"use client";

import { useEffect, useState } from "react";

export default function Table() {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("https://ai4vt-production.up.railway.app/results");
        const json = await res.json();
        setData(json.reverse()); // Show newest first
      } catch (error) {
        console.error("Error fetching table data:", error);
      }
    }
    fetchData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Date (Trading Day)</th>
              <th className="px-6 py-3 text-right">Real % (Actual Market Move)</th>
              <th className="px-6 py-3 text-right">Forecast % (Predicted Move)</th>
              <th className="px-6 py-3 text-right">Calc % (Calculated Move)</th>
              <th className="px-6 py-3 text-right">Avg % (Average of Metrics)</th>
              <th className="px-6 py-3 text-center">Correct (✔/✘)</th>
              <th className="px-6 py-3 text-left">Headline</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {currentItems.map((row) => (
              <tr key={row.date} className="border-t">
                <td className="px-6 py-4">{row.date}</td>
                <td className={`px-6 py-4 text-right ${row.real_move_pct > 0 ? "text-green-600" : "text-red-600"}`}>
                  {row.real_move_pct}%
                </td>
                <td className={`px-6 py-4 text-right ${row.forecasted_pct > 0 ? "text-green-600" : "text-red-600"}`}>
                  {row.forecasted_pct}%
                </td>
                <td className={`px-6 py-4 text-right ${row.calculated_pct > 0 ? "text-green-600" : "text-red-600"}`}>
                  {row.calculated_pct}%
                </td>
                <td className={`px-6 py-4 text-right ${row.average_pct > 0 ? "text-green-600" : "text-red-600"}`}>
                  {row.average_pct}%
                </td>
                <td className="px-6 py-4 text-center">
                  {row.correct ? "✔" : "✘"}
                </td>
                <td className="px-6 py-4 text-left animate-marquee">
                  {row.headline || "No headline available"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center space-x-2 mt-6">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded-md border ${
              currentPage === i + 1 ? "bg-black text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Prediction:</strong> LLM-based prediction of market movement.</p>
        <p><strong>Calculated:</strong> Algorithmic calculation using LLM outputs like sentiment and confidence.</p>
        <p><strong>Average:</strong> The average of the Prediction and Calculated values.</p>
      </div>
    </section>
  );
}
