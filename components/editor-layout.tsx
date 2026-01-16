import type React from "react"

interface EditorLayoutProps {
  toolbar: React.ReactNode
  editor: React.ReactNode
  preview: React.ReactNode
}

export default function EditorLayout({ toolbar, editor, preview }: EditorLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar Toolbar */}
      <aside className="w-64 bg-card border-r border-border overflow-y-auto">{toolbar}</aside>

      {/* Main Editor */}
      <main className="flex-1 flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col border-r border-border bg-background">{editor}</div>

        {/* Preview */}
        <div className="w-full md:w-96 bg-card border-l border-border overflow-y-auto">{preview}</div>
      </main>
    </div>
  )
}
