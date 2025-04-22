import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI4VT — Financial Sentiment Predictions",
  description: "AI-powered daily prediction of VT ETF market moves based on financial news headlines.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className + " flex flex-col min-h-screen"}>
        {/* Header */}
        <header className="w-full bg-gray-900 text-white py-4 shadow-md">
          <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">🧠 AI4VT</h1>
            <p className="text-sm text-gray-400">Forecasting VT ETF Daily</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="w-full bg-gray-100 dark:bg-gray-800 text-center py-4 text-sm text-gray-500">
          Built with ❤️ by Marco — 2025
        </footer>
      </body>
    </html>
  );
}