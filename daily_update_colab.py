# Google Colab Script to Run Daily Update Logic for Historical Data with Extensive Logging

# Install required libraries
!pip install -q requests databases python-dotenv openai psycopg2

# Import necessary modules
import os
from datetime import datetime, timedelta, date, time
import openai
import requests
from dotenv import load_dotenv
import psycopg2

# Example variable for target date
# Replace '2025-04-10' with the desired date in 'YYYY-MM-DD' format
target_date = '2025-04-10'

# Load environment variables
from google.colab import drive
drive.mount('/content/drive')

# Set up environment variables (update with your own values)
os.environ['DATABASE_URL'] = 'your_database_url_here'
os.environ['OPENAI_API_KEY'] = 'your_openai_api_key_here'
os.environ['NEWS_API_KEY'] = 'your_news_api_key_here'
os.environ['FMP_API_KEY'] = 'your_fmp_api_key_here'

DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
FMP_API_KEY = os.getenv("FMP_API_KEY")

# Add a function to check if the market is open using the FMP API
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

# Update adjust_for_friday_and_holidays to go back to the date where closing data exists
def adjust_for_friday_and_holidays(target_date):
    # Check if the market is open for the given date
    if is_market_open(target_date):
        return target_date

    # If the market is closed, go back one day until closing data exists
    while not is_market_open(target_date):
        target_date -= timedelta(days=1)
    return target_date

# Fetch financial indicators
def fetch_vt_close_data(closing_day):
    print(f"[LOG] Fetching VT close data for {closing_day}")
    url = f"https://financialmodelingprep.com/api/v3/historical-price-full/VT"
    params = {"serietype": "line", "timeseries": 10, "apikey": FMP_API_KEY}
    response = requests.get(url, params=params)
    data = response.json()
    for row in data.get("historical", []):
        row_date = datetime.strptime(row["date"], "%Y-%m-%d").date()
        if row_date == closing_day:
            return {"date": row_date, "close": row["close"]}
    print(f"⚠️ No closing price found for {closing_day}. Check data source.")
    return None

def fetch_vt_open_data(forecast_day):
    print(f"[LOG] Fetching VT open data for {forecast_day}")
    url = f"https://financialmodelingprep.com/api/v3/historical-chart/1min/VT"
    params = {"apikey": FMP_API_KEY}
    response = requests.get(url, params=params)
    data = response.json()
    if isinstance(data, list):
        for entry in reversed(data):
            entry_date = datetime.strptime(entry["date"], "%Y-%m-%d %H:%M:%S").date()
            if entry_date == forecast_day:
                return {"date": entry_date, "open": entry["open"]}
    print(f"⚠️ No open price found for {forecast_day}. Check data source.")
    return None

def fetch_pre_market_signals():
    print("[LOG] Fetching pre-market signals")
    # Replace with actual logic to fetch pre-market signals
    return {"signal": "neutral"}

# Validation to ensure fetched data matches the expected date
def validate_data_date(data_date, expected_date):
    print(f"[LOG] Validating data date: {data_date} against expected date: {expected_date}")
    if data_date != expected_date:
        raise ValueError(f"Data date {data_date} does not match expected date {expected_date}")

# Fetch news headlines
def fetch_news_for_morning(since: datetime, until: datetime):
    print(f"[LOG] Fetching news from {since} to {until}")
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
        articles = response.json().get("articles", [])
        print(f"[LOG] Fetched {len(articles)} articles")
        return articles
    except requests.RequestException as e:
        print(f"❌ Error fetching news: {e}")
        return []

# Get the most recent valid closing date
def get_closing_date(target_date):
    while True:
        print(f"[LOG] Checking if market was open on {target_date}")
        if is_market_open(target_date):
            return target_date
        target_date -= timedelta(days=1)

# Forecast pipeline
def run_forecast_update_for_specific_date(target_date):
    print("[LOG] Connecting to database")

    # Stop execution if the market is closed
    if not is_market_open(target_date):
        print(f"[LOG] Market is closed on {target_date}. Stopping execution.")
        return

    closing_day = get_closing_date(target_date - timedelta(days=1))
    print(f"[LOG] Starting forecast update for Forecast Day: {target_date}, Closing Day: {closing_day}")

    try:
        # Gather data
        vt_data = fetch_vt_close_data(closing_day)
        if vt_data is None:
            print(f"⚠️ No closing price found for {closing_day}. Skipping database update for closing price.")

        vt_open_data = fetch_vt_open_data(target_date)
        if vt_open_data is None:
            print(f"⚠️ No open price found for {target_date}. Skipping database update for opening price.")

        pre_market = fetch_pre_market_signals()
        print(f"[LOG] Pre-Market Signals: {pre_market}")

        # Fetch news from the day before (after 4:30 PM NYC time) to the forecast day (up until 9:30 AM NYC time)
        nyc_closing_time = datetime.combine(closing_day, time(16, 30))
        nyc_open_time = datetime.combine(target_date, time(9, 30))
        news_articles = fetch_news_for_morning(since=nyc_closing_time, until=nyc_open_time)

        headlines = [a["title"] for a in news_articles if "title" in a][:10]
        print(f"[LOG] Headlines: {headlines}")
        if not headlines:
            print("⚠️ No valid headlines")
            return

        prompt = f"""
        You are an economic assistant forecasting the VT ETF daily movement.
        Today's date: {target_date}.
        Yesterday's VT data: {vt_data}
        Today's VT open data: {vt_open_data}
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

        print("[LOG] Sending prompt to OpenAI")
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=500
        )

        response_text = response.choices[0].message.content.strip()
        print(f"[LOG] OpenAI Response: {response_text}")
        parsed = eval(response_text)  # Can replace with json.loads if LLM is stable

        print(f"✅ Forecast: {parsed}")

        # Simulate writing to database (replace with actual database logic if needed)
        connection = psycopg2.connect(DATABASE_URL)
        cursor = connection.cursor()

        # Ensure daily_data is updated first before inserting into predictions and headlines
        print("[LOG] Ensuring date exists in daily_data table")
        cursor.execute(
            """
            INSERT INTO daily_data (date)
            VALUES (%s)
            ON CONFLICT (date) DO NOTHING
            """,
            (target_date,)
        )

        # Update daily_data with any new data if available
        if vt_data and vt_open_data:
            print("[LOG] Updating daily_data with new data if available")
            cursor.execute(
                """
                UPDATE daily_data
                SET close_yesterday = %s, open_today = %s
                WHERE date = %s
                """,
                (vt_data["close"], vt_open_data["open"], target_date)
            )
        elif vt_data:
            print("[LOG] Updating daily_data with closing price only")
            cursor.execute(
                """
                UPDATE daily_data
                SET close_yesterday = %s
                WHERE date = %s
                """,
                (vt_data["close"], target_date)
            )
        elif vt_open_data:
            print("[LOG] Updating daily_data with opening price only")
            cursor.execute(
                """
                UPDATE daily_data
                SET open_today = %s
                WHERE date = %s
                """,
                (vt_open_data["open"], target_date)
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
                target_date,
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
            (target_date, parsed["headline_summary"])
        )

        connection.commit()
        cursor.close()
        connection.close()

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        print("[LOG] Disconnecting from database")
        print("🏁 Done!")

# Main function to run the script for a specific date
def main():
    print("[LOG] Starting script")
    target_date_obj = datetime.strptime(target_date, '%Y-%m-%d').date()
    run_forecast_update_for_specific_date(target_date_obj)

# Call the main function explicitly
if __name__ == "__main__":
    main()