"use client"

import { useState, useEffect } from "react"
import type { CollectionSummary } from "@/lib/api"

export interface SummarySession {
  id: string
  collectionId: string
  summaryType: string
  content: string
  generatedAt: string
  processingTimeMs: number
  
}

const STORAGE_KEY = "connectreader_summary_sessions"
const MAX_SESSIONS = 20

export function useSummaryHistory() {
  const [sessions, setSessions] = useState<SummarySession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Load sessions from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedSessions = JSON.parse(stored)
        setSessions(parsedSessions)
      }
    } catch (error) {
      console.error("Failed to load summary sessions:", error)
    }
  }, [])

  // Save sessions to sessionStorage whenever sessions change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error("Failed to save summary sessions:", error)
    }
  }, [sessions])

  const addSession = (summary: CollectionSummary) => {
    const newSession: SummarySession = {
      id: `${summary.collection_id}_${summary.summary_type}_${Date.now()}`,
      collectionId: summary.collection_id,
      summaryType: summary.summary_type,
      content: summary.content,
      generatedAt: summary.generated_at,
      processingTimeMs: summary.processing_time_ms,
    }

    setSessions((prev) => {
      const updated = [newSession, ...prev.filter((s) => s.id !== newSession.id)]
      return updated.slice(0, MAX_SESSIONS) // Keep only the most recent sessions
    })

    setCurrentSessionId(newSession.id)
    return newSession
  }

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
    }
  }

  const clearAllSessions = () => {
    setSessions([])
    setCurrentSessionId(null)
  }

  const getCurrentSession = () => {
    return sessions.find((s) => s.id === currentSessionId) || null
  }

  const getSessionsByCollection = (collectionId: string) => {
    return sessions.filter((s) => s.collectionId === collectionId)
  }

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    addSession,
    deleteSession,
    clearAllSessions,
    getCurrentSession,
    getSessionsByCollection,
  }
}
