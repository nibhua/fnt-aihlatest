"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Headphones, Search, FileText, Play, RefreshCw } from "lucide-react"
import { 
  generatePodcastFromSnippets, 
  generatePodcastFromCollection,
  type QueryHit
} from "@/lib/api"
import { PodcastPlayer } from "@/components/podcast-player"

type ContentSource = "search" | "summary"
type PodcastStyle = "overview" | "conversational" | "detailed" | "educational"
type PodcastLanguage = "English" | "Hindi" | "Spanish" | "Japanese" | "French" | "German" | "Chinese" | "Arabic" | "Portuguese" | "Russian"

interface PodcastGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (config: PodcastConfig) => void
  searchResultsCount?: number
  searchResults?: QueryHit[]
  selectedText?: string
  collectionId?: string
}

interface PodcastConfig {
  contentSource: ContentSource
  podcastStyle: PodcastStyle
  language: PodcastLanguage
  audioUrl?: string
  transcript?: string
  generatedScript?: string
}

export function PodcastGenerationModal({
  isOpen,
  onClose,
  onGenerate,
  searchResultsCount = 0,
  searchResults = [],
  selectedText,
  collectionId,
}: PodcastGenerationModalProps) {
  const [contentSource, setContentSource] = useState<ContentSource>("search")
  const [podcastStyle, setPodcastStyle] = useState<PodcastStyle>("overview")
  const [language, setLanguage] = useState<PodcastLanguage>("English")
  const [loading, setLoading] = useState(false)

  const contentSources = [
    {
      id: "search" as const,
      label: "From Search Results",
      icon: Search,
      description: `${searchResultsCount} sections`,
      available: searchResultsCount > 0,
    },
    {
      id: "summary" as const,
      label: "From Collection Summary",
      icon: FileText,
      description: collectionId ? "Entire knowledge base" : "Not available",
      available: !!collectionId,
    },
  ]

  const podcastStyles = [
    {
      id: "overview" as const,
      label: "Overview",
      description: "High-level summary format",
    },
    {
      id: "conversational" as const,
      label: "Conversational",
      description: "Two AI speakers discussing the content",
    },
    {
      id: "detailed" as const,
      label: "Detailed",
      description: "In-depth analysis format (uses overview style)",
    },
    {
      id: "educational" as const,
      label: "Educational",
      description: "Teaching-focused approach (uses overview style)",
    },
  ]

  const languages = [
    { id: "English" as const, label: "English", flag: "🇺🇸" },
    { id: "Hindi" as const, label: "Hindi", flag: "🇮🇳" },
    { id: "Spanish" as const, label: "Spanish", flag: "🇪🇸" },
    { id: "Japanese" as const, label: "Japanese", flag: "🇯🇵" },
    { id: "French" as const, label: "French", flag: "🇫🇷" },
    { id: "German" as const, label: "German", flag: "🇩🇪" },
    { id: "Chinese" as const, label: "Chinese", flag: "🇨🇳" },
    { id: "Arabic" as const, label: "Arabic", flag: "🇸🇦" },
    { id: "Portuguese" as const, label: "Portuguese", flag: "🇵🇹" },
    { id: "Russian" as const, label: "Russian", flag: "🇷🇺" },
  ]

  const getContentPreview = () => {
    switch (contentSource) {
      case "search":
        return searchResultsCount > 0
          ? `Will use ${searchResultsCount} search result sections to generate podcast content.`
          : "No search results available."
      case "summary":
        return collectionId 
          ? `Will generate podcast from entire collection (${collectionId}) using comprehensive summary.`
          : "Collection not available"
      default:
        return ""
    }
  }

  const getEffectivePodcastStyle = () => {
    // For detailed and educational, use overview style but with theme prompts
    if (podcastStyle === "detailed" || podcastStyle === "educational") {
      return "overview"
    }
    return podcastStyle
  }

  const getThemePrompt = () => {
    if (podcastStyle === "detailed") {
      return "detailed analysis with comprehensive coverage"
    } else if (podcastStyle === "educational") {
      return "educational teaching format with clear explanations"
    }
    return ""
  }

  const handleGenerate = async () => {
    setLoading(true)

    try {
      let podcastResponse
      let inputText = ""
      const effectiveStyle = getEffectivePodcastStyle()
      const themePrompt = getThemePrompt()

      if (contentSource === "search" && searchResults.length > 0) {
        // Generate podcast from search results
        inputText = searchResults.map(result => result.snippet).join("\n\n")
        podcastResponse = await generatePodcastFromSnippets(
          searchResults,
          effectiveStyle,
          "medium", // duration preference
          language,
          themePrompt,
          collectionId // Pass collectionId if available for proper audio URL construction
        )
      } else if (contentSource === "summary" && collectionId) {
        // Generate podcast from collection summary
        inputText = `Collection ${collectionId} summary`
        podcastResponse = await generatePodcastFromCollection(
          collectionId,
          effectiveStyle,
          "medium", // duration preference
          language,
          "comprehensive", // summary type
          themePrompt
        )
      } else {
        throw new Error("Invalid content source or no content available")
      }

      // Create episode data for the main app player
      const episode = {
        id: `podcast-${Date.now()}`,
        title: `Podcast Summary in ${language}`,
        description: `AI-generated audio summary based on ${contentSource} content`,
        audioUrl: podcastResponse.audio_url,
        generatedScript: podcastResponse.generated_script,
        podcastType: effectiveStyle,
        transcript: [{ 
          id: '1', 
          startTime: 0, 
          endTime: 60, 
          text: inputText, 
          speaker: effectiveStyle === "conversational" ? "AI Speakers" : 'AI Narrator' 
        }]
      }

      // Call the original onGenerate for the main app to handle the player
      const config: PodcastConfig = {
        contentSource,
        podcastStyle,
        language,
        audioUrl: podcastResponse.audio_url,
        transcript: inputText,
        generatedScript: podcastResponse.generated_script,
      }
      
      onGenerate(config)

      // Close the modal after successful generation
      onClose()
    } catch (error) {
      console.error("Failed to generate podcast:", error)
      // You might want to show a toast error here
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = () => {
    if (loading) return false
    if (contentSource === "search" && searchResultsCount === 0) return false
    if (contentSource === "summary" && !collectionId) return false
    return true
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#ff0000]/10 rounded-full flex items-center justify-center">
              <Headphones className="w-5 h-5 text-[#ff0000]" />
            </div>
            <DialogTitle className="text-xl font-semibold">Generate Podcast</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Source */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Content Source</h3>
            <div className="space-y-2">
              {contentSources.map((source) => {
                const Icon = source.icon
                return (
                  <label
                    key={source.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                      contentSource === source.id
                        ? "border-[#ff0000] bg-red-50"
                        : source.available
                          ? "border-gray-200 hover:border-gray-300"
                          : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="contentSource"
                        value={source.id}
                        checked={contentSource === source.id}
                        onChange={(e) => setContentSource(e.target.value as ContentSource)}
                        disabled={!source.available}
                        className="text-[#ff0000] focus:ring-[#ff0000]"
                      />
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">{source.label}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{source.description}</div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Language</h3>
            <div className="grid grid-cols-5 gap-2">
              {languages.map((lang) => (
                <label
                  key={lang.id}
                  className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    language === lang.id ? "border-[#ff0000] bg-red-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="language"
                    value={lang.id}
                    checked={language === lang.id}
                    onChange={(e) => setLanguage(e.target.value as PodcastLanguage)}
                    className="text-[#ff0000] focus:ring-[#ff0000] mb-2"
                  />
                  <div className="text-2xl mb-1">{lang.flag}</div>
                  <div className="text-xs text-center text-gray-700">{lang.label}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Podcast Style */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Podcast Style</h3>
            <div className="grid grid-cols-2 gap-3">
              {podcastStyles.map((style) => (
                <label
                  key={style.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    podcastStyle === style.id ? "border-[#ff0000] bg-red-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="podcastStyle"
                    value={style.id}
                    checked={podcastStyle === style.id}
                    onChange={(e) => setPodcastStyle(e.target.value as PodcastStyle)}
                    className="text-[#ff0000] focus:ring-[#ff0000] mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{style.label}</div>
                    <div className="text-sm text-gray-500">{style.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Content Preview */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Content Preview</h3>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Source:</span> {getContentPreview().split("(")[0]}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Language:</span>{" "}
                  {languages.find((l) => l.id === language)?.label}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Style:</span>{" "}
                  {podcastStyles.find((s) => s.id === podcastStyle)?.label.toLowerCase()}
                  {getEffectivePodcastStyle() !== podcastStyle && (
                    <span className="text-orange-600"> (using overview format)</span>
                  )}
                </div>
                {getThemePrompt() && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Theme:</span> {getThemePrompt()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button onClick={onClose} variant="outline" disabled={loading}>
            Close
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate()}
            className="bg-[#ff0000] hover:bg-[#e60000] text-white flex items-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{loading ? "Generating..." : "Generate Podcast"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}