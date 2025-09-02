"use client"

import { Button } from "@/components/ui/button"
import { Lightbulb, MessageSquare, FileText, Headphones, Lock } from "lucide-react"

interface AiFeaturesGridProps {
  onOpenInsights: () => void
  onOpenChat: () => void
  onOpenSummary: () => void
  onOpenPodcast: () => void
  disabled?: boolean
  onDisabledClick?: () => void
}

export function AiFeaturesGrid({
  onOpenInsights,
  onOpenChat,
  onOpenSummary,
  onOpenPodcast,
  disabled = false,
  onDisabledClick,
}: AiFeaturesGridProps) {
  const features = [
    {
      id: "insights",
      label: "Insights",
      icon: Lightbulb,
      onClick: onOpenInsights,
      description: "AI-powered document insights",
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      onClick: onOpenChat,
      description: "Chat with your documents",
    },
    {
      id: "summary",
      label: "Summary",
      icon: FileText,
      onClick: onOpenSummary,
      description: "Generate document summaries",
    },
    {
      id: "podcast",
      label: "Podcast",
      icon: Headphones,
      onClick: onOpenPodcast,
      description: "Create audio summaries",
    },
  ]

  const handleClick = (feature: (typeof features)[0]) => {
    if (disabled) {
      onDisabledClick?.()
    } else {
      feature.onClick()
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">AI Features</div>

      {/* Single row - All 5 buttons */}
      <div className="flex items-center justify-evenly gap-3 px-1">
        {features.map((feature) => {
          const Icon = feature.icon

          return (
            <Button
              key={feature.id}
              onClick={() => handleClick(feature)}
              disabled={false} // Never actually disable to allow click handling
              variant="outline"
              size="sm"
              className={`
                flex items-center gap-1.5 px-3 py-2 h-auto text-xs transition-all duration-200 shadow-sm whitespace-nowrap border
                ${
                  disabled
                    ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed hover:bg-gray-50 hover:text-gray-400 hover:border-gray-200"
                    : "bg-transparent border-red-600 hover:bg-[#ff0000] hover:text-white hover:border-[#ff0000]"
                }
              `}
              title={disabled ? undefined : feature.description}
            >
              {disabled && <Lock className="w-3 h-3 flex-shrink-0 opacity-60" />}
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${disabled ? "opacity-60" : ""}`} />
              <span className={`font-medium ${disabled ? "opacity-60" : ""}`}>{feature.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
