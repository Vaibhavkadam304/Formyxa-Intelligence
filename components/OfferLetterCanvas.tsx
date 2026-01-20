"use client"

import React from "react"

type DetectedPlaceholder = {
  key: string
  label: string
  original_text: string
  placeholder: string
  confidence?: "high" | "medium" | "low"
  enabled?: boolean
  anchorId: string
}


/* ================= HELPERS (Moved inside or kept utility) ================= */

function isUnderline(text: string) {
  return /^_+$/.test(text.replace(/\s+/g, ""))
}

function applyAnchoredValues(
  html: string,
  placeholders: DetectedPlaceholder[],
  values: Record<string, string>
) {
  let output = html

  placeholders.forEach((p) => {
    if (!p.enabled) return
    const value = values[p.key]
    if (!value) return

    // TEMPORARY bridge: exact original_text replacement
    // (anchorId guarantees uniqueness now)
    const escaped = p.original_text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    output = output.replace(
      new RegExp(escaped, "i"),
      `<span class="bg-blue-50 px-1 font-medium text-blue-700">${value}</span>`
    )
  })

  return output
}



function renderCanvasHtml(
  html: string,
  placeholders: DetectedPlaceholder[],
  values: Record<string, string>
) {
  let output = html

  /* 1. SIGNATURES */
  const signatureFields = placeholders.filter(
    (p) =>
      p.enabled &&
      isUnderline(p.original_text) &&
      p.key.toLowerCase().includes("signatory")
  )

  if (signatureFields.length > 0) {
    const filled = signatureFields.map((p) => values[p.key]).filter(Boolean)

    if (filled.length > 0) {
      const blockHtml = filled
        .map((v) => `<div class="font-cursive text-xl leading-snug text-blue-900">${v}</div>`)
        .join("")

      const underlinePattern = textToHtmlLooseRegex(signatureFields[0].original_text)
      const blockRegex = new RegExp(
        `(${underlinePattern}|[-—–]{3,})+(?:\\s|<[^>]+>)*`,
        "i"
      )

      output = output.replace(
        blockRegex,
        `<div class="my-2 border-b-2 border-slate-300 pb-1">${blockHtml}</div>`
      )
    }
  }

  return output
}


/* ================= COMPONENT ================= */

export function OfferLetterCanvas({
  html,
  placeholders,
  values,
}: {
  html: string
  placeholders: DetectedPlaceholder[]
  values: Record<string, string>
}) {
  return (
    <div className="flex h-full flex-col bg-slate-100">
      
      {/* Preview Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Preview</h3>
          <p className="mt-1 text-sm text-slate-500">
            Review your information carefully before creating the permission.
          </p>
        </div>
        <div className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            A4 Document
        </div>
      </div>

      {/* Canvas Area (Gray Background) */}
      <div className="flex-1 overflow-auto p-8 lg:p-12">
        <div className="mx-auto flex justify-center">
          {/* A4 Paper Shadow & Dimensions */}
          <div
            className="
              relative
              min-h-[1123px]
              w-[794px]
              origin-top
              scale-[0.7]
              bg-white
              p-12
              shadow-2xl
              ring-1 ring-slate-900/5
              lg:scale-[0.85]
              xl:scale-100
              prose prose-sm max-w-none
            "
           dangerouslySetInnerHTML={{
            __html: applyAnchoredValues(html, placeholders, values),
            }}
          />
        </div>
      </div>
    </div>
  )
}