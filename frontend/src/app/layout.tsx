"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import "./globals.css";
import { Inter } from "next/font/google";
import DottedLine from "@/components/ui/dotted-line";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const firstChild = carouselRef.current.firstChild as HTMLElement;
        carouselRef.current.appendChild(firstChild);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <html lang="en">
      <head>
        <title>AI4VT - AI Forecasting for Vanguard VT ETF</title>
        <meta
          name="description"
          content="AI4VT forecasts the Vanguard Total World Stock ETF (VT) next opening using AI-driven analysis of financial news, market data, and macroeconomic signals."
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="AI4VT - AI Forecasting for VT ETF" />
        <meta name="google-site-verification" content="fikhVwo3ZwnbfpNcn_y_6by89m7kfnyDkqD5kcP_tuY" />
        <meta
          property="og:description"
          content="Get AI-powered insights forecasting the next opening move of VT ETF based on news, sentiment, and data."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ai4vt.vercel.app/" />
        <meta property="og:image" content="https://ai4vt.vercel.app/logo_bear.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-NJC7CBVF');
            `,
          }}
        />
      </head>
      <body className={inter.className + " flex flex-col min-h-screen"}>
        {/* Google Tag Manager (noscript fallback) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NJC7CBVF"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <div>
          {/* HEADER */}
          <div className="w-full">
            <header className="max-w-7xl mx-auto px-2 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center space-x-2">
                  <Image src="/logo_bear.png" alt="AI4VT Logo" width={48} height={48} className="h-12 w-12" />
                  <span>AI4VT</span>
                </h1>
                <nav className="flex space-x-2">
                  <a
                    href="https://github.com/marco97x1/AI4VT"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 border border-black text-black px-3 py-1 rounded-md text-xs"
                  >
                    <Image src="/github-icon.png" alt="GitHub" width={16} height={16} className="h-4 w-4" />
                    <span>GitHub</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/marco-beinat-5350581bb/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 bg-[#0A66C2] text-white px-3 py-1 rounded-md text-xs"
                  >
                    <Image src="/linkedin-app-icon.png" alt="LinkedIn" width={16} height={16} className="h-4 w-4" />
                    <span>LinkedIn</span>
                  </a>
                </nav>
              </div>
            </header>
          </div>

          <DottedLine />

          {/* MAIN */}
          <main>{children}</main>

          {/* FOOTER */}
          <footer className="py-10">
            <DottedLine />
            <div className="text-center text-xs mt-3">
              <p>
                AI4VT is an AI-powered tool that forecasts daily movements of the Vanguard Total World Stock ETF (VT) by analyzing financial news, macroeconomic signals, and market data.
                <br />
                Built with care and for pure educational purposes to support research and transparency in global investing.
                <br />
                © 2025 Marco Beinat · Powered by
                <Image src="/openai-icon.png" alt="OpenAI Logo" width={16} height={16} className="inline h-4 w-4 mx-1" />
                OpenAI
                <a href="https://www.linkedin.com/in/marco-beinat-5350581bb/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">LinkedIn</a>
              </p>

              {/* MOVING PARTNERS */}
              <div className="overflow-hidden max-w-7xl mx-auto space-x-12 mt-4 relative">
                <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-white to-transparent z-10"></div>

                <div className="flex animate-scroll whitespace-nowrap space-x-12 px-32">
                  <Image src="/logo/Com_1.PNG" alt="Partner 1" width={60} height={30} className="object-contain" />
                  <Image src="/logo/Com_2.PNG" alt="Partner 2" width={60} height={30} className="object-contain" />
                  <Image src="/logo/Com_3.PNG" alt="Partner 3" width={60} height={30} className="object-contain" />
                  <Image src="/logo/Com_4.PNG" alt="Partner 4" width={60} height={30} className="object-contain" />
                  <Image src="/logo/Com_5.PNG" alt="Partner 5" width={60} height={30} className="object-contain" />
                  <Image src="/logo/Com_6.PNG" alt="Partner 6" width={60} height={30} className="object-contain" />
                  <Image src="/logo/Com_7.PNG" alt="Partner 7" width={60} height={30} className="object-contain" />
                </div>

                <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white to-transparent z-10"></div>
              </div>

              <p className="text-gray-500 text-xxs mt-2">Trusted Partners</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
