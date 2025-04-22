"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, LineChart, Activity } from "lucide-react";

export default function Home() {
  const [data, setData] = useState([]);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading predictions...</p>
      </div>
    );
  }

  const winRate = data.length
    ? Math.round((data.filter((d) => d.correct).length / data.length) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-6 py-8 space-y-8">
      {/* Header */}
      <header className="w-full flex justify-between items-center py-4 max-w-6xl">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-bold">🧠 AI4VT</span>
          <span className="text-sm text-gray-500">Forecasting VT ETF</span>
        </div>
        <div>
          <a
            href="https://www.linkedin.com/in/marco-beinat-5350581bb/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm hover:underline"
          >
            Marco&apos;s LinkedIn
          </a>
        </div>
      </header>

      {/* Mini Dashboard */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-6xl">
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <span className="text-gray-500 text-sm">Win Rate</span>
          <span className="text-2xl font-bold">{winRate}% ✅</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <span className="text-gray-500 text-sm">Today Avg</span>
          <span className={`text-2xl font-bold ${today?.average_pct > 0 ? "text-green-500" : "text-red-500"}`}>
            {today?.average_pct}%
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <span className="text-gray-500 text-sm">Confidence</span>
          <span className="text-2xl font-bold">{today?.confidence_level}%</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <span className="text-gray-500 text-sm">Volatility</span>
          <span className="text-2xl font-bold">{today?.volatility_indicator}</span>
        </div>
      </section>

      {/* Today's Forecast */}
      <section className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-2xl space-y-4">
        <h2 className="text-xl font-semibold">📈 Today&apos;s Forecast ({today?.date})</h2>
        <div className="flex flex-col items-center">
          <div className="flex items-center text-4xl font-bold space-x-2">
            {today?.average_pct > 0 ? (
              <ArrowUpRight className="text-green-500 w-10 h-10" />
            ) : (
              <ArrowDownRight className="text-red-500 w-10 h-10" />
            )}
            <span className={today?.average_pct > 0 ? "text-green-600" : "text-red-600"}>
              {today?.average_pct}%
            </span>
          </div>
          <p className="text-gray-500">
            Volatility: {today?.volatility_indicator}
          </p>
          <p className="text-gray-500">
            Confidence: {today?.confidence_level}%
          </p>
        </div>
      </section>

      {/* Historical Table */}
      <section className="w-full max-w-6xl overflow-x-auto">
        <table className="min-w-full bg-white text-sm text-gray-700 rounded-lg overflow-hidden shadow-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Real %</th>
              <th className="px-4 py-2">Forecast %</th>
              <th className="px-4 py-2">Calc %</th>
              <th className="px-4 py-2">Avg %</th>
              <th className="px-4 py-2">Correct</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.date} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{row.date}</td>
                <td className={`px-4 py-2 ${row.real_move_pct > 0 ? "text-green-600" : "text-red-600"}`}>
                  {row.real_move_pct}%
                </td>
                <td className={`px-4 py-2 ${row.forecasted_pct > 0 ? "text-green-600" : "text-red-600"}`}>
                  {row.forecasted_pct}%
                </td>
                <td className={`px-4 py-2 ${row.calculated_pct > 0 ? "text-green-600" : "text-red-600"}`}>
                  {row.calculated_pct}%
                </td>
                <td className={`px-4 py-2 ${row.average_pct > 0 ? "text-green-600" : "text-red-600"}`}>
                  {row.average_pct}%
                </td>
                <td className="px-4 py-2">
                  {row.correct ? "✅" : "❌"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-gray-400 text-sm">
        © 2025 AI4VT Built with ❤️ by Marco Beinat
      </footer>
    </main>
  );
}