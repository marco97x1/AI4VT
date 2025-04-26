"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import Metrics from "@/components/Metrics";
import { LineChartComponent, BarChartComponent } from "@/components/Chart";
import DottedLine from "@/components/ui/dotted-line";
import { DataTable } from "@/components/Table";

export default function Home() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("https://ai4vt-production.up.railway.app/results");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500">Loading chart data...</p>
      </div>
    );
  }

  return (
    <main className="space-y-3">
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto px-1">
        <div className="flex-1 ">
          <Hero />
        </div>
        <div className="flex-1">
          <Metrics data={data} />
        </div>
      </div>
      <DottedLine />
      <section className="max-w-7xl mx-auto px-4 mt-10 mb-10">
        <h2 className="text-2xl font-bold mb-4">Trends</h2>
        <div className="space-y-8">
          <LineChartComponent data={data} />
          <BarChartComponent data={data}/>
        </div>
      </section>
      <DottedLine />
      <section className="max-w-7xl mx-auto px-4 mt-10 mb-5">
        <h2 className="text-2xl font-bold mb-4">History</h2>
        <DataTable data={data} />
      </section>
    </main>
  );
}
