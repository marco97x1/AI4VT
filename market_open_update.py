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

def run_market_open_update():
    connection = psycopg2.connect(DATABASE_URL)
    cursor = connection.cursor()

    open_price = fetch_open_price()
    if open_price is None:
        print("⚠️ Could not fetch open price.")
        cursor.close()
        connection.close()
        return

    print(f"📈 Inserting open price {open_price} for {market_day_str}...")

    # Simplify the logic to only ensure the date exists and update the open_today field
    print("[LOG] Ensuring date exists in daily_data table")
    cursor.execute(
        """
        INSERT INTO daily_data (date)
        VALUES (%s)
        ON CONFLICT (date) DO NOTHING
        """,
        (market_day_str,)
    )

    print("[LOG] Updating daily_data with open price")
    cursor.execute(
        """
        UPDATE daily_data
        SET open_today = %s
        WHERE date = %s
        """,
        (open_price, market_day_str)
    )

    connection.commit()
    cursor.close()
    connection.close()
    print("✅ Market open update completed.")

if __name__ == "__main__":
    run_market_open_update()