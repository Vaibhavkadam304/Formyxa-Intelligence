"use client"

import { CheckCircle2, Circle, User, FileText, ChevronRight } from "lucide-react"

type DetectedPlaceholder = {
  key: string
  label: string
  original_text: string
  placeholder: string
  confidence?: "high" | "medium" | "low"
  enabled?: boolean
  anchorId: string
}

export function OfferLetterForm({
  placeholders,
  setPlaceholders,
  values,
  setValues,
  onGenerate,
}: {
  placeholders: DetectedPlaceholder[]
  setPlaceholders: (p: DetectedPlaceholder[]) => void
  values: Record<string, string>
  setValues: (v: Record<string, string>) => void
  onGenerate: () => void
}) {
  return (
    <div className="flex h-full w-full bg-white text-slate-900">
      
      {/* --- SUB-SIDEBAR (Matches the "1. Applicant, 2. Vehicle" list in image) --- */}
      {/* <div className="hidden w-48 flex-col border-r border-slate-100 bg-slate-50/50 py-6 pl-4 pr-2 sm:flex">
        <div className="space-y-1">
          <SidebarItem label="Applicant" active completed />
          <SidebarItem label="Details" completed />
          <SidebarItem label="Compensation" />
          <SidebarItem label="Notes" />
        </div>
      </div> */}

      {/* --- MAIN FORM AREA --- */}
      <div className="flex flex-1 flex-col">
        
        {/* Header */}
        <div className="border-b border-slate-100 px-8 py-6">
          <h2 className="text-xl font-bold text-slate-900">Applicant Information</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select the fields you want to include in the offer.
          </p>
        </div>

        {/* Scrollable Inputs */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          <div className="space-y-6">
            {placeholders.map((p, idx) => (
              <div
                key={p.key}
                className={`group transition-opacity ${
                  p.enabled ? "opacity-100" : "opacity-40"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => {
                        const next = [...placeholders]
                        next[idx].enabled = e.target.checked
                        setPlaceholders(next)
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-black focus:ring-black"
                    />
                    {p.label} <span className="text-red-500">*</span>
                  </label>
                  
                  {p.enabled && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    disabled={!p.enabled}
                    placeholder={`Enter ${p.label}...`}
                    value={values[p.key] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [p.key]: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-slate-50"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Action */}
        <div className="border-t border-slate-100 bg-white p-6">
          <button
            onClick={onGenerate}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] hover:bg-slate-800 active:scale-[0.99]"
          >
            Create Offer Letter
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* --- Helper Component for the visual steps sidebar --- */
function SidebarItem({ label, active, completed }: { label: string; active?: boolean; completed?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-white text-black shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
      <span className="flex items-center gap-2">
        {completed ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-slate-300" />}
        {label}
      </span>
    </div>
  )
}