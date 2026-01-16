"use client"

import { useState } from "react"
import Image from "next/image"

const featureTabs = [
  {
    id: "structured",
    label: "Create structured docs",
    title: "Create high-quality documents faster",
    bullets: [
      "Convert rough input into clearly defined sections",
      "Use predefined document structures like offer letters and policies",
      "AI assists within structure, not free-form writing",
    ],
    image: "/images/formyxa-editor1.png",
    caption: "Structured outline with enforced sections",
  },
  {
    id: "standards",
    label: "Enforce company standards",
    title: "One canonical version for every document",
    bullets: [
      "Company-approved wording and structure",
      "Prevent accidental or unsafe edits",
      "Reuse the same document safely at scale",
    ],
    image: "/images/formyxa-editor2.png",
    caption: "Company-approved structure applied automatically",
  },
  {
    id: "editing",
    label: "Edit safely",
    title: "Edit in a familiar, safe editor",
    bullets: [
      "Google-Docs–style editing experience",
      "Teams can edit without breaking structure",
      "Track changes and collaboration-ready",
    ],
    image: "/images/formyxa-editor3.png",
    caption: "Editable content with locked structural sections",
  },
  {
    id: "export",
    label: "Export official output",
    title: "Export-ready, official documents",
    bullets: [
      "Generate clean DOCX and PDF files",
      "Preserve formatting and structure",
      "Ready for sharing, signing, or archiving",
    ],
    image: "/images/formyxa-editor4.png",
    caption: "Export-ready, compliant documents",
  },
]

export default function Features() {
  const [activeTab, setActiveTab] = useState(featureTabs[0])

  return (
    <section
      id="features"
      className="
        relative
        py-24
        pt-20
        bg-gradient-to-b
        from-background
        via-muted/40
        to-background
      "
    >
      {/* soft section background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/50 via-background to-background" />

      <div className="mx-auto max-w-6xl px-6">

        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight md:leading-[1.15] text-foreground">
            Built for structured, real-world documents
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
            Turn rough input into structured, reusable company documents.
          </p>
        </div>

        {/* Pills */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {featureTabs.map((tab) => {
            const isActive = activeTab.id === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab)}
                className={`
                  rounded-full px-4 py-2 text-sm transition
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="grid items-center gap-14 md:grid-cols-2">

          {/* Left */}
          <div>
            <h3 className="mb-4 text-xl font-medium text-foreground">
              {activeTab.title}
            </h3>

            <ul className="max-w-lg space-y-3 text-sm text-muted-foreground">
              {activeTab.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Right */}
          <div className="relative">

            {/* subtle backdrop */}
            <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/15 blur-2xl scale-95" />

            {/* main image */}
            <div className="relative rounded-xl border border-border bg-card p-4 shadow-xl">
              <Image
                key={activeTab.image}
                src={activeTab.image}
                alt="Formyxa document editor"
                width={600}
                height={400}
                className="rounded-lg"
              />

              {/* floating governance badge */}
              <div className="
                absolute -bottom-5 right-6
                w-[220px]
                rounded-lg
                bg-card
                p-3
                shadow-lg
                ring-1 ring-black/5
              ">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="
                    flex h-5 w-5 items-center justify-center
                    rounded-full
                    bg-primary
                    text-primary-foreground
                    text-[11px]
                  ">
                    ✓
                  </span>
                  Approved structure
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Editing within company-defined sections
                </p>
              </div>
            </div>

            {/* caption */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {activeTab.caption}
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
