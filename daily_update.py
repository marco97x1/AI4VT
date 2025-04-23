import os
import psycopg2
from datetime import datetime, timedelta, time, date
import openai
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
FMP_API_KEY = os.getenv("FMP_API_KEY")

# Timezone helpers
def is_market_open(target_date):
    print(f"[LOG] Checking if the market is open on {target_date}")
    url = f"https://financialmodelingprep.com/api/v3/is-the-market-open"
    params = {"exchange": "NYSE", "apikey": FMP_API_KEY}
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        return data.get("isTheStockMarketOpen", False)
    print(f"⚠️ Failed to fetch market status. Status code: {response.status_code}")
    return False

def adjust_for_friday_and_holidays(target_date):
    # Check if the market is open for the given date
    while not is_market_open(target_date):
        target_date -= timedelta(days=1)
    return target_date

# Ensure daily_update.py uses now_utc for everyday updates
def get_market_timing(now_utc: datetime):
    forecast_day = now_utc.date()  # Use the current date dynamically
    closing_day = forecast_day - timedelta(days=1)

    # Adjust closing_day for Fridays and holidays
    closing_day = adjust_for_friday_and_holidays(closing_day)

    print(f"[LOG] Forecast Day: {forecast_day}, Adjusted Closing Day: {closing_day}")
    return forecast_day, closing_day

# Fetch financial indicators
def fetch_fmp_json(endpoint, params):
    response = requests.get(f"https://financialmodelingprep.com/api/v3/{endpoint}", params={**params, "apikey": FMP_API_KEY})
    return response.json()

def fetch_pre_market_signals():
    futures = fetch_fmp_json("quote/%5ESPX", {})  # S&P 500 futures
    currencies = fetch_fmp_json("quote/USD", {})  # USD index or currency indicators
    world_indices = fetch_fmp_json("quotes/index", {})  # Get global indices

    return {
        "futures": futures,
        "currencies": currencies,
        "world_indices": world_indices,
    }

def fetch_vt_close_data(closing_day: date):
    history = fetch_fmp_json("historical-price-full/VT", {"serietype": "line", "timeseries": 10})
    for row in history.get("historical", []):
        if row["date"] == closing_day.strftime("%Y-%m-%d"):
            return row
    return None

# Validation to ensure fetched data matches the expected date
def validate_data_date(fetched_date: str, expected_date: date):
    fetched_date_obj = datetime.strptime(fetched_date, "%Y-%m-%d").date()
    if fetched_date_obj != expected_date:
        raise ValueError(f"Data mismatch: Fetched date {fetched_date_obj} does not match expected date {expected_date}.")

# Fetch news headlines
def fetch_news_for_period(since: datetime, until: datetime):
    try:
        response = requests.get("https://newsapi.org/v2/everything", params={
            "q": "stock market OR global economy OR inflation OR interest rates OR business",
            "from": since.isoformat(),
            "to": until.isoformat(),
            "language": "en",
            "sortBy": "relevancy",
            "pageSize": 100,
            "apiKey": NEWS_API_KEY
        })
        response.raise_for_status()
        return response.json().get("articles", [])
    except requests.RequestException as e:
        print(f"❌ Error fetching news: {e}")
        return []

# Update the forecast pipeline to use now_utc dynamically
def run_forecast_update():
    connection = psycopg2.connect(DATABASE_URL)
    cursor = connection.cursor()

    now = datetime.utcnow()
    forecast_day, closing_day = get_market_timing(now)

    print(f"[LOG] Starting forecast update for Forecast Day: {forecast_day}, Closing Day: {closing_day}")

    try:
        # Gather data
        vt_data = fetch_vt_close_data(closing_day)
        if vt_data is None:
            print(f"⚠️ No closing price found for {closing_day}. Skipping database update for closing price.")

        pre_market = fetch_pre_market_signals()

        # Fetch news from the closing day (4:30 PM NYC time) to the current time
        nyc_closing_time = datetime.combine(closing_day, time(16, 30))
        news_articles = fetch_news_for_period(since=nyc_closing_time, until=now)

        headlines = [a["title"] for a in news_articles if "title" in a][:10]
        if not headlines:
            print("⚠️ No valid headlines")
            connection.close()
            return

        prompt = f"""
        You are an economic assistant forecasting the VT ETF daily movement.
        Today's date: {forecast_day}.
        Yesterday's VT data: {vt_data}
        Pre-market signals: {pre_market}
        News headlines:
        {chr(10).join(f"- {title}" for title in headlines)}

        Please summarize today’s market outlook and estimate if VT will go up or down.
        Give a percentage forecast and a volatility label (low/medium/high).
        Return a JSON:
        {{
          "forecasted_pct": float,
          "confidence_level": int,
          "volatility_indicator": str,
          "headline_summary": str
        }}
        """

        # Call OpenAI
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=500
        )

        response_text = response.choices[0].message.content.strip()
        parsed = eval(response_text)  # Can replace with json.loads if LLM is stable

        print(f"✅ Forecast: {parsed}")

        # Ensure daily_data is updated first before inserting into predictions and headlines
        print("[LOG] Ensuring date exists in daily_data table")
        cursor.execute(
            """
            INSERT INTO daily_data (date)
            VALUES (%s)
            ON CONFLICT (date) DO NOTHING
            """,
            (forecast_day,)
        )

        # Update daily_data with any new data if available
        if vt_data:
            print("[LOG] Updating daily_data with new data if available")
            cursor.execute(
                """
                UPDATE daily_data
                SET close_yesterday = %s
                WHERE date = %s
                """,
                (vt_data["close"], forecast_day)
            )

        # Proceed with inserting into predictions and headlines
        print("[LOG] Writing forecast to database")
        cursor.execute(
            """
            INSERT INTO predictions (date, forecasted_pct, confidence_level, volatility_indicator, average_pct)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (date) DO UPDATE SET
              forecasted_pct = EXCLUDED.forecasted_pct,
              confidence_level = EXCLUDED.confidence_level,
              volatility_indicator = EXCLUDED.volatility_indicator,
              average_pct = EXCLUDED.average_pct
            """,
            (
                forecast_day,
                parsed["forecasted_pct"],
                parsed["confidence_level"],
                parsed["volatility_indicator"],
                parsed["forecasted_pct"]
            )
        )

        cursor.execute(
            """
            INSERT INTO headlines (date, headline)
            VALUES (%s, %s)
            ON CONFLICT (date) DO UPDATE SET headline = EXCLUDED.headline
            """,
            (forecast_day, parsed["headline_summary"])
        )

        connection.commit()

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        cursor.close()
        connection.close()
        print("🏁 Done!")

if __name__ == "__main__":
    run_forecast_update()