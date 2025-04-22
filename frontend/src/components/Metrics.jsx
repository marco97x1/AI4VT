"use client";

import { useEffect, useState } from "react";

export default function Metrics() {
  const [data, setData] = useState([]);
  const [today, setToday] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("https://ai4vt-production.up.railway.app/results");
        const json = await res.json();
        setData(json);
        if (json.length > 0) {
          setToday(json[json.length - 1]);
        }
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchHeadlines() {
      try {
        const res = await fetch(`https://ai4vt-production.up.railway.app/summary/${today.date}`);
        const json = await res.json();
        setToday((prev) => ({ ...prev, summary: json.summary }));
      } catch (error) {
        console.error("Error fetching headline:", error);
      }
    }

    if (today && today.date) {
      fetchHeadlines();
    }
  }, [today?.date]);

  if (!today) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500">Loading metrics...</p>
      </div>
    );
  }

  const winRate = data.length
    ? Math.round((data.filter((d) => d.correct).length / data.length) * 100)
    : 0;

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto py-10 px-4">
      <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-1">Forecast Accuracy</p>
        <h2 className="text-3xl font-bold text-blue-600">{winRate}%</h2>
        <p className="text-xs text-gray-400">Percentage of correct predictions over total predictions.</p>
        <p className={`text-xs font-semibold ${today.improvement > 0 ? "text-green-500" : "text-red-500"}`}>
          {today.improvement > 0 ? "+" : ""}{today.improvement || 0}% compared to yesterday
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-1">Today Average</p>
        <h2 className={`text-2xl font-bold ${today.average_pct > 0 ? "text-green-500" : "text-red-500"}`}>
          {today.average_pct}%
        </h2>
        <p className="text-xs text-gray-400">The average of all calculated metrics for today.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-1">Confidence</p>
        <h2 className="text-2xl font-bold">{today.confidence_level}%</h2>
        <p className="text-xs text-gray-400">Confidence level of the prediction based on sentiment analysis.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-1">Volatility</p>
        <h2 className="text-2xl font-bold">{today.volatility_indicator}</h2>
        <p className="text-xs text-gray-400">Indicates the expected market volatility for the day.</p>
      </div>
      <div className="bg-black text-white p-4 rounded-lg shadow flex items-center overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-lg font-digital">
          {today.summary || "No major news"}
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-1">Market Impact</p>
        <h2 className="text-2xl font-bold">{today.market_impact_score}</h2>
        <p className="text-xs text-gray-400">A score indicating the potential market impact based on sentiment analysis.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-1">Sentiment Score</p>
        <h2 className="text-2xl font-bold">{today.sentiment_score}</h2>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-1">Correct Predictions</p>
        <h2 className="text-2xl font-bold">{data.filter((d) => d.correct).length}</h2>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-1">Day-to-Day Improvement</p>
        <h2 className="text-2xl font-bold">{today.improvement || "N/A"}</h2>
        <p className="text-xs text-gray-400">Change in prediction accuracy compared to the previous day.</p>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 10s linear infinite;
        }
        .font-digital {
          font-family: 'Courier New', Courier, monospace;
        }
      `}</style>
    </section>
  );
}