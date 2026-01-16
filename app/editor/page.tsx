"use client"

import { useState } from "react"
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
} from "@/components/editor/Sidebar"
import { TopBar } from "@/components/editor/TopBar"
import { DocumentEditor } from "@/components/editor/DocumentEditor"
import { AIToolbar } from "@/components/editor/AIToolbar"
import { RightPanel } from "@/components/editor/RightPanel"

type ToolbarPosition = { top: number; left: number }

export default function EditorPage() {
  const [content, setContent] = useState("Your formatted document will appear here...")
  const [showAIToolbar, setShowAIToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({
    top: 280,
    left: 300,
  })

  return (
    <SidebarProvider>
      <div className="h-screen flex bg-background overflow-hidden">
        {/* Left sidebar (demo) */}
        <Sidebar collapsible="icon">
          {/* you can add nav items here later */}
        </Sidebar>

        {/* Main content inset */}
        <SidebarInset className="flex flex-col overflow-hidden">
          {/* Simple top bar for demo */}
          <TopBar title="Demo document" />

          <div className="flex-1 flex overflow-hidden">
            {/* Document area */}
            <div className="flex-1 overflow-y-auto py-8 px-12 flex justify-center">
              <div className="relative w-full max-w-4xl">
                <DocumentEditor
                  value={content}              // ✅ use value instead of content
                  onChange={setContent}
                  onTextSelect={(pos) => {
                    setShowAIToolbar(true)
                    setToolbarPosition(pos)
                  }}
                />

                {showAIToolbar && (
                  <AIToolbar
                    position={toolbarPosition}
                    onClose={() => setShowAIToolbar(false)}
                  />
                )}
              </div>
            </div>

            {/* Right info panel */}
            <RightPanel />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
