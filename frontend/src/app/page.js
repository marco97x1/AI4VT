"use client";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useEffect, useState } from "react";

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
          setToday(json[json.length - 1]); // latest entry
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

  return (
    <main className="flex flex-col items-center justify-start p-8 space-y-8">
      {/* Today's Forecast */}
      {today && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md w-full max-w-2xl text-center space-y-4">
          <h1 className="text-2xl font-bold">
            📈 Today's Forecast ({today.date})
          </h1>
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2 text-4xl font-bold">
              {today.average_pct > 0 ? (
                <ArrowUpRight className="text-green-500 w-10 h-10" />
              ) : (
                <ArrowDownRight className="text-red-500 w-10 h-10" />
              )}
              <span
                className={
                  today.average_pct > 0 ? "text-green-600" : "text-red-600"
                }
              >
                {today.average_pct}%
              </span>
            </div>
            <p className="text-gray-500">
              Volatility: {today.volatility_indicator}
            </p>
            <p className="text-gray-500">
              Confidence: {today.confidence_level}%
            </p>
          </div>
        </div>
      )}

      {/* Historical Table */}
      <div className="w-full max-w-5xl overflow-x-auto">
        <table className="min-w-full table-auto text-sm text-left">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-800">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Real %</th>
              <th className="px-4 py-2">Predicted %</th>
              <th className="px-4 py-2">Correct?</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.date}
                className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-2">{row.date}</td>
                <td
                  className={`px-4 py-2 ${
                    row.real_move_pct > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {row.real_move_pct}%
                </td>
                <td
                  className={`px-4 py-2 ${
                    row.average_pct > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {row.average_pct}%
                </td>
                <td className="px-4 py-2">
                  {row.correct ? "✅" : "❌"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
