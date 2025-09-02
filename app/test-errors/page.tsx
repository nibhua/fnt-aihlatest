"use client"

import { ErrorTest } from "@/components/ErrorTest"
import { Toaster } from "@/components/ui/toaster"

export default function TestErrorsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Error Handling Test</h1>
        <p className="text-muted-foreground">
          This page demonstrates the new error handling system with toast notifications for different error types.
        </p>
      </div>
      
      <div className="space-y-8">
        <ErrorTest />
      </div>
      <Toaster />
    </div>
  )
}
