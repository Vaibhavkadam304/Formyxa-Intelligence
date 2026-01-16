"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const templates = [
  { id: "business-proposal", name: "Business Proposal", description: "Professional proposal template" },
  { id: "report", name: "Report", description: "Formal report structure" },
  { id: "letter", name: "Letter", description: "Professional letter format" },
  { id: "resume", name: "Resume", description: "Modern resume template" },
]

interface DocumentFormProps {
  onSubmit: () => void
}

export default function DocumentForm({ onSubmit }: DocumentFormProps) {
  const [title, setTitle] = useState("")
  const [template, setTemplate] = useState("business-proposal")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Parse the handleSubmit logic from the attachment
    const documentData = {
      title,
      template,
      content,
    }

    console.log("Document created:", documentData)
    setIsLoading(false)
    onSubmit()
  }

  return (
    <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-3xl text-card-foreground">Create New Document</CardTitle>
            <CardDescription>Start with a template and add your content</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">
                  Document Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Q4 Sales Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template" className="text-foreground">
                  Template
                </Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger id="template" className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-foreground">
                  Content
                </Label>
                <Textarea
                  id="content"
                  placeholder="Paste or type your document content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="bg-input border-border resize-none"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isLoading || !title || !content}>
                {isLoading ? "Creating Document..." : "Create Document"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
