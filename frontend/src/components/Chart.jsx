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
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 14,
            family: "Arial, sans-serif"
          }
        }
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
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
        text: "Real vs Forecasted vs Calculated Market Moves",
        font: {
          size: 18,
          family: "Arial, sans-serif"
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (val) => `${val}%`,
          font: {
            size: 12,
            family: "Arial, sans-serif"
          }
        },
        title: {
          display: true,
          text: "Percentage Change",
          font: {
            size: 14,
            family: "Arial, sans-serif"
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 12,
            family: "Arial, sans-serif"
          }
        },
        title: {
          display: true,
          text: "Date",
          font: {
            size: 14,
            family: "Arial, sans-serif"
          }
        }
      }
    }
  };

  const vtChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: { mode: "index", intersect: false },
      title: {
        display: true,
        text: "VT Value Over Time",
        font: { size: 16 }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "VT Value"
        }
      },
      x: {
        title: {
          display: true,
          text: "Date"
        }
      }
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div className="flex justify-center space-x-4 mb-6">
        {["1M", "3M", "1Y", "ALL"].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-full border ${
              range === r ? "bg-blue-600 text-white" : "text-gray-600"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <Line data={chartData} options={chartOptions} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <Line data={vtValueChartData} options={vtChartOptions} />
        </div>
      </div>
    </section>
  );
}
