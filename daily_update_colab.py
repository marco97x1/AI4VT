# Google Colab Script to Run Daily Update Logic for Historical Data with Extensive Logging

# Install required libraries
!pip install -q requests databases python-dotenv openai

# Import necessary modules
import os
import asyncio
from datetime import datetime, timedelta, date, time
import databases
import openai
import requests
from dotenv import load_dotenv

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

# Timezone helpers
def get_market_timing(now):
    rome_now = now + timedelta(hours=2)  # Adjust for Rome timezone
    forecast_day = rome_now.date()
    closing_day = forecast_day - timedelta(days=1)
    print(f"[LOG] Rome Now: {rome_now}, Forecast Day: {forecast_day}, Closing Day: {closing_day}")
    return rome_now, forecast_day, closing_day

def get_market_timing_for_date(target_date):
    closing_day = target_date - timedelta(days=1)
    print(f"[LOG] Target Date: {target_date}, Closing Day: {closing_day}")
    return target_date, closing_day

# Fetch financial indicators
def fetch_vt_close_data(closing_day):
    print(f"[LOG] Fetching VT close data for {closing_day}")
    # Replace with actual logic to fetch VT close data
    return {"date": closing_day, "close": 100.0}

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

# Forecast pipeline
async def run_forecast_update_for_historical_data():
    database = databases.Database(DATABASE_URL)
    openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

    print("[LOG] Connecting to database")
    await database.connect()
    now = datetime.utcnow()
    rome_now, forecast_day, closing_day = get_market_timing(now)

    print(f"[LOG] Starting forecast update for Forecast Day: {forecast_day}, Closing Day: {closing_day}")

    try:
        # Gather data
        vt_data = fetch_vt_close_data(closing_day)
        print(f"[LOG] VT Data: {vt_data}")
        if vt_data:
            validate_data_date(vt_data["date"], closing_day)

        pre_market = fetch_pre_market_signals()
        print(f"[LOG] Pre-Market Signals: {pre_market}")

        # Fetch news from the day before (after 4:30 PM NYC time) to the forecast day (up until 9:30 AM NYC time)
        nyc_closing_time = datetime.combine(closing_day, time(16, 30))
        nyc_open_time = datetime.combine(forecast_day, time(9, 30))
        news_articles = fetch_news_for_morning(since=nyc_closing_time, until=nyc_open_time)

        headlines = [a["title"] for a in news_articles if "title" in a][:10]
        print(f"[LOG] Headlines: {headlines}")
        if not headlines:
            print("⚠️ No valid headlines")
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

        print("[LOG] Sending prompt to OpenAI")
        response = await openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=500
        )

        response_text = response.choices[0].message.content.strip()
        print(f"[LOG] OpenAI Response: {response_text}")
        parsed = eval(response_text)  # Can replace with json.loads if LLM is stable

        print(f"✅ Forecast: {parsed}")

        # Overwrite record in DB
        print("[LOG] Writing forecast to database")
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
            "average_pct": parsed["forecasted_pct"]
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
        print(f"❌ Error: {e}")
    finally:
        print("[LOG] Disconnecting from database")
        await database.disconnect()
        print("🏁 Done!")

async def run_forecast_update_for_specific_date(target_date):
    database = databases.Database(DATABASE_URL)
    openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

    print("[LOG] Connecting to database")
    await database.connect()
    forecast_day, closing_day = get_market_timing_for_date(target_date)

    print(f"[LOG] Starting forecast update for Forecast Day: {forecast_day}, Closing Day: {closing_day}")

    try:
        # Gather data
        vt_data = fetch_vt_close_data(closing_day)
        print(f"[LOG] VT Data: {vt_data}")
        if vt_data:
            validate_data_date(vt_data["date"], closing_day)

        pre_market = fetch_pre_market_signals()
        print(f"[LOG] Pre-Market Signals: {pre_market}")

        # Fetch news from the day before (after 4:30 PM NYC time) to the forecast day (up until 9:30 AM NYC time)
        nyc_closing_time = datetime.combine(closing_day, time(16, 30))
        nyc_open_time = datetime.combine(forecast_day, time(9, 30))
        news_articles = fetch_news_for_morning(since=nyc_closing_time, until=nyc_open_time)

        headlines = [a["title"] for a in news_articles if "title" in a][:10]
        print(f"[LOG] Headlines: {headlines}")
        if not headlines:
            print("⚠️ No valid headlines")
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

        print("[LOG] Sending prompt to OpenAI")
        response = await openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=500
        )

        response_text = response.choices[0].message.content.strip()
        print(f"[LOG] OpenAI Response: {response_text}")
        parsed = eval(response_text)  # Can replace with json.loads if LLM is stable

        print(f"✅ Forecast: {parsed}")

        # Overwrite record in DB
        print("[LOG] Writing forecast to database")
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
            "average_pct": parsed["forecasted_pct"]
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
        print(f"❌ Error: {e}")
    finally:
        print("[LOG] Disconnecting from database")
        await database.disconnect()
        print("🏁 Done!")