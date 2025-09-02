"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { UploadZone } from "@/components/upload-zone"
import { FileText } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  onFilesReady: (files: File[]) => void
  onSkip?: () => void
  maxFiles?: number
}

export default function QueryDocModal({ open, onClose, onFilesReady, onSkip, maxFiles = 50 }: Props) {
  const [files, setFiles] = React.useState<File[]>([])

  const handleSkip = React.useCallback(() => {
    onFilesReady([]) // Pass empty array to trigger default behavior
    setFiles([])
    if (onSkip) {
      onSkip()
    } else {
      onClose()
    }
  }, [onFilesReady, onSkip, onClose])

  const handleOpen = React.useCallback(() => {
    onFilesReady(files)
    setFiles([])
    onClose()
  }, [files, onFilesReady, onClose])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Open a "Query PDF"</DialogTitle>
          <DialogDescription>
            Upload any PDFs you'd like to analyze alongside your collection. These files won't be added to the knowledge
            base — they'll simply be opened for contextual lookups.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <UploadZone onFilesUploaded={(fs) => setFiles(fs.slice(0, maxFiles))} maxFiles={maxFiles} className="mb-2" />
          {files.length > 0 && (
            <div className="rounded border bg-gray-50 p-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Selected</div>
              <ul className="space-y-1 max-h-32 overflow-auto">
                {files.map((f) => (
                  <li key={f.name} className="text-xs text-gray-600 flex items-center">
                    <FileText className="w-3 h-3 mr-2" />
                    {f.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="mt-3">
          <Button variant="outline" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={handleOpen} disabled={files.length === 0}>
            Open
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
