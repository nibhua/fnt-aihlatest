"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import AdobePdfViewer from "@/components/AdobePdfViewer"
import { InsightsModal } from "@/components/ai-features/InsightsModal"
import { PodcastPlayer } from "@/components/podcast-player"
import SelectionConsentDialog from "@/components/SelectionConsentDialog"
import { SummaryModal } from "@/components/ai-features/SummaryModal"
import { ChatModal } from "@/components/ai-features/ChatModal"
import { PodcastGenerationModal } from "@/components/ai-features/PodcastGenerationModal"

import { buildCollection, queryTopK, pdfUrl, type BuildResponse, type QueryHit, type QueryResponse } from "@/lib/api"

import { UploadPanel } from "@/components/app/UploadPanel"
import { PdfHeaderBar } from "@/components/app/PdfHeaderBar"
import { SearchPanel } from "@/components/app/SearchPanel"
import { ResultsList } from "@/components/app/ResultsList"
import { Toast } from "@/components/app/Toast"
import QueryDocModal from "@/components/app/QueryDocModal"

// Import onboarding components
import { OnboardingProvider } from "@/lib/onboarding-context"
import { WelcomeModal } from "@/components/onboarding/WelcomeModal"

import type { Mode, UploadedFile, ExpandedResult, QueryFile, QueryPdfSource } from "@/types/app"
import { CheckCircle, Upload, Loader2, ArrowLeft } from "lucide-react"

// Import Adobe facts from JSON file
import adobeFactsData from "@/lib/data/adobe-facts.json"

// Extract the facts array from the imported JSON
const ADOBE_FACTS = adobeFactsData.adobe_facts

const MIN_SHOW = 3
const MAX_SHOW = 10

// --- geometry helpers (unchanged) ---
function coerceBBox(b: any): number[] | undefined {
  if (!Array.isArray(b) || b.length !== 4) return undefined
  const nums = b.map((n) => Number(n))
  return nums.every((n) => Number.isFinite(n)) ? nums : undefined
}
function coerceRects(a: any): number[][] | undefined {
  if (!Array.isArray(a)) return undefined
  const out: number[][] = []
  for (const r of a) {
    if (Array.isArray(r) && r.length === 4) {
      const nums = r.map((v) => (typeof v === "string" ? Number(v) : v))
      if (nums.every((n) => Number.isFinite(n))) out.push(nums as number[])
    }
  }
  return out.length ? out : undefined
}
function coerceQuads(a: any): number[][] | undefined {
  if (!Array.isArray(a)) return undefined
  const out: number[][] = []
  for (const q of a) {
    if (Array.isArray(q) && q.length === 8) {
      const nums = q.map((v) => (typeof v === "string" ? Number(v) : v))
      if (nums.every((n) => Number.isFinite(n))) out.push(nums as number[])
    }
  }
  return out.length ? out : undefined
}

type SelectionPayload = { text: string; page: number; bbox?: number[]; quads?: number[][]; fileName: string }

function AppPageContent() {
  // files & build
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  const [buildInfo, setBuildInfo] = useState<BuildResponse | null>(null)

  // Query docs - SESSION ONLY (no persistence)
  const [queryFiles, setQueryFiles] = useState<QueryFile[]>([])
  const [showQueryModal, setShowQueryModal] = useState(false)

  // modes & show-N - CHANGED DEFAULT TO CONTEXT
  const [mode, setMode] = useState<Mode>("context")
  const [showN, setShowN] = useState<number>(MIN_SHOW)

  // inputs
  const [persona, setPersona] = useState("")
  const [job, setJob] = useState("")

  // results
  const [legacyResults, setLegacyResults] = useState<QueryHit[]>([])
  const [contextResults, setContextResults] = useState<QueryHit[]>([])

  // loading flags
  const [loading, setLoading] = useState<{ build: boolean; queryLegacy: boolean; queryContext: boolean }>({
    build: false,
    queryLegacy: false,
    queryContext: false,
  })

  // viewer hints
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null)
  const [pageHint, setPageHint] = useState<number | null>(null)
  const [bboxHint, setBboxHint] = useState<number[] | undefined>(undefined)
  const [areasHint, setAreasHint] = useState<number[][] | undefined>(undefined)
  const [quadsHint, setQuadsHint] = useState<number[][] | undefined>(undefined)

  // ui misc
  const [factIndex, setFactIndex] = useState(0)
  const [showInsights, setShowInsights] = useState(false)
  const [showPodcast, setShowPodcast] = useState(false)
  const [expandedResults, setExpandedResults] = useState<ExpandedResult>({})
  const [isPdfSticky, setIsPdfSticky] = useState(true)
  const [toast, setToast] = useState<{
    show: boolean
    type: "success" | "error" | "info"
    title: string
    message: string
  }>({
    show: false,
    type: "success",
    title: "",
    message: "",
  })

  // query PDF source tracking
  const [queryPdfSource, setQueryPdfSource] = useState<QueryPdfSource | null>(null)
  const [showReturnButton, setShowReturnButton] = useState(false)

  // Clear query files on component mount (page refresh)
  useEffect(() => {
    // This ensures query files are always cleared on page refresh
    setQueryFiles([])
    setQueryPdfSource(null)
  }, [])

  // 👇 Listen for global error-handler broadcasts and surface them via <Toast />
  const autoHideRef = useRef<number | null>(null)
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const detail = (e as CustomEvent).detail || {}
      const type: "success" | "error" | "info" =
        detail.type === "error" ? "error" : detail.type === "success" ? "success" : "info"

      setToast({
        show: true,
        type,
        title: detail.title || "",
        message: detail.message || "",
      })

      // handle optional auto-hide
      if (autoHideRef.current) {
        clearTimeout(autoHideRef.current)
        autoHideRef.current = null
      }
      if (detail.duration && Number.isFinite(detail.duration)) {
        autoHideRef.current = window.setTimeout(() => {
          setToast((prev) => ({ ...prev, show: false }))
          autoHideRef.current = null
        }, Number(detail.duration))
      }
    }

    window.addEventListener("cr:toast", handleGlobalToast as EventListener)
    return () => {
      window.removeEventListener("cr:toast", handleGlobalToast as EventListener)
      if (autoHideRef.current) clearTimeout(autoHideRef.current)
    }
  }, [])

  // consent
  const [consent, setConsent] = useState<"unknown" | "granted" | "denied">("unknown")
  const consentRef = useRef(consent)
  useEffect(() => {
    consentRef.current = consent
  }, [consent])
  const [consentOpen, setConsentOpen] = useState(false)
  const [pendingSel, setPendingSel] = useState<SelectionPayload | null>(null)
  const suppressNextCancelRef = useRef(false)

  // AI feature modals
  const [showSummary, setShowSummary] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showPodcastGeneration, setShowPodcastGeneration] = useState(false)
  const [lastSelectedText, setLastSelectedText] = useState<string>("")
  const [currentPodcastEpisode, setCurrentPodcastEpisode] = useState<any>(null)

  // rotating Adobe facts while loading
  useEffect(() => {
    const any = loading.build || loading.queryLegacy || loading.queryContext
    if (!any) return
    const t = setInterval(() => setFactIndex((i) => (i + 1) % ADOBE_FACTS.length), 2500)
    return () => clearInterval(t)
  }, [loading.build, loading.queryLegacy, loading.queryContext])

  const uploadDisabled = loading.build || !!buildInfo
  const personaDisabled = !buildInfo || loading.build
  const showToast = useCallback((type: "success" | "error" | "info", title: string, message: string) => {
    setToast({ show: true, type, title, message })
  }, [])
  const hideToast = useCallback(() => setToast((t) => ({ ...t, show: false })), [])

  // Helper function to open first knowledge base PDF
  const openFirstKnowledgeBasePdf = useCallback(() => {
    if (uploadedFiles.length > 0) {
      const firstPdf = uploadedFiles[0]
      setCurrentFileName(firstPdf.name)
      setCurrentPdfUrl(pdfUrl(firstPdf.name))
      setPageHint(1)
      setBboxHint(undefined)
      setAreasHint(undefined)
      setQuadsHint(undefined)
      setSelectedFile(firstPdf)
      showToast("success", "PDF Opened", `Now viewing: ${firstPdf.name}`)
    }
  }, [uploadedFiles, showToast])

  // file handlers
  const onFilesSelected = useCallback(
    (files: File[]) => {
      if (uploadDisabled) return
      setStagedFiles((prev) => {
        const names = new Set(prev.map((f) => f.name))
        const next = [...prev, ...files.filter((f) => !names.has(f.name))]
        return next
      })
    },
    [uploadDisabled],
  )

  const removeStaged = useCallback((name: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.name !== name))
  }, [])

  const startBuild = useCallback(async () => {
    if (stagedFiles.length === 0) {
      showToast("error", "No Files Selected", "Please select at least one PDF file to build the collection.")
      return
    }
    try {
      setLoading((s) => ({ ...s, build: true }))

      // Clear ALL session data including query files
      try {
        queryFiles.forEach((q) => URL.revokeObjectURL(q.url))
      } catch {}
      setQueryFiles([])
      setQueryPdfSource(null)
      setShowReturnButton(false)

      // clear viewer and results
      setLegacyResults([])
      setContextResults([])
      setCurrentFileName(null)
      setCurrentPdfUrl(null)
      setPageHint(null)
      setBboxHint(undefined)
      setAreasHint(undefined)
      setQuadsHint(undefined)

      const resp = await buildCollection(stagedFiles)
      if (resp) {
        setBuildInfo(resp)
      } else {
        return
      }

      const now = new Date()
      const newUploadedFiles = stagedFiles.map((f) => ({
        id: Math.random().toString(36).slice(2),
        name: f.name,
        size: f.size,
        uploadedAt: now,
      }))

      setUploadedFiles(newUploadedFiles)
      setSelectedFile(null)
      setStagedFiles([])
      showToast("success", "Build Complete! 🎉", "Your collection is ready. Pick a mode and search.")

      // invite user to open "query" PDFs
      setShowQueryModal(true)
    } finally {
      setLoading((s) => ({ ...s, build: false }))
    }
  }, [stagedFiles, showToast, queryFiles])

  const resetSession = useCallback(() => {
    // Force page refresh to ensure complete reset
    window.location.reload()
  }, [])

  // navigate to a hit (KB doc)
  const [navigatingItems, setNavigatingItems] = useState<Set<string>>(new Set())

  const applyFirstHit = useCallback(
    (hit?: QueryHit) => {
      if (!hit) return
      const bb = coerceBBox(hit.bbox)
      const pageNum = Number(hit.page) || 1
      setCurrentFileName(hit.file_name)
      setCurrentPdfUrl(pdfUrl(hit.file_name, hit.collection_id))
      setPageHint(pageNum)
      setBboxHint(bb)
      setAreasHint(coerceRects((hit as any).areas))
      setQuadsHint(coerceQuads((hit as any).quads))
      const match = uploadedFiles.find((f) => f.name === hit.file_name)
      if (match) setSelectedFile(match)
    },
    [uploadedFiles],
  )

  // search: legacy
  const runLegacyQuery = useCallback(async () => {
    if (!persona.trim() || !job.trim()) {
      showToast("error", "Missing Information", "Please enter both persona and job to be done.")
      return
    }
    try {
      setLoading((s) => ({ ...s, queryLegacy: true }))
      const data: QueryResponse | null = await queryTopK({
        mode: "legacy",
        persona: persona.trim(),
        job: job.trim(),
        collectionId: buildInfo?.collection_id,
      })
      if (data) {
        setLegacyResults(data.results || [])
        setExpandedResults({})
        setShowN(Math.min(MIN_SHOW, (data.results || []).length || MIN_SHOW))
        showToast("success", "Search Complete", `Fetched ${data.results?.length || 0} sections.`)
      } else {
        return
      }
    } finally {
      setLoading((s) => ({ ...s, queryLegacy: false }))
    }
  }, [persona, job, applyFirstHit, showToast])

  // search: context
  const runContextQuery = useCallback(
    async (selectedText: string) => {
      if (!buildInfo) {
        showToast("info", "Build Required", "Finish the build to enable selection search.")
        return
      }
      const q = (selectedText || "").trim()
      if (!q) return
      try {
        setLoading((s) => ({ ...s, queryContext: true }))
        const data = await queryTopK({
          mode: "context",
          queryText: q,
          collectionId: buildInfo?.collection_id,
        })
        if (data) {
          setContextResults(data.results || [])
          setExpandedResults({})
          setShowN(Math.min(MIN_SHOW, (data.results || []).length || MIN_SHOW))
          if ((data.results || []).length) {
            showToast("success", "Context Results", `Fetched ${data.results.length} sections for your selection.`)
          }
        } else {
          return
        }

        if (!(data.results || []).length) {
          showToast("info", "No Matches", "No sections matched that selection. Try a longer or different phrase.")
        }
      } finally {
        setLoading((s) => ({ ...s, queryContext: false }))
      }
    },
    [buildInfo, applyFirstHit, showToast],
  )

  const openHit = useCallback(
    (hit: QueryHit) => {
      const itemKey = `${hit.file_name}-${hit.page}-${hit.rank}`
      setNavigatingItems((prev) => new Set(prev).add(itemKey))

      const bb = coerceBBox(hit.bbox)
      const pageNum = Number(hit.page) || 1
      setCurrentFileName(hit.file_name)
      setCurrentPdfUrl(pdfUrl(hit.file_name, hit.collection_id))
      setPageHint(pageNum)
      setBboxHint(bb)
      setAreasHint(coerceRects((hit as any).areas))
      setQuadsHint(coerceQuads((hit as any).quads))
      const match = uploadedFiles.find((f) => f.name === hit.file_name)
      if (match) setSelectedFile(match)

      // Show return button immediately if we have a query PDF source
      if (queryPdfSource) {
        // Update the source to mark it as from result click
        setQueryPdfSource((prev) => (prev ? { ...prev, fromResultClick: true } : null))
        // Show button immediately
        setShowReturnButton(true)
      }

      // Remove loading state after navigation
      setTimeout(() => {
        setNavigatingItems((prev) => {
          const newSet = new Set(prev)
          newSet.delete(itemKey)
          return newSet
        })
      }, 1000)
    },
    [uploadedFiles, queryPdfSource],
  )

  const openPdfManually = useCallback(
    (file: UploadedFile | File) => {
      if (!buildInfo) {
        showToast("info", "Build Required", "PDF preview will be available after the build is complete.")
        return
      }
      const name = (file as any).name as string
      setCurrentFileName(name)
      setCurrentPdfUrl(pdfUrl(name, buildInfo.collection_id))
      setPageHint(1)
      setBboxHint(undefined)
      setAreasHint(undefined)
      setQuadsHint(undefined)
      if ((file as any).id) setSelectedFile(file as UploadedFile)
      showToast("success", "PDF Opened", `Now viewing: ${name}`)
    },
    [buildInfo, showToast],
  )

  const toggleResultExpansion = useCallback((resultKey: string) => {
    setExpandedResults((prev) => ({ ...prev, [resultKey]: !prev[resultKey] }))
  }, [])

  const rawResults = useMemo(
    () => (mode === "legacy" ? legacyResults : contextResults),
    [mode, legacyResults, contextResults],
  )

  // dynamic "Show N" options based on actual results (max 10)
  const maxSelectable = useMemo(() => Math.min(MAX_SHOW, rawResults.length), [rawResults.length])
  useEffect(() => {
    const upper = maxSelectable
    if (upper > 0) {
      if (showN > upper) setShowN(upper)
      if (showN < Math.min(MIN_SHOW, upper)) setShowN(Math.min(MIN_SHOW, upper))
    }
  }, [maxSelectable])
  const showOptions = useMemo(() => {
    const end = maxSelectable
    if (end <= 0) return []
    const start = Math.min(MIN_SHOW, end)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [maxSelectable])

  const visibleResults = useMemo(() => rawResults.slice(0, showN), [rawResults, showN])
  const aiFeaturesEnabled = useMemo(() => buildInfo && rawResults.length > 0, [buildInfo, rawResults.length])

  const isQueryLoading = mode === "legacy" ? loading.queryLegacy : loading.queryContext

  // Handle AI features disabled click
  const handleAiFeaturesDisabledClick = useCallback(() => {
    showToast(
      "info",
      "🔒 AI Features Locked",
      "Get search results first by using Legacy mode (Persona + Job) or Context mode (select text in PDF).",
    )
  }, [showToast])

  const handleViewerSelection = useCallback(
    (payload: SelectionPayload) => {
      setLastSelectedText(payload.text)

      // Track if this selection is from a query PDF
      const isFromQueryPdf = queryFiles.some((q) => q.name === payload.fileName)
      if (isFromQueryPdf) {
        const sourceQueryPdf = queryFiles.find((q) => q.name === payload.fileName)
        if (sourceQueryPdf) {
          setQueryPdfSource({
            queryPdfId: sourceQueryPdf.id,
            queryPdfName: sourceQueryPdf.name,
            selectedText: payload.text,
            fromResultClick: false,
          })
        }
      }

      const c = consentRef.current
      if (c !== "granted") {
        setPendingSel(payload)
        setConsentOpen(true)
        return
      }

      showToast(
        "info",
        "Selection captured",
        `Page ${payload.page} • ${payload.text.slice(0, 80)}${payload.text.length > 80 ? "…" : ""}`,
      )
      if (mode === "context") runContextQuery(payload.text)
    },
    [setLastSelectedText, setPendingSel, setConsentOpen, runContextQuery, showToast, mode, queryFiles],
  )

  const onToggleMode = useCallback((next: Mode) => {
    setMode(next)
    setExpandedResults({})
  }, [])

  // Handle files coming from QueryDocModal
  const handleQueryFilesReady = useCallback(
    (files: File[]) => {
      if (!files?.length) {
        // No query PDF uploaded, auto-open first knowledge base PDF
        openFirstKnowledgeBasePdf()
        return
      }

      const now = new Date()
      const prepared: QueryFile[] = files.slice(0, 5).map((f) => ({
        id: Math.random().toString(36).slice(2),
        name: f.name,
        size: f.size,
        uploadedAt: now,
        url: URL.createObjectURL(f),
      }))
      setQueryFiles(prepared)

      // Open first query PDF immediately
      const first = prepared[0]
      if (first) {
        setCurrentFileName(first.name)
        setCurrentPdfUrl(first.url)
        setPageHint(1)
        setBboxHint(undefined)
        setAreasHint(undefined)
        setQuadsHint(undefined)
        setSelectedFile(null)
        showToast("success", "Opened Query PDF", `Now viewing: ${first.name}`)
      }
    },
    [openFirstKnowledgeBasePdf, showToast],
  )

  // Handle skip button in QueryDocModal
  const handleQueryModalSkip = useCallback(() => {
    setShowQueryModal(false)
    // Auto-open first knowledge base PDF when user skips
    openFirstKnowledgeBasePdf()
  }, [openFirstKnowledgeBasePdf])

  const openQueryPdf = useCallback((q: QueryFile) => {
    setCurrentFileName(q.name)
    setCurrentPdfUrl(q.url)
    setPageHint(1)
    setBboxHint(undefined)
    setAreasHint(undefined)
    setQuadsHint(undefined)
    setSelectedFile(null)
    setShowReturnButton(false) // Hide return button when manually opening query PDF
  }, [])

  const removeQueryFile = useCallback((id: string) => {
    setQueryFiles((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) {
        try {
          URL.revokeObjectURL(target.url)
        } catch {}
      }
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  const clearQueryFiles = useCallback(() => {
    try {
      queryFiles.forEach((q) => URL.revokeObjectURL(q.url))
    } catch {}
    setQueryFiles([])
    setQueryPdfSource(null)
    setShowReturnButton(false)
  }, [queryFiles])

  // AI feature handlers
  const handlePodcastGenerate = useCallback(
    (config: any) => {
      setShowPodcastGeneration(false)

      const episode = {
        id: `podcast-${Date.now()}`,
        title: `Podcast Summary: ${currentFileName || "Your Documents"}`,
        description: `AI-generated audio summary in ${config.language}`,
        audioUrl: config.audioUrl,
        generatedScript: config.generatedScript,
        podcastType: config.podcastStyle,
        transcript: config.transcript
          ? [{ id: "1", startTime: 0, endTime: 60, text: config.transcript, speaker: "AI Narrator" }]
          : undefined,
      }

      setCurrentPodcastEpisode(episode)
      setShowPodcast(true)

      showToast("success", "Podcast Generated", `Your ${config.language} podcast is ready to play!`)
    },
    [showToast, currentFileName],
  )

  // Consent handlers
  const handleConsentAccept = useCallback(
    (remember: boolean) => {
      if (remember) {
        sessionStorage.setItem("cr.selectionConsent", "granted")
        setConsent("granted")
      }
      suppressNextCancelRef.current = true
      setConsentOpen(false)
      if (pendingSel) {
        showToast("info", "Selection allowed", "We'll use your highlight to improve results.")
        runContextQuery(pendingSel.text)
        setPendingSel(null)
      }
    },
    [pendingSel, runContextQuery, showToast],
  )

  const handleConsentCancel = useCallback(
    (remember: boolean) => {
      if (suppressNextCancelRef.current) {
        suppressNextCancelRef.current = false
        return
      }
      if (remember) {
        sessionStorage.setItem("cr.selectionConsent", "denied")
        setConsent("denied")
      }
      setConsentOpen(false)
      setPendingSel(null)
      showToast("info", "Selection ignored", "We won't use your highlights unless you allow it.")
    },
    [showToast],
  )

  // Return to query PDF handler
  const handleReturnToQueryPdf = useCallback(() => {
    if (!queryPdfSource) return

    const queryPdf = queryFiles.find((q) => q.id === queryPdfSource.queryPdfId)
    if (queryPdf) {
      setCurrentFileName(queryPdf.name)
      setCurrentPdfUrl(queryPdf.url)
      setPageHint(1)
      setBboxHint(undefined)
      setAreasHint(undefined)
      setQuadsHint(undefined)
      setSelectedFile(null)
      setShowReturnButton(false) // Hide button when returning
      showToast("success", "Returned to Query PDF", `Now viewing: ${queryPdf.name}`)
    }
  }, [queryPdfSource, queryFiles, showToast])

  // Check if we should show the return button
  const shouldShowReturnButton =
    showReturnButton &&
    queryPdfSource &&
    queryPdfSource.fromResultClick &&
    !queryFiles.some((q) => q.name === currentFileName)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Welcome Modal */}
      <WelcomeModal />

      <header className="bg-white border-b shadow-sm flex-shrink-0 z-40">
        <div className="w-full px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Team Valhalla Logo" className="w-8 h-8 rounded shadow-sm object-contain" />
            <h1 className="text-xl font-semibold">Weave</h1>
          </div>
          <div className="flex items-center gap-3">
            {buildInfo && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                  Build Complete: <span className="font-mono">{buildInfo.collection_id}</span>
                </span>
              </div>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full flex overflow-hidden">
        {/* Left: Upload + Shelves */}
        <UploadPanel
          buildInfo={buildInfo}
          stagedFiles={stagedFiles}
          uploadedFiles={uploadedFiles}
          selectedFile={selectedFile}
          uploadDisabled={uploadDisabled}
          loadingBuild={loading.build}
          onFilesSelected={onFilesSelected}
          onStartBuild={startBuild}
          onReset={resetSession}
          onRemoveStaged={removeStaged}
          onOpenPdfManually={openPdfManually}
          queryFiles={queryFiles}
          currentOpenName={currentFileName}
          onOpenQueryPdf={openQueryPdf}
          onOpenQueryModal={() => setShowQueryModal(true)}
          onRemoveQueryFile={removeQueryFile}
          onClearQueryFiles={clearQueryFiles}
          onShowToast={showToast}
        />

        {/* Center: PDF Viewer */}
        <div className="flex-1 flex flex-col px-4">
          <div
            className={`bg-white border-b shadow-sm flex flex-col transition-all duration-300 ${isPdfSticky ? "sticky top-0 z-30" : "relative"}`}
            style={{ height: "calc(100vh - 80px)" }}
          >
            <PdfHeaderBar
              aiFeaturesEnabled={aiFeaturesEnabled}
              isPdfSticky={isPdfSticky}
              onToggleSticky={() => setIsPdfSticky(!isPdfSticky)}
              onOpenInsights={() => setShowInsights(true)}
              onOpenPodcast={() => setShowPodcastGeneration(true)}
              onOpenChat={() => setShowChat(true)}
              onOpenSummary={() => setShowSummary(true)}
              onAiFeaturesDisabledClick={handleAiFeaturesDisabledClick}
            />

            <div className="flex-1 p-3 relative overflow-hidden">
              {currentPdfUrl ? (
                <div className="h-full border border-gray-200 rounded-lg overflow-hidden shadow-inner relative">
                  {/* Return to Query PDF Button - Overlaid on Adobe PDF Viewer */}
                  {shouldShowReturnButton && (
                    <button
                      onClick={handleReturnToQueryPdf}
                      className="absolute top-3 left-16 z-50 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1.5 transition-all duration-200 animate-in fade-in slide-in-from-left-2"
                      title={`Return to ${queryPdfSource?.queryPdfName}`}
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span className="max-w-32 truncate">
                        Return to {queryPdfSource?.queryPdfName?.replace(/\.[^/.]+$/, "")}
                      </span>
                    </button>
                  )}

                  <AdobePdfViewer
                    key={`${mode}:${currentPdfUrl || currentFileName || "viewer"}`}
                    url={currentPdfUrl}
                    fileName={currentFileName || "document.pdf"}
                    page={pageHint ?? undefined}
                    bbox={bboxHint}
                    areas={areasHint}
                    quads={quadsHint}
                    mode="FULL_WINDOW"
                    showDownloadPDF={false}
                    showPrintPDF={false}
                    className="w-full h-full"
                    debug
                    onSelection={handleViewerSelection}
                    selectionDebounceMs={3000}
                  />
                </div>
              ) : (
                <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    {loading.build ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-12 w-12 text-[#ff0000] animate-spin" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium text-gray-900">Building Collection</h3>
                          <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                            {ADOBE_FACTS[factIndex]}
                          </p>
                          <div className="flex items-center justify-center space-x-1 mt-3">
                            {ADOBE_FACTS.slice(0, 6).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-colors ${i === factIndex % 6 ? "bg-[#ff0000]" : "bg-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Open</h3>
                          <p className="text-gray-600 text-sm">
                            {buildInfo ? (
                              <>
                                Choose a mode on the right. In{" "}
                                <span className="font-medium text-[#ff0000]">Context</span> mode, select text in the PDF
                                to search.
                              </>
                            ) : (
                              <>
                                Select PDFs and click <span className="font-medium text-[#ff0000]">Start Build</span>.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Search + Results */}
        <div className="w-80 bg-white border-l shadow-sm flex flex-col h-[calc(100vh-80px)] overflow-hidden">
          <SearchPanel
            mode={mode}
            onToggleMode={onToggleMode}
            rawResultsLen={rawResults.length}
            showOptions={showOptions}
            showN={showN}
            onChangeShowN={(n) => {
              const clamped = Math.max(Math.min(MIN_SHOW, maxSelectable), Math.min(maxSelectable, n))
              setShowN(clamped)
            }}
            isQueryLoading={isQueryLoading}
            persona={persona}
            setPersona={setPersona}
            job={job}
            setJob={setJob}
            personaDisabled={personaDisabled}
            buildInfo={buildInfo}
            onRunLegacy={runLegacyQuery}
            showTinyContextStatus={loading.queryContext}
          />

          <ResultsList
            mode={mode}
            isLoading={isQueryLoading}
            quotes={ADOBE_FACTS}
            quoteIndex={factIndex}
            visibleResults={visibleResults}
            rawResultsCount={rawResults.length}
            onOpen={openHit}
            navigatingItems={navigatingItems}
            expandedResults={expandedResults}
            toggleExpand={toggleResultExpansion}
            selectedText={lastSelectedText}
            buildInfo={buildInfo}
            onShowToast={showToast}
            showOptions={showOptions}
            showN={showN}
            onChangeShowN={(n) => {
              const clamped = Math.max(Math.min(MIN_SHOW, maxSelectable), Math.min(maxSelectable, n))
              setShowN(clamped)
            }}
          />
        </div>
      </div>

      <Toast show={toast.show} onClose={hideToast} type={toast.type} title={toast.title} message={toast.message} />

      <InsightsModal
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        selectedText={lastSelectedText}
        searchResults={rawResults}
      />

      <PodcastPlayer
        episode={
          currentPodcastEpisode || {
            id: "current-doc",
            title: `Podcast Summary: ${currentFileName || "Your Documents"}`,
            description: `AI-generated audio summary based on your ${mode === "legacy" ? "persona+job" : "selection"} search.`,
            audioUrl: undefined,
          }
        }
        isOpen={showPodcast}
        onClose={() => setShowPodcast(false)}
        autoPlay={!!currentPodcastEpisode}
      />

      <SelectionConsentDialog
        open={consentOpen}
        snippet={pendingSel?.text ?? ""}
        onAccept={handleConsentAccept}
        onCancel={handleConsentCancel}
      />

      <QueryDocModal
        open={!!buildInfo && showQueryModal}
        onClose={() => setShowQueryModal(false)}
        onFilesReady={handleQueryFilesReady}
        onSkip={handleQueryModalSkip}
        maxFiles={50}
      />

      <SummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        collectionId={buildInfo?.collection_id}
      />

      <ChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        selectedText={lastSelectedText}
        collectionId={buildInfo?.collection_id}
        searchResults={rawResults}
      />

      <PodcastGenerationModal
        isOpen={showPodcastGeneration}
        onClose={() => setShowPodcastGeneration(false)}
        onGenerate={handlePodcastGenerate}
        searchResultsCount={rawResults.length}
        searchResults={rawResults}
        selectedText={lastSelectedText}
        collectionId={buildInfo?.collection_id}
      />
    </div>
  )
}

export default function AppPage() {
  return (
    <OnboardingProvider>
      <AppPageContent />
    </OnboardingProvider>
  )
}
