import React from "react"
import { Clock, FileText, Eye } from "lucide-react"

export function RightPanel() {
  return (
    <div className="w-72 bg-muted border-l border-border p-6 space-y-6">
      {/* AI Assistant Preview */}
      <div>
        <h3 className="text-sm text-muted-foreground mb-3">AI Assistant</h3>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground">
              <span className="text-lg">✨</span>
            </div>
            <div>
              <p className="text-sm text-foreground">Formatly AI</p>
              <p className="text-xs text-muted-foreground">Ready to help</p>
            </div>
          </div>
          {/* Main action in the panel → primary */}
          <button className="w-full py-2 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-lg transition-colors">
            Ask AI Assistant
          </button>
        </div>
      </div>

      {/* Document Stats */}
      <div>
        <h3 className="text-sm text-muted-foreground mb-3">Document Stats</h3>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4 text-primary" />
              <span>Characters</span>
            </div>
            <span className="text-sm text-foreground">6,847</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4 text-primary" />
              <span>Reading time</span>
            </div>
            <span className="text-sm text-foreground">5 min</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>Last saved</span>
            </div>
            <span className="text-sm text-foreground">2h ago</span>
          </div>
        </div>
      </div>

      {/* Version History */}
      <div>
        <h3 className="text-sm text-muted-foreground mb-3">Recent Activity</h3>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
            <div className="flex-1">
              <p className="text-xs text-foreground">AI enhanced section</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30 mt-1.5" />
            <div className="flex-1">
              <p className="text-xs text-foreground">Updated timeline</p>
              <p className="text-xs text-muted-foreground">Yesterday</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30 mt-1.5" />
            <div className="flex-1">
              <p className="text-xs text-foreground">Created document</p>
              <p className="text-xs text-muted-foreground">3 days ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm text-muted-foreground mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full py-2 px-3 bg-card hover:bg-muted text-foreground text-sm rounded-lg transition-colors border border-border text-left">
            Share document
          </button>
          <button className="w-full py-2 px-3 bg-card hover:bg-muted text-foreground text-sm rounded-lg transition-colors border border-border text-left">
            View comments
          </button>
          <button className="w-full py-2 px-3 bg-card hover:bg-muted text-foreground text-sm rounded-lg transition-colors border border-border text-left">
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  )
}
