// components/editor/TopBar.tsx
"use client"

import { Download, Save } from "lucide-react"
import { Button } from "@/components/ui/button"

type TopBarProps = {
  title: string
  saving?: boolean
  message?: string
  onSave?: () => void
  onDownload?: () => void
}

export function TopBar({
  title,
  saving,
  message,
  onSave,
  onDownload,
}: TopBarProps) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground mb-1">
            Documents / Client proposals
          </p>
          <h1 className="text-base md:text-lg font-semibold truncate">
            {title}
          </h1>
          {message && (
            <p className="text-xs text-muted-foreground mt-1">{message}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onDownload}
            className="hidden sm:inline-flex"
          >
            <Download className="mr-2 h-4 w-4" />
            Download DOCX
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={onSave}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </header>
  )
}
