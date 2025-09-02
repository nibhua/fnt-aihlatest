"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

// Use environment variable for API base URL to call backend directly
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api"

export default function DebugApiPage() {
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const testEndpoint = async (endpoint: string, options: RequestInit = {}) => {
    setIsLoading(true)
    const result = {
      endpoint,
      timestamp: new Date().toISOString(),
      status: 'pending',
      data: null,
      error: null,
      isLogData: false
    }

    try {
      console.log(`🔍 Testing: ${API_BASE}${endpoint}`)
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      
      result.status = response.status.toString()
      
      const responseText = await response.text()
      
      // Check if response looks like a log entry
      if (responseText.includes('PERFORMANCE') || 
          responseText.includes('REQUEST') || 
          responseText.includes('RESPONSE') ||
          responseText.includes('| INFO |') ||
          responseText.includes('| ERROR |')) {
        result.isLogData = true
        result.data = responseText
      } else {
        // Try to parse as JSON
        try {
          result.data = JSON.parse(responseText)
        } catch {
          result.data = responseText
        }
      }
      
    } catch (error) {
      result.status = 'error'
      result.error = error instanceof Error ? error.message : String(error)
    }

    setResults(prev => [result, ...prev])
    setIsLoading(false)
  }

  const testHealth = () => testEndpoint('/')
  
  const testChatSession = () => {
    const formData = new FormData()
    formData.append('collection_id', 'test')
    testEndpoint('/chat/sessions', {
      method: 'POST',
      body: formData,
    })
  }

  const testBuildCollection = () => {
    const formData = new FormData()
    formData.append('files', new Blob(['fake pdf content'], { type: 'application/pdf' }), 'test.pdf')
    testEndpoint('/collections/build', {
      method: 'POST',
      body: formData,
    })
  }

  const clearResults = () => setResults([])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Debug Tool</h1>
        <p className="text-muted-foreground">
          Test API endpoints to check if you're receiving proper responses or log data.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          API Base: <code className="bg-muted px-1 rounded">{API_BASE}</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Endpoints</CardTitle>
            <CardDescription>
              Click to test different API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={testHealth} 
              disabled={isLoading}
              className="w-full"
            >
              Test Health Check (/)
            </Button>
            
            <Button 
              onClick={testChatSession} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Test Chat Session (/chat/sessions)
            </Button>
            
            <Button 
              onClick={testBuildCollection} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Test Build Collection (/collections/build)
            </Button>
            
            <Button 
              onClick={clearResults} 
              variant="destructive"
              className="w-full"
            >
              Clear Results
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What to Look For</CardTitle>
            <CardDescription>
              Signs that indicate problems
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">❌ Problem</Badge>
              <span className="text-sm">Response contains log entries (PERFORMANCE, REQUEST, etc.)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">❌ Problem</Badge>
              <span className="text-sm">Response is not valid JSON</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">✅ Good</Badge>
              <span className="text-sm">Response is valid JSON with expected structure</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">✅ Good</Badge>
              <span className="text-sm">Status code is 200-299</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            {results.length} test(s) completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-muted-foreground">No tests run yet. Click a test button above.</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={result.isLogData ? "destructive" : "default"}>
                        {result.isLogData ? "LOG DATA" : "API RESPONSE"}
                      </Badge>
                      <Badge variant={result.status === 'error' ? "destructive" : "outline"}>
                        {result.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {result.endpoint}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {result.error && (
                    <div className="mb-2">
                      <Badge variant="destructive" className="mb-1">Error</Badge>
                      <p className="text-sm text-red-600">{result.error}</p>
                    </div>
                  )}
                  
                  <Textarea
                    value={typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                    readOnly
                    className="font-mono text-xs"
                    rows={8}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}