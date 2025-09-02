// lib/useAdobeSDK.ts
'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    AdobeDC?: any
  }
}

export function useAdobeSDK() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // If already loaded, just mark ready.
    if (window.AdobeDC) {
      setReady(true)
      return
    }

    const scriptId = 'adobe-pdf-embed-sdk'
    if (document.getElementById(scriptId)) return

    const s = document.createElement('script')
    s.id = scriptId
    s.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js'
    s.async = true
    s.onload = () => {
      // The SDK dispatches "adobe_dc_view_sdk.ready" after it finishes initializing.
      document.addEventListener('adobe_dc_view_sdk.ready', () => setReady(true), { once: true })
    }
    document.body.appendChild(s)
  }, [])

  return ready
}
