"use client";

export default function Hero() {
  return (
    <section className="text-center py-20 px-4 bg-gray-50">
      <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
        Welcome to AI4VT
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
        AI4VT is an AI-powered financial forecasting tool that predicts daily movements of the VT ETF using real-time news sentiment analysis. Our goal is to explore the potential of AI in financial markets.
      </p>
      <p className="text-md text-gray-500 max-w-2xl mx-auto mb-8">
        Key Performance Indicators (KPIs) such as confidence, impact, and volatility are calculated to provide actionable insights. Hover over the metrics to learn more about each KPI.
      </p>
      <div className="flex justify-center space-x-4">
        <a
          href="https://github.com/marco97x1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-gray-800 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-700 transition"
        >
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/marco-beinat-5350581bb/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-500 transition"
        >
          LinkedIn
        </a>
      </div>
    </section>
  );
}