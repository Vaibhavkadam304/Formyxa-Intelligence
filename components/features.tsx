"use client"

import { useState } from "react"
import Image from "next/image"

const featureTabs = [
  {
    id: "scope",
    label: "Define scope clearly",
    title: "Break projects into enforceable sections",
    bullets: [
      "Separate deliverables from assumptions and exclusions",
      "Clearly define timelines, milestones, and revision limits",
      "AI assists within structured guardrails — not free-form drafting",
    ],
    image: "/images/formyxa-editor1.jpg",
    caption: "Structured scope with defined boundaries and responsibilities",
  },
  {
    id: "guardrails",
    label: "Enforce guardrails",
    title: "Built-in protection against scope creep",
    bullets: [
      "Predefined scope, payment, and change policies",
      "Structured clauses for revisions and overages",
      "Prevent vague or risky wording before it becomes a problem",
    ],
    image: "/images/formyxa-editor2.png",
    caption: "Company-approved guardrails applied automatically",
  },
  {
    id: "editing",
    label: "Edit safely",
    title: "Flexible editing with structural protection",
    bullets: [
      "Familiar editing experience with protected sections",
      "Make changes without expanding scope accidentally",
      "Maintain clarity across revisions and updates",
    ],
    image: "/images/formyxa-editor3.png",
    caption: "Editable content with protected structural sections",
  },
  {
    id: "export",
    label: "Lock & export",
    title: "Finalize contracts with confidence",
    bullets: [
      "Generate clean DOCX and PDF files",
      "Signature-ready formatting",
      "Version-safe, export-ready agreements",
    ],
    image: "/images/formyxa-editor4.png",
    caption: "Locked, export-ready agreements",
  },
]

export default function Features() {
  const [activeTab, setActiveTab] = useState(featureTabs[0])

  return (
    <section id="features" className="relative py-24 pt-20 bg-background">
      <div className="mx-auto max-w-6xl px-6">

        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight md:leading-[1.15] text-foreground">
            Structure That Protects Your Revenue
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
            Turn client conversations into structured, enforceable agreements with built-in guardrails.
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
                alt="Formyxa contract editor"
                width={600}
                height={400}
                className="rounded-lg"
              />

              {/* floating protection badge */}
              <div className="
                absolute -bottom-5 right-6
                w-[240px]
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
                  Scope Guard: Active
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Protected sections prevent accidental scope expansion
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