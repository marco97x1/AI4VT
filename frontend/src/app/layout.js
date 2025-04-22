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
        <header className="w-full bg-gray-100 text-gray-800 py-6 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">🌍 AI4VT</h1>
            <nav className="flex space-x-4">
              <a href="https://github.com/marco97x1" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">GitHub</a>
              <a href="https://www.linkedin.com/in/marco-beinat-5350581bb/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">LinkedIn</a>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="w-full bg-gray-100 text-gray-800 py-6 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-sm">Built with &hearts; by Marco &mdash; 2025</p>
            <p className="text-xs text-gray-500">Support the initiative by following us on GitHub and LinkedIn!</p>
          </div>
        </footer>
      </body>
    </html>
  );
}