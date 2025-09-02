"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, RefreshCw, Briefcase, Target, Trash2, ArrowLeft } from "lucide-react"
import { generateCollectionSummary, listCollectionSummaries, type SummaryType, type CollectionSummary } from "@/lib/api"
import { useSummaryHistory, type SummarySession } from "@/lib/useSummaryHistory"
import adobeFactsData from "@/lib/data/adobe-facts2.json"

// Extract Adobe facts from JSON
const ADOBE_FACTS = adobeFactsData.adobe_facts

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  collectionId?: string
}

export function SummaryModal({ isOpen, onClose, collectionId }: SummaryModalProps) {
  const [activeTab, setActiveTab] = useState<SummaryType>("comprehensive")
  const [summaries, setSummaries] = useState<Record<SummaryType, CollectionSummary | null>>({
    comprehensive: null,
    executive: null,
    thematic: null,
  })
  const [loading, setLoading] = useState<Record<SummaryType, boolean>>({
    comprehensive: false,
    executive: false,
    thematic: false,
  })
  const [showSessionHistory, setShowSessionHistory] = useState(false)
  const [factIndex, setFactIndex] = useState(0)

  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    addSession,
    deleteSession,
    clearAllSessions,
    getCurrentSession,
    getSessionsByCollection,
  } = useSummaryHistory()

  // Rotate Adobe facts during loading
  useEffect(() => {
    const isAnyLoading = Object.values(loading).some(Boolean)
    if (isAnyLoading) {
      const interval = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % ADOBE_FACTS.length)
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [loading])

  // Function to parse and format summary content
  const parseSummaryContent = (content: string) => {
    try {
      // First, try to parse as JSON directly
      const parsed = JSON.parse(content)

      // Check if this is a backend response with a nested summary
      if (parsed.summary) {
        if (typeof parsed.summary === "string") {
          try {
            const nestedParsed = JSON.parse(parsed.summary)
            return nestedParsed
          } catch {
            const jsonMatch = parsed.summary.match(/```json\s*([\s\S]*?)\s*```/)
            if (jsonMatch) {
              const jsonContent = jsonMatch[1].trim()
              return JSON.parse(jsonContent)
            }
            return parsed
          }
        } else if (typeof parsed.summary === "object" && parsed.summary.summary) {
          if (typeof parsed.summary.summary === "string") {
            try {
              const jsonMatch = parsed.summary.summary.match(/```json\s*([\s\S]*?)\s*```/)
              if (jsonMatch) {
                const jsonContent = jsonMatch[1].trim()
                return JSON.parse(jsonContent)
              }
            } catch {
              return parsed
            }
          }
        }
      }

      return parsed
    } catch {
      // If direct parsing fails, try to extract JSON from markdown code blocks
      try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          const jsonContent = jsonMatch[1].trim()
          return JSON.parse(jsonContent)
        }

        const jsonObjectMatch = content.match(/\{[\s\S]*\}/)
        if (jsonObjectMatch) {
          return JSON.parse(jsonObjectMatch[0])
        }
      } catch {
        return { summary: content }
      }
      return { summary: content }
    }
  }

  // Function to render summary content beautifully
  const renderSummaryContent = (content: string) => {
    const parsed = parseSummaryContent(content)
    return renderStructuredContent(parsed, content)
  }

  // Function to render structured content
  const renderStructuredContent = (parsed: any, originalContent: string) => {
    const fallbackContent = originalContent || "No content available"
    return (
      <div className="space-y-6">
        {/* Summary Header */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900">Collection Summary</h2>
              <p className="text-red-700 text-sm">AI-generated analysis of your document collection</p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        {parsed.executive_summary && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Executive Summary
            </h3>
            <p className="text-blue-800 leading-relaxed">{parsed.executive_summary}</p>
          </div>
        )}

        {/* Executive Overview */}
        {parsed.overview && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Executive Overview
            </h3>
            <p className="text-blue-800 leading-relaxed">{parsed.overview}</p>
          </div>
        )}

        {/* Key Points */}
        {parsed.key_points && parsed.key_points.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
            <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Key Points
            </h3>
            <div className="space-y-2">
              {parsed.key_points.map((point: string, index: number) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-amber-100">
                  <p className="text-amber-800 text-sm">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Focus */}
        {parsed.main_focus && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Main Focus
            </h3>
            <p className="text-indigo-800 leading-relaxed">{parsed.main_focus}</p>
          </div>
        )}

        {/* Business Value */}
        {parsed.business_value && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
            <h3 className="text-lg font-semibold text-emerald-900 mb-2 flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Business Value
            </h3>
            <p className="text-emerald-800 leading-relaxed">{parsed.business_value}</p>
          </div>
        )}

        {/* Quick Insights */}
        {parsed.quick_insights && parsed.quick_insights.length > 0 && (
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
            <h3 className="text-lg font-semibold text-cyan-900 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Quick Insights
            </h3>
            <div className="space-y-2">
              {parsed.quick_insights.map((insight: string, index: number) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-cyan-100">
                  <p className="text-cyan-800 text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main / Primary Themes */}
        {(parsed.main_themes || parsed.primary_themes) && (parsed.main_themes || parsed.primary_themes).length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 hover:shadow-md transition-all duration-200">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              {parsed.primary_themes ? "Primary Themes" : "Main Themes"}
            </h3>
            <div className="space-y-3">
              {(parsed.main_themes || parsed.primary_themes).map((theme: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-green-100">
                  {typeof theme === "string" ? (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-green-200 transition-colors duration-200 cursor-default">
                      {theme}
                    </span>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-green-800 mb-1">{theme.theme}</h4>
                      <p className="text-green-700 text-sm mb-2">{theme.description}</p>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Prevalence: {theme.prevalence}
                        </span>
                      </div>
                      {theme.documents && theme.documents.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {theme.documents.map((doc: string, docIndex: number) => (
                            <span key={docIndex} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                              {doc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Topics */}
        {parsed.key_topics && parsed.key_topics.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-all duration-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Key Topics
            </h3>
            <div className="space-y-3">
              {parsed.key_topics.map((topic: any, index: number) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-3 border border-purple-100 hover:shadow-sm transition-all duration-200"
                >
                  <h4 className="font-semibold text-purple-800 mb-1">{topic.topic}</h4>
                  <p className="text-purple-700 text-sm mb-2">{topic.description}</p>
                  {topic.documents && topic.documents.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {topic.documents.map((doc: string, docIndex: number) => (
                        <span key={docIndex} className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                          {doc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Relationships */}
        {parsed.document_relationships && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Document Relationships
            </h3>
            <p className="text-orange-800 leading-relaxed">{parsed.document_relationships}</p>
          </div>
        )}

        {/* Content Patterns */}
        {parsed.content_patterns && parsed.content_patterns.length > 0 && (
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200 hover:shadow-md transition-all duration-200">
            <h3 className="text-lg font-semibold text-teal-900 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Content Patterns
            </h3>
            <div className="space-y-2">
              {parsed.content_patterns.map((pattern: string, index: number) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-teal-100">
                  <p className="text-teal-800 text-sm">{pattern}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Clusters */}
        {parsed.topic_clusters && parsed.topic_clusters.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200 hover:shadow-md transition-all duration-200">
            <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Topic Clusters
            </h3>
            <div className="space-y-3">
              {parsed.topic_clusters.map((cluster: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-amber-100">
                  <h4 className="font-semibold text-amber-800 mb-2">{cluster.cluster}</h4>
                  <div className="flex flex-wrap gap-1">
                    {cluster.topics.map((topic: string, topicIndex: number) => (
                      <span key={topicIndex} className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coverage Analysis */}
        {parsed.coverage_analysis && (
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
            <h3 className="text-lg font-semibold text-teal-900 mb-2 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Coverage Analysis
            </h3>
            <p className="text-teal-800 leading-relaxed">{parsed.coverage_analysis}</p>
          </div>
        )}

        {/* Insights */}
        {parsed.insights && parsed.insights.length > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-4 border border-pink-200">
            <h3 className="text-lg font-semibold text-pink-900 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Key Insights
            </h3>
            <div className="space-y-2">
              {parsed.insights.map((insight: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-pink-100">
                  <p className="text-pink-800 font-medium">{insight.insight}</p>
                  {insight.supporting_documents && insight.supporting_documents.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {insight.supporting_documents.map((doc: string, docIndex: number) => (
                        <span key={docIndex} className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs">
                          {doc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {parsed.recommendations && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2 flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Recommendations
            </h3>
            <p className="text-indigo-800 leading-relaxed">{parsed.recommendations}</p>
          </div>
        )}

        {/* Fallback for plain text or parsing errors */}
        {!parsed.executive_summary &&
          !parsed.overview &&
          !parsed.main_themes &&
          !parsed.primary_themes &&
          !parsed.key_topics &&
          !parsed.content_patterns &&
          !parsed.topic_clusters && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Summary Content
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{fallbackContent}</p>
            </div>
          )}
      </div>
    )
  }

  const tabs = [
    {
      id: "comprehensive" as const,
      label: "Comprehensive",
      icon: FileText,
      description: "Detailed analysis of all documents",
    },
    {
      id: "executive" as const,
      label: "Executive",
      icon: Briefcase,
      description: "High-level overview for decision makers",
    },
    {
      id: "thematic" as const,
      label: "Thematic",
      icon: Target,
      description: "Key themes and patterns analysis",
    },
  ]

  // Load existing summaries when modal opens
  useEffect(() => {
    if (isOpen && collectionId) {
      loadExistingSummaries()
    }
  }, [isOpen, collectionId])

  // Reset session history view when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowSessionHistory(false)
    }
  }, [isOpen])

  const loadExistingSummaries = async () => {
    if (!collectionId) return

    try {
      const existingSummaries = await listCollectionSummaries(collectionId)

      const summaryMap: Record<SummaryType, CollectionSummary | null> = {
        comprehensive: null,
        executive: null,
        thematic: null,
      }

      existingSummaries.forEach((summary) => {
        if (summary.summary_type in summaryMap) {
          summaryMap[summary.summary_type as SummaryType] = summary
        }
      })

      setSummaries(summaryMap)
    } catch (error) {
      console.error("Failed to load existing summaries:", error)
    }
  }

  const generateSummary = async (type: SummaryType) => {
    if (!collectionId) return

    setLoading((prev) => ({ ...prev, [type]: true }))

    try {
      const summary = await generateCollectionSummary(collectionId, type)
      setSummaries((prev) => ({ ...prev, [type]: summary }))

      // Add to session history
      addSession(summary)
    } catch (error) {
      console.error(`Failed to generate ${type} summary:`, error)
      const errorSummary = {
        summary_id: `${collectionId}_${type}_error`,
        collection_id: collectionId,
        summary_type: type,
        content: `Error generating summary: ${error instanceof Error ? error.message : "Unknown error"}`,
        generated_at: new Date().toISOString(),
        processing_time_ms: 0,
      }
      setSummaries((prev) => ({ ...prev, [type]: errorSummary }))
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }))
    }
  }

  const loadSessionSummary = (session: SummarySession) => {
    const summary: CollectionSummary = {
      summary_id: session.id,
      collection_id: session.collectionId,
      summary_type: session.summaryType as SummaryType,
      content: session.content,
      generated_at: session.generatedAt,
      processing_time_ms: session.processingTimeMs,
    }

    // Clear all summaries first
    setSummaries({
      comprehensive: null,
      executive: null,
      thematic: null,
    })

    // Set the loaded summary
    setSummaries((prev) => ({ ...prev, [session.summaryType as SummaryType]: summary }))
    setActiveTab(session.summaryType as SummaryType)
    setCurrentSessionId(session.id)
    setShowSessionHistory(false)
  }

  const formatSessionLabel = (session: SummarySession) => {
    const date = new Date(session.generatedAt)
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const collectionStr = session.collectionId.slice(0, 8)
    const typeStr = session.summaryType.charAt(0).toUpperCase() + session.summaryType.slice(1)

    return `${typeStr} • ${timeStr} • ${collectionStr}...`
  }

  const currentSummary = summaries[activeTab]
  const isCurrentLoading = loading[activeTab]
  const currentSession = getCurrentSession()
  const collectionSessions = collectionId ? getSessionsByCollection(collectionId) : []

  // Show session history view
  if (showSessionHistory) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setShowSessionHistory(false)} className="p-1 h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <DialogTitle className="text-xl font-semibold">Summary History</DialogTitle>
                <p className="text-sm text-gray-600">
                  {sessions.length} session{sessions.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
            {sessions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllSessions}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Summary History</h3>
                <p className="text-gray-600 text-center">
                  Generate summaries to see them appear here for quick access.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadSessionSummary(session)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {session.summaryType.charAt(0).toUpperCase() + session.summaryType.slice(1)} Summary
                        </span>
                        <span className="text-xs text-gray-500">{new Date(session.generatedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        Collection: {session.collectionId.slice(0, 16)}...
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id)
                      }}
                      className="p-1 h-8 w-8 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#ff0000]/10 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#ff0000]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Collection Summary</DialogTitle>
              <p className="text-sm text-gray-600">
                Collection: {collectionId ? `${collectionId.slice(0, 8)}...` : "No collection"}
              </p>
            </div>
          </div>

          {/* Session History Dropdown - Left aligned with margin */}
          {sessions.length > 0 && (
            <div className="flex items-center space-x-2 mr-8">
              <Select
                value={currentSessionId || ""}
                onValueChange={(value) => {
                  if (value === "history") {
                    setShowSessionHistory(true)
                  } else if (value) {
                    const session = sessions.find((s) => s.id === value)
                    if (session) {
                      loadSessionSummary(session)
                    }
                  }
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a summary session">
                    {currentSession ? formatSessionLabel(currentSession) : "New Summary"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="history" className="font-medium">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      View All History ({sessions.length})
                    </div>
                  </SelectItem>
                  {collectionSessions.slice(0, 5).map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {formatSessionLabel(session)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id ? "bg-white text-[#ff0000] shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isCurrentLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <RefreshCw className="w-12 h-12 text-[#ff0000] animate-spin" />
                <div className="absolute inset-0 rounded-full border-4 border-red-100 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                Generating {tabs.find((t) => t.id === activeTab)?.label} Summary
              </h3>
              <p className="text-sm text-gray-600 text-center max-w-md mb-4">{ADOBE_FACTS[factIndex]}</p>
              <div className="flex items-center justify-center space-x-1">
                {ADOBE_FACTS.slice(0, 6).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === factIndex % 6 ? "bg-red-400" : "bg-red-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : currentSummary && currentSummary.content ? (
            <Card>
              <CardContent className="p-6">
                {renderSummaryContent(currentSummary.content)}
                <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  Generated: {new Date(currentSummary.generated_at).toLocaleString()} • Processing time:{" "}
                  {currentSummary.processing_time_ms}ms
                </div>
              </CardContent>
            </Card>
          ) : currentSummary && !currentSummary.content ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Summary Generated but Empty</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                The {activeTab} summary was generated but contains no content. This might be due to an error in the
                generation process.
              </p>
              <Button
                onClick={() => generateSummary(activeTab)}
                className="bg-[#ff0000] hover:bg-[#e60000] text-white px-6 py-2"
                disabled={!collectionId}
              >
                Regenerate {tabs.find((t) => t.id === activeTab)?.label} Summary
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No {activeTab} summary available</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Generate a {activeTab} summary to get {tabs.find((t) => t.id === activeTab)?.description.toLowerCase()}.
              </p>
              <Button
                onClick={() => generateSummary(activeTab)}
                className="bg-[#ff0000] hover:bg-[#e60000] text-white px-6 py-2"
                disabled={!collectionId}
              >
                Generate {tabs.find((t) => t.id === activeTab)?.label} Summary
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
