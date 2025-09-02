// lib/error-handler.ts
  // Unified error handling that broadcasts to the app's custom <Toast /> via window event.
  // We intentionally do NOT use shadcn's toast here to avoid two toast systems.

  export interface ApiError {
    error: {
      type: string
      message: string
      status_code: number
      timestamp: number
      request_id?: string
      details?: string
      validation_errors?: any[]
    }
  }

  export interface ErrorToastConfig {
    title: string
    description: string
    variant?: "default" | "destructive"
    duration?: number
  }

  /** Broadcast to your custom <Toast /> via a window event */
  function broadcastFallbackToast(detail: {
    title: string
    message: string
    type: "success" | "error" | "info"
    duration?: number
  }) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cr:toast", { detail }))
    }
  }

  // Error type mapping for user-friendly messages
  const ERROR_MESSAGES: Record<string, ErrorToastConfig> = {
    TimeoutError: {
      title: "Request Timeout",
      description: "The operation took too long to complete. Please try again or check your connection.",
      variant: "destructive",
      duration: 8000,
    },
    RateLimitError: {
      title: "Rate Limit Exceeded",
      description: "Too many requests. Please wait a moment before trying again.",
      variant: "destructive",
      duration: 6000,
    },
    NetworkError: {
      title: "Network Error",
      description: "Unable to connect to the server. Please check your internet connection.",
      variant: "destructive",
      duration: 8000,
    },
    GeminiAPIError: {
      title: "AI Service Error",
      description: "The AI service is temporarily unavailable. Please try again later.",
      variant: "destructive",
      duration: 6000,
    },
    ValidationError: {
      title: "Invalid Input",
      description: "Please check your input and try again.",
      variant: "destructive",
      duration: 5000,
    },
    ResourceNotFoundError: {
      title: "Not Found",
      description: "The requested resource could not be found.",
      variant: "destructive",
      duration: 5000,
    },
    PermissionError: {
      title: "Access Denied",
      description: "You don't have permission to perform this action.",
      variant: "destructive",
      duration: 5000,
    },
    InternalServerError: {
      title: "Server Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
      duration: 6000,
    },
    "400": {
      title: "Bad Request",
      description: "The request was invalid. Please check your input.",
      variant: "destructive",
      duration: 5000,
    },
    "403": {
      title: "Access Denied",
      description: "You don't have permission to perform this action.",
      variant: "destructive",
      duration: 5000,
    },
    "404": {
      title: "Not Found",
      description: "The requested resource could not be found.",
      variant: "destructive",
      duration: 5000,
    },
    "408": {
      title: "Request Timeout",
      description: "The request timed out. Please try again.",
      variant: "destructive",
      duration: 8000,
    },
    "422": {
      title: "Validation Error",
      description: "Please check your input and try again.",
      variant: "destructive",
      duration: 5000,
    },
    "429": {
      title: "Too Many Requests",
      description: "Rate limit exceeded. Please wait before trying again.",
      variant: "destructive",
      duration: 6000,
    },
    "500": {
      title: "Server Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
      duration: 6000,
    },
    "502": {
      title: "Service Unavailable",
      description: "The AI service is temporarily unavailable. Please try again later.",
      variant: "destructive",
      duration: 6000,
    },
    "503": {
      title: "Service Unavailable",
      description: "The service is temporarily unavailable. Please check your connection and try again.",
      variant: "destructive",
      duration: 8000,
    },
  }

  // Operation-specific overrides
  const OPERATION_ERROR_MESSAGES: Record<string, Record<string, ErrorToastConfig>> = {
    buildCollection: {
      TimeoutError: {
        title: "Build Timeout",
        description:
          "Document processing is taking longer than expected. This may happen with large files. Please try again.",
        variant: "destructive",
        duration: 10000,
      },
      NetworkError: {
        title: "Build Failed",
        description:
          "Build request could not reach the backend. Please ensure your backend is active (or restart it) and try again.",
        variant: "destructive",
        duration: 9000,
      },
      "502": {
        title: "Build Failed",
        description:
          "Backend is unavailable (502). Please start or restart your backend, then try the build again.",
        variant: "destructive",
        duration: 9000,
      },
      "503": {
        title: "Build Failed",
        description:
          "Backend is inactive or overloaded (503). Please ensure it is running and try again.",
        variant: "destructive",
        duration: 9000,
      },
    },
    queryTopK: {
      TimeoutError: {
        title: "Search Timeout",
        description: "Search is taking longer than expected. Please try a more specific query.",
        variant: "destructive",
        duration: 8000,
      },
      RateLimitError: {
        title: "Search Rate Limited",
        description: "Too many searches. Please wait a moment before searching again.",
        variant: "destructive",
        duration: 6000,
      },
    },
    generateInsights: {
      TimeoutError: {
        title: "Insight Generation Timeout",
        description: "Generating insights is taking longer than expected. Please try again.",
        variant: "destructive",
        duration: 8000,
      },
      GeminiAPIError: {
        title: "AI Service Unavailable",
        description: "The AI service is temporarily unavailable. Please try again later.",
        variant: "destructive",
        duration: 6000,
      },
    },
    generatePodcast: {
      TimeoutError: {
        title: "Podcast Generation Timeout",
        description: "Podcast generation is taking longer than expected. Please try again.",
        variant: "destructive",
        duration: 10000,
      },
      GeminiAPIError: {
        title: "AI Service Unavailable",
        description: "The AI service is temporarily unavailable. Please try again later.",
        variant: "destructive",
        duration: 6000,
      },
    },
    analyzeRelevance: {
      TimeoutError: {
        title: "Analysis Timeout",
        description: "Relevance analysis is taking longer than expected. Please try again.",
        variant: "destructive",
        duration: 8000,
      },
      GeminiAPIError: {
        title: "AI Service Unavailable",
        description: "The AI service is temporarily unavailable. Please try again later.",
        variant: "destructive",
        duration: 6000,
      },
    },
    generateCollectionSummary: {
      TimeoutError: {
        title: "Summary Generation Timeout",
        description: "Summary generation is taking longer than expected. Please try again.",
        variant: "destructive",
        duration: 10000,
      },
      GeminiAPIError: {
        title: "AI Service Unavailable",
        description: "The AI service is temporarily unavailable. Please try again later.",
        variant: "destructive",
        duration: 6000,
      },
    },
  }

  /** Parse error response from backend */
  export function parseApiError(response: Response, responseText?: string): ApiError | null {
    try {
      if (responseText) {
        const parsed = JSON.parse(responseText)
        if (parsed.error) return parsed
      }
    } catch {
      // ignore parse errors
    }

    return {
      error: {
        type: "HTTPError",
        message: `HTTP ${response.status}: ${response.statusText}`,
        status_code: response.status,
        timestamp: Date.now(),
        details: responseText || "Unknown error",
      },
    }
  }

  /** Build a toast config from an error (with operation-specific overrides) */
  export function getErrorToastConfig(error: ApiError | Error | string, operation?: string): ErrorToastConfig {
    let errorType = ""
    let statusCode = ""

    if (typeof error === "string") {
      const lower = error.toLowerCase()
      if (lower.includes("timeout")) errorType = "TimeoutError"
      else if (lower.includes("rate limit") || lower.includes("quota")) errorType = "RateLimitError"
      else if (lower.includes("network") || lower.includes("connection") || lower.includes("failed to fetch"))
        errorType = "NetworkError"
      else if (lower.includes("gemini") || lower.includes("ai")) errorType = "GeminiAPIError"
      else
        return { title: "Error", description: error, variant: "destructive", duration: 5000 }
    } else if ("error" in (error as any)) {
      const apiError = error as ApiError
      errorType = apiError.error.type
      statusCode = String(apiError.error.status_code)
    } else {
      const e = error as Error
      const msg = (e.message || "").toLowerCase()
      if (msg.includes("timeout")) errorType = "TimeoutError"
      else if (msg.includes("rate limit") || msg.includes("quota")) errorType = "RateLimitError"
      else if (msg.includes("network") || msg.includes("connection") || msg.includes("failed to fetch"))
        errorType = "NetworkError"
      else if (msg.includes("gemini") || msg.includes("ai")) errorType = "GeminiAPIError"
      else
        return { title: "Error", description: e.message, variant: "destructive", duration: 5000 }
    }

    if (operation && OPERATION_ERROR_MESSAGES[operation]?.[errorType]) {
      return OPERATION_ERROR_MESSAGES[operation][errorType]
    }
    if (operation && statusCode && OPERATION_ERROR_MESSAGES[operation]?.[statusCode]) {
      return OPERATION_ERROR_MESSAGES[operation][statusCode]
    }
    if (ERROR_MESSAGES[errorType]) return ERROR_MESSAGES[errorType]
    if (statusCode && ERROR_MESSAGES[statusCode]) return ERROR_MESSAGES[statusCode]

    return {
      title: "Error",
      description: typeof error === "string" ? error : "An unexpected error occurred",
      variant: "destructive",
      duration: 5000,
    }
  }

  /** Show error via the app's custom <Toast /> */
  export function showErrorToast(error: ApiError | Error | string, operation?: string): void {
    const config = getErrorToastConfig(error, operation)
    const type: "success" | "error" | "info" =
      (config.variant || "destructive") === "destructive" ? "error" : "info"

    broadcastFallbackToast({
      title: config.title,
      message: config.description,
      type,
      duration: config.duration,
    })
  }

  /** Fetch with error handling (throws) */
  export async function fetchWithErrorHandling(
    url: string,
    options: RequestInit = {},
    operation?: string,
  ): Promise<Response> {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(150000) })
      if (!response.ok) {
        const text = await response.text()
        const apiError = parseApiError(response, text)
        if (apiError) {
          showErrorToast(apiError, operation)
          throw new Error(apiError.error.message)
        } else {
          showErrorToast(`HTTP ${response.status}: ${response.statusText}`, operation)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }
      return response
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "TimeoutError" || error.message.includes("timeout")) {
          showErrorToast("TimeoutError", operation)
          throw new Error("Request timed out")
        } else if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("TypeError: Failed to fetch")
        ) {
          showErrorToast("NetworkError", operation)
          throw new Error("Network connection failed")
        }
      }
      throw error
    }
  }

  /** Fetch that shows toast but does NOT throw */
  export async function fetchWithToastOnly(
    url: string,
    options: RequestInit = {},
    operation?: string,
  ): Promise<{ success: boolean; response?: Response; error?: string }> {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(150000) })
      if (!response.ok) {
        const text = await response.text()
        const apiError = parseApiError(response, text)
        if (apiError) {
          showErrorToast(apiError, operation)
          return { success: false, error: apiError.error.message }
        } else {
          showErrorToast(`HTTP ${response.status}: ${response.statusText}`, operation)
          return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
        }
      }
      return { success: true, response }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "TimeoutError" || error.message.includes("timeout")) {
          showErrorToast("TimeoutError", operation)
          return { success: false, error: "Request timed out" }
        } else if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("TypeError: Failed to fetch")
        ) {
          showErrorToast("NetworkError", operation)
          return { success: false, error: "Network connection failed" }
        }
      }
      showErrorToast(error as Error | string, operation)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  /** Wrapper for arbitrary API calls that should show toast on error */
  export async function apiCallWithErrorHandling<T>(apiCall: () => Promise<T>, operation?: string): Promise<T> {
    try {
      return await apiCall()
    } catch (error) {
      showErrorToast(error as Error | string, operation)
      throw error
    }
  }
