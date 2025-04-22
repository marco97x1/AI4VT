import os
import databases
import sqlalchemy
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime, date

# — Load environment variables —
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# — Define your tables —
daily_data = sqlalchemy.Table(
    "daily_data", metadata,
    sqlalchemy.Column("date", sqlalchemy.Date, primary_key=True),
    sqlalchemy.Column("close_yesterday", sqlalchemy.Numeric),
    sqlalchemy.Column("open_today", sqlalchemy.Numeric),
    sqlalchemy.Column("real_move_pct", sqlalchemy.Numeric),
)

predictions = sqlalchemy.Table(
    "predictions", metadata,
    sqlalchemy.Column("date", sqlalchemy.Date, sqlalchemy.ForeignKey("daily_data.date"), primary_key=True),
    sqlalchemy.Column("sentiment_score", sqlalchemy.Integer),
    sqlalchemy.Column("market_impact_score", sqlalchemy.Integer),
    sqlalchemy.Column("confidence_level", sqlalchemy.Integer),
    sqlalchemy.Column("volatility_indicator", sqlalchemy.String),
    sqlalchemy.Column("forecasted_pct", sqlalchemy.Numeric),
    sqlalchemy.Column("calculated_pct", sqlalchemy.Numeric),
    sqlalchemy.Column("average_pct", sqlalchemy.Numeric),
    sqlalchemy.Column("correct", sqlalchemy.Boolean),
)

summaries = sqlalchemy.Table(
    "headlines", metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("date", sqlalchemy.Date),
    sqlalchemy.Column("headline", sqlalchemy.Text),
)

# — Create FastAPI app —
app = FastAPI(title="VT-ETF Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (you can restrict later if needed)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# — Pydantic models —
class Result(BaseModel):
    date: str
    close_yesterday: float
    open_today: float
    real_move_pct: float
    sentiment_score: int
    market_impact_score: int
    confidence_level: int
    volatility_indicator: str
    forecasted_pct: float
    calculated_pct: float
    average_pct: float
    correct: bool

class Summary(BaseModel):
    date: str
    summary: str

# — Startup and Shutdown events —
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# — GET /results —
@app.get("/results", response_model=list[Result])
async def get_results():
    if not database.is_connected:
        await database.connect()

    query = (
        daily_data
        .join(predictions, daily_data.c.date == predictions.c.date)
        .select()
        .order_by(daily_data.c.date)
    )
    rows = await database.fetch_all(query)

    fixed_rows = []
    for r in rows:
        r_dict = dict(r)
        r_dict["date"] = r_dict["date"].strftime("%Y-%m-%d")
        r_dict["close_yesterday"] = float(r_dict["close_yesterday"])
        r_dict["open_today"] = float(r_dict["open_today"])
        r_dict["real_move_pct"] = float(r_dict["real_move_pct"])
        r_dict["forecasted_pct"] = float(r_dict["forecasted_pct"])
        r_dict["calculated_pct"] = float(r_dict["calculated_pct"])
        r_dict["average_pct"] = float(r_dict["average_pct"])
        fixed_rows.append(Result(**r_dict))

    return fixed_rows

# — GET /summary/{date} —
@app.get("/summary/{date}", response_model=Summary)
async def get_summary(date: str):
    if not database.is_connected:
        await database.connect()

    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    query = summaries.select().where(summaries.c.date == date_obj)
    row = await database.fetch_one(query)

    if not row:
        raise HTTPException(status_code=404, detail="No summary found for this date")

    return Summary(date=row["date"].strftime("%Y-%m-%d"), summary=row["headline"])