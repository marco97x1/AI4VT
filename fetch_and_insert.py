# fetch_and_insert.py

import os
import requests
import openai
import psycopg2
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
FMP_API_KEY = os.getenv("FMP_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

openai.api_key = OPENAI_API_KEY

# Connect to database
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

# Functions

def fetch_news(from_dt, to_dt):
    url = 'https://newsapi.org/v2/everything'
    params = {
        'q': 'stock market OR global economy OR inflation OR interest rates OR business',
        'from': from_dt.isoformat(),
        'to': to_dt.isoformat(),
        'language': 'en',
        'sortBy': 'relevancy',
        'pageSize': 100,
        'apiKey': NEWS_API_KEY,
        'page': 1
    }
    response = requests.get(url, params=params)
    data = response.json()
    return [a['title'] for a in data.get('articles', [])]

def summarize_news(headlines):
    if not headlines:
        return "No major news headlines."
    return " | ".join(headlines[:10])  # First 10 headlines joined

def predict_llm(headlines):
    if not headlines:
        return None

    prompt = f"""
You are a financial news analyst.

Based on these headlines:
{headlines}

Reply ONLY in JSON format:

{{
  "sentiment_score": integer (0-100),
  "market_impact_score": integer (0-100),
  "confidence_level": integer (0-100),
  "volatility_indicator": "Low"|"Medium"|"High",
  "forecasted_pct": float between -10.0 and +10.0
}}
"""

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        temperature=0.2,
        messages=[{"role": "user", "content": prompt}]
    )

    import json
    return json.loads(response['choices'][0]['message']['content'])

def fetch_vt_prices():
    url = f"https://financialmodelingprep.com/api/v3/historical-price-full/VT?apikey={FMP_API_KEY}"
    response = requests.get(url)
    return response.json().get('historical', [])

def calculate_predicted_movement(sentiment, impact, confidence, volatility):
    if None in (sentiment, impact, confidence, volatility):
        return None
    s = (sentiment - 50) / 50
    i = impact / 100
    c = confidence / 100
    mult = {'Low': 0.5, 'Medium': 1.0, 'High': 1.5}.get(volatility, 1.0)
    return round(s * i * c * mult * 10, 2)

# Main logic

def main():
    # Get yesterday
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)

    from_time = datetime.combine(yesterday, datetime.min.time()).replace(hour=16)
    to_time = datetime.combine(today, datetime.min.time()).replace(hour=9)

    # Fetch news
    headlines = fetch_news(from_time, to_time)
    summary = summarize_news(headlines)
    llm_result = predict_llm(summary)

    if not llm_result:
        print("LLM prediction failed")
        return

    # Fetch VT prices
    prices = fetch_vt_prices()

    close_yesterday = None
    open_today = None
    for p in prices:
        if p['date'] == str(yesterday):
            close_yesterday = p['close']
        if p['date'] == str(today):
            open_today = p['open']

    if close_yesterday is None or open_today is None:
        print("Prices not available")
        return

    real_move_pct = round((open_today - close_yesterday) / close_yesterday * 100, 2)

    # Calculate predicted movement
    calculated_pct = calculate_predicted_movement(
        llm_result['sentiment_score'],
        llm_result['market_impact_score'],
        llm_result['confidence_level'],
        llm_result['volatility_indicator']
    )
    average_pct = round((llm_result['forecasted_pct'] + calculated_pct) / 2, 2)

    correct = (real_move_pct > 0 and average_pct > 0) or (real_move_pct < 0 and average_pct < 0)

    # Insert into database
    cursor.execute("""
    INSERT INTO daily_data (date, close_yesterday, open_today, real_move_pct)
    VALUES (%s, %s, %s, %s)
    ON CONFLICT (date) DO NOTHING
    """, (today, close_yesterday, open_today, real_move_pct))

    cursor.execute("""
    INSERT INTO predictions (date, sentiment_score, market_impact_score, confidence_level, volatility_indicator, forecasted_pct, calculated_pct, average_pct, correct)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (date) DO NOTHING
    """, (
        today,
        llm_result['sentiment_score'],
        llm_result['market_impact_score'],
        llm_result['confidence_level'],
        llm_result['volatility_indicator'],
        llm_result['forecasted_pct'],
        calculated_pct,
        average_pct,
        correct
    ))

    cursor.execute("""
    INSERT INTO summaries (date, summary)
    VALUES (%s, %s)
    ON CONFLICT (date) DO NOTHING
    """, (today, summary))

    conn.commit()
    print("✅ Data inserted successfully!")

if __name__ == "__main__":
    main()