// components/editor/DocumentEditor.tsx
"use client"

import React, { useEffect, useRef } from "react"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import { Node, Mark, Extension } from "@tiptap/core"; // 👈 add Extension

type Position = { top: number; left: number }

type DocumentEditorProps = {
  value: string
  onChange: (html: string) => void
  onTextSelect?: (position: Position) => void
}

export function DocumentEditor({
  value,
  onChange,
  onTextSelect,
}: DocumentEditorProps) {
  const pageRef = useRef<HTMLDivElement | null>(null)
  

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Start typing your template here…",
      }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    // 👇 this line fixes the SSR/hydration warning
    immediatelyRender: false,
  })

  

  // Keep TipTap in sync if parent replaces value (e.g. open another doc)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || "", false)
    }
  }, [value, editor])

  // Selection → AI toolbar positioning
  useEffect(() => {
    if (!onTextSelect) return

    const handleSelection = () => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0 || sel.toString().length === 0) return

      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const pageRect = pageRef.current?.getBoundingClientRect()
      if (!pageRect) return

      const inside =
        rect.bottom >= pageRect.top &&
        rect.top <= pageRect.bottom &&
        rect.right >= pageRect.left &&
        rect.left <= pageRect.right

      if (!inside) return

      onTextSelect({
        top: rect.top - 56,
        left: rect.left + rect.width / 2 - 200,
      })
    }

    document.addEventListener("mouseup", handleSelection)
    return () => document.removeEventListener("mouseup", handleSelection)
  }, [onTextSelect])

  if (!editor) return null

  const currentBlockType = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
    ? "h3"
    : "paragraph"

  return (
    <div className="flex flex-col gap-3">
      {/* 1) Insert-tag bar (top) */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2 text-sm">
        <span className="font-medium text-muted-foreground">
          Insert tag into template
        </span>
        <div className="flex items-center gap-2">
          <Select defaultValue="field">
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Field group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="field">Field</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="project">Project</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="field1">
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Field name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="field1">field1</SelectItem>
              <SelectItem value="field2">field2</SelectItem>
              <SelectItem value="field3">field3</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" className="h-8 px-4">
            Insert
          </Button>
        </div>
      </div>

      {/* 2) Rich-text toolbar */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
        {/* Paragraph / H1 / H2 / H3 */}
        <Select
          value={currentBlockType}
          onValueChange={(val) => {
            const chain = editor.chain().focus()
            if (val === "paragraph") chain.setParagraph().run()
            if (val === "h1") chain.toggleHeading({ level: 1 }).run()
            if (val === "h2") chain.toggleHeading({ level: 2 }).run()
            if (val === "h3") chain.toggleHeading({ level: 3 }).run()
          }}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Paragraph</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
          </SelectContent>
        </Select>

        <span className="mx-2 h-5 w-px bg-border" />

        {/* Bold / Italic / Underline */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("underline") ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>
        </div>

        <span className="mx-2 h-5 w-px bg-border" />

        {/* Alignment */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive({ textAlign: "center" }) ? "default" : "ghost"
            }
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <span className="mx-2 h-5 w-px bg-border" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 3) Page area – Google Docs–style sheet */}
      <div className="rounded-xl border border-border bg-muted/60 p-6">
        <div className="flex justify-center overflow-auto">
          <div
            ref={pageRef}
            className="w-[794px] min-h-[1123px] rounded-md bg-white px-16 py-12 shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_18px_40px_rgba(15,23,42,0.16)]"
          >
            <EditorContent
              editor={editor}
              className="tiptap text-[14px] leading-relaxed
                [&_p]:mb-3
                [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mb-4
                [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3
                [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2
                [&_ul]:list-disc [&_ul]:pl-5
                [&_ol]:list-decimal [&_ol]:pl-5"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
