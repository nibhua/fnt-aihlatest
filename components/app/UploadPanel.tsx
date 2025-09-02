"use client"

import * as React from "react"
import { cn } from "@/lib/utils" // if you have one; otherwise inline className joins
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload } from "lucide-react"
import { FileText, Trash2, Plus, RefreshCw } from "lucide-react"
import type { BuildResponse } from "@/lib/api"
import type { UploadedFile, QueryFile } from "@/types/app"

type Props = {
  // KB build & upload (existing)
  buildInfo: BuildResponse | null
  stagedFiles: File[]
  uploadedFiles: UploadedFile[]
  selectedFile: UploadedFile | null
  uploadDisabled: boolean
  loadingBuild: boolean
  onFilesSelected: (files: File[]) => void
  onStartBuild: () => void
  onReset: () => void
  onRemoveStaged: (name: string) => void
  onOpenPdfManually: (file: UploadedFile | File) => void

  // NEW: query shelf
  queryFiles?: QueryFile[]
  currentOpenName?: string | null
  onOpenQueryPdf?: (file: QueryFile) => void
  onOpenQueryModal?: () => void
  onRemoveQueryFile?: (id: string) => void
  onClearQueryFiles?: () => void

  // NEW: toast callback
  onShowToast?: (type: "success" | "error" | "info", title: string, message: string) => void
}

export function UploadPanel({
  buildInfo,
  stagedFiles,
  uploadedFiles,
  selectedFile,
  uploadDisabled,
  loadingBuild,
  onFilesSelected,
  onStartBuild,
  onReset,
  onRemoveStaged,
  onOpenPdfManually,

  // query shelf
  queryFiles = [],
  currentOpenName,
  onOpenQueryPdf,
  onOpenQueryModal,
  onRemoveQueryFile,
  onClearQueryFiles,
  onShowToast,
}: Props) {
  const [activeShelf, setActiveShelf] = React.useState<"kb" | "query">("kb")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleLocalPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) onFilesSelected(files)
    e.target.value = ""
  }

  const handleQueryTabClick = () => {
    if (!buildInfo) {
      onShowToast?.("info", "Build Required", "Query PDFs will be available after upload and build complete! 📚")
      return
    }
    setActiveShelf("query")
  }

  return (
    <aside className="w-80 bg-white border-r shadow-sm flex-shrink-0 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-gray-900">Upload Documents</h2>

        {/* Segmented control - using exact same design as Context/Legacy */}
        <div className="mt-3 relative inline-flex rounded-lg overflow-hidden border border-gray-300 shadow-sm bg-gray-100 p-0.5 w-full">
          {/* Sliding indicator */}
          <div
            className={`absolute top-0.5 bottom-0.5 bg-[#ff0000] rounded-md transition-all duration-300 ease-in-out ${
              activeShelf === "kb" ? "left-0.5 right-1/2" : "left-1/2 right-0.5"
            }`}
          />

          {/* Knowledge Base button */}
          <button
            className={`relative z-10 px-3 py-1.5 text-xs font-medium transition-all duration-200 flex-1 ${
              activeShelf === "kb" ? "text-white" : "text-gray-700 hover:text-gray-900"
            }`}
            onClick={() => setActiveShelf("kb")}
          >
            Knowledge Base
          </button>

          {/* Query PDFs button */}
          <button
            className={`relative z-10 px-3 py-1.5 text-xs font-medium transition-all duration-200 flex-1 ${
              !buildInfo
                ? "text-gray-400 cursor-pointer"
                : activeShelf === "query"
                  ? "text-white"
                  : "text-gray-700 hover:text-gray-900"
            }`}
            onClick={handleQueryTabClick}
            title={!buildInfo ? "Complete knowledge base build to enable Query PDFs" : ""}
          >
            Query PDFs
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {activeShelf === "kb" ? (
          <div className="p-4 space-y-4">
            {/* Staging area */}
            <Card>
              <CardContent className="pt-4">
                <div
                  className={cn(
                    "rounded border-2 border-dashed p-4 text-center",
                    uploadDisabled ? "opacity-60 pointer-events-none" : "hover:bg-gray-50",
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2 text-sm text-gray-600">Drag & drop PDFs here or click to browse</div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  hidden
                  onChange={handleLocalPick}
                />

                {stagedFiles.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">Ready to build</div>
                    <ul className="max-h-28 overflow-auto space-y-1">
                      {stagedFiles.map((f) => (
                        <li
                          key={f.name}
                          className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1"
                        >
                          <span className="truncate">{f.name}</span>
                          <button
                            className="text-gray-500 hover:text-red-600"
                            onClick={() => onRemoveStaged(f.name)}
                            aria-label="Remove staged"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" onClick={onStartBuild} disabled={uploadDisabled || stagedFiles.length === 0}>
                    {loadingBuild ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Start Build
                  </Button>
                  <Button size="sm" variant="outline" onClick={onReset}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* KB list */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">Uploaded Files</div>
              <ul className="space-y-1 overflow-y-auto overflow-x-hidden">
                {uploadedFiles.length === 0 ? (
                  <li className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 italic">
                    Uploaded Files will be visible here after the build is completed and you can easily navigate between
                    the listed PDFs by clicking on them.
                  </li>
                ) : (
                  uploadedFiles.map((f) => {
                    const isActive = currentOpenName === f.name
                    return (
                      <li
                        key={f.id}
                        className={cn(
                          "flex items-center justify-between rounded px-2 text-sm cursor-pointer transition-all duration-300 ease-in-out h-8 min-h-[2rem]",
                          isActive
                            ? "bg-[#ff0000] text-white shadow-md"
                            : "hover:bg-gray-50 hover:shadow-sm text-gray-800",
                        )}
                        onClick={() => onOpenPdfManually(f)}
                        title={f.name}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                          <FileText
                            className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-gray-500")}
                          />
                          <span className={cn("truncate text-xs", isActive ? "font-medium text-white" : "")}>
                            {f.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span
                            className={cn("text-xs whitespace-nowrap", isActive ? "text-white/80" : "text-gray-400")}
                          >
                            {Math.round(f.size / 1024)} KB
                          </span>
                        </div>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          </div>
        ) : (
          // Query shelf
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Query PDFs</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={onOpenQueryModal}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
                <Button size="sm" variant="ghost" onClick={onClearQueryFiles} disabled={!queryFiles.length}>
                  <Trash2 className="w-4 h-4 mr-1" /> Clear
                </Button>
              </div>
            </div>

            {queryFiles.length === 0 ? (
              <div className="text-xs text-gray-500">
                No query PDFs yet. Click <span className="font-medium">Add</span> to open up to 50 PDFs you want to
                analyze against the knowledge base.
              </div>
            ) : (
              <ul className="space-y-1 max-h-[58vh] overflow-y-auto overflow-x-hidden">
                {queryFiles.map((q) => {
                  const isActive = currentOpenName === q.name
                  return (
                    <li
                      key={q.id}
                      className={cn(
                        "flex items-center justify-between rounded px-2 text-sm cursor-pointer transition-all duration-300 ease-in-out h-8 min-h-[2rem]",
                        isActive
                          ? "bg-[#ff0000] text-white shadow-md"
                          : "hover:bg-gray-50 hover:shadow-sm text-gray-800",
                      )}
                    >
                      <button
                        className={cn(
                          "flex-1 flex items-center gap-2 min-w-0 text-left overflow-hidden",
                          isActive ? "text-white" : "text-gray-800",
                        )}
                        onClick={() => onOpenQueryPdf?.(q)}
                        title={q.name}
                      >
                        <FileText className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-gray-500")} />
                        <span className={cn("truncate text-xs", isActive ? "font-medium text-white" : "")}>
                          {q.name}
                        </span>
                      </button>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={cn("text-xs whitespace-nowrap", isActive ? "text-white/80" : "text-gray-400")}>
                          {Math.round(q.size / 1024)} KB
                        </span>
                        <button
                          className={cn(
                            "transition-colors duration-200 flex-shrink-0",
                            isActive ? "text-white/80 hover:text-white" : "text-gray-400 hover:text-red-600",
                          )}
                          onClick={() => onRemoveQueryFile?.(q.id)}
                          aria-label="Remove query file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
