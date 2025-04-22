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
        <header className="w-full bg-white text-gray-800 py-6 shadow-lg">
          <div className="max-w-6xl mx-auto px-8 flex justify-between items-center" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
            <h1 className="text-3xl font-extrabold flex items-center space-x-4">
              <img src="/bear-animal-color-icon.png" alt="AI4VT Logo" className="h-10 w-10" />
              <span className="tracking-wide">AI4VT</span>
            </h1>
            <nav className="flex space-x-4">
              <a href="https://github.com/marco97x1" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 border border-black text-black px-4 py-2 rounded-md">
                <img src="/github-icon.png" alt="GitHub" className="h-6 w-6" />
                <span>GitHub</span>
              </a>
              <a href="https://www.linkedin.com/in/marco-beinat-5350581bb/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-[#0e76a8] text-white px-4 py-2 rounded-md">
                <img src="/linkedin-app-icon.png" alt="LinkedIn" className="h-6 w-6" />
                <span>LinkedIn</span>
              </a>
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