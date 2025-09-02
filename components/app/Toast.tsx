"use client"

import { useEffect } from "react"
import { CheckCircle, AlertCircle, X } from "lucide-react"

export type ToastType = "success" | "error" | "info"

export function Toast({
  show,
  onClose,
  type = "success",
  title,
  message,
}: {
  show: boolean
  onClose: () => void
  type?: ToastType
  title: string
  message: string
}) {
  useEffect(() => {
    if (!show) return
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [show, onClose])

  if (!show) return null

  const Icon = type === "success" ? CheckCircle : AlertCircle
  const bg =
    type === "success"
      ? "bg-green-50 border-green-200"
      : type === "error"
      ? "bg-red-50 border-red-200"
      : "bg-blue-50 border-blue-200"

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`${bg} border rounded-lg shadow-lg p-4 transition-all duration-300`}>
        <div className="flex items-start space-x-3">
          <Icon className={`w-5 h-5 ${type === "success" ? "text-green-500" : type === "error" ? "text-red-500" : "text-blue-500"}`} />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
