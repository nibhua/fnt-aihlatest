// lib/useInsightsHistory.ts
import { useEffect, useMemo, useState } from "react"
import type { Insight } from "@/lib/api"

export type InsightsRun = {
  id: string
  mode: "quick" | "detailed"
  createdAt: number
  selectedText: string
  insights: Insight[]
}

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `run_${Date.now()}_${Math.random().toString(36).slice(2)}`

/**
 * Persist Insights runs in sessionStorage (per tab).
 * Automatically caps to the newest 20 runs.
 */
export function useInsightsHistory(storageKey = "insights:runs") {
  const read = (): InsightsRun[] => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const [runs, setRuns] = useState<InsightsRun[]>(() => read())

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(runs))
    } catch {
      // ignore write errors
    }
  }, [runs, storageKey])

  const addRun = (partial: Omit<InsightsRun, "id" | "createdAt">) => {
    const run: InsightsRun = {
      id: makeId(),
      createdAt: Date.now(),
      ...partial,
    }
    setRuns((prev) => [run, ...prev].slice(0, 20))
    return run
  }

  const removeRun = (id: string) =>
    setRuns((prev) => prev.filter((r) => r.id !== id))

  const clearAll = () => setRuns([])

  const hasRuns = useMemo(() => runs.length > 0, [runs])

  return { runs, addRun, removeRun, clearAll, hasRuns }
}
