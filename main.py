import os
import databases
import sqlalchemy
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

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
    "summaries", metadata,
    sqlalchemy.Column("date", sqlalchemy.Date, primary_key=True),
    sqlalchemy.Column("summary", sqlalchemy.Text),
)

# — Create FastAPI app —
app = FastAPI(title="VT-ETF Prediction API")

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

# — GET /results endpoint —
@app.get("/results", response_model=list[Result])
async def get_results():
    query = (
        daily_data
        .join(predictions, daily_data.c.date == predictions.c.date)
        .select()
        .order_by(daily_data.c.date)
    )
    rows = await database.fetch_all(query)
    return [Result(**dict(r)) for r in rows]

# — GET /summary/{date} endpoint —
@app.get("/summary/{date}", response_model=Summary)
async def get_summary(date: str):
    query = summaries.select().where(summaries.c.date == date)
    row = await database.fetch_one(query)
    if not row:
        raise HTTPException(status_code=404, detail="No summary found for this date")
    return Summary(**dict(row))
