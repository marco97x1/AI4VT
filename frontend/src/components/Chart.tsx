"use client";

import * as React from "react";
import { Cell, ReferenceLine } from "recharts";
import {
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  Bar,
  BarChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ChartDataPoint = {
  date: string;
  real_move_pct: number;
  average_pct: number;
};

export function LineChartComponent({ data }: { data: ChartDataPoint[] }) {
  const [timeRange, setTimeRange] = React.useState("90d");

  const filteredData = data.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  const chartConfig = {
    real_move_pct: {
      label: "Real Open Move %",
      color: "#1d4ed8", // Dark Blue
    },
    average_pct: {
      label: "Forecasted %",
      color: "#22c55e", // Green
    },
  };

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Real Open Values vs Forecasted</CardTitle>
          <CardDescription>Showing data for the selected time range</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
            <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
            <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            <SelectItem value="365d" className="rounded-lg">All Year</SelectItem>    
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart data={filteredData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                  formatter={(value, name) =>
                    typeof value === "number"
                      ? [`${value.toFixed(2)}%`, " ", name]
                      : [`${value}%`, " ",name]
                  }
                />
              }
            />
            <Line
              dataKey="real_move_pct"
              type="monotone"
              stroke={chartConfig.real_move_pct.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
            <Line
              dataKey="average_pct"
              type="monotone"
              stroke={chartConfig.average_pct.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function BarChartComponent({ data }: { data: ChartDataPoint[] }) {
  const [timeRange, setTimeRange] = React.useState("90d");

  const filteredData = data.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  }).map((item) => {
    const rawDiff = item.real_move_pct - item.average_pct;
    const absDiff = Math.abs(rawDiff);

    const sameSign =
      (item.real_move_pct >= 0 && item.average_pct >= 0) ||
      (item.real_move_pct <= 0 && item.average_pct <= 0);

    let barColor = "#1d4ed8"; // Dark Blue
    if (sameSign && absDiff < 1.5) {
      barColor = "#22c55e"; // Green
    }

    return {
      ...item,
      diff_value: absDiff,
      barColor,
    };
  });

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Absolute Difference: Real Open Value - Forecasted</CardTitle>
          <CardDescription>Showing data for the selected time range</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
            <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
            <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            <SelectItem value="365d" className="rounded-lg">All Year</SelectItem>    
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px] w-full">
          <BarChart data={filteredData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  formatter={(value, name) =>
                    typeof value === "number"
                      ? [`${value.toFixed(2)}%`," ", name]
                      : [`${value}%`, " ", name]
                  }
                />
              }
            />
            <ReferenceLine y={1.5} stroke="#f97316" strokeDasharray="5 5" />
            <Bar dataKey="diff_value" radius={4} isAnimationActive={true}>
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.barColor} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Manual Legend */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[#22c55e]" />
            <span className="text-sm text-muted-foreground">Precise (&lt; 1.5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[#1d4ed8]" />
            <span className="text-sm text-muted-foreground">Imprecise (&ge; 1.5%)</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm" />
    </Card>
  );
}
