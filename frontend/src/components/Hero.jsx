"use client";

export default function Hero() {
  return (
    <section className="text-center py-20 px-4 bg-white">
      <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
        Welcome to AI4VT
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
        An AI-powered financial forecasting tool that predicts daily movements of the VT ETF using real-time news sentiment analysis.
        Stay ahead of the market with precision insights and sharp analytics.
      </p>
      <a
        href="https://www.linkedin.com/in/marco-beinat-5350581bb/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-black text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition"
      >
        Learn More
      </a>
    </section>
  );
}