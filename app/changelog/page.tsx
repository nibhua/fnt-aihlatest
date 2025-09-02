
"use client"

import Navigation from "@/components/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function ChangelogPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white relative">
      <Navigation />

      {/* Back to Home Button */}
      <div className="fixed top-20 left-6 z-40">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1200 2000" preserveAspectRatio="xMidYMid slice">
          {/* Main circuit paths */}
          <defs>
            <linearGradient id="flowGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="30%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#dc2626" stopOpacity="1" />
              <stop offset="100%" stopColor="transparent" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="-100 0;400 0;-100 0"
                dur="3s"
                repeatCount="indefinite"
                begin={`${scrollY * 0.01}s`}
              />
            </linearGradient>

            <linearGradient id="flowGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="30%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#dc2626" stopOpacity="1" />
              <stop offset="100%" stopColor="transparent" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="-100 0;400 0;-100 0"
                dur="3s"
                repeatCount="indefinite"
                begin={`${scrollY * 0.01 + 1}s`}
              />
            </linearGradient>

            <linearGradient id="verticalFlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="30%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#dc2626" stopOpacity="1" />
              <stop offset="100%" stopColor="transparent" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="0 -50;0 150;0 -50"
                dur="2s"
                repeatCount="indefinite"
                begin={`${scrollY * 0.005}s`}
              />
            </linearGradient>
          </defs>

          {/* Circuit line from 1a to 1b with flowing current */}
          <path d="M 200 400 Q 400 450 600 500 T 1000 600" stroke="url(#flowGradient1)" strokeWidth="3" fill="none" />
          <path
            d="M 200 400 Q 400 450 600 500 T 1000 600"
            stroke="#ef4444"
            strokeWidth="1"
            fill="none"
            opacity="0.3"
            strokeDasharray="5,5"
          />

          {/* Circuit line from 1b to Final Backend with flowing current */}
          <path d="M 200 800 Q 500 850 800 900 T 1000 1000" stroke="url(#flowGradient2)" strokeWidth="3" fill="none" />
          <path
            d="M 200 800 Q 500 850 800 900 T 1000 1000"
            stroke="#ef4444"
            strokeWidth="1"
            fill="none"
            opacity="0.3"
            strokeDasharray="5,5"
          />

          {/* Vertical connecting lines with flowing current */}
          <path d="M 150 350 L 150 450" stroke="url(#verticalFlow)" strokeWidth="2" fill="none" />
          <path d="M 150 350 L 150 450" stroke="#ef4444" strokeWidth="1" fill="none" opacity="0.3" />

          <path d="M 150 750 L 150 850" stroke="url(#verticalFlow)" strokeWidth="2" fill="none" />
          <path d="M 150 750 L 150 850" stroke="#ef4444" strokeWidth="1" fill="none" opacity="0.3" />

          <circle cx="200" cy="400" r="6" fill="#ef4444">
            <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="600" cy="500" r="6" fill="#ef4444">
            <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" begin="0.5s" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <circle cx="1000" cy="600" r="6" fill="#ef4444">
            <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" begin="1s" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="1s" />
          </circle>
          <circle cx="200" cy="800" r="6" fill="#ef4444">
            <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" begin="1.5s" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="1.5s" />
          </circle>
          <circle cx="800" cy="900" r="6" fill="#ef4444">
            <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" begin="2s" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="2s" />
          </circle>
          <circle cx="1000" cy="1000" r="6" fill="#ef4444">
            <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" begin="2.5s" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="2.5s" />
          </circle>

          {/* Small circuit elements with enhanced animation */}
          <rect x="148" y="380" width="4" height="8" fill="#ef4444" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <rect x="148" y="780" width="4" height="8" fill="#ef4444" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
          </rect>
          <rect x="598" y="480" width="4" height="8" fill="#ef4444" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
          </rect>
          <rect x="798" y="880" width="4" height="8" fill="#ef4444" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" begin="0.9s" />
          </rect>
        </svg>
      </div>

      <main className="pt-20 relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-light text-gray-900 mb-8">Changelog for AH2K25 Project</h1>

            <p className="text-gray-600 mb-12">
              This document outlines the incremental improvements and changes across three versions of the AH2K25
              project: Version 1a, Version 1b, and the Final Backend.
            </p>

            <section className="mb-16 relative">
              <div className="absolute -left-8 top-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-3xl font-light text-red-600 mb-6 border-l-4 border-red-200 pl-6">
                Final Backend Overview
              </h2>

              <p className="mb-6 text-gray-700">
                The Final Backend is a microservices-based platform with unified middleware, robust timeouts, and
                observability hooks. Tasks 1a and 1b were independent efforts; we leveraged both sets of work to deliver
                this production-ready backend.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Architecture</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Microservices with clear boundaries and APIs.</li>
                    <li>
                      Unified middleware in <code className="bg-gray-100 px-1 rounded">backend/core</code>:
                      <code className="bg-gray-100 px-1 rounded">middleware.py</code>,
                      <code className="bg-gray-100 px-1 rounded">exception_handler.py</code>,
                      <code className="bg-gray-100 px-1 rounded">error_handler.py</code>,
                      <code className="bg-gray-100 px-1 rounded">timeout_middleware.py</code>.
                    </li>
                    <li>Request timeouts across services to prevent hangs.</li>
                    <li>Observability-ready: structured logs/metrics compatible with Grafana/Prometheus/Loki.</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h3 className="text-xl font-medium text-gray-900 mb-3">Key Services</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><code className="bg-gray-100 px-1 rounded">chat_service</code>, <code className="bg-gray-100 px-1 rounded">collection_summary_service</code>, <code className="bg-gray-100 px-1 rounded">insights_service</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">persona</code>, <code className="bg-gray-100 px-1 rounded">podcast_service</code>, <code className="bg-gray-100 px-1 rounded">relevance_service</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">chunk_builder</code>, <code className="bg-gray-100 px-1 rounded">embeddings</code>, <code className="bg-gray-100 px-1 rounded">indexer</code>, <code className="bg-gray-100 px-1 rounded">snippets</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">core</code> (logging + middleware)</li>
                  </ul>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-medium text-gray-900 mb-3">Operational Readiness</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Strict timeouts via <code className="bg-gray-100 px-1 rounded">timeout_middleware.py</code>.</li>
                  <li>Global exception and error handling with consistent JSON responses.</li>
                  <li>Metrics/logs structured for drop-in dashboards and alerts (Grafana/Prometheus/Loki).</li>
                  <li>Tests for error/timeout handling in backend validate resilience.</li>
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-medium text-gray-900 mb-3">File Structure (Final Backend)</h3>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border-l-4 border-red-100 text-black">{`├── LOGGING_README.md
├── README.md
├── chat_service/
├── chunk_builder/
├── collection_summary_service/
├── core/
├── embeddings/
├── indexer/
├── insights_service/
├── lexicons/
├── main.py
├── outline_extractor/
├── persona/
├── podcast_service/
├── relevance_service/
├── scripts/
├── snippets/
├── uploads/
├── vector_store/
└── web_static/`}</pre>
              </div>

              <div className="mb-2">
                <h3 className="text-xl font-medium text-gray-900 mb-3">Foundations from Prior Tasks</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-white rounded-lg border border-gray-100">
                    <h4 className="text-lg font-medium text-gray-800 mb-2">Task 1a (Independent)</h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700">
                      <li>PDF heading extraction with heuristics + XGBoost.</li>
                      <li>PyMuPDF (fitz) text extraction and heading level assignment.</li>
                      <li>Title extraction and multilingual support.</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-100">
                    <h4 className="text-lg font-medium text-gray-800 mb-2">Task 1b (Independent)</h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700">
                      <li>RAG pipeline with embeddings, retrieval, and cross-encoder reranking.</li>
                      <li>Persona-aware filtering and dynamic exclude lists.</li>
                      <li>Standardized I/O and analysis of relevant sections.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
