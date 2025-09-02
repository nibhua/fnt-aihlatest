"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Play, Pause, Volume2, VolumeX, X, SkipBack, SkipForward, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Function to parse generated script into transcript segments
function parseScriptToTranscript(script: string, podcastType: string, audioDuration?: number): TranscriptSegment[] {
  if (!script) return []

  try {
    const segments: TranscriptSegment[] = []
    const lines = script.split("\n").filter((line) => line.trim())

    if (podcastType === "conversational") {
      // For conversational, parse Speaker A/B format
      let currentTime = 0
      let segmentId = 1

      for (const line of lines) {
        if (line.startsWith("Speaker A:") || line.startsWith("Speaker B:")) {
          const speaker = line.startsWith("Speaker A:") ? "Speaker A" : "Speaker B"
          const text = line.replace(/^Speaker [AB]:\s*/, "").trim()

          if (text) {
            // Estimate duration based on text length (roughly 150 words per minute)
            const wordCount = text.split(" ").length
            const estimatedDuration = Math.max(3, (wordCount / 150) * 60) // minimum 3 seconds

            segments.push({
              id: segmentId.toString(),
              startTime: currentTime,
              endTime: currentTime + estimatedDuration,
              text: text,
              speaker: speaker,
            })

            currentTime += estimatedDuration
            segmentId++
          }
        }
      }
    } else {
      // For overview/detailed/educational, split into paragraphs
      const paragraphs = script.split("\n\n").filter((p) => p.trim())
      let currentTime = 0
      let segmentId = 1

      for (const paragraph of paragraphs) {
        const text = paragraph.trim()
        if (text) {
          // Estimate duration based on text length
          const wordCount = text.split(" ").length
          const estimatedDuration = Math.max(5, (wordCount / 150) * 60) // minimum 5 seconds

          segments.push({
            id: segmentId.toString(),
            startTime: currentTime,
            endTime: currentTime + estimatedDuration,
            text: text,
            speaker: "AI Narrator",
          })

          currentTime += estimatedDuration
          segmentId++
        }
      }
    }

    // If we have audio duration, adjust the timing to match
    if (audioDuration && segments.length > 0) {
      const totalEstimatedTime = segments[segments.length - 1].endTime
      const scaleFactor = audioDuration / totalEstimatedTime

      segments.forEach((segment) => {
        segment.startTime = segment.startTime * scaleFactor
        segment.endTime = segment.endTime * scaleFactor
      })
    }

    return segments
  } catch (error) {
    console.error("Error parsing script to transcript:", error)
    // Return a fallback transcript
    return [
      {
        id: "1",
        startTime: 0,
        endTime: audioDuration || 60,
        text: script || "Transcript not available",
        speaker: "AI Narrator",
      },
    ]
  }
}

// Move this outside the component, before the PodcastPlayer function
const DEFAULT_TRANSCRIPT: TranscriptSegment[] = [
  {
    id: "1",
    startTime: 0,
    endTime: 15,
    text: "Welcome to today's episode where we explore the fascinating world of renewable energy and its impact on global sustainability.",
    speaker: "Host",
  },
  {
    id: "2",
    startTime: 15,
    endTime: 32,
    text: "Recent studies show that solar panel efficiency has increased by 23% over the past year, making it more accessible than ever.",
    speaker: "AI Narrator",
  },
  {
    id: "3",
    startTime: 32,
    endTime: 48,
    text: "Investment in clean energy infrastructure reached unprecedented levels, with developing nations leading the charge.",
    speaker: "AI Narrator",
  },
  {
    id: "4",
    startTime: 48,
    endTime: 65,
    text: "However, experts warn that rapid deployment without proper grid infrastructure could pose stability challenges.",
    speaker: "AI Narrator",
  },
]

export interface PodcastEpisode {
  id: string
  title: string
  description?: string
  audioUrl?: string // Made optional
  duration?: number
  transcript?: TranscriptSegment[]
  generatedScript?: string
  podcastType?: string
}

export interface TranscriptSegment {
  id: string
  startTime: number
  endTime: number
  text: string
  speaker?: string
}

interface PodcastPlayerProps {
  episode: PodcastEpisode
  isOpen: boolean
  onClose: () => void
  autoPlay?: boolean
  className?: string
}

// Session storage key for tracking if walkthrough was shown
const WALKTHROUGH_SHOWN_KEY = "podcast-walkthrough-shown"

export function PodcastPlayer({ episode, isOpen, onClose, autoPlay = false, className }: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [hasAudioError, setHasAudioError] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [position, setPosition] = useState({ x: 16, y: 16 }) // bottom-right by default
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showWalkthrough, setShowWalkthrough] = useState(false)

  // Parse generated script into transcript segments
  const parsedTranscript = useMemo(() => {
    if (episode.generatedScript) {
      return parseScriptToTranscript(episode.generatedScript, episode.podcastType || "overview", duration)
    }
    return episode.transcript || DEFAULT_TRANSCRIPT
  }, [episode.generatedScript, episode.transcript, episode.podcastType, duration])

  const transcript = parsedTranscript
  const hasValidAudio =
    episode.audioUrl && episode.audioUrl !== "/placeholder-audio.mp3" && episode.audioUrl !== "undefined"

  // Format time helper
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  // Demo mode simulation
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isDemo && isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 1
          if (newTime >= 180) {
            // 3 minutes demo
            setIsPlaying(false)
            return 0
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isDemo, isPlaying])

  // Replace the transcript useEffect with useMemo
  const currentTranscript = useMemo(() => {
    if (transcript.length === 0) return []

    // Find the current segment
    const currentSegment = transcript.find(
      (segment) => currentTime >= segment.startTime && currentTime <= segment.endTime,
    )

    if (currentSegment) {
      // Show current segment and next few segments
      const currentIndex = transcript.findIndex(
        (segment) => currentTime >= segment.startTime && currentTime <= segment.endTime,
      )
      const contextSegments = transcript.slice(currentIndex, currentIndex + 4)
      return contextSegments
    } else {
      // Show next few segments if no current match
      const upcoming = transcript.filter((segment) => segment.startTime > currentTime).slice(0, 4)

      if (upcoming.length === 0) {
        // Show last few segments if we're at the end
        return transcript.slice(-3)
      }

      return upcoming
    }
  }, [currentTime, transcript])

  // Get the currently active segment for highlighting
  const activeSegment = useMemo(() => {
    return transcript.find((segment) => currentTime >= segment.startTime && currentTime <= segment.endTime)
  }, [currentTime, transcript])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0)
      setIsLoading(false)
      setHasAudioError(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    const handleError = (e: Event) => {
      setHasAudioError(true)
      setIsLoading(false)
    }

    const handleCanPlay = () => {
      if (audio.duration && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("error", handleError)
    audio.addEventListener("canplay", handleCanPlay)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("canplay", handleCanPlay)
    }
  }, [episode.audioUrl]) // Changed dependency to episode.audioUrl

  // Initialize demo mode if no valid audio
  useEffect(() => {
    if (!hasValidAudio) {
      setHasAudioError(true)
    }
  }, [hasValidAudio])

  // Auto play effect
  useEffect(() => {
    if (autoPlay && isOpen && hasValidAudio) {
      // Reset player state
      setCurrentTime(0)
      setIsPlaying(false)
      setHasAudioError(false)

      // Wait a bit for audio to load, then play
      const timer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch((error) => {
            setHasAudioError(true)
          })
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [autoPlay, isOpen, hasValidAudio, episode.audioUrl])

  // Control functions
  const togglePlay = useCallback(() => {
    if (isDemo) {
      setIsPlaying(!isPlaying)
      return
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch((error) => {
          setHasAudioError(true)
        })
      }
    }
  }, [isPlaying, isDemo, hasValidAudio])

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = Number.parseFloat(e.target.value)
      setCurrentTime(newTime)

      if (audioRef.current && !isDemo) {
        audioRef.current.currentTime = newTime
      }
    },
    [isDemo],
  )

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)

    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }, [])

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted
    setIsMuted(newMuted)

    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume
    }
  }, [isMuted, volume])

  const changePlaybackRate = useCallback(() => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]

    setPlaybackRate(newRate)

    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
  }, [playbackRate])

  const skipTime = useCallback(
    (seconds: number) => {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      setCurrentTime(newTime)

      if (audioRef.current && !isDemo) {
        audioRef.current.currentTime = newTime
      }
    },
    [currentTime, duration, isDemo],
  )

  const seekToSegment = useCallback(
    (segment: TranscriptSegment) => {
      const newTime = segment.startTime
      setCurrentTime(newTime)

      if (audioRef.current && !isDemo) {
        audioRef.current.currentTime = newTime
      }
    },
    [isDemo],
  )

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Allow dragging even when maximized - removed the restriction
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Keep within viewport bounds
      const maxX = window.innerWidth - 320 // player width
      const maxY = window.innerHeight - (isMinimized ? 64 : isMaximized ? 500 : 400) // player height

      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY)),
      })
    },
    [isDragging, dragOffset, isMinimized, isMaximized],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const toggleMaximize = useCallback(() => {
    const newMaximized = !isMaximized
    setIsMaximized(newMaximized)

    if (newMaximized) {
      // Calculate expanded height (approximately 500px when maximized)
      const expandedHeight = 500
      const currentBottom = position.y + (isMinimized ? 64 : 400)
      const screenHeight = window.innerHeight

      // Check if expanded content would go off-screen
      const wouldOverflow = position.y + expandedHeight > screenHeight - 20

      if (wouldOverflow) {
        // Smart repositioning: move player up so full content is visible
        const newY = Math.max(20, screenHeight - expandedHeight - 20)
        const newX = Math.min(position.x, window.innerWidth - 320 - 20) // Ensure it stays within screen width

        setPosition({
          x: newX,
          y: newY,
        })
      }
    }
  }, [isMaximized, position.y, position.x, isMinimized])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Initialize position to bottom-right when component mounts
  useEffect(() => {
    if (isOpen) {
      setPosition({
        x: window.innerWidth - 320 - 16, // 320px width + 16px margin
        y: window.innerHeight - 400 - 16, // estimated height + 16px margin
      })
    }
  }, [isOpen])

  // Show walkthrough on first podcast player open (once per session)
  useEffect(() => {
    if (isOpen && !showWalkthrough) {
      // Check if walkthrough was already shown in this session
      const wasShown = sessionStorage.getItem(WALKTHROUGH_SHOWN_KEY)

      if (!wasShown) {
        // Show walkthrough after a brief delay
        const timer = setTimeout(() => {
          setShowWalkthrough(true)
          sessionStorage.setItem(WALKTHROUGH_SHOWN_KEY, "true")
        }, 1000)

        return () => clearTimeout(timer)
      }
    }
  }, [isOpen, showWalkthrough])

  // Auto-dismiss walkthrough after 5 seconds
  useEffect(() => {
    if (showWalkthrough) {
      const timer = setTimeout(() => {
        setShowWalkthrough(false)
      }, 5000) // 5 seconds

      return () => clearTimeout(timer)
    }
  }, [showWalkthrough])

  // Close walkthrough manually
  const closeWalkthrough = useCallback(() => {
    setShowWalkthrough(false)
  }, [])

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200",
        "w-80 max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out",
        isMinimized ? "h-16" : isMaximized ? "h-auto" : "h-auto",
        isDragging ? "cursor-move" : "cursor-default", // Better cursor for dragging
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxHeight: isMaximized ? `${window.innerHeight - position.y - 20}px` : "auto",
        transition: isDragging ? "none" : "all 0.3s ease-out", // Smooth animations when not dragging
      }}
    >
      {/* Always render audio element if we have an audio URL */}
      {episode.audioUrl && (
        <audio
          ref={audioRef}
          src={episode.audioUrl}
          preload="metadata"
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              setDuration(audioRef.current.duration)
            }
          }}
          onError={(e) => {
            setHasAudioError(true)
            setIsDemo(true)
          }}
        />
      )}

      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between p-3 border-b border-gray-200",
          "cursor-move active:cursor-move", // Always show move cursor on header
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{episode.title || "Document Summary Podcast"}</h4>
          <p className="text-xs text-gray-500 truncate flex items-center">AI-Generated Audio Summary</p>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMaximize}
            className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            <Minimize2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
            title="Close"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Controls */}
          <div className="p-4 space-y-3">
            {/* Progress Bar */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ff0000 0%, #ff0000 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(-15)}
                className="text-gray-600 hover:text-[#ff0000] p-2"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                onClick={togglePlay}
                disabled={isLoading}
                className="bg-[#ff0000] hover:bg-[#e60000] text-white rounded-full p-3 h-12 w-12"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => skipTime(15)}
                className="text-gray-600 hover:text-[#ff0000] p-2"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-between">
              {/* Volume */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-gray-600 hover:text-[#ff0000] p-1"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Playback Speed */}
              <Button
                variant="ghost"
                size="sm"
                onClick={changePlaybackRate}
                className="text-gray-600 hover:text-[#ff0000] text-xs px-2 py-1 h-6"
              >
                {playbackRate}x
              </Button>
            </div>
          </div>

          {/* Transcript Preview */}
          <div className="px-4 pb-4">
            <div className={cn("bg-gray-50 rounded-lg p-3 overflow-y-auto", isMaximized ? "max-h-96" : "max-h-32")}>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span className="font-medium">Transcript</span>
                {activeSegment && (
                  <span className="text-[#ff0000] font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                )}
              </div>
              {currentTranscript.length > 0 ? (
                <div className="space-y-2">
                  {currentTranscript.map((segment, index) => (
                    <div key={segment.id} className="space-y-1">
                      {segment.speaker && segment.speaker !== "AI Narrator" && (
                        <div className="text-xs text-gray-500 font-medium">{segment.speaker}</div>
                      )}
                      <p
                        className={cn(
                          "text-xs leading-relaxed transition-colors duration-200 cursor-pointer hover:bg-gray-100 p-1 rounded",
                          activeSegment?.id === segment.id ? "text-[#ff0000] font-medium bg-red-50" : "text-gray-600",
                        )}
                        onClick={() => seekToSegment(segment)}
                        title={`Click to jump to ${formatTime(segment.startTime)}`}
                      >
                        {segment.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  {hasValidAudio ? "Transcript will appear here during playback..." : "No transcript available"}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Minimized View */}
      {isMinimized && (
        <div className="flex items-center p-3 space-x-3">
          <Button
            onClick={togglePlay}
            className="bg-[#ff0000] hover:bg-[#e60000] text-white rounded-full p-2 h-8 w-8 flex-shrink-0"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
          </Button>
          <div className="flex-1 min-w-0">
            <div className="w-full h-1 bg-gray-200 rounded-lg">
              <div
                className="h-1 bg-[#ff0000] rounded-lg transition-all duration-300"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 flex-shrink-0">{formatTime(currentTime)}</div>
        </div>
      )}

      {/* Improved Walkthrough Tooltip */}
      {showWalkthrough && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white border border-gray-200 shadow-lg text-gray-800 text-sm px-4 py-3 rounded-lg max-w-xs text-center relative">
            <div className="flex items-center justify-center mb-1">
              <span className="mr-2 text-[#ff0000]">🎯</span>
              <span className="font-medium text-gray-900">Tip: Drag me anywhere!</span>
            </div>
            <div className="text-gray-600 text-xs mb-2">
              Click and drag to move • Click maximize for full transcript
            </div>

            {/* Arrow pointing down to player */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-[-1px] w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>

            {/* Close button */}
            <button
              onClick={closeWalkthrough}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 text-sm border border-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
