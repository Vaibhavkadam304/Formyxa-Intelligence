"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export interface TimelineItem {
  phase: string
  start: string
  end: string
}

export interface PricingItem {
  item: string
  qty: string
  rate: string
}

export interface ProposalFormData {
  clientName: string
  clientCompany: string
  projectName: string
  currency: string
  projectValue: string
  scope: string
  deliverables: string
  timeline: TimelineItem[]
  pricing: PricingItem[]
  terms: string
  date: string
}

interface ProposalPreviewProps {
  formData: ProposalFormData
}

export function ProposalPreview({ formData }: ProposalPreviewProps) {
  const clientBlock = [formData.clientName, formData.clientCompany]
    .filter(Boolean)
    .join(" · ")

  const pricingRows = formData.pricing.filter((p) => p.item.trim() !== "")
  const numericTotal = pricingRows.reduce((sum, p) => {
    const qty = Number(p.qty) || 0
    const rate = Number(p.rate) || 0
    return sum + qty * rate
  }, 0)

  function formatDisplayDate(isoDate?: string | null) {
    if (!isoDate) return "-"
    const parts = isoDate.split("-")
    if (parts.length !== 3) return isoDate

    const [year, month, day] = parts
    const monthIndex = Number(month) - 1
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]

    const monthName = monthNames[monthIndex] ?? month
    const dayNum = Number(day)

    return `${monthName} ${dayNum}, ${year}`
  }

  const currency = formData.currency || "USD ($)"

  const formattedTotal =
    numericTotal > 0
      ? `${currency} ${numericTotal.toLocaleString()}`
      : formData.projectValue

  const displayDate = formatDisplayDate(formData.date)

  // For timeline display, format the ISO dates too
  const formatTimelineDate = (v: string) =>
    v ? formatDisplayDate(v) : "—"

  return (
    <Card
      className="
        rounded-2xl
        border border-indigo-100/80
        bg-white
        shadow-[0_18px_45px_rgba(15,23,42,0.16)]
      "
    >
      <CardContent className="p-6 sm:p-7 space-y-6 text-xs sm:text-sm text-slate-800">
        {/* Top header */}
        <div className="text-center space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-indigo-500 uppercase">
            Project Proposal
          </p>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
            {formData.projectName || "Website Redesign & Development"}
          </h2>
        </div>

        <Separator className="bg-slate-100" />

        {/* Meta info */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between text-[11px] sm:text-xs">
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">Prepared for</p>
            <p className="whitespace-pre-line text-slate-700">
              {clientBlock || "Client Name\nClient Company"}
            </p>
          </div>
          <div className="space-y-2 text-left sm:text-right">
            <div>
              <p className="font-semibold text-slate-900">Date</p>
              <p className="text-slate-700">{displayDate || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Project value</p>
              <p className="text-slate-700">
                {formattedTotal || `${currency} 15,000`}
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* TOC */}
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">Table of contents</p>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-500">
            <li>Project overview</li>
            <li>Scope of work</li>
            <li>Deliverables</li>
            <li>Timeline &amp; milestones</li>
            <li>Investment</li>
            <li>Terms &amp; conditions</li>
            <li>Signatures</li>
          </ol>
        </div>

        <Separator className="bg-slate-100" />

        {/* 1. Overview */}
        <section className="space-y-2">
          <h3 className="font-semibold text-slate-900">
            1. Project overview
          </h3>
          <p className="text-slate-600 whitespace-pre-line">
            {`This proposal outlines the scope, timeline, and investment for ${
              formData.projectName || "this project"
            } for ${clientBlock || "your client"}.`}
          </p>
        </section>

        {/* 2. Scope of Work */}
        <section className="space-y-2">
          <h3 className="font-semibold text-slate-900">
            2. Scope of work
          </h3>
          <p className="text-slate-600 whitespace-pre-line">
            {formData.scope ||
              "High-level scope of work will be listed here. Add a short description of what is included and excluded from this project."}
          </p>
        </section>

        {/* 3. Deliverables */}
        <section className="space-y-2">
          <h3 className="font-semibold text-slate-900">
            3. Deliverables
          </h3>
          <p className="text-slate-600 whitespace-pre-line">
            {formData.deliverables ||
              "Project deliverables will be listed here as bullet points or short paragraphs so the client clearly sees what they will receive."}
          </p>
        </section>

        {/* 4. Timeline */}
        <section className="space-y-2">
          <h3 className="font-semibold text-slate-900">
            4. Timeline &amp; milestones
          </h3>
          {formData.timeline.length ? (
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              {formData.timeline.map((t, idx) => (
                <li key={idx}>
                  <span className="font-medium text-slate-900">
                    {t.phase || "Phase"}
                  </span>
                  {": "}
                  <span>
                    {formatTimelineDate(t.start)} – {formatTimelineDate(t.end)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">
              Add phases with start and end dates to show a clear project
              timeline and key milestones.
            </p>
          )}
        </section>

        {/* 5. Investment */}
        <section className="space-y-2">
          <h3 className="font-semibold text-slate-900">5. Investment</h3>
          {pricingRows.length ? (
            <div className="space-y-1 text-slate-600">
              <ul className="space-y-1">
                {pricingRows.map((p, idx) => {
                  const qty = Number(p.qty) || 0
                  const rate = Number(p.rate) || 0
                  const lineTotal = qty * rate

                  return (
                    <li key={idx}>
                      <span className="font-medium text-slate-900">
                        {p.item}
                      </span>{" "}
                      {qty && rate ? (
                        <>
                          – {qty} × {currency} {rate.toLocaleString()} ={" "}
                          {currency} {lineTotal.toLocaleString()}
                        </>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
              {numericTotal > 0 && (
                <p className="font-semibold mt-2 text-slate-900">
                  Total investment: {currency} {numericTotal.toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-slate-600">
              Add line items with quantity and rate. The total investment will
              be calculated automatically.
            </p>
          )}
        </section>

        {/* 6. Terms */}
        <section className="space-y-2">
          <h3 className="font-semibold text-slate-900">
            6. Terms &amp; conditions
          </h3>
          <p className="text-slate-600 whitespace-pre-line">
            {formData.terms ||
              "Add payment terms, revision rounds, responsibilities, and any other important conditions here so both sides are aligned."}
          </p>
        </section>

        {/* 7. Signatures */}
        <section className="space-y-2">
          <h3 className="font-semibold text-slate-900">7. Signatures</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-6 text-[11px] sm:text-xs text-slate-600">
            <div className="space-y-4">
              <p className="font-medium text-slate-900">Client acceptance</p>
              <div className="h-px bg-slate-200" />
              <p>Signature &amp; name</p>
              <p>Date</p>
            </div>
            <div className="space-y-4">
              <p className="font-medium text-slate-900">Service provider</p>
              <div className="h-px bg-slate-200" />
              <p>Signature &amp; name</p>
              <p>Date</p>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
