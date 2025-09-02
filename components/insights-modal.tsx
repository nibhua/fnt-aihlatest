"use client"

import type React from "react"

import { useState } from "react"
import { X, Lightbulb, FileText, TrendingUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface InsightSource {
  fileName: string
  page: number
  snippet: string
}

export interface DocumentInsight {
  id: string
  title: string
  content: string
  confidence: number
  category?: string
  sources?: InsightSource[]
}

interface InsightsModalProps {
  isOpen: boolean
  onClose: () => void
  insights: DocumentInsight[]
  className?: string
}

export function InsightsModal({ isOpen, onClose, insights, className }: InsightsModalProps) {
  const [selectedInsight, setSelectedInsight] = useState<DocumentInsight | null>(null)

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={cn("bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden", className)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#ff0000]/10 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-[#ff0000]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Document Insights</h2>
              <p className="text-sm text-gray-600">AI-powered analysis of your documents</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex h-[70vh]">
          {/* Insights List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-3">
              {insights.map((insight) => (
                <Card
                  key={insight.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedInsight?.id === insight.id
                      ? "ring-2 ring-[#ff0000] border-[#ff0000]"
                      : "hover:border-gray-300",
                  )}
                  onClick={() => setSelectedInsight(insight)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight">{insight.title}</h3>
                      <div className="flex items-center space-x-1 ml-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            insight.confidence >= 0.9
                              ? "bg-green-500"
                              : insight.confidence >= 0.7
                                ? "bg-yellow-500"
                                : "bg-red-500",
                          )}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{insight.content}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">{insight.sources?.length || 0} sources</span>
                      <span className="text-xs font-medium text-gray-700">
                        {Math.round((insight.confidence || 0) * 100)}% confidence
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Insight Detail */}
          <div className="flex-1 overflow-y-auto">
            {selectedInsight ? (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedInsight.title}</h3>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {Math.round((selectedInsight.confidence || 0) * 100)}% confidence
                      </span>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p>{selectedInsight.content}</p>
                  </div>
                </div>

                {/* Sources */}
                {selectedInsight.sources && selectedInsight.sources.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Supporting Sources ({selectedInsight.sources.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedInsight.sources.map((source, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{source.fileName}</span>
                            <span className="text-xs text-gray-500">Page {source.page}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{source.snippet}</p>
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

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">{insights.length} insights generated from your search results</div>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
