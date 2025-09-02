"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TrendingUp, RefreshCw, FileText, ArrowRight, Target } from "lucide-react"
import { 
  analyzeRelevance, 
  analyzeMultipleRelevance,
  type RelevanceResponse,
  type RelevanceAnalysis
} from "@/lib/api"

interface RelevanceConnection {
  id: string
  sourceDoc: string
  targetDoc: string
  sourcePage: number
  targetPage: number
  connectionType: "thematic" | "factual" | "contextual"
  strength: number
  description: string
}

interface RelevanceModalProps {
  isOpen: boolean
  onClose: () => void
  selectedText?: string
  searchResults?: any[]
}

export function RelevanceModal({ isOpen, onClose, selectedText, searchResults }: RelevanceModalProps) {
  const [connections, setConnections] = useState<RelevanceConnection[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [analysisDepth, setAnalysisDepth] = useState<"quick" | "standard" | "detailed">("standard")

  const analyzeRelevanceConnections = async () => {
    if (!selectedText || !searchResults || searchResults.length === 0) {
      console.error("No selected text or search results available for relevance analysis")
      return
    }

    setLoading(true)

    try {
      // Analyze relevance for each search result
      const relevancePromises = searchResults.slice(0, 5).map(async (result, index) => {
        try {
          const relevanceResponse = await analyzeRelevance(
            selectedText,
            {
              file_name: result.file_name,
              page: result.page,
              snippet: result.snippet,
              heading: result.heading,
              score: result.score || 0.5
            },
            analysisDepth
          )
          
          // Validate response structure
          if (!relevanceResponse || !relevanceResponse.analysis) {
            console.error(`Invalid response structure for result ${index}`)
            return null
          }
          
          return {
            id: `connection-${index}`,
            sourceDoc: "Selected Text",
            targetDoc: result.file_name,
            sourcePage: 1,
            targetPage: result.page,
            connectionType: getConnectionType(relevanceResponse.analysis.confidence_level || "medium"),
            strength: relevanceResponse.analysis.relevance_score || 0.5,
            description: relevanceResponse.analysis.explanation || "No analysis available",
            analysis: relevanceResponse.analysis
          }
        } catch (error) {
          console.error(`Failed to analyze relevance for result ${index}:`, error)
          return null
        }
      })

      const relevanceResults = await Promise.all(relevancePromises)
      const validConnections = relevanceResults.filter(Boolean) as RelevanceConnection[]
      
      setConnections(validConnections)
      setAnalyzed(true)
      
      if (validConnections.length === 0) {
        console.warn("No valid relevance connections found")
      }
    } catch (error) {
      console.error("Failed to analyze relevance:", error)
    } finally {
      setLoading(false)
    }
  }

  const getConnectionType = (confidenceLevel: string): "thematic" | "factual" | "contextual" => {
    switch (confidenceLevel) {
      case "high":
        return "factual"
      case "medium":
        return "thematic"
      case "low":
        return "contextual"
      default:
        return "contextual"
    }
  }

  const getConnectionColor = (type: RelevanceConnection["connectionType"]) => {
    switch (type) {
      case "thematic":
        return "bg-blue-100 text-blue-800"
      case "factual":
        return "bg-green-100 text-green-800"
      case "contextual":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return "text-green-600"
    if (strength >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#ff0000]/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#ff0000]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Document Relevance</DialogTitle>
              <p className="text-sm text-gray-600">
                {selectedText ? `Analyzing relevance for: "${selectedText.slice(0, 50)}..."` : "Find connections between your documents"}
              </p>
            </div>
          </div>
          {analyzed && (
            <div className="flex items-center space-x-2">
              <select
                value={analysisDepth}
                onChange={(e) => setAnalysisDepth(e.target.value as "quick" | "standard" | "detailed")}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="quick">Quick</option>
                <option value="standard">Standard</option>
                <option value="detailed">Detailed</option>
              </select>
              <Button
                onClick={analyzeRelevanceConnections}
                disabled={loading || !selectedText || !searchResults}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span>Re-analyze</span>
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-[#ff0000] animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Document Connections</h3>
              <p className="text-gray-600 text-center max-w-md">
                Finding thematic, factual, and contextual relationships between your documents...
              </p>
            </div>
          ) : !analyzed ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Target className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Discover Document Connections</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                {selectedText && searchResults 
                  ? `Analyze how your selected text relates to ${searchResults.length} search results.`
                  : "Select text in a document and perform a search to analyze relevance connections."
                }
              </p>
              <Button 
                onClick={analyzeRelevanceConnections} 
                className="bg-[#ff0000] hover:bg-[#e60000] text-white"
                disabled={!selectedText || !searchResults || searchResults.length === 0}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analyze Relevance
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Connections Found</h3>
                  <p className="text-gray-600 mb-4">
                    No relevant connections were found between your selected text and the search results.
                  </p>
                  <Button 
                    onClick={analyzeRelevanceConnections}
                    className="bg-[#ff0000] hover:bg-[#e60000] text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Found {connections.length} Connections</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-100 rounded"></div>
                    <span>Thematic</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-100 rounded"></div>
                    <span>Factual</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-100 rounded"></div>
                    <span>Contextual</span>
                  </div>
                </div>
              </div>

              {connections.map((connection) => (
                <Card key={connection.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getConnectionColor(connection.connectionType)}`}
                        >
                          {connection.connectionType}
                        </span>
                        <span className={`text-sm font-medium ${getStrengthColor(connection.strength)}`}>
                          {Math.round(connection.strength * 100)}% match
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900 truncate">{connection.sourceDoc}</span>
                          <span className="text-gray-500">Page {connection.sourcePage}</span>
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900 truncate">{connection.targetDoc}</span>
                          <span className="text-gray-500">Page {connection.targetPage}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed">{connection.description}</p>
                  </CardContent>
                </Card>
              ))}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
