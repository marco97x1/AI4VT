import os
import psycopg2
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
FMP_API_KEY = os.getenv("FMP_API_KEY")

if not DATABASE_URL or not FMP_API_KEY:
    raise RuntimeError("Missing DATABASE_URL or FMP_API_KEY")

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

def fetch_open_price(market_day_str):
    url = "https://financialmodelingprep.com/api/v3/historical-chart/1min/VT"
    params = {"apikey": FMP_API_KEY}
    response = requests.get(url, params=params)
    data = response.json()
    if isinstance(data, list):
        for entry in reversed(data):
            if entry["date"].startswith(market_day_str):
                return float(entry["open"])
    return None

def run_market_open_update():
    now = datetime.utcnow()
    market_day = now.date()
    market_day_str = market_day.strftime("%Y-%m-%d")

    # Stop execution if the market is closed
    if not is_market_open(market_day):
        print(f"[LOG] Market is closed on {market_day}. Stopping execution.")
        return

    connection = psycopg2.connect(DATABASE_URL)
    cursor = connection.cursor()

    open_price = fetch_open_price(market_day_str)
    if open_price is None:
        print("⚠️ Could not fetch open price.")
        cursor.close()
        connection.close()
        return

    print(f"📈 Inserting open price {open_price} for {market_day}...")

    print("[LOG] Ensuring date exists in daily_data table")
    cursor.execute(
        """
        INSERT INTO daily_data (date)
        VALUES (%s)
        ON CONFLICT (date) DO NOTHING
        """,
        (market_day,)
    )

    print("[LOG] Updating daily_data with open price")
    cursor.execute(
        """
        UPDATE daily_data
        SET open_today = %s
        WHERE date = %s
        """,
        (open_price, market_day)
    )

    connection.commit()
    cursor.close()
    connection.close()
    print("✅ Market open update completed.")

if __name__ == "__main__":
    run_market_open_update()