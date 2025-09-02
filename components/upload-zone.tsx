'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadZoneProps {
  onFilesUploaded: (files: File[]) => void
  maxFiles?: number
  maxFileSize?: number // in bytes
  accept?: string
  disabled?: boolean
  className?: string
}

export function UploadZone({
  onFilesUploaded,
  maxFiles = 50,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  accept = '.pdf',
  disabled = false,
  className
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFiles = useCallback((files: File[]): { valid: File[], errors: string[] } => {
    const valid: File[] = []
    const errors: string[] = []

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
      return { valid, errors }
    }

    files.forEach(file => {
      // Check file type
      if (!file.type.includes('pdf')) {
        errors.push(`${file.name}: Only PDF files are allowed`)
        return
      }

      // Check file size
      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024))
        errors.push(`${file.name}: File size exceeds ${maxSizeMB}MB limit`)
        return
      }

      // Check for empty files
      if (file.size === 0) {
        errors.push(`${file.name}: File is empty`)
        return
      }

      valid.push(file)
    })

    return { valid, errors }
  }, [maxFiles, maxFileSize])

  const handleFiles = useCallback(async (files: File[]) => {
    if (disabled) return

    setError(null)
    setIsUploading(true)

    try {
      const { valid, errors } = validateFiles(files)

      if (errors.length > 0) {
        setError(errors.join(', '))
        setIsUploading(false)
        return
      }

      if (valid.length > 0) {
        // Simulate upload delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500))
        onFilesUploaded(valid)
      }
    } catch (err) {
      setError('An error occurred while processing files')
    } finally {
      setIsUploading(false)
    }
  }, [disabled, validateFiles, onFilesUploaded])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [disabled, handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
    
    // Reset input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault()
      handleClick()
    }
  }, [disabled, handleClick])

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:ring-offset-2",
          {
            // Default state
            "border-gray-300 hover:border-gray-400 bg-white": !isDragOver && !disabled && !error,
            // Drag over state
            "border-[#ff0000] bg-red-50 scale-[1.02]": isDragOver && !disabled,
            // Disabled state
            "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60": disabled,
            // Error state
            "border-red-300 bg-red-50": error && !isDragOver,
            // Uploading state
            "border-[#ff0000] bg-red-50": isUploading
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Upload PDF files"
        aria-describedby={error ? "upload-error" : undefined}
      >
        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ff0000]"></div>
              <span className="text-sm font-medium text-gray-700">Processing files...</span>
            </div>
          </div>
        )}

        {/* Upload icon */}
        <div className={cn(
          "mx-auto mb-4 transition-transform duration-200",
          isDragOver && !disabled ? "scale-110" : "scale-100"
        )}>
          {error ? (
            <AlertCircle className="h-12 w-12 text-red-400" />
          ) : (
            <Upload className={cn(
              "h-12 w-12",
              isDragOver && !disabled ? "text-[#ff0000]" : "text-gray-400"
            )} />
          )}
        </div>

        {/* Main text */}
        <div className="space-y-2">
          <p className={cn(
            "text-sm font-medium",
            error ? "text-red-600" : 
            isDragOver && !disabled ? "text-[#ff0000]" : "text-gray-700"
          )}>
            {isUploading ? "Processing your files..." :
             error ? "Upload failed" :
             isDragOver ? "Drop your PDF files here" :
             "Drag and drop PDF files here"}
          </p>
          
          {!isUploading && !error && (
            <>
              <p className="text-sm text-gray-600">
                or{" "}
                <span className={cn(
                  "font-medium transition-colors",
                  disabled ? "text-gray-400" : "text-[#ff0000] hover:text-[#e60000]"
                )}>
                  browse files
                </span>
              </p>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>PDF files only • Max {maxFiles} files</p>
                <p>Up to {Math.round(maxFileSize / (1024 * 1024))}MB per file</p>
              </div>
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled}
          aria-hidden="true"
        />
      </div>

      {/* Error message */}
      {error && (
        <div 
          id="upload-error"
          className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md"
          role="alert"
        >
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Upload Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
