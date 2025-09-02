// components/AdobePdfViewer.tsx
'use client'

import { useEffect, useId, useRef } from 'react'
import { useAdobeSDK } from '@/lib/useAdobeSDK'

type EmbedMode = 'FULL_WINDOW' | 'SIZED_CONTAINER' | 'IN_LINE' | 'LIGHT_BOX'

export type AdobePdfViewerProps = {
  url: string
  fileName: string
  /** 1-based page number */
  page?: number
  /** bbox: [x0, y0, x1, y1] in PDF points; origin = bottom-left */
  bbox?: number[] | string[]
  /** optional section rectangles for this page (BL origin) */
  areas?: Array<number[] | string[]>
  /** optional section quads for this page (BL origin), each 8 numbers */
  quads?: Array<number[] | string[]>

  /** Fired after user finishes a selection and we read it from the viewer */
  onSelection?: (payload: {
    text: string
    page: number
    bbox?: number[]
    quads?: number[][]
    fileName: string
  }) => void
  /** Idle time after selection (ms) before we emit onSelection. Default 3000 */
  selectionDebounceMs?: number

  mode?: EmbedMode
  focusOnRendering?: boolean
  showDownloadPDF?: boolean
  showPrintPDF?: boolean
  onReady?: () => void
  className?: string
  debug?: boolean
  /** for debugging: draw a demo highlight when bbox is missing */
  forceDemoHighlight?: boolean
}

function toNums(a: any[]): number[] | null {
  if (!Array.isArray(a)) return null
  const out = a.map(v => (typeof v === 'string' ? parseFloat(v) : v))
  return out.every(n => Number.isFinite(n)) ? (out as number[]) : null
}
function toBBoxNums(b: any): number[] | null {
  if (!Array.isArray(b) || b.length !== 4) return null
  return toNums(b)
}
function toQuadNums(q: any): number[] | null {
  if (!Array.isArray(q) || q.length !== 8) return null
  return toNums(q)
}
function unionRect(a: [number, number, number, number], b: [number, number, number, number]) {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])] as [
    number,
    number,
    number,
    number
  ]
}

export default function AdobePdfViewer({
  url,
  fileName,
  page,
  bbox,
  areas,
  quads,
  onSelection,
  selectionDebounceMs = 3000,
  mode = 'FULL_WINDOW',
  focusOnRendering = true,
  showDownloadPDF = false,
  showPrintPDF = false,
  onReady,
  className,
  debug = true,
  forceDemoHighlight = false
}: AdobePdfViewerProps) {
  const ready = useAdobeSDK()
  const divId = useId()

  const viewRef = useRef<any>(null)
  const apisRef = useRef<any>(null)
  const previewHandleRef = useRef<any>(null)

  const docKeyRef = useRef<string>('') // cancel stale async when doc changes
  const lastAnnIdRef = useRef<string | null>(null)
  const annEventsSetupRef = useRef(false)
  const isJumpingRef = useRef(false)

  // selection debounce timer + last payload guard
  const selTimerRef = useRef<number | null>(null)
  const lastSelKeyRef = useRef<string>('')

  // NEW: always call the latest onSelection (prevents stale closures)
  const onSelectionRef = useRef<typeof onSelection>(onSelection)
  useEffect(() => {
    onSelectionRef.current = onSelection
  }, [onSelection])

  const log = (...args: any[]) => {
    if (debug) console.log('[AdobeViewer]', ...args)
  }
  const warn = (...args: any[]) => {
    if (debug) console.warn('[AdobeViewer]', ...args)
  }
  const error = (...args: any[]) => console.error('[AdobeViewer]', ...args)

  // stable file id (must match WA target.source)
  const fileId = (() => {
    try {
      let h = 0,
        s = `${url}::${fileName}`
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
      return `cr_${h.toString(16)}`
    } catch {
      return `cr_${Date.now()}`
    }
  })()

  /** Add ngrok bypass automatically */
  const withNgrokBypass = (src: string): string => {
    try {
      const u = new URL(src)
      if (u.hostname.includes('ngrok')) {
        if (!u.searchParams.has('ngrok-skip-browser-warning')) {
          u.searchParams.set('ngrok-skip-browser-warning', '1')
        }
      }
      return u.toString()
    } catch {
      return src.includes('ngrok') && !src.includes('ngrok-skip-browser-warning')
        ? `${src}${src.includes('?') ? '&' : '?'}ngrok-skip-browser-warning=1`
        : src
    }
  }

  /** Fetch PDF as bytes with diagnostics */
  const fetchPdfBytes = async (src: string): Promise<ArrayBuffer> => {
    const finalUrl = withNgrokBypass(src)
    log('FETCH', finalUrl)

    let res: Response
    try {
      res = await fetch(finalUrl, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.1'
        }
      })
    } catch (e) {
      error('fetch failed:', e)
      throw e
    }

    const ct = (res.headers.get('content-type') || '').toLowerCase()
    log('response', { ok: res.ok, status: res.status, contentType: ct })

    if (!ct.includes('pdf') && !ct.includes('octet-stream')) {
      try {
        const clone = res.clone()
        const text = await clone.text()
        const head = text.slice(0, 200)
        warn('WARNING: response does not look like a PDF. Viewer may fail to render.', { head })
        if (head.startsWith('<!DOCTYPE') || head.startsWith('<html') || head.includes('ngrok')) {
          throw new Error(`Not a PDF (received HTML). status=${res.status}`)
        }
      } catch {
        // best effort
      }
    }

    const buf = await res.arrayBuffer()
    const sig = new TextDecoder().decode(new Uint8Array(buf.slice(0, 4)))
    if (sig !== '%PDF') {
      warn('First 4 bytes are not %PDF; the worker may throw t5::corrupt_data.', { sig })
    }
    return buf
  }

  /** resolve viewer APIs */
  const resolveApis = async (): Promise<any | null> => {
    const v: any = viewRef.current
    const ph: any = previewHandleRef.current
    try {
      if (ph?.getAPIs) {
        log('resolveApis: previewHandle.getAPIs()')
        return await ph.getAPIs()
      }
      if (v?.getAPIs) {
        log('resolveApis: view.getAPIs()')
        return await v.getAPIs()
      }
      if (v?.getAPIsPromise) {
        log('resolveApis: view.getAPIsPromise()')
        return await v.getAPIsPromise()
      }
    } catch (e) {
      log('resolveApis error:', e)
    }
    log('resolveApis: APIs not ready yet')
    return null
  }

  /** page height (for Y flip) — may be null (ok) */
  const getPageHeight = async (apis: any, pageNum: number): Promise<number | null> => {
    try {
      const info = await (apis.getPageInfo ? apis.getPageInfo({ pageNumber: pageNum }) : apis.getPageInfo?.(pageNum))
      const h = info?.height ?? info?.pageInfo?.height ?? null
      log('getPageHeight:', { pageNum, height: h })
      return typeof h === 'number' && Number.isFinite(h) ? h : null
    } catch (e) {
      log('getPageHeight error:', e)
      return null
    }
  }

  const normalizeRect = (b?: number[] | null) => {
    if (!Array.isArray(b) || b.length !== 4) return null
    const [x0, y0, x1, y1] = b
    return [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)] as [
      number,
      number,
      number,
      number
    ]
  }

  const toBLRect = (h: number | null, b: [number, number, number, number]) => {
    if (!h) return b
    const [xmin, ymin, xmax, ymax] = b
    const height = ymax - ymin
    const looksTopLeft = ymax < h * 0.5 || (height < 40 && ymax < h * 0.8)
    return looksTopLeft ? ([xmin, h - ymax, xmax, h - ymin] as [number, number, number, number]) : b
  }

  const rectFromQuad = (q: number[]) => {
    // q = [xul,yul, xur,yur, xll,yll, xlr,ylr]
    const xs = [q[0], q[2], q[4], q[6]]
    const ys = [q[1], q[3], q[5], q[7]]
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] as [number, number, number, number]
  }

  const computeGotoFromGeom = async (apis: any, pageNum: number, b?: number[], a?: number[][], q?: number[][]) => {
    // Prefer bbox; else first area; else first quad's bbox
    let rect = normalizeRect(b || undefined)
    if (!rect && a?.length) {
      const a0 = toBBoxNums(a[0])
      if (a0) rect = normalizeRect(a0)
    }
    if (!rect && q?.length) {
      const q0 = toQuadNums(q[0])
      if (q0) rect = normalizeRect(rectFromQuad(q0))
    }
    if (!apis || !rect || pageNum < 1) return { left: 0, top: 0 }
    const h = await getPageHeight(apis, pageNum)
    const [, , , ymax] = toBLRect(h, rect)
    const pad = 12
    const pos = {
      left: Math.max(0, Math.floor(rect[0] - pad)),
      top: h ? Math.max(0, Math.floor(h - ymax - pad)) : 0
    }
    log('computeGotoFromGeom:', { pageNum, h, pos, rect })
    return pos
  }

  const tryNavigate = async (apis: any, target: number, left = 0, top = 0) => {
    if (!apis) return false
    const setPage = (apis as any).setCurrentPage || (apis as any).setPageNumber
    if (typeof setPage === 'function') {
      try {
        log('setCurrentPage:', target)
        await setPage(target)
        return true
      } catch (e) {
        log('setCurrentPage failed:', e)
      }
    }
    if (typeof apis.gotoLocation === 'function') {
      try {
        log('gotoLocation(positional):', target, left, top)
        await apis.gotoLocation(target, left, top)
        return true
      } catch (e2) {
        log('gotoLocation(positional) failed:', e2)
      }
    }
    log('No navigation method succeeded.')
    return false
  }

  const addAnyHighlight = async (
    pageNum: number,
    options: { bbox?: number[] | null; areas?: number[][] | null; quads?: number[][] | null }
  ) => {
    if (!previewHandleRef.current) {
      log('SKIP highlight: no previewHandle')
      return
    }
    if (!pageNum || pageNum < 1) {
      log('SKIP highlight: invalid page', pageNum)
      return
    }

    const apis = apisRef.current || (apisRef.current = await resolveApis())
    if (!apis) {
      log('SKIP highlight: APIs not ready')
      return
    }

    // Normalize inputs
    const b = (options.bbox && toBBoxNums(options.bbox)) || null
    const areasN: number[][] = (options.areas || []).map(r => toBBoxNums(r)).filter(Boolean) as number[][]
    const quadsN: number[][] = (options.quads || []).map(q => toQuadNums(q)).filter(Boolean) as number[][]

    const h = (await getPageHeight(apis, pageNum)) || 0

    // Build final quad list
    let finalQuads: number[][] = []
    if (quadsN.length) {
      // Quads provided → flip if needed
      finalQuads = quadsN.map(q => {
        const r = rectFromQuad(q)
        const rBL = toBLRect(h, r)
        if (rBL === r) return q
        // flip Y for each (x,y): y' = h - y
        return [q[0], h - q[1], q[2], h - q[3], q[4], h - q[5], q[6], h - q[7]]
      })
    } else if (areasN.length) {
      finalQuads = areasN
        .map(r => {
          const n = normalizeRect(r)
          if (!n) return [] as unknown as number[]
          const [xmin, ymin, xmax, ymax] = toBLRect(h, n)
          return [xmin, ymax, xmax, ymax, xmin, ymin, xmax, ymin]
        })
        .filter(q => Array.isArray(q) && q.length === 8)
    } else if (b) {
      const n = normalizeRect(b)
      if (n) {
        const [xmin, ymin, xmax, ymax] = toBLRect(h, n)
        finalQuads = [[xmin, ymax, xmax, ymax, xmin, ymin, xmax, ymin]]
      }
    } else if (forceDemoHighlight) {
      const top = Math.max(0, h - 140)
      finalQuads = [[72, top + 60, 372, top + 60, 72, top, 372, top]]
    } else {
      log('SKIP highlight: no geometry available')
      return
    }

    // Filter out any malformed quads defensively
    finalQuads = finalQuads.filter(q => Array.isArray(q) && q.length === 8 && q.every(Number.isFinite))

    if (!finalQuads.length) {
      log('SKIP highlight: finalQuads empty after normalization')
      return
    }

    // Safety cap
    const MAX_QUADS = 120
    if (finalQuads.length > MAX_QUADS) {
      finalQuads = finalQuads.slice(0, MAX_QUADS)
      warn(`quads capped at ${MAX_QUADS}`)
    }

    // Compute overall bounding box
    let bb: [number, number, number, number] | null = null
    for (const q of finalQuads) {
      const r = rectFromQuad(q)
      bb = bb ? unionRect(bb, r) : r
    }
    if (!bb) {
      log('SKIP highlight: failed to compute bounding box from quads')
      return
    }

    let annMgr: any
    try {
      annMgr = await previewHandleRef.current.getAnnotationManager()
    } catch (e) {
      log('getAnnotationManager() failed:', e)
      return
    }

    if (!annEventsSetupRef.current) {
      try {
        annEventsSetupRef.current = true
        const listenOn = [
          'ANNOTATION_ADDED',
          'ANNOTATION_UPDATED',
          'ANNOTATION_DELETED',
          'ANNOTATION_SELECTED',
          'ANNOTATION_CLICKED'
        ]
        annMgr.registerEventListener?.((ev: any) => log('ANN_EVENT:', ev?.type, ev?.data), { listenOn })
      } catch (e) {
        log('registerEventListener failed (ok to ignore):', e)
      }
    }

    if (lastAnnIdRef.current) {
      try {
        await annMgr.deleteAnnotations?.({ annotationIds: [lastAnnIdRef.current] })
      } catch {}
      lastAnnIdRef.current = null
    }

    const id = `cr-hit-${Date.now()}`
    const nowIso = new Date().toISOString()

    const quadPointsFlat = finalQuads.flat()
    if (!quadPointsFlat.length || quadPointsFlat.length % 8 !== 0) {
      log('SKIP highlight: quadPointsFlat invalid length', quadPointsFlat.length)
      return
    }

    const waHighlight = {
      '@context': ['https://www.w3.org/ns/anno.jsonld', 'https://comments.acrobat.com/ns/anno.jsonld'],
      type: 'Annotation',
      id,
      bodyValue: 'Auto highlight',
      motivation: 'commenting',
      target: {
        source: fileId,
        selector: {
          type: 'AdobeAnnoSelector',
          subtype: 'highlight',
          node: { index: pageNum - 1 },
          quadPoints: quadPointsFlat,
          boundingBox: [bb[0], bb[1], bb[2], bb[3]],
          opacity: 0.4
        }
      },
      creator: { type: 'Person', name: 'ConnectReader' },
      created: nowIso,
      modified: nowIso
    }

    try {
      log('add highlight TRY → WA highlight', { quads: finalQuads.length })
      await annMgr.addAnnotations([waHighlight])
      lastAnnIdRef.current = id
      log('add highlight SUCCESS → WA highlight', 'id=', id)
      try {
        await annMgr.selectAnnotation?.(id)
      } catch {}
    } catch (e) {
      log('add highlight FAILED → WA highlight', e)
    }
  }

  const jumpAndHighlight = async (
    p?: number,
    opts?: {
      bbox?: number[] | string[] | null
      areas?: Array<number[] | string[]> | null
      quads?: Array<number[] | string[]> | null
    }
  ) => {
    if (!p || p < 1 || isJumpingRef.current) return
    isJumpingRef.current = true
    try {
      const apis = apisRef.current || (apisRef.current = await resolveApis())
      if (!apis) return

      const bnums = opts?.bbox ? toBBoxNums(opts.bbox) : null
      const areasN = (opts?.areas || []).map(r => toBBoxNums(r)).filter(Boolean) as number[][]
      const quadsN = (opts?.quads || []).map(q => toQuadNums(q)).filter(Boolean) as number[][]

      const pos = await computeGotoFromGeom(
        apis,
        p,
        bnums ?? undefined,
        areasN.length ? areasN : undefined,
        quadsN.length ? quadsN : undefined
      )
      const ok = await tryNavigate(apis, p, pos.left, pos.top)
      await addAnyHighlight(p, { bbox: bnums, areas: areasN, quads: quadsN })
      if (ok) log('jump success + highlight')
    } finally {
      isJumpingRef.current = false
    }
  }

  const scheduleJump = (
    target?: number | null,
    opts?: {
      bbox?: number[] | string[] | null
      areas?: Array<number[] | string[]> | null
      quads?: Array<number[] | string[]> | null
    }
  ) => {
    if (!target || target < 1) return
    let attempts = 0
    const maxAttempts = 24
    const docKeyAtCall = docKeyRef.current
    const tick = async () => {
      if (docKeyRef.current !== docKeyAtCall) return
      attempts += 1
      const apis = apisRef.current || (apisRef.current = await resolveApis())
      log(`jump attempt #${attempts} → page ${target}`, apis ? '(apis ready)' : '(apis not ready)')
      if (apis) {
        await jumpAndHighlight(target, opts)
        return
      }
      if (attempts < maxAttempts) setTimeout(tick, attempts < 6 ? 120 : attempts < 12 ? 200 : 300)
      else log('jump gave up after', maxAttempts, 'attempts')
    }
    tick()
  }

  // --- selection capture helpers ---
  const makeSelKey = (text: string, pageNum: number) => `${pageNum}|${text.trim().slice(0, 200)}`

  /** Use the proper APIs surface to read selected text; rely on PREVIEW_SELECTION_END for page info */
  const handlePreviewSelectionEnd = async (event?: any) => {
    try {
      const apis = apisRef.current || (apisRef.current = await resolveApis())
      if (!apis) return

      let text = ''
      try {
        const result = await apis.getSelectedContent?.()
        if (result && typeof result.data === 'string') {
          text = result.data
        } else if (typeof result === 'string') {
          text = result
        }
      } catch (e) {
        log('apis.getSelectedContent() failed:', e)
        try {
          const result2 = await previewHandleRef.current?.getSelectedContent?.()
          if (result2?.data && typeof result2.data === 'string') text = result2.data
        } catch {}
      }

      text = (text || '').trim()
      if (!text) return

      const startPage =
        Number(event?.data?.startPageNumber) ||
        Number(event?.data?.pageNumber) ||
        Number(event?.data?.page) ||
        1

      // Debounce & dedupe
      const key = makeSelKey(text, startPage)
      if (key === lastSelKeyRef.current) return
      lastSelKeyRef.current = key

      if (selTimerRef.current) window.clearTimeout(selTimerRef.current)
      selTimerRef.current = window.setTimeout(() => {
        onSelectionRef.current?.({
          text,
          page: startPage,
          fileName
        })
      }, Math.max(0, selectionDebounceMs))
    } catch (e) {
      log('handlePreviewSelectionEnd error:', e)
    }
  }
  // -------------------------------

  // Mount / render
  useEffect(() => {
    if (!ready) return
    const clientId = process.env.NEXT_PUBLIC_ADOBE_EMBED_API_KEY
    if (!clientId) {
      error('NEXT_PUBLIC_ADOBE_EMBED_API_KEY is missing')
      return
    }

    log('MOUNT props →', { url, fileName, page, bbox, areas, quads })

    viewRef.current = null
    apisRef.current = null
    previewHandleRef.current = null
    lastAnnIdRef.current = null
    annEventsSetupRef.current = false
    isJumpingRef.current = false
    lastSelKeyRef.current = ''
    if (selTimerRef.current) {
      window.clearTimeout(selTimerRef.current)
      selTimerRef.current = null
    }
    docKeyRef.current = `${url}|${fileName}`

    const AdobeDC: any = (window as any).AdobeDC
    const view = new AdobeDC.View({ clientId, divId })
    viewRef.current = view
    log('create view', { mode, fileName, fileId })

    const previewConfig: any = {
      embedMode: mode,
      focusOnRendering,
      showDownloadPDF,
      showPrintPDF,
      enableAnnotationAPIs: true,
      includePDFAnnotations: true,
      annotationUIConfig: {
        showToolbar: true,
        showCommentsPanel: false,
        showToolsOnTextSelection: false,
        downloadWithAnnotations: false,
        printWithAnnotations: false
      }
    }

    // Always preview via BYTES (avoids CORS/range issues)
    const filePromise = fetchPdfBytes(url)

    view
      .previewFile(
        {
          content: { promise: filePromise }, // BYTES MODE
          metaData: { fileName, id: fileId }
        },
        previewConfig
      )
      .then(async (handle: any) => {
        if (docKeyRef.current !== `${url}|${fileName}`) return
        log('previewFile() resolved')
        previewHandleRef.current = handle
        apisRef.current = await resolveApis()

        // Register events (viewer + file preview events)
        try {
          const cbType = AdobeDC.View.Enum.CallbackType.EVENT_LISTENER
          const Events = AdobeDC.View.Enum.Events
          const FilePreviewEvents = AdobeDC.View.Enum.FilePreviewEvents

          const listener = async (event: any) => {
            if (docKeyRef.current !== `${url}|${fileName}`) return
            log('event:', event?.type)

            if (
              event?.type === 'VIEWER_READY' ||
              event?.type === 'PDF_VIEWER_READY' ||
              event?.type === Events.APP_RENDERING_DONE ||
              event?.type === Events.PAGE_VIEW ||
              event?.type === Events.ZOOM_LEVEL_CHANGED
            ) {
              if (!apisRef.current) apisRef.current = await resolveApis()
              scheduleJump(page, { bbox, areas, quads })
            }

            if (event?.type === FilePreviewEvents.PREVIEW_SELECTION_END) {
              await handlePreviewSelectionEnd(event)
            }
          }

          view.registerCallback(cbType, listener, {
            enablePDFAnalytics: false,
            enableAnnotationEvents: true,
            enableFilePreviewEvents: true,
            listenOn: [
              Events.APP_RENDERING_DONE,
              Events.PAGE_VIEW,
              Events.ZOOM_LEVEL_CHANGED,
              'PDF_VIEWER_READY',
              'VIEWER_READY',
              FilePreviewEvents.PREVIEW_SELECTION_END
            ]
          })
        } catch (e) {
          log('registerCallback error:', e)
        }

        scheduleJump(page, { bbox, areas, quads })
        onReady?.()
      })
      .catch((e: any) => error('previewFile error:', e))

    return () => {
      log('unmount viewer')
      apisRef.current = null
      previewHandleRef.current = null
      lastAnnIdRef.current = null
      annEventsSetupRef.current = false
      isJumpingRef.current = false
      if (selTimerRef.current) {
        window.clearTimeout(selTimerRef.current)
        selTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, url, fileName, mode, focusOnRendering, showDownloadPDF, showPrintPDF, onReady, divId, debug])

  // respond to updates (same doc)
  useEffect(() => {
    log('props changed →', { page, bbox, areas, quads })
    scheduleJump(page, { bbox, areas, quads })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, bbox, areas, quads])

  return <div id={divId} className={className} />
}
