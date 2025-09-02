"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface OnboardingContextType {
  showWelcome: boolean
  setShowWelcome: (show: boolean) => void
  markWelcomeSeen: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem("weave-welcome-seen")
    if (!hasSeenWelcome) {
      setShowWelcome(true)
    }
  }, [])

  const markWelcomeSeen = () => {
    localStorage.setItem("weave-welcome-seen", "true")
    setShowWelcome(false)
  }

  return (
    <OnboardingContext.Provider
      value={{
        showWelcome,
        setShowWelcome,
        markWelcomeSeen,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
