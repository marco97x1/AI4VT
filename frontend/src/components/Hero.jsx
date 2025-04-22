"use client";

export default function Hero() {
  return (
    <section className="text-left py-20 px-4 bg-gray-50">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-6">
        Forecasting VT ETF's Next Opening
      </h1>
      <p className="text-sm text-gray-600 max-w-2xl mb-8">
        AI4VT leverages advanced AI models to analyze a wide range of financial data, including news headlines, market trends, and sentiment metrics, to forecast how the VT ETF will open in the next trading session. This tool aims to provide actionable insights for investors and researchers.
      </p>
      <p className="text-sm text-gray-600 max-w-2xl mb-8">
        <strong>Tech Stack:</strong>
        <span className="inline-block bg-gray-800 text-white px-3 py-1 rounded-md mr-2">FastAPI</span>
        <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-md mr-2">Supabase</span>
        <span className="inline-block bg-purple-600 text-white px-3 py-1 rounded-md mr-2">OpenAI</span>
        <span className="inline-block bg-gray-900 text-white px-3 py-1 rounded-md mr-2">Railway</span>
        <span className="inline-block bg-black text-white px-3 py-1 rounded-md">Vercel</span>
      </p>
    </section>
  );
}