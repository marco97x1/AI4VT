// Full updated working Metrics component with Market Status (Open/Close), Animations, Full Card Descriptions and Badges for All Metrics

"use client"

import { useEffect, useState } from "react"
import { TrendingDownIcon, TrendingUpIcon, Circle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Metrics({ data }: { data: any[] }) {
  const [summary, setSummary] = useState("")
  const [marketOpen, setMarketOpen] = useState(false)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const mostRecentDate = data[data.length - 1]?.date
        if (mostRecentDate) {
          const res = await fetch(`https://ai4vt-production.up.railway.app/summary/${mostRecentDate}`)
          const json = await res.json()
          setSummary(json.summary)
        }
      } catch (error) {
        console.error("Error fetching summary:", error)
      }
    }

    if (data.length > 0) {
      fetchSummary()
    }

    function checkMarketOpen() {
      const now = new Date()
      const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
      const hours = nyTime.getHours()
      const minutes = nyTime.getMinutes()
      const isOpen =
        (hours > 9 || (hours === 9 && minutes >= 30)) && (hours < 16 || (hours === 16 && minutes === 0))
      setMarketOpen(isOpen)
    }

    checkMarketOpen()
    const interval = setInterval(checkMarketOpen, 60000)
    return () => clearInterval(interval)
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500">Loading metrics...</p>
      </div>
    )
  }

  const today = data[data.length - 1]
  const yesterday = data.length > 1 ? data[data.length - 2] : null
  const winRate = data.length
    ? Math.round((data.filter((d) => d.correct).length / data.length) * 100)
    : 0
  const yesterdayWinRate = data.length > 1
    ? Math.round((data.filter((d, idx) => idx !== data.length - 1 && d.correct).length / (data.length - 1)) * 100)
    : 0

  const metricDifference = (todayValue: number, yesterdayValue: number) => todayValue - yesterdayValue

  return (
    <section className="flex flex-col gap-6 max-w-6xl mx-auto py-8 px-2">
      <div className="flex items-center gap-2">
        <Circle className={`h-3 w-3 ${marketOpen ? "text-green-500 animate-pulse" : "text-red-500 animate-pulse"}`} />
        <p className="text-sm font-medium">
          {marketOpen ? "Market Open (NYSE)" : "Market Closed (NYSE)"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Forecast Accuracy */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Forecast Accuracy</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {winRate}%
            </CardTitle>
            {yesterday && (
              <div className="flex gap-1 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {metricDifference(winRate, yesterdayWinRate) >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
                  {metricDifference(winRate, yesterdayWinRate) >= 0 ? "+" : ""}
                  {metricDifference(winRate, yesterdayWinRate).toFixed(2)}%
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardFooter className="flex flex-col items-start text-sm">
            <div className="font-medium">
              Percentage of correct predictions compared to total.
            </div>
          </CardFooter>
        </Card>

        {/* Average Forecast */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Today Average Forecast</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {today.average_pct}%
            </CardTitle>
            {yesterday && (
              <div className="flex gap-1 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {metricDifference(today.average_pct, yesterday.average_pct) >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
                  {metricDifference(today.average_pct, yesterday.average_pct) >= 0 ? "+" : ""}
                  {metricDifference(today.average_pct, yesterday.average_pct).toFixed(2)}%
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardFooter className="flex flex-col items-start text-sm">
            <div className="font-medium">
              Average predicted market move based on models.
            </div>
          </CardFooter>
        </Card>

        {/* Prediction Confidence */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Prediction Confidence</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {today.confidence_level}%
            </CardTitle>
            {yesterday && (
              <div className="flex gap-1 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {metricDifference(today.confidence_level, yesterday.confidence_level) >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
                  {metricDifference(today.confidence_level, yesterday.confidence_level) >= 0 ? "+" : ""}
                  {metricDifference(today.confidence_level, yesterday.confidence_level).toFixed(2)}%
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardFooter className="flex flex-col items-start text-sm">
            <div className="font-medium">
              Confidence level for today's prediction.
            </div>
          </CardFooter>
        </Card>

        {/* Today Open */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Today Open Price</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              ${today.open_today.toFixed(2)}
            </CardTitle>
            {yesterday && (
              <div className="flex gap-1 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {metricDifference(today.open_today, yesterday.open_today) >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
                  {metricDifference(today.open_today, yesterday.open_today) >= 0 ? "+" : ""}
                  {metricDifference(today.open_today, yesterday.open_today).toFixed(2)}%
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardFooter className="flex flex-col items-start text-sm">
            <div className="font-medium">
              Actual VT market open price today.
            </div>
          </CardFooter>
        </Card>

        {/* Real Market Move */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Real Market Move</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {today.real_move_pct}%
            </CardTitle>
            {yesterday && (
              <div className="flex gap-1 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {metricDifference(today.real_move_pct, yesterday.real_move_pct) >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
                  {metricDifference(today.real_move_pct, yesterday.real_move_pct) >= 0 ? "+" : ""}
                  {metricDifference(today.real_move_pct, yesterday.real_move_pct).toFixed(2)}%
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardFooter className="flex flex-col items-start text-sm">
            <div className="font-medium">
              True market movement from yesterday’s close.
            </div>
          </CardFooter>
        </Card>

        {/* Sentiment Score */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Sentiment Score</CardDescription>
            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
              {today.sentiment_score}
            </CardTitle>
            {yesterday && (
              <div className="flex gap-1 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {metricDifference(today.sentiment_score, yesterday.sentiment_score) >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
                  {metricDifference(today.sentiment_score, yesterday.sentiment_score) >= 0 ? "+" : ""}
                  {metricDifference(today.sentiment_score, yesterday.sentiment_score).toFixed(2)}
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardFooter className="flex flex-col items-start text-sm">
            <div className="font-medium">
              Sentiment derived from aggregated news and market data.
            </div>
          </CardFooter>
        </Card>
      </div>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Headline Summary</CardDescription>
          <CardTitle className="text-lg font-semibold">
            {summary || "No major news available today."}
          </CardTitle>
        </CardHeader>
      </Card>
    </section>
  )
}