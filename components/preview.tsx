"use client"

interface PreviewProps {
  content: string
}

export default function Preview({ content }: PreviewProps) {
  return (
    <div className="p-6 space-y-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-card-foreground">Preview</h2>
        <p className="text-sm text-muted-foreground">Live formatting preview</p>
      </div>

      <div className="bg-background border border-border rounded-lg p-6 prose prose-sm max-w-none">
        <div className="text-foreground whitespace-pre-wrap break-words text-sm leading-relaxed">{content}</div>
      </div>

      <div className="space-y-2 pt-4">
        <button className="w-full bg-primary text-primary-foreground rounded-lg py-2 px-4 font-medium hover:opacity-90 transition-opacity">
          Download PDF
        </button>
        <button className="w-full bg-secondary text-secondary-foreground rounded-lg py-2 px-4 font-medium hover:opacity-90 transition-opacity">
          Export DOCX
        </button>
      </div>
    </div>
  )
}
