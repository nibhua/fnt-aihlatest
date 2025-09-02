"use client"

import { AiFeaturesGrid } from "@/components/ai-features/AiFeaturesGrid"

export function PdfHeaderBar({
  aiFeaturesEnabled,
  onOpenInsights,
  onOpenPodcast,
  onOpenChat,
  onOpenSummary,
  onAiFeaturesDisabledClick,
}: {
  aiFeaturesEnabled: boolean
  onOpenInsights: () => void
  onOpenPodcast: () => void
  onOpenChat: () => void
  onOpenSummary: () => void
  onAiFeaturesDisabledClick?: () => void
}) {
  return (
    <div className="border-b bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Always show AI Features Grid */}
          <AiFeaturesGrid
            onOpenInsights={onOpenInsights}
            onOpenChat={onOpenChat}
            onOpenSummary={onOpenSummary}
            onOpenPodcast={onOpenPodcast}
            disabled={!aiFeaturesEnabled}
            onDisabledClick={onAiFeaturesDisabledClick}
          />
        </div>
      </div>
    </div>
  )
}
