import os
import asyncio
import databases
import openai
import requests
from datetime import date
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# Connect to database
database = databases.Database(DATABASE_URL)

# Connect to OpenAI properly with new style
openai_client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

async def run_daily_update():
    await database.connect()

    print("🔎 Fetching latest financial news...")
    news_response = requests.get(
        f"https://newsapi.org/v2/top-headlines",
        params={"apiKey": NEWS_API_KEY, "q": "finance", "language": "en"}
    )
    news_data = news_response.json()

    if "articles" not in news_data or not news_data["articles"]:
        print("⚠️ No news articles found!")
        await database.disconnect()
        return

    headlines = [article["title"] for article in news_data["articles"] if "title" in article][:10]

    if not headlines:
        print("⚠️ No valid headlines to summarize!")
        await database.disconnect()
        return

    # Build the prompt
    prompt = "Summarize today's financial news headlines in a few sentences:\n\n" + "\n".join(headlines)

    print("🧠 Summarizing headlines with GPT-3.5 Turbo...")

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500
        )
    except Exception as e:
        print(f"❌ OpenAI API Error: {e}")
        await database.disconnect()
        return

    summary_text = response.choices[0].message.content.strip()

    print("📝 Inserting summary into database...")
    try:
        await database.execute(
            query="""
                INSERT INTO headlines (date, headline)
                VALUES (:date, :headline)
                ON CONFLICT (date) DO UPDATE SET headline = EXCLUDED.headline
            """,
            values={"date": date.today(), "headline": summary_text}
        )
    except Exception as e:
        print(f"❌ Database Error: {e}")

    await database.disconnect()
    print("✅ Daily update finished successfully!")

if __name__ == "__main__":
    asyncio.run(run_daily_update())