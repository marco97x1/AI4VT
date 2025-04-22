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
        <p className="text-gray-500 text-sm mb-1">Win Rate</p>
        <h2 className="text-2xl font-bold">{winRate}%</h2>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-1">Today Average</p>
        <h2 className={`text-2xl font-bold ${today.average_pct > 0 ? "text-green-500" : "text-red-500"}`}>
          {today.average_pct}%
        </h2>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-1">Confidence</p>
        <h2 className="text-2xl font-bold">{today.confidence_level}%</h2>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
        <p className="text-gray-500 text-sm mb-1">Volatility</p>
        <h2 className="text-2xl font-bold">{today.volatility_indicator}</h2>
      </div>
    </section>
  );
}