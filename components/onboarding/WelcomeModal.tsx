"use client"

import { useState } from "react"
import { useOnboarding } from "@/lib/onboarding-context"
import { X } from "lucide-react"

// Using Heroicons for unique icons
const CloudArrowUpIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
    />
  </svg>
)

const MagnifyingGlassIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
)

const LightBulbIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
)

const ChatBubbleLeftRightIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
    />
  </svg>
)

const DocumentTextIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
)

const SpeakerWaveIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.79-1.59-1.76V9.51c0-.97.71-1.76 1.59-1.76h2.24z"
    />
  </svg>
)

export function WelcomeModal() {
  const { showWelcome, markWelcomeSeen, setShowWelcome } = useOnboarding()
  const [dontShowAgain, setDontShowAgain] = useState(false)

  if (!showWelcome) return null

  const handleClose = () => {
    if (dontShowAgain) {
      markWelcomeSeen()
    } else {
      setShowWelcome(false)
    }
  }

  const handleGetStarted = () => {
    if (dontShowAgain) {
      markWelcomeSeen()
    } else {
      setShowWelcome(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="WEAVE Logo" className="w-10 h-10 rounded-lg shadow-sm object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome to WEAVE</h1>
              <p className="text-gray-600">Your AI-powered document intelligence platform</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="text-red-600 mt-0.5 flex-shrink-0">
                <CloudArrowUpIcon />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Smart Upload</h3>
                <p className="text-sm text-gray-600">Upload PDFs and build knowledge base</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-blue-600 mt-0.5 flex-shrink-0">
                <MagnifyingGlassIcon />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Context Search</h3>
                <p className="text-sm text-gray-600">Select text to find related content</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-purple-600 mt-0.5 flex-shrink-0">
                <LightBulbIcon />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">AI Insights</h3>
                <p className="text-sm text-gray-600">Extract key insights and patterns</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-green-600 mt-0.5 flex-shrink-0">
                <ChatBubbleLeftRightIcon />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">AI Chat</h3>
                <p className="text-sm text-gray-600">Chat with your documents using AI</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="text-orange-600 mt-0.5 flex-shrink-0">
                <DocumentTextIcon />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">AI Summary</h3>
                <p className="text-sm text-gray-600">Generate intelligent document summaries</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="text-indigo-600 mt-0.5 flex-shrink-0">
                <SpeakerWaveIcon />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">AI Podcasts</h3>
                <p className="text-sm text-gray-600">Transform documents into audio content</p>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started Steps */}
        <div className="px-6 pb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Getting Started (2 simple steps):</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <p className="text-gray-700">Upload your PDF documents and click "Start Build"</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <p className="text-gray-700">Select text in PDFs or use Persona search to explore your content</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-600">Don't show this again</span>
            </label>

            <button
              onClick={handleGetStarted}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Let's Get Started!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
