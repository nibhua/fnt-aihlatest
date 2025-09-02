"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Search, Info, Sparkles, Target } from "lucide-react"
import type { Mode, BuildResponse } from "@/types/app"

export function SearchPanel({
  mode,
  onToggleMode,
  rawResultsLen,
  showOptions,
  showN,
  onChangeShowN,
  isQueryLoading,
  persona,
  setPersona,
  job,
  setJob,
  personaDisabled,
  buildInfo,
  onRunLegacy,
  showTinyContextStatus,
}: {
  mode: Mode
  onToggleMode: (mode: Mode) => void
  rawResultsLen: number
  showOptions: number[]
  showN: number
  onChangeShowN: (n: number) => void
  isQueryLoading: boolean
  persona: string
  setPersona: (persona: string) => void
  job: string
  setJob: (job: string) => void
  personaDisabled: boolean
  buildInfo: BuildResponse | null
  onRunLegacy: () => void
  showTinyContextStatus: boolean
}) {
  const [showPersonaTooltip, setShowPersonaTooltip] = useState(false)
  const [showTaskTooltip, setShowTaskTooltip] = useState(false)
  const [isLegacyMinimized, setIsLegacyMinimized] = useState(false)

  // Auto-minimize logic from your old code
  useEffect(() => {
    if (rawResultsLen > 0 && !isQueryLoading && mode === "legacy") {
      const timer = setTimeout(() => setIsLegacyMinimized(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [rawResultsLen, isQueryLoading, mode])

  // Reset minimized state when mode changes
  useEffect(() => {
    setIsLegacyMinimized(false)
  }, [mode])

  return (
    <div className="p-4 border-b bg-white">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Knowledge Retriever</h2>

      <div className="flex items-center justify-between mb-3">
        <div className="relative inline-flex rounded-lg overflow-hidden border border-gray-300 shadow-sm bg-gray-100 p-0.5 w-fit">
          {/* Sliding indicator */}
          <div
            className={`absolute top-0.5 bottom-0.5 bg-[#ff0000] rounded-md transition-all duration-300 ease-in-out ${
              mode === "context" ? "left-0.5 right-1/2" : "left-1/2 right-0.5"
            }`}
          />

          {/* Context Search Button */}
          <button
            className={`relative z-10 px-3 py-1.5 text-xs font-medium transition-all duration-200 min-w-[90px] ${
              mode === "context" ? "text-white" : "text-gray-700 hover:text-gray-900"
            }`}
            onClick={() => onToggleMode("context")}
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            Context Search
          </button>

          {/* Persona Search Button */}
          <button
            className={`relative z-10 px-3 py-1.5 text-xs font-medium transition-all duration-200 min-w-[90px] ${
              mode === "legacy" ? "text-white" : "text-gray-700 hover:text-gray-900"
            }`}
            onClick={() => onToggleMode("legacy")}
          >
            <Target className="w-3 h-3 inline mr-1" />
            Persona Search
          </button>
        </div>
      </div>

      {mode === "legacy" && (
        <div className="space-y-2">
          {isLegacyMinimized && rawResultsLen > 0 ? (
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs text-gray-600 flex-1 pr-2">
                  <span className="font-medium">Search configured:</span> {persona.slice(0, 20)}
                  {persona.length > 20 ? "..." : ""} • {job.slice(0, 30)}
                  {job.length > 30 ? "..." : ""}
                </div>
                <Button
                  onClick={() => setIsLegacyMinimized(false)}
                  size="sm"
                  className="h-5 px-2 text-xs bg-[#ff0000] hover:bg-[#e60000] text-white flex-shrink-0"
                >
                  Expand
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="block text-xs font-medium text-gray-700">Persona</label>
                  <div className="relative group">
                    <Info className="w-3 h-3 text-gray-400 hover:text-red-500 cursor-help transition-colors duration-200" />
                    <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Provide a role for knowledge extractor
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-2 border-b-2 border-r-2 border-transparent border-r-gray-900"></div>
                    </div>
                  </div>
                </div>
                <Input
                  placeholder="e.g., Software Engineer, Marketing Manager..."
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  disabled={personaDisabled}
                  className="text-xs h-8"
                />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="block text-xs font-medium text-gray-700">Task</label>
                  <div className="relative group">
                    <Info className="w-3 h-3 text-gray-400 hover:text-red-500 cursor-help transition-colors duration-200" />
                    <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Provide task or query to extract relevant results
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-2 border-b-2 border-r-2 border-transparent border-r-gray-900"></div>
                    </div>
                  </div>
                </div>
                <Textarea
                  placeholder="e.g., Find best practices for API design..."
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  disabled={personaDisabled}
                  rows={1}
                  className="text-xs min-h-[32px] resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={onRunLegacy}
                  disabled={personaDisabled || isQueryLoading || !persona.trim() || !job.trim()}
                  className="flex-1 bg-[#ff0000] hover:bg-[#e60000] text-white h-8"
                  size="sm"
                >
                  {isQueryLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      <span className="text-xs">Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3 h-3 mr-1" />
                      <span className="text-xs">Search</span>
                    </>
                  )}
                </Button>
                {rawResultsLen > 0 && !isLegacyMinimized && (
                  <Button onClick={() => setIsLegacyMinimized(true)} variant="outline" size="sm" className="h-8 px-2">
                    <span className="text-xs">Minimize</span>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {mode === "context" && (
        <div className="space-y-3">
          {showTinyContextStatus && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Analyzing your selection...</span>
            </div>
          )}

          {rawResultsLen === 0 && !showTinyContextStatus && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 italic">
              Select the text from PDF to Trigger Search.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
