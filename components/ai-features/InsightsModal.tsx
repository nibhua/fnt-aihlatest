"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Lightbulb,
  FileText,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronDown,
  Trash2,
  CornerUpLeft,
  Loader2,
} from "lucide-react"
import { generateInsights, generateQuickInsights, type Insight, type InsightsResponse } from "@/lib/api"
import { useInsightsHistory, type InsightsRun } from "@/lib/useInsightsHistory"
import adobeFactsData from "@/lib/data/adobe-facts1.json"

// Extract the facts array from the imported JSON
const ADOBE_FACTS = adobeFactsData.adobe_facts

interface InsightsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedText?: string
  searchResults?: any[]
}

export function InsightsModal({ isOpen, onClose, selectedText, searchResults }: InsightsModalProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null)
  const [generated, setGenerated] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [factIndex, setFactIndex] = useState(0)

  // session history (per tab)
  const { runs, addRun, removeRun, clearAll, hasRuns } = useInsightsHistory()

  // Adobe facts rotation during loading
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % ADOBE_FACTS.length)
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [loading])

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInsights([])
      setSelectedInsight(null)
      setGenerated(false)
      setActiveRunId(null)
      setFactIndex(0)
    }
  }, [isOpen])

  const activeRun = useMemo(() => runs.find((r) => r.id === activeRunId) || null, [runs, activeRunId])

  // Format helpers
  const fmtTime = (t: number) =>
    new Date(t).toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })

  const snip = (s: string, n = 36) => (s.length > n ? `${s.slice(0, n)}…` : s)

  const runLabel = (r: InsightsRun) =>
    `${r.mode === "quick" ? "Quick" : "Detailed"} • ${fmtTime(r.createdAt)} • "${snip(r.selectedText.replace(/\s+/g, " "))}"`

  // Load a run into view
  const loadRun = (r: InsightsRun) => {
    setInsights(r.insights || [])
    setSelectedInsight((r.insights && r.insights[0]) || null)
    setActiveRunId(r.id)
    setGenerated(true)
  }

  const backToMenu = () => {
    setGenerated(false)
    setSelectedInsight(null)
    setActiveRunId(null)
  }

  // Generate (quick/detailed)
  const generateDocumentInsights = async (quickMode = false) => {
    if (!selectedText || !searchResults || searchResults.length === 0) {
      console.error("No selected text or search results available for insights generation")
      return
    }

    setLoading(true)
    setFactIndex(0) // Reset fact index when starting
    try {
      const relevantSections = searchResults.slice(0, 10).map((r) => ({
        file_name: r.file_name,
        page: r.page,
        snippet: r.snippet,
        heading: r.heading,
      }))

      const res: InsightsResponse = quickMode
        ? await generateQuickInsights(selectedText, relevantSections)
        : await generateInsights(selectedText, relevantSections)

      const validInsights = Array.isArray(res.insights) ? res.insights : []

      // Save run to history and open it
      const run = addRun({
        mode: quickMode ? "quick" : "detailed",
        selectedText,
        insights: validInsights,
      })
      loadRun(run)
    } catch (e) {
      console.error("Failed to generate insights:", e)
      // Show empty, but keep user on menu
      setGenerated(false)
    } finally {
      setLoading(false)
    }
  }

  // UI helpers
  const confidenceDot = (c: number) => (c >= 0.9 ? "bg-green-500" : c >= 0.7 ? "bg-yellow-500" : "bg-red-500")

  // Adobe Facts Loader Component
  const AdobeFactsLoader = () => (
    <div className="text-center py-6">
      <div className="flex items-center justify-center mb-4">
        <Loader2 className="h-8 w-8 text-[#ff0000] animate-spin" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-3">Generating Insights</h3>
      <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed px-3">{ADOBE_FACTS[factIndex]}</p>
      <div className="flex items-center justify-center space-x-1 mt-3">
        {ADOBE_FACTS.slice(0, 6).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === factIndex % 6 ? "bg-[#ff0000]" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  )

  const HeaderHistory = () => (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-white">
            <Clock className="w-4 h-4 mr-2" />
            <span className="max-w-[260px] truncate">
              {activeRun ? runLabel(activeRun) : hasRuns ? "Select a previous run…" : "No history yet"}
            </span>
            <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[360px]">
          <DropdownMenuLabel className="text-xs text-gray-500">Previous runs</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {runs.length === 0 && (
            <DropdownMenuItem disabled className="text-gray-500">
              No saved runs in this tab
            </DropdownMenuItem>
          )}
          {runs.map((r) => (
            <DropdownMenuItem key={r.id} onClick={() => loadRun(r)} className="flex-col items-start">
              <div className="w-full flex items-center justify-between">
                <div className="text-sm font-medium">{r.mode === "quick" ? "Quick" : "Detailed"}</div>
                <div className="text-xs text-gray-500">{fmtTime(r.createdAt)}</div>
              </div>
              <div className="w-full text-xs text-gray-600 truncate">"{r.selectedText.replace(/\s+/g, " ")}"</div>
            </DropdownMenuItem>
          ))}
          {runs.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  clearAll()
                  backToMenu()
                }}
                className="text-red-600 focus:text-red-700"
              >
                Clear all history
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete current run (trash icon) */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-red-50"
              disabled={!activeRun}
              onClick={() => {
                if (!activeRun) return
                const id = activeRun.id
                removeRun(id)
                // pick another run if available, else go back to menu
                const next = runs.find((r) => r.id !== id)
                if (next) loadRun(next)
                else backToMenu()
              }}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete this run</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Back to menu */}
      <Button variant="outline" size="sm" onClick={backToMenu}>
        <CornerUpLeft className="w-4 h-4 mr-2" />
        Back to menu
      </Button>
    </div>
  )

  const currentList = generated ? (
    <div className="p-4 space-y-3">
      {insights && insights.length > 0 ? (
        insights.map((insight) => (
          <Card
            key={insight.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedInsight?.id === insight.id ? "ring-2 ring-[#ff0000] border-[#ff0000]" : "hover:border-gray-300"
            }`}
            onClick={() => setSelectedInsight(insight)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm leading-tight">{insight.title}</h3>
                <div className="flex items-center space-x-1 ml-2">
                  <div className={`w-2 h-2 rounded-full ${confidenceDot(insight.confidence)}`} />
                </div>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{insight.content}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">{insight.sources?.length || 0} sources</span>
                <span className="text-xs font-medium text-gray-700">
                  {Math.round(insight.confidence * 100)}% confidence
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">No insights in this run</p>
        </div>
      )}
    </div>
  ) : (
    // Initial menu
    <div className="flex flex-col items-center justify-center h-full py-12">
      <Lightbulb className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Insights</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {selectedText && searchResults
          ? `Analyze your selected text against ${searchResults.length} search results.`
          : "Select text in a document and perform a search to generate insights."}
      </p>
      <div className="space-y-2 w-full px-6">
        <Button
          onClick={() => generateDocumentInsights(true)}
          className="bg-[#ff0000] hover:bg-[#e60000] text-white w-full"
          disabled={!selectedText || !searchResults || searchResults.length === 0 || loading}
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          {loading ? "Generating…" : "Quick Insights"}
        </Button>
        <Button
          onClick={() => generateDocumentInsights(false)}
          variant="outline"
          className="w-full"
          disabled={!selectedText || !searchResults || searchResults.length === 0 || loading}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {loading ? "Generating…" : "Detailed Analysis"}
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#ff0000]/10 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-[#ff0000]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Document Insights</DialogTitle>
              <p className="text-sm text-gray-600">
                {selectedText
                  ? `AI-powered analysis of: "${snip(selectedText)}"`
                  : "Generate insights from your documents"}
              </p>
            </div>
          </div>

          {/* Right-side controls: History dropdown + Trash + Back to menu (only once there is something generated) */}
          {generated ? (
            <HeaderHistory />
          ) : hasRuns ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="max-w-[260px] truncate">Select a previous run…</span>
                  <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[360px]">
                <DropdownMenuLabel className="text-xs text-gray-500">Previous runs</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {runs.map((r) => (
                  <DropdownMenuItem key={r.id} onClick={() => loadRun(r)} className="flex-col items-start">
                    <div className="w-full flex items-center justify-between">
                      <div className="text-sm font-medium">{r.mode === "quick" ? "Quick" : "Detailed"}</div>
                      <div className="text-xs text-gray-500">{fmtTime(r.createdAt)}</div>
                    </div>
                    <div className="w-full text-xs text-gray-600 truncate">"{r.selectedText.replace(/\s+/g, " ")}"</div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAll} className="text-red-600 focus:text-red-700">
                  Clear all history
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </DialogHeader>

        {/* BODY */}
        <div className="flex h-[70vh]">
          {/* Left column (list / menu) */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {loading ? <AdobeFactsLoader /> : currentList}
          </div>

          {/* Right column (detail) */}
          <div className="flex-1 overflow-y-auto">
            {generated && selectedInsight ? (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedInsight.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        {Math.round(selectedInsight.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p>{selectedInsight.content}</p>
                  </div>
                </div>

                {selectedInsight.sources && selectedInsight.sources.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Supporting Sources ({selectedInsight.sources.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedInsight.sources.map((src, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{src.file_name}</span>
                            <span className="text-xs text-gray-500">Page {src.page}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{src.snippet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Insight</h3>
                  <p className="text-gray-600">Choose an insight from the list to view detailed analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {generated ? `${insights?.length || 0} insights in this run` : "Ready to generate insights"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
