"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showErrorToast } from "@/lib/error-handler"

export function ErrorTest() {
  const [isLoading, setIsLoading] = useState(false)

  const testTimeoutError = () => {
    showErrorToast("TimeoutError", "testOperation")
  }

  const testRateLimitError = () => {
    showErrorToast("RateLimitError", "testOperation")
  }

  const testNetworkError = () => {
    showErrorToast("NetworkError", "testOperation")
  }

  const testGeminiError = () => {
    showErrorToast("GeminiAPIError", "testOperation")
  }

  const testValidationError = () => {
    showErrorToast("ValidationError", "testOperation")
  }

  const testBuildTimeout = () => {
    showErrorToast("TimeoutError", "buildCollection")
  }

  const testSearchRateLimit = () => {
    showErrorToast("RateLimitError", "queryTopK")
  }

  const testInsightTimeout = () => {
    showErrorToast("TimeoutError", "generateInsights")
  }

  const testPodcastTimeout = () => {
    showErrorToast("TimeoutError", "generatePodcast")
  }

  const testSummaryTimeout = () => {
    showErrorToast("TimeoutError", "generateCollectionSummary")
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Error Handling Test</CardTitle>
        <CardDescription>
          Test different error types and their toast messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={testTimeoutError}
            variant="outline"
            disabled={isLoading}
          >
            Test Timeout Error
          </Button>
          
          <Button 
            onClick={testRateLimitError}
            variant="outline"
            disabled={isLoading}
          >
            Test Rate Limit Error
          </Button>
          
          <Button 
            onClick={testNetworkError}
            variant="outline"
            disabled={isLoading}
          >
            Test Network Error
          </Button>
          
          <Button 
            onClick={testGeminiError}
            variant="outline"
            disabled={isLoading}
          >
            Test Gemini API Error
          </Button>
          
          <Button 
            onClick={testValidationError}
            variant="outline"
            disabled={isLoading}
          >
            Test Validation Error
          </Button>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Operation-Specific Errors:</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={testBuildTimeout}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Build Timeout
            </Button>
            
            <Button 
              onClick={testSearchRateLimit}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Search Rate Limit
            </Button>
            
            <Button 
              onClick={testInsightTimeout}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Insight Timeout
            </Button>
            
            <Button 
              onClick={testPodcastTimeout}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Podcast Timeout
            </Button>
            
            <Button 
              onClick={testSummaryTimeout}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Summary Timeout
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
