"use client";

import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="text-left py-20 px-4 bg-transparent">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-6">
        Forecasting VT ETF&apos;s Next Opening
      </h1>
      <p className="text-sm text-gray-600 max-w-2xl mb-8">
        AI4VT leverages advanced AI models to analyze a wide range of financial data, including news headlines, market trends, and sentiment metrics, to forecast how the VT ETF will open in the next trading session. This tool aims to provide actionable insights for investors and researchers.
      </p>
      <p className="text-sm text-gray-600 max-w-2xl mb-8">
        Vanguard Total World Stock ETF (VT) is an exchange-traded fund that seeks to track the performance of the FTSE Global All Cap Index, providing investors with exposure to a wide range of global stocks. <a href="https://investor.vanguard.com/investment-products/etfs/profile/vt" className="text-blue-600 underline">Learn more</a>.
      </p>
      <p className="text-sm text-gray-600 max-w-2xl mb-3">
        <strong>Tech Stack:</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">
          <Image src="/fast_api.png" alt="FastAPI Logo" width={16} height={16} className="inline h-4 w-4 mr-1 filter invert" />
        FastAPI
        </Badge>
        <Badge variant="success">
          <Image src="/supabase-554aca1c.png" alt="Supabase Logo" width={16} height={16} className="inline h-4 w-4 mr-1" />
          Supabase
        </Badge>
        <Badge variant="secondary">
          <Image src="/openai-icon.png" alt="OpenAI Logo" width={16} height={16} className="inline h-4 w-4 mr-1" />
          OpenAI
        </Badge>
        <Badge variant="outline">
          <Image src="/railway.png" alt="Railway Logo" width={16} height={16} className="inline h-4 w-4 mr-1" />
          Railway
        </Badge>
        <Badge variant="destructive">
          <Image src="/vercel.png" alt="Vercel Logo" width={16} height={16} className="inline h-4 w-4 mr-1 filter invert" />
          Vercel
        </Badge>
      </div>
    </section>
  );
}