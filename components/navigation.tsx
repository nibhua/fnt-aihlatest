"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="relative backdrop-blur-md bg-white/10 border-b border-white/20 rounded-b-xl">
        {/* Red gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-red-500/20"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-4 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Team Valhalla Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold text-gray-900">Valhalla</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="https://youtu.be/6U3UmPejv4Y" className="text-gray-600 hover:text-red-600 transition-colors">
                Demo Video
              </Link>
              <Link href="#pitch" className="text-gray-600 hover:text-red-600 transition-colors">
                Pitch Deck
              </Link>
              <Link href="/changelog" className="text-gray-600 hover:text-red-600 transition-colors">
                Changelog
              </Link>
            </div>

            <Button variant="ghost" size="sm" className="md:hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
