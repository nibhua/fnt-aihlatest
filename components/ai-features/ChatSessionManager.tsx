"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageSquare, Clock, Trash2, RefreshCw } from "lucide-react"
import {
  listChatSessions,
  deleteChatSession,
  type ChatSession
} from "@/lib/api"

interface ChatSessionManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelectSession: (sessionId: string) => void
  currentSessionId?: string
  /** Only show sessions for this collection */
  collectionId?: string
}

export function ChatSessionManager({
  isOpen,
  onClose,
  onSelectSession,
  currentSessionId,
  collectionId,
}: ChatSessionManagerProps) {
  const [allSessions, setAllSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingSession, setDeletingSession] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) loadSessions()
  }, [isOpen, collectionId])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const sessionList = await listChatSessions()
      setAllSessions(sessionList)
    } catch (error) {
      console.error("Failed to load chat sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  // Only sessions for the current collection; newest first
  const sessions = useMemo(() => {
    const filtered = collectionId
      ? allSessions.filter(s => s.collection_id === collectionId)
      : allSessions
    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [allSessions, collectionId])

  const handleDeleteSession = async (sessionId: string) => {
    // Block deleting the current/active session
    if (sessionId === currentSessionId) {
      console.warn("Prevented deletion of the active chat session.")
      return
    }
    setDeletingSession(sessionId)
    try {
      await deleteChatSession(sessionId)
      setAllSessions(prev => prev.filter(s => s.session_id !== sessionId))
    } catch (error) {
      console.error("Failed to delete session:", error)
    } finally {
      setDeletingSession(null)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const emptyText = collectionId
    ? "No chat sessions for this collection yet."
    : "No chat sessions."

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#ff0000]/10 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#ff0000]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Chat Sessions</DialogTitle>
              <p className="text-sm text-gray-600">
                {collectionId ? "Showing sessions for this collection" : "Manage your previous conversations"}
              </p>
            </div>
          </div>
          <Button
            onClick={loadSessions}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 bg-transparent"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-[#ff0000] animate-spin mb-4" />
              <p className="text-gray-600">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyText}</h3>
              <p className="text-gray-600 text-center max-w-md">
                Start a new conversation to see your chat sessions here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {sessions.map((session) => {
                const selected = currentSessionId === session.session_id
                return (
                  <li key={session.session_id}>
                    <Card
                      role="button"
                      aria-pressed={selected}
                      onClick={() => onSelectSession(session.session_id)}
                      className={[
                        "transition-all duration-150 overflow-hidden rounded-xl",
                        "border hover:shadow-sm mx-1",               // prevents border from touching dialog edges
                        selected ? "border-2 border-[#ff0000] bg-red-50 relative" : "border-gray-200 hover:border-gray-300",
                      ].join(" ")}
                    >
                      {/* Left accent bar when selected */}
                      {selected && <div className="absolute inset-y-0 left-0 w-1 bg-[#ff0000]" aria-hidden />}
                      <CardContent className="p-4 pl-5">
                        <div className="flex items-center justify-between">
                          {/* Title/meta (clickable area) */}
                          <div className="flex-1 pr-3">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">
                                Session {session.session_id.slice(0, 8)}…
                              </span>
                              {selected && (
                                <span className="text-xs bg-[#ff0000] text-white px-2 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(session.created_at)}
                              </span>
                              <span>•</span>
                              <span>{session.message_count} messages</span>
                              {session.collection_id && (
                                <>
                                  <span>•</span>
                                  <span>Collection: {session.collection_id.slice(0, 8)}…</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Delete (hidden for current/active session) */}
                          {!selected && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteSession(session.session_id)
                              }}
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={deletingSession === session.session_id}
                              aria-label="Delete session"
                            >
                              {deletingSession === session.session_id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
