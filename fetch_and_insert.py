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
# 🔑 Load environment variables
# ============================
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
FMP_API_KEY = os.getenv("FMP_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

openai.api_key = OPENAI_API_KEY

# ============================
# 🔗 Connect to Supabase Postgres
# ============================
conn = psycopg2.connect(DATABASE_URL, sslmode="require")
cursor = conn.cursor()
print("✅ Connected to database!")

# ============================
# 📈 Fetch VT historical prices
# ============================
def fetch_vt_prices():
    url = f"https://financialmodelingprep.com/api/v3/historical-price-full/VT?apikey={FMP_API_KEY}"
    response = requests.get(url)
    data = response.json()
    return {p['date']: p for p in data.get('historical', [])}

# ============================
# 📰 Fetch summarized news headlines
# ============================
def fetch_news_summary(from_dt, to_dt):
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
        print("NewsAPI error:", response.json())
        return "No major news."
    
    headlines = [a['title'] for a in response.json().get('articles', [])]
    summary = " | ".join(headlines[:10])  # Summarize first 10 headlines
    return summary if summary else "No major news."

# ============================
# 🤖 LLM prediction
# ============================
def predict_llm(summary_text):
    if not summary_text:
        return None

    prompt = f"""
You are a sharp financial news analyst.

Below is a summary of today's most important financial headlines:
\"\"\"{summary_text}\"\"\"

Analyze this and respond ONLY with a JSON object:
{{
  "sentiment_score": integer 0-100,
  "market_impact_score": integer 0-100,
  "confidence_level": integer 0-100,
  "volatility_indicator": one of "Low","Medium","High",
  "forecasted_pct": float between -10.0 and +10.0
}}
"""

    try:
        resp = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=300
        )
        reply = resp.choices[0].message.content
        return eval(reply)
    except Exception as e:
        print("LLM error:", e)
        return None

# ============================
# 🧠 Predict movement
# ============================
def calculate_predicted_movement(sentiment, impact, confidence, volatility):
    if None in (sentiment, impact, confidence, volatility):
        return None
    s = (sentiment - 50) / 50
    i = impact / 100
    c = confidence / 100
    mult = {'Low': 0.5, 'Medium': 1.0, 'High': 1.5}.get(volatility, 1.0)
    return round(s * i * c * mult * 10, 2)

# ============================
# 🔥 MAIN LOGIC
# ============================
def main():
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)

    # Correct time window for US Market: yesterday 16:00 to today 09:00
    from_time = datetime.combine(yesterday, datetime.min.time()).replace(hour=16)
    to_time = datetime.combine(today, datetime.min.time()).replace(hour=9)

    # Fetch news and summarize
    news_summary = fetch_news_summary(from_time, to_time)

    # Fetch VT prices
    vt_prices = fetch_vt_prices()

    close_yesterday = vt_prices.get(str(yesterday), {}).get('close')
    open_today = vt_prices.get(str(today), {}).get('open')

    if close_yesterday is None or open_today is None:
        print("⚠️ Skipping - missing price data")
        return

    real_move_pct = round((open_today - close_yesterday) / close_yesterday * 100, 2)

    # Insert into daily_data
    cursor.execute("""
        INSERT INTO daily_data (date, close_yesterday, open_today, real_move_pct)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (date) DO NOTHING;
    """, (today, close_yesterday, open_today, real_move_pct))
    conn.commit()

    # Insert summarized news into headlines
    cursor.execute("""
        INSERT INTO headlines (date, headline)
        VALUES (%s, %s)
        ON CONFLICT (date) DO NOTHING;
    """, (today, news_summary))
    conn.commit()

    # LLM prediction
    llm_output = predict_llm(news_summary)

    if llm_output:
        calculated_pct = calculate_predicted_movement(
            llm_output['sentiment_score'],
            llm_output['market_impact_score'],
            llm_output['confidence_level'],
            llm_output['volatility_indicator']
        )
        average_pct = round((llm_output['forecasted_pct'] + calculated_pct) / 2, 2)
        correct = (real_move_pct > 0 and average_pct > 0) or (real_move_pct < 0 and average_pct < 0)

        # Insert into predictions
        cursor.execute("""
            INSERT INTO predictions (date, sentiment_score, market_impact_score,
                                      confidence_level, volatility_indicator,
                                      forecasted_pct, calculated_pct, average_pct, correct)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (date) DO NOTHING;
        """, (
            today,
            llm_output['sentiment_score'],
            llm_output['market_impact_score'],
            llm_output['confidence_level'],
            llm_output['volatility_indicator'],
            llm_output['forecasted_pct'],
            calculated_pct,
            average_pct,
            correct
        ))
        conn.commit()

    print(f"✅ Successfully inserted {today}")

# ============================
# Run if main
# ============================
if __name__ == "__main__":
    main()
    cursor.close()
    conn.close()
    print("🏁 Done!")