"use client"

import { useRouter } from "next/navigation"
import { HelpCircle } from "lucide-react"


/* ---------------- COMPONENT: ACTION ITEM ROW ---------------- */
const ActionItem = ({ 
  text, 
  meta 
}: { 
  text: string
  meta: string 
}) => (
  <div className="flex items-start gap-3 mb-4 last:mb-0">
    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-700" />
    <div>
      <p className="text-gray-900">{text}</p>
      <p className="text-sm text-gray-500 mt-0.5">{meta}</p>
    </div>
  </div>
)

/* ---------------- COMPONENT: LESSON SECTION ---------------- */
const LessonSection = ({ 
  title, 
  children 
}: { 
  title: string
  children: React.ReactNode 
}) => (
  <div className="mb-4 last:mb-0">
    <h4 className="text-sm font-semibold text-gray-900 mb-1">{title}</h4>
    <p className="text-gray-600 text-sm leading-relaxed">{children}</p>
  </div>
)


/* ---------------- PAGE ---------------- */

export default function IncidentPostmortemPage() {
 const router = useRouter()

  const handleOpenEditor = async () => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Incident Postmortem",
          templateSlug: "incident-postmortem-core",
          preset: "standard",
        }),
      })

      const data = await res.json()

      if (data?.id) {
        router.push(`/builder/${data.id}`)
      }
    } catch (err) {
      console.error("Failed to open editor", err)
    }
  }


  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans text-gray-900">
      
      {/* ---------------- TOP NAVIGATION BAR ---------------- */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {/* Logo Box */}
          <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg">
            F
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-none text-gray-900">
              Incident Postmortem (RCA)
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-500 font-medium">Approved format · Ready to use</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleOpenEditor}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Open editor
        </button>
      </header>

      {/* ---------------- MAIN CANVAS AREA ---------------- */}
      <main className="flex-1 flex flex-col items-center py-10 px-4 overflow-y-auto">
        
        {/* Helper Text */}
        <p className="text-gray-500 text-sm mb-6 font-medium">
          This is the exact structure you'll edit.
        </p>

        {/* ---------------- THE DOCUMENT (PAPER) ---------------- */}
        <div className="relative w-full max-w-[800px] bg-white shadow-md border border-gray-200 rounded-sm min-h-[1000px] mb-20">
          
          {/* Read-only Badge (Absolute) */}
          <div className="absolute -top-8 left-0 text-xs text-gray-400 font-medium">
            Read-only preview
          </div>

          {/* DOCUMENT CONTENT PADDING */}
          <div className="px-20 py-16">

            {/* Title */}
            <h1 className="text-3xl font-medium text-gray-900 mb-8">
              Incident Postmortem
            </h1>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 mb-12 text-sm">
              <div className="grid grid-cols-[80px_1fr]">
                <span className="text-gray-500">Date:</span>
                <span className="text-gray-900 font-medium">YYYY-MM-DD</span>
              </div>
              <div className="grid grid-cols-[80px_1fr]">
                <span className="text-gray-500">Severity:</span>
                <span className="text-gray-900 font-medium">Level</span>
              </div>
              <div className="grid grid-cols-[80px_1fr]">
                <span className="text-gray-500">Duration:</span>
                <span className="text-gray-900 font-medium">HH:MM</span>
              </div>
              <div className="grid grid-cols-[80px_1fr]">
                <span className="text-gray-500">Owner:</span>
                <span className="text-gray-900 font-medium">Name</span>
              </div>
            </div>

            <hr className="border-gray-100 mb-10" />

            {/* Executive Summary */}
            <section className="mb-10">
              <h2 className="text-xl font-medium text-gray-800 mb-3">Executive Summary</h2>
              <p className="text-gray-700 leading-[1.7]">
                Brief overview of what happened and the impact. This section should be concise and accessible to non-technical stakeholders, summarizing the incident, its duration, scope of impact, and ultimate resolution.
              </p>
            </section>

            {/* Timeline */}
            <section className="mb-14">
              <h2 className="text-xl font-medium text-gray-800 mb-4">Timeline</h2>
              <div className="space-y-4">
                {[
                  { time: "00:00", desc: "Initial detection: Alert triggered for service degradation" },
                  { time: "00:15", desc: "Investigation began: On-call engineer started diagnostics" },
                  { time: "00:30", desc: "Root cause identified: Database connection pool exhausted" },
                  { time: "00:45", desc: "Mitigation applied: Increased connection pool limit" },
                  { time: "01:00", desc: "Resolution confirmed: All services restored to normal operation" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-8 text-sm">
                    <span className="text-gray-400 font-mono w-12 shrink-0">{item.time}</span>
                    <span className="text-gray-700">{item.desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Root Cause Analysis */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Root Cause Analysis</h2>
              <p className="text-gray-600 leading-relaxed">
                Technical explanation of what caused the incident. Include details about the system components involved, the chain of events that led to the failure, and any contributing factors. This section should be thorough enough for engineers to understand exactly what went wrong and why.
              </p>
            </section>

            {/* Impact */}
            <section className="mb-10">
              <h2 className="text-xl font-medium text-gray-800 mb-3">Impact</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong className="font-medium text-gray-900">Users affected:</strong> Approximately XXX users experienced degraded performance</li>
                <li><strong className="font-medium text-gray-900">Services impacted:</strong> Primary API, notification system, and user dashboard</li>
                <li><strong className="font-medium text-gray-900">Duration:</strong> 60 minutes of partial service degradation</li>
                <li><strong className="font-medium text-gray-900">Revenue impact:</strong> Estimated $XXX in lost transactions</li>
                <li><strong className="font-medium text-gray-900">SLA impact:</strong> XX.XX% uptime (within/outside SLA targets)</li>
              </ul>
            </section>

            {/* Action Items */}
            <section className="mb-10">
              <h2 className="text-xl font-medium text-gray-800 mb-4">Action Items</h2>
              <div className="pl-1">
                <ActionItem 
                  text="Implement automated scaling for database connection pools"
                  meta="Owner: Database Team | Due: 2026-02-15 | Priority: High"
                />
                <ActionItem 
                  text="Add monitoring alerts for connection pool saturation"
                  meta="Owner: Observability Team | Due: 2026-02-10 | Priority: High"
                />
                <ActionItem 
                  text="Update runbook with connection pool troubleshooting steps"
                  meta="Owner: SRE Team | Due: 2026-02-05 | Priority: Medium"
                />
              </div>
            </section>

             {/* Lessons Learned */}
             <section>
              <h2 className="text-xl font-medium text-gray-800 mb-4">Lessons Learned</h2>
              <div className="space-y-5">
                <LessonSection title="What went well">
                  Quick detection and response time. Team followed established incident procedures effectively.
                </LessonSection>
                <LessonSection title="What didn't go well">
                  Lack of proactive monitoring for this specific failure mode. Documentation was outdated.
                </LessonSection>
                <LessonSection title="What we'll change">
                  Implement comprehensive connection pool monitoring and establish regular capacity reviews.
                </LessonSection>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Floating Help Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6">
        <button className="h-10 w-10 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-black transition">
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
      
    </div>
  )
}