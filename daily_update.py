import os
import asyncio
from datetime import datetime, timedelta, time, date
import databases
import openai
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
FMP_API_KEY = os.getenv("FMP_API_KEY")

# Setup
database = databases.Database(DATABASE_URL)
openai_client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

# Timezone helpers
def get_market_timing(now_utc: datetime):
    rome_now = now_utc + timedelta(hours=2)
    forecast_day = rome_now.date()
    closing_day = forecast_day - timedelta(days=1) if forecast_day.weekday() != 0 else forecast_day - timedelta(days=3)
    return rome_now, forecast_day, closing_day

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
def fetch_news(since: datetime):
    to_dt = datetime.utcnow()  # Use the current time as the upper limit for filtering news
    response = requests.get("https://newsapi.org/v2/everything", params={
        "q": "stock market OR global economy OR inflation OR interest rates OR business",
        "from": since.isoformat(),
        "to": to_dt.isoformat(),
        "language": "en",
        "sortBy": "relevancy",
        "pageSize": 100,
        "apiKey": NEWS_API_KEY
    })
    return response.json().get("articles", [])

# Forecast pipeline
async def run_forecast_update():
    await database.connect()
    now = datetime.utcnow()
    rome_now, forecast_day, closing_day = get_market_timing(now)

    print(f"🗓 Forecast Day: {forecast_day} | Closing Day: {closing_day}")

    # Gather data
    vt_data = fetch_vt_close_data(closing_day)
    if vt_data:
        validate_data_date(vt_data["date"], closing_day)

    pre_market = fetch_pre_market_signals()
    news_articles = fetch_news(since=closing_day + timedelta(hours=14.5))  # from 16:30 Rome time

    headlines = [a["title"] for a in news_articles if "title" in a][:10]
    if not headlines:
        print("⚠️ No valid headlines")
        await database.disconnect()
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
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=500
        )
    except Exception as e:
        print(f"❌ OpenAI Error: {e}")
        await database.disconnect()
        return

    try:
        response_text = response.choices[0].message.content.strip()
        parsed = eval(response_text)  # Can replace with json.loads if LLM is stable

        print(f"✅ Forecast: {parsed}")

        # Write to DB (replace existing)
        await database.execute("""
            INSERT INTO predictions (date, forecasted_pct, confidence_level, volatility_indicator, average_pct)
            VALUES (:date, :forecasted_pct, :confidence_level, :volatility_indicator, :average_pct)
            ON CONFLICT (date) DO UPDATE
              SET forecasted_pct = EXCLUDED.forecasted_pct,
                  confidence_level = EXCLUDED.confidence_level,
                  volatility_indicator = EXCLUDED.volatility_indicator,
                  average_pct = EXCLUDED.average_pct
        """, {
            "date": forecast_day,
            "forecasted_pct": parsed["forecasted_pct"],
            "confidence_level": parsed["confidence_level"],
            "volatility_indicator": parsed["volatility_indicator"],
            "average_pct": parsed["forecasted_pct"]  # For now same value
        })

        await database.execute("""
            INSERT INTO headlines (date, headline)
            VALUES (:date, :headline)
            ON CONFLICT (date) DO UPDATE SET headline = EXCLUDED.headline
        """, {
            "date": forecast_day,
            "headline": parsed["headline_summary"]
        })

    except Exception as e:
        print(f"❌ Error saving forecast: {e}")
    
    await database.disconnect()
    print("🏁 Done!")

if __name__ == "__main__":
    asyncio.run(run_forecast_update())