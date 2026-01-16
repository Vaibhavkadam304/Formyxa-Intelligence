// components/Editor.tsx
"use client"

import React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"

type EditorProps = {
  content: string
  onChange: (html: string) => void
}

export default function Editor({ content, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    // 👇 important for Next 16 + Tiptap
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML() // ✅ we always send HTML
      onChange(html)
    },
  })

  if (!editor) return null

  return (
    <EditorContent
      editor={editor}
      className="formatly-editor"
    />
  )
}
