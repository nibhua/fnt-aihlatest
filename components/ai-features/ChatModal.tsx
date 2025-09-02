"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageSquare, Send, Plus, RefreshCw, User, Bot } from "lucide-react"
import { createChatSession, sendChatMessage, getChatHistory, type ChatMessage as ApiChatMessage } from "@/lib/api"
import { ChatSessionManager } from "./ChatSessionManager"

// Markdown
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  selectedText?: string
  collectionId?: string
  searchResults?: any[] // Pass search results for context
}

export function ChatModal({ isOpen, onClose, selectedText, collectionId, searchResults }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showSessionManager, setShowSessionManager] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const DEFAULT_PROMPT = "What are the main topics covered in my documents?"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Only prefill ONCE when modal opens with selected text, and user hasn't interacted
  useEffect(() => {
    if (isOpen && selectedText && !input && !hasUserInteracted) {
      setInput(`Tell me more about: "${selectedText}"`)
    }
  }, [isOpen, selectedText])

  // Reset interaction state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasUserInteracted(false)
    }
  }, [isOpen])

  // Create a session only when the first message is sent
  const ensureSession = async (): Promise<string> => {
    if (sessionId) return sessionId
    const session = await createChatSession(collectionId)
    setSessionId(session.session_id)
    return session.session_id
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const sid = await ensureSession()

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Prepare context sections from search results if available
      const contextSections = searchResults?.slice(0, 3).map((result) => ({
        file_name: result.file_name,
        page: result.page,
        snippet: result.snippet,
        heading: result.heading,
      }))

      const response = await sendChatMessage(sid, userMessage.content, contextSections)

      if (!response) {
        // Error was already shown via toast, just add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error while processing your message. Please try again.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } else {
        const assistantMessage: Message = {
          id: response.message.id,
          role: "assistant",
          content: response.message.content,
          timestamp: new Date(response.message.timestamp),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Start new chat now just clears local state; a new session
  // will be created lazily on the next send.
  const startNewChat = async () => {
    setMessages([])
    setInput("")
    setSessionId(null)
    setHasUserInteracted(false) // Reset interaction state
    // focus the input for convenience
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSelectSession = async (selectedSessionId: string) => {
    setSessionId(selectedSessionId)
    setShowSessionManager(false)

    try {
      const history = await getChatHistory(selectedSessionId)
      const formattedHistory: Message[] = history.map((msg: ApiChatMessage) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      }))
      setMessages(formattedHistory)
    } catch (error) {
      console.error("Failed to load chat history:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Handle input changes and mark user interaction
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (!hasUserInteracted) {
      setHasUserInteracted(true)
    }
  }

  // Empty-state CTA: if there's text in the input, send it; otherwise fill a default prompt and focus.
  const handleEmptyStart = () => {
    if (input.trim()) {
      void sendMessage()
    } else {
      setInput(DEFAULT_PROMPT)
      setHasUserInteracted(true)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  // Markdown renderer for assistant messages
  const MarkdownBubble = ({ children }: { children: string }) => (
    <div className="text-sm leading-relaxed prose prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )

  // Header "New" should only be active if we actually have a conversation to clear
  const newDisabled = messages.length === 0 && !sessionId

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#ff0000]/10 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#ff0000]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Chat with Documents</DialogTitle>
              <p className="text-sm text-gray-600">
                {sessionId ? `Session: ${sessionId.slice(0, 8)}...` : "No session yet — send a message to start"}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowSessionManager(true)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 bg-transparent"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Sessions</span>
            </Button>
            <Button
              onClick={startNewChat}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 bg-transparent"
              disabled={newDisabled}
              title={newDisabled ? "Start chatting first before creating another session" : "Start a fresh chat"}
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a new chat session</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Ask questions about your documents, get summaries, or explore specific topics. A session will be created
                after you send your first message.
              </p>
              <Button onClick={handleEmptyStart} className="bg-[#ff0000] hover:bg-[#e60000] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Start Chat
              </Button>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-[#ff0000]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-[#ff0000]" />
                    </div>
                  )}

                  <Card
                    className={`max-w-[80%] ${
                      message.role === "user" ? "bg-[#ff0000] text-white" : "bg-white border-gray-200"
                    }`}
                  >
                    <CardContent className="p-3">
                      {message.role === "assistant" ? (
                        <MarkdownBubble>{message.content}</MarkdownBubble>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      )}
                      <p className={`text-xs mt-2 ${message.role === "user" ? "text-red-100" : "text-gray-500"}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>

                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#ff0000]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-[#ff0000]" />
                  </div>
                  <Card className="bg-white border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#ff0000]" />
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t pt-4">
          <div className="flex items-center space-x-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your documents..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-[#ff0000] hover:bg-[#e60000] text-white px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>

      <ChatSessionManager
        isOpen={showSessionManager}
        onClose={() => setShowSessionManager(false)}
        onSelectSession={handleSelectSession}
        currentSessionId={sessionId || undefined}
        collectionId={collectionId}
      />
    </Dialog>
  )
}
