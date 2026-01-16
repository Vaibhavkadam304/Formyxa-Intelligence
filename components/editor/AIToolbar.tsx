import React from "react"
import { Wand2, Minus, Plus, Zap, FileText, AlignLeft, X } from "lucide-react"

interface AIToolbarProps {
  position: { top: number; left: number }
  onClose: () => void
}

export function AIToolbar({ position, onClose }: AIToolbarProps) {
  const tools = [
    { icon: Wand2, label: "Rephrase", primary: true },
    { icon: Minus, label: "Shorter", primary: false },
    { icon: Plus, label: "Longer", primary: false },
    { icon: Zap, label: "Translate", primary: false },
    { icon: FileText, label: "Summarize", primary: false },
    { icon: AlignLeft, label: "Format", primary: false },
  ]

  return (
    <div
      className="fixed z-50 animate-[fadeIn_0.2s_ease-out]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="bg-card rounded-xl shadow-xl border border-border p-2 flex items-center gap-1.5">
        {tools.map((tool, index) => {
          const Icon = tool.icon
          const baseClasses =
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-[1.05]"

          const variantClasses = tool.primary
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            : "bg-card text-foreground border border-border hover:bg-muted"

          return (
            <button key={index} className={`${baseClasses} ${variantClasses}`}>
              <Icon className="w-4 h-4" />
              <span>{tool.label}</span>
            </button>
          )
        })}

        {/* Divider + Close Button */}
        <div className="w-px h-6 bg-border mx-1" />
        <button
          onClick={onClose}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tooltip Arrow */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full">
        <div className="w-3 h-3 bg-card border-r border-b border-border transform rotate-45 -translate-y-1.5" />
      </div>
    </div>
  )
}
