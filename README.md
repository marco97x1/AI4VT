# 🎯 AI4VT — News Sentiment-Based VT ETF Prediction

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 🚀 About the Project

**AI4VT** is an experimental AI system that:
- 📰 Collects financial news headlines daily
- 🤖 Analyzes the news with a lightweight LLM (Large Language Model)
- 📈 Predicts the expected daily movement of the **VT ETF** (Vanguard Total World Stock ETF)
- 🧠 Calculates multiple sentiment metrics: confidence, impact, volatility
- 🖥️ Displays real vs predicted market moves over time through a web interface

**Goal**:  
👉 Understand if AI-driven sentiment analysis can predict real market movement with minimal infrastructure and cost.

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| Backend | [FastAPI](https://fastapi.tiangolo.com/) on [Railway](https://railway.app/) |
| Database | [Supabase Postgres](https://supabase.com/) |
| Frontend | (Coming Soon) [Vercel](https://vercel.com/) (Next.js or React) |
| LLM API | [OpenAI API](https://platform.openai.com/) |
| Financial Data | [FinancialModelingPrep API](https://financialmodelingprep.com/) |
| News API | [NewsAPI](https://newsapi.org/) |

---

## ⚡ Architecture Overview

```plaintext
             🌐 User Browser
                  ↓
         Frontend (Vercel, always-on)
                  ↓ API calls
      --------------------------------
           Backend (FastAPI on Railway)
               - /results
               - /summary/{date}
      --------------------------------
                  ↓
        Database (Supabase Postgres)
```
---

## ⚡ Architecture Overview
🕑 A Cron job runs once per day to fetch news, predict sentiment, and update the database.

🛠️ Local Development Setup
Clone the repo

bash
Copy
Edit
git clone https://github.com/YOUR-USERNAME/AI4VT.git
cd AI4VT
Create a .env file

Copy .env.example to .env and fill your API keys:

bash
Copy
Edit
cp .env.example .env
Fill in:

env
Copy
Edit
DATABASE_URL=your_supabase_database_url
FMP_API_KEY=your_financialmodelingprep_api_key
NEWS_API_KEY=your_newsapi_key
OPENAI_API_KEY=your_openai_api_key
Install dependencies

bash
Copy
Edit
pip install -r requirements.txt
Run the app locally

bash
Copy
Edit
uvicorn main:app --reload
The API will be available at:

arduino
Copy
Edit
http://localhost:8000

--- 
## 🔥 Deployed Services

Service	Provider	Status
Backend API	Railway	🟢 Online
Database	Supabase	🟢 Online
Frontend	Vercel	(Coming soon)

--- 

## ✨ Future Improvements
 Build beautiful Vercel frontend to visualize data 📊

 Improve LLM prompts and fine-tuning to boost accuracy 🎯

 Add a dashboard: trends over time, confidence statistics 📈

 Allow filtering by date ranges on frontend 🔍

 Add user authentication and saved watchlists 🛡️


