"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Loader2, Search, Info, Lock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Mode, ExpandedResult, BuildResponse } from "@/types/app"
import type { QueryHit } from "@/lib/api"
import { MoreInfoModal } from "@/components/ai-features/MoreInfoModal"
import adobeFactsData from "@/lib/data/adobe-facts1.json"

const ADOBE_FACTS = adobeFactsData.adobe_facts

export function ResultsList({
  mode,
  isLoading,
  quotes,
  quoteIndex,
  visibleResults,
  rawResultsCount,
  onOpen,
  navigatingItems,
  expandedResults,
  toggleExpand,
  selectedText,
  buildInfo,
  onShowToast,
  showOptions,
  showN,
  onChangeShowN,
}: {
  mode: Mode
  isLoading: boolean
  quotes: string[]
  quoteIndex: number
  visibleResults: QueryHit[]
  rawResultsCount: number
  onOpen: (hit: QueryHit) => void
  navigatingItems: Set<string>
  expandedResults: ExpandedResult
  toggleExpand: (key: string) => void
  selectedText?: string
  buildInfo: BuildResponse | null
  onShowToast: (type: "success" | "error" | "info", title: string, message: string) => void
  showOptions: number[]
  showN: number
  onChangeShowN: (n: number) => void
}) {
  const [moreInfoResult, setMoreInfoResult] = useState<QueryHit | null>(null)
  const [showMoreInfo, setShowMoreInfo] = useState(false)
  const [factIndex, setFactIndex] = useState(0)

  const isDisabled = !buildInfo

  // Adobe facts rotation during loading
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % ADOBE_FACTS.length)
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [isLoading])

  const handleDisabledClick = () => {
    if (isDisabled) {
      onShowToast(
        "info",
        "🔒 Results Section Locked",
        "This section will be enabled after the build is complete. Please upload PDFs and click 'Start Build' first.",
      )
    }
  }

  const truncate = (text: string, max = 120) => (text.length <= max ? text : text.slice(0, max) + "...")

  const AdobeFactsLoader = () => (
    <div className="text-center py-8">
      <div className="flex items-center justify-center mb-4">
        <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        {mode === "legacy" ? "Searching Persona Relevant Sections" : "Processing Context Selection"}
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-md mx-auto mb-4">{ADOBE_FACTS[factIndex]}</p>
      <div className="flex items-center justify-center space-x-1">
        {ADOBE_FACTS.slice(0, 6).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${i === factIndex % 6 ? "bg-red-400" : "bg-red-200"}`}
          />
        ))}
      </div>
    </div>
  )

  const DisabledOverlay = () => (
    <div
      className="absolute inset-0 bg-gray-50/80 backdrop-blur-sm flex items-center justify-center z-20 cursor-pointer"
      onClick={handleDisabledClick}
    >
      <div className="text-center p-6">
        <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Results Section Locked</h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          Complete the build process to unlock search results and AI features.
        </p>
        <p className="text-xs text-gray-500 mt-2">Click anywhere to learn more</p>
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto relative">
      {isDisabled && <DisabledOverlay />}

      <div className={`p-4 ${isDisabled ? "pointer-events-none" : ""}`}>
        <div className="sticky top-0 bg-white py-2 mb-3 border-b z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              {mode === "legacy" ? "Persona Relevant Sections" : "Context Relevant Sections"}{" "}
              {visibleResults.length > 0 &&
                `(${visibleResults.length}${rawResultsCount > visibleResults.length ? ` of ${rawResultsCount}` : ""})`}
            </h3>

            {visibleResults.length > 0 && showOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Show:</span>
                <Select value={showN.toString()} onValueChange={(value) => onChangeShowN(Number.parseInt(value))}>
                  <SelectTrigger className="w-16 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {showOptions.map((option) => (
                      <SelectItem key={option} value={option.toString()} className="text-xs">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <AdobeFactsLoader />
        ) : (
          <div className="space-y-3">
            {visibleResults.length === 0 ? (
              <div className="text-center py-8">
                <Search className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No results yet.</p>
                <p className="text-xs text-gray-400 mt-1">Start by running a search or selecting text in the PDF.</p>
              </div>
            ) : (
              visibleResults.map((r) => {
                const key = `${r.file_name}-${r.page}-${r.rank}`
                const itemKey = `${r.file_name}-${r.page}-${r.rank}`
                const isExpanded = !!expandedResults[key]
                const isItemNavigating = navigatingItems.has(itemKey)
                const snippet = r.snippet || ""
                const shouldTruncate = snippet.length > 120

                return (
                  <Card
                    key={key}
                    className="hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-sm border-gray-200"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm font-medium text-gray-900 flex items-center min-w-0 flex-1">
                          <span className="bg-[#ff0000] text-white text-xs px-1.5 py-0.5 rounded-full mr-2 flex-shrink-0">
                            {r.rank}
                          </span>
                          <span className="truncate">{r.heading}</span>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                          {r.score.toFixed(3)}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-2 flex items-center">
                        <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{r.file_name}</span>
                        <span className="mx-1">—</span>
                        <span className="flex-shrink-0">Page {r.page}</span>
                      </div>

                      {!!snippet && (
                        <div className="text-xs text-gray-700 mb-3 bg-gray-50 p-2 rounded leading-relaxed">
                          {shouldTruncate && !isExpanded ? (
                            <div>
                              {truncate(snippet)}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleExpand(key)
                                }}
                                className="text-[#ff0000] hover:text-[#e60000] ml-1 font-medium"
                              >
                                View More
                              </button>
                            </div>
                          ) : (
                            <div>
                              {snippet}
                              {shouldTruncate && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleExpand(key)
                                  }}
                                  className="text-[#ff0000] hover:text-[#e60000] ml-1 font-medium"
                                >
                                  View Less
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        {mode === "context" && selectedText && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMoreInfoResult(r)
                              setShowMoreInfo(true)
                            }}
                            className="hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 text-xs px-3 py-1"
                          >
                            <Info className="w-3 h-3 mr-1" />
                            More Info
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpen(r)}
                          className="hover:bg-[#ff0000] hover:text-white hover:border-[#ff0000] transition-all duration-200 text-xs px-3 py-1"
                        >
                          {isItemNavigating ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Opening...
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Open
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>

      <MoreInfoModal
        isOpen={showMoreInfo}
        onClose={() => setShowMoreInfo(false)}
        result={moreInfoResult}
        selectedText={selectedText}
      />
    </div>
  )
}
