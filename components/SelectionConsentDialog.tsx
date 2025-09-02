'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

type Props = {
  open: boolean
  snippet: string
  onAccept: (remember: boolean) => void
  onCancel: (remember: boolean) => void
}

export default function SelectionConsentDialog({
  open,
  snippet,
  onAccept,
  onCancel,
}: Props) {
  const [remember, setRemember] = React.useState(true)

  // NEW: track if we’re closing because of an Accept click.
  const closingByAcceptRef = React.useRef(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // If the modal is closing due to Accept, do NOT treat it as cancel.
        if (!v) {
          if (closingByAcceptRef.current) {
            closingByAcceptRef.current = false
            return
          }
          // User hit ESC / clicked backdrop: treat as cancel WITHOUT remembering.
          onCancel(false)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Use your selection?</DialogTitle>
          <DialogDescription>
            We can send the text you highlighted to your local search to find matching sections.
            Nothing is uploaded outside your server.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
          <div className="font-medium mb-1">Preview</div>
          <div className="line-clamp-4">{snippet}</div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Checkbox
            id="remember-choice"
            checked={remember}
            onCheckedChange={(v) => setRemember(Boolean(v))}
          />
          <label htmlFor="remember-choice" className="text-sm">
            Don’t ask me again
          </label>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onCancel(remember)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              closingByAcceptRef.current = true
              onAccept(remember)
            }}
          >
            Allow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
