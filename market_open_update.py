import os
import asyncio
import databases
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
FMP_API_KEY = os.getenv("FMP_API_KEY")

if not DATABASE_URL or not FMP_API_KEY:
    raise RuntimeError("Missing DATABASE_URL or FMP_API_KEY")

# Connect to the database
database = databases.Database(DATABASE_URL)

# Determine the date to update
now = datetime.utcnow() + timedelta(hours=2)  # Rome is UTC+2
market_day = now.date()
market_day_str = market_day.strftime("%Y-%m-%d")

def fetch_open_price():
    url = "https://financialmodelingprep.com/api/v3/historical-chart/1min/VT"
    params = {"apikey": FMP_API_KEY}
    response = requests.get(url, params=params)
    data = response.json()
    if isinstance(data, list):
        for entry in reversed(data):
            if entry["date"].startswith(market_day_str):
                return float(entry["open"])
    return None

async def run_market_open_update():
    await database.connect()
    open_price = fetch_open_price()
    if open_price is None:
        print("⚠️ Could not fetch open price.")
        await database.disconnect()
        return

    print(f"📈 Inserting open price {open_price} for {market_day_str}...")

    query = """
        UPDATE daily_data
        SET open_today = :open_today
        WHERE date = :date
    """
    await database.execute(query, values={"open_today": open_price, "date": market_day_str})
    await database.disconnect()
    print("✅ Market open update completed.")

if __name__ == "__main__":
    asyncio.run(run_market_open_update())