// Full working component with Pagination (10 per page) and Sentiment/Confidence

"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

export function DataTable({ data }: { data: any[] }) {
  const [summary, setSummary] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const fetchSummary = async (date: string) => {
    setLoading(true)
    try {
      const res = await fetch(`https://ai4vt-production.up.railway.app/summary/${date}`)
      const json = await res.json()
      setSummary(json.summary || "No summary found.")
    } catch (error) {
      console.error(error)
      setSummary("Error loading summary.")
    } finally {
      setLoading(false)
    }
  }

  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  return (
    <div className="w-full rounded-lg border">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Open Today</TableHead>
              <TableHead className="text-right">Close Yesterday</TableHead>
              <TableHead className="text-right">Real Move %</TableHead>
              <TableHead className="text-right">Forecasted Avg %</TableHead>
              <TableHead className="text-right">Sentiment</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead className="text-right">Correct</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => (
              <TableRow key={item.date}>
                <TableCell>{item.date}</TableCell>
                <TableCell className="text-right">{item.open_today.toFixed(2)}</TableCell>
                <TableCell className="text-right">{item.close_yesterday.toFixed(2)}</TableCell>
                <TableCell className="text-right">{item.real_move_pct.toFixed(2)}%</TableCell>
                <TableCell className="text-right">{item.average_pct.toFixed(2)}%</TableCell>
                <TableCell className="text-right">{item.sentiment_score}%</TableCell>
                <TableCell className="text-right">{item.confidence_level}%</TableCell>
                <TableCell className="text-right">
                  {item.correct ? (
                    <Badge variant="outline" className="text-green-500 border-green-500">Correct</Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-500 border-red-500">Wrong</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchSummary(item.date)}
                      >
                        View
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <div className="mx-auto w-full max-w-2xl p-4">
                        <DrawerHeader>
                          <DrawerTitle>Summary for {item.date}</DrawerTitle>
                          <DrawerDescription>News and sentiment info for this date.</DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 text-sm">
                          {loading ? "Loading..." : summary}
                        </div>
                        <DrawerFooter>
                          <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <div className="flex items-center justify-center py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} />
            </PaginationItem>
            <span className="px-2 text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <PaginationItem>
              <PaginationNext onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
