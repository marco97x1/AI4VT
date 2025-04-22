# ============================
# 🛠️ Install dependencies (ONLY if running locally)
# ============================
# pip install requests openai psycopg2-binary pandas python-dotenv

# ============================
# 📚 Imports
# ============================
import os
import requests
import openai
import pandas as pd
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv

# ============================
# 🔑 Load Environment Variables
# ============================
load_dotenv()

FMP_API_KEY = os.getenv("FMP_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# Setup OpenAI
openai.api_key = OPENAI_API_KEY

# ============================
# 🔗 Connect to Supabase Postgres
# ============================
conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT,
    sslmode="require"
)
cursor = conn.cursor()
print("✅ Connected to Supabase database!")

# ============================
# 📈 Fetch VT historical prices
# ============================
def fetch_vt_prices():
    url = f"https://financialmodelingprep.com/api/v3/historical-price-full/VT?apikey={FMP_API_KEY}"
    response = requests.get(url)
    data = response.json()
    prices = data.get('historical', [])
    return {p['date']: p for p in prices}

# ============================
# 📰 Fetch news headlines
# ============================
def fetch_news_for_market_gap(from_dt, to_dt):
    url = 'https://newsapi.org/v2/everything'
    params = {
        'q': 'stock market OR global economy OR inflation OR interest rates OR business',
        'from': from_dt.isoformat(),
        'to': to_dt.isoformat(),
        'language': 'en',
        'sortBy': 'relevancy',
        'pageSize': 100,
        'apiKey': NEWS_API_KEY
    }
    response = requests.get(url, params=params)
    if response.status_code != 200:
        print("Error fetching news:", response.json())
        return []
    return [article['title'] for article in response.json().get('articles', [])]

# ============================
# 🤖 LLM prediction function
# ============================
def predict_llm_all_outputs(headlines):
    if not headlines:
        return None
    news_text = "\n".join(f"- {h}" for h in headlines)

    prompt = f"""
You are a sharp financial news analyst.

Analyze the following headlines and respond ONLY with a JSON object like:
{{
  "sentiment_score": integer 0-100,
  "market_impact_score": integer 0-100,
  "confidence_level": integer 0-100,
  "volatility_indicator": one of "Low","Medium","High",
  "forecasted_pct": number between -10.0 and +10.0
}}

Headlines:
{news_text}
"""

    try:
        resp = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=500
        )
        reply = resp.choices[0].message.content
        return eval(reply)
    except Exception as e:
        print("LLM error:", e)
        return None

# ============================
# 🗓️ Today's Date
# ============================
today = datetime.utcnow().date()

# ============================
# 🔥 Fetch everything and insert
# ============================
vt_prices = fetch_vt_prices()

date_str = today.strftime("%Y-%m-%d")
today_dt = datetime.strptime(date_str, "%Y-%m-%d")
prev_day = today_dt - timedelta(days=1)

close_yesterday = vt_prices.get(prev_day.strftime("%Y-%m-%d"), {}).get('close')
open_today = vt_prices.get(date_str, {}).get('open')

if close_yesterday is None or open_today is None:
    print(f"⚠️ Skipping {date_str} - missing price data")
else:
    real_move_pct = round((open_today - close_yesterday) / close_yesterday * 100, 2)

    # Insert into daily_data table
    cursor.execute("""
        INSERT INTO daily_data (date, close_yesterday, open_today, real_move_pct)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (date) DO NOTHING;
    """, (date_str, close_yesterday, open_today, real_move_pct))
    conn.commit()

    # Fetch news (time shifted to US close / open gap in UTC)
    from_dt = (prev_day + timedelta(hours=20)).replace(minute=0, second=0)  # 4pm NY time = 20 UTC
    to_dt = (today_dt + timedelta(hours=13)).replace(minute=0, second=0)     # 9am NY time = 13 UTC

    headlines = fetch_news_for_market_gap(from_dt, to_dt)

    # Save headlines to 'headlines' table
    for h in headlines:
        cursor.execute("""
            INSERT INTO headlines (date, headline)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING;
        """, (date_str, h))
    conn.commit()

    # Run LLM
    llm_output = predict_llm_all_outputs(headlines)

    if llm_output:
        cursor.execute("""
            INSERT INTO predictions (date, sentiment_score, market_impact_score,
                                      confidence_level, volatility_indicator,
                                      forecasted_pct, calculated_pct, average_pct, correct)
            VALUES (%s, %s, %s, %s, %s, %s, NULL, NULL, NULL)
            ON CONFLICT (date) DO NOTHING;
        """, (
            date_str,
            llm_output['sentiment_score'],
            llm_output['market_impact_score'],
            llm_output['confidence_level'],
            llm_output['volatility_indicator'],
            llm_output['forecasted_pct'],
        ))
        conn.commit()

    print(f"✅ Inserted {date_str}")

# ============================
# ✅ Close DB
# ============================
cursor.close()
conn.close()
print("🏁 Done!")