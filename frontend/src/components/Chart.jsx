"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function Chart() {
  const [data, setData] = useState([]);
  const [range, setRange] = useState("1M"); // 1M, 3M, 1Y, ALL

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("https://ai4vt-production.up.railway.app/results");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    }
    fetchData();
  }, []);

  const getFilteredData = () => {
    const today = new Date();
    let filtered = [];

    if (range === "1M") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);
      filtered = data.filter((d) => new Date(d.date) >= oneMonthAgo);
    } else if (range === "3M") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      filtered = data.filter((d) => new Date(d.date) >= threeMonthsAgo);
    } else if (range === "1Y") {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      filtered = data.filter((d) => new Date(d.date) >= oneYearAgo);
    } else {
      filtered = data;
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  const chartData = {
    labels: filteredData.map((d) => d.date),
    datasets: [
      {
        label: "Real % Move",
        data: filteredData.map((d) => d.real_move_pct),
        fill: false,
        borderColor: "#2563eb",
        tension: 0.3
      },
      {
        label: "Forecasted % Move",
        data: filteredData.map((d) => d.forecasted_pct),
        fill: false,
        borderColor: "#10b981",
        tension: 0.3
      },
      {
        label: "Calculated % Move",
        data: filteredData.map((d) => d.calculated_pct),
        fill: false,
        borderColor: "#f59e0b",
        tension: 0.3
      }
    ]
  };

  const vtValueChartData = {
    labels: filteredData.map((d) => d.date),
    datasets: [
      {
        label: "VT Value",
        data: filteredData.map((d) => d.open_today),
        fill: false,
        borderColor: "#ef4444",
        tension: 0.3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 12,
            family: "Arial, sans-serif"
          },
          color: "#333"
        }
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(50, 50, 50, 0.9)",
        titleFont: {
          size: 14,
          family: "Arial, sans-serif"
        },
        bodyFont: {
          size: 12,
          family: "Arial, sans-serif"
        }
      },
      title: {
        display: true,
        text: "Market Moves",
        font: {
          size: 18,
          family: "Arial, sans-serif"
        },
        color: "#333"
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (val) => `${val}%`,
          font: {
            size: 12,
            family: "Arial, sans-serif"
          },
          color: "#333"
        },
        title: {
          display: true,
          text: "Percentage Change",
          font: {
            size: 14,
            family: "Arial, sans-serif"
          },
          color: "#333"
        }
      },
      x: {
        ticks: {
          font: {
            size: 12,
            family: "Arial, sans-serif"
          },
          color: "#333"
        },
        title: {
          display: true,
          text: "Date",
          font: {
            size: 14,
            family: "Arial, sans-serif"
          },
          color: "#333"
        }
      }
    }
  };

  const filterOptions = ["1W", "1M", "1Y", "ALL"];

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div className="flex justify-center space-x-4 mb-6">
        {filterOptions.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-full border ${
              range === r ? "bg-black text-white" : "bg-gray-300 text-gray-800"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-lg shadow">
          <Line data={chartData} options={chartOptions} />
        </div>
        <div className="bg-white p-8 rounded-lg shadow">
          <Line data={vtValueChartData} options={chartOptions} />
        </div>
      </div>
    </section>
  );
}
