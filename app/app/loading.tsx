import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff0000]" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading WEAVE
        </h2>
        <p className="text-gray-600">
          Preparing your intelligent document viewer...
        </p>
      </div>
    </div>
  )
}
