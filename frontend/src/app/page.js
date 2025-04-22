"use client";

import Hero from "@/components/Hero";
import Metrics from "@/components/Metrics";
import Chart from "@/components/Chart";
import Table from "@/components/Table";

export default function Home() {
  return (
    <main>
      <Hero />
      <Metrics />
      <Chart />
      <Table />
    </main>
  );
}
