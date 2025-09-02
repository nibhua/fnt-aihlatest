import Navigation from "@/components/navigation"
import AdobeDisplay from "@/components/adobe-display"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="h-screen bg-white relative overflow-hidden">
      <Navigation />

      {/* Particle side */}
      <div className="fixed top-0 right-0 w-1/2 h-full z-0">
        <AdobeDisplay />
      </div>

      {/* Content side */}
      <main className="pt-0 relative z-10 h-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-8 h-full">
          <div className="grid lg:grid-cols-[45%_55%] gap-8 items-center h-full">
            {/* Left column */}
            <div className="space-y-8">
              <div className="space-y-6 mt-16">
                {/* Hackathon Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-sm font-medium rounded-full animate-pulse">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  Adobe 2K25 Hackathon
                </div>

                {/* Hero Heading */}
                <h1 className="text-5xl lg:text-6xl font-light text-gray-900 leading-tight tracking-tight">
                  WE BUILD
                  <br />
                  EXPERIENCES,
                  <br />
                  <span className="text-red-600">NOT JUST PRODUCTS.</span>
                </h1>

                {/* Mission (moved up for impact) */}
                <p className="text-gray-600 text-lg leading-relaxed max-w-md italic -mt-5">Just like Adobe ;)</p>
              </div>

              {/* CTA */}
              <div className="space-y-6 -mt-4">
                <p className="text-gray-600 text-lg leading-relaxed max-w-md -mt-2.5 mb-4 mt-[-30px]">
                  ~ Team Valhalla
                </p>

                <Link href="/app">
                  <Button
                    size="lg"
                    className="bg-red-600 border-2 border-red-600 text-white hover:bg-gray-900 hover:border-gray-900 hover:text-white transition-all duration-300 px-8 py-3 rounded-full shadow-lg"
                  >
                    VIEW OUR SUBMISSION
                  </Button>
                </Link>
              </div>

              {/* Footer */}
              <div className="pt-3">
                <p className="text-s text-gray-500 uppercase tracking-wider font-semibold -mt-5">
                  Powered by Adobe's embedded PDF API with our AI Intelligence layer
                </p>
                <div className="w-16 h-px bg-gray-900 mt-2"></div>
              </div>
            </div>

            {/* Right column reserved for particles */}
            <div className="relative h-full -mt-8" />
          </div>
        </div>
      </main>
    </div>
  )
}
