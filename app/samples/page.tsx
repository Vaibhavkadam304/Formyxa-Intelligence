import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Shield, Zap, RefreshCcw, ClipboardList, FileText,
  Search, ClipboardCheck, TrendingUp, CheckCircle,
  Archive, Receipt, Users
} from "lucide-react"

const categories = ["All", "Project Flow", "Legal", "During Project", "Closing & Billing", "Ongoing"]

const samples = [
  // CORE PROJECT FLOW
  {
    id: "project-brief",
    title: "Project Brief",
    description: "Capture goals, deliverables, and constraints before any proposal is written.",
    icon: ClipboardList,
    href: "/templates/project-brief",
    badge: "Start Here",
    badgeColor: "yellow",
    category: "Project Flow",
    preview: ["Project goals", "Target audience", "Key deliverables", "Timeline & budget"],
  },
  {
    id: "quick-close-proposal",
    title: "Sales Proposal",
    description: "High-value pitches with 'Why Us' and 'Project Strategy' narrative blocks.",
    icon: Zap,
    href: "/templates/quick-close-proposal",
    badge: "High Growth",
    badgeColor: "blue",
    category: "Project Flow",
    preview: ["Executive summary", "Project strategy", "Pricing breakdown", "Why us"],
  },
  {
    id: "anti-scope-creep-sow",
    title: "Statement of Work",
    description: "Lock scope, exclusions, and payment terms to prevent unpaid revisions.",
    icon: Shield,
    href: "/templates/anti-scope-creep-sow",
    badge: "Most Used",
    badgeColor: "red",
    category: "Project Flow",
    preview: ["Project purpose", "Scope of services", "Milestones & payment", "Exclusions"],
  },
  // LEGAL
  {
    id: "client-service-agreement",
    title: "Client Service Agreement",
    description: "Foundation agreement covering payment, IP, liability, and termination.",
    icon: FileText,
    href: "/templates/client-service-agreement",
    badge: "New",
    badgeColor: "indigo",
    category: "Legal",
    preview: ["Service terms", "IP ownership", "Payment conditions", "Termination clause"],
  },
  {
    id: "master-retainer-agreement",
    title: "Master Retainer Agreement",
    description: "Standing rules for ongoing monthly work — hours, fees, and exit terms.",
    icon: RefreshCcw,
    href: "/templates/master-retainer-agreement",
    badge: "New",
    badgeColor: "green",
    category: "Legal",
    preview: ["Monthly scope", "Fee structure", "Renewal terms", "Exit conditions"],
  },
  // DURING PROJECT
  {
    id: "creative-discovery-brief",
    title: "Creative Discovery Brief",
    description: "Define brand voice, emotional goals, and audience nuances for creative work.",
    icon: Search,
    href: "/templates/creative-discovery-brief",
    category: "During Project",
    preview: ["Brand personality", "Audience profile", "Visual direction", "Tone of voice"],
  },
  {
    id: "profit-guard-change-order",
    title: "Change Order",
    description: "Document scope changes with technical and financial impact before proceeding.",
    icon: ClipboardCheck,
    href: "/templates/profit-guard-change-order",
    category: "During Project",
    preview: ["Change description", "Reason & impact", "Cost adjustment", "Approval sign-off"],
  },
  {
    id: "project-status-report",
    title: "Project Status Report",
    description: "Structured weekly updates covering progress, blockers, and next steps.",
    icon: TrendingUp,
    href: "/templates/project-status-report",
    badge: "New",
    badgeColor: "blue",
    category: "During Project",
    preview: ["Completed this week", "Blockers & risks", "Next steps", "Timeline status"],
  },
  // CLOSING & BILLING
  {
    id: "deliverable-acceptance-form",
    title: "Deliverable Acceptance",
    description: "Formal client sign-off on each milestone before the next phase begins.",
    icon: CheckCircle,
    href: "/templates/deliverable-acceptance-form",
    badge: "New",
    badgeColor: "green",
    category: "Closing & Billing",
    preview: ["Deliverable summary", "Acceptance criteria", "Client feedback", "Approval signature"],
  },
  {
    id: "project-closure-report",
    title: "Project Closure Report",
    description: "Officially close with a summary of deliverables, outcomes, and lessons.",
    icon: Archive,
    href: "/templates/project-closure-report",
    badge: "New",
    badgeColor: "purple",
    category: "Closing & Billing",
    preview: ["Final deliverables", "Project outcomes", "Budget summary", "Lessons learned"],
  },
  {
    id: "invoice-template",
    title: "Invoice",
    description: "Professional invoices tied directly to SOW milestones and payment terms.",
    icon: Receipt,
    href: "/templates/invoice-template",
    badge: "New",
    badgeColor: "yellow",
    category: "Closing & Billing",
    preview: ["Service line items", "Milestone reference", "Payment due date", "Banking details"],
  },
  // ONGOING
  {
    id: "creative-retainer-agreement-core",
    title: "Marketing Retainer",
    description: "Ongoing service tiers, monthly reporting cadences, and value-add strategies.",
    icon: RefreshCcw,
    href: "/templates/creative-retainer-agreement-core",
    category: "Ongoing",
    preview: ["Service tiers", "Monthly deliverables", "Reporting cadence", "Add-on services"],
  },
  {
    id: "business-impact-report",
    title: "Business Impact / ROI Report",
    description: "Summarize outcomes into an executive-level narrative for stakeholders.",
    icon: FileText,
    href: "/templates/business-impact-report",
    badge: "Stakeholder Ready",
    badgeColor: "purple",
    category: "Ongoing",
    preview: ["Project outcomes", "ROI metrics", "Key achievements", "Recommendations"],
  },
]

const badgeStyles: Record<string, string> = {
  red: "bg-red-500/10 text-red-400 border border-red-500/20",
  blue: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  green: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  indigo: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
}

export default function SamplesPage() {
  return (
    <div className="bg-background min-h-screen">

      {/* ── PAGE HERO ── */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            13 templates · Full project lifecycle
          </div>

          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.05]">
            Every document your
            <br />
            <span className="font-semibold text-primary">agency actually needs</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-[48ch] mx-auto">
            From first client brief to final invoice. Each template is AI-guided, structured, and built to protect your revenue.
          </p>

          <div className="flex justify-center gap-4 pt-2">
            <Button asChild size="lg" className="rounded-lg px-6">
              <Link href="/choose">Start a document</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-lg px-6 text-primary hover:bg-muted">
              <Link href="/choose">Browse templates →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── LIFECYCLE FLOW ── */}
      <section className="pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            {[
              "Project Brief",
              "→",
              "Proposal",
              "→",
              "Agreement",
              "→",
              "SOW",
              "→",
              "Change Orders",
              "→",
              "Acceptance",
              "→",
              "Invoice",
              "→",
              "Retainer",
            ].map((step, i) => (
              <span
                key={i}
                className={
                  step === "→"
                    ? "text-muted-foreground/30"
                    : "rounded-full border border-border bg-card/60 px-3 py-1 text-foreground/70"
                }
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATE GRID ── */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          {/* Category headers + cards */}
          {[
            { label: "Core Project Flow", cat: "Project Flow" },
            { label: "Legal & Agreement", cat: "Legal" },
            { label: "During Project", cat: "During Project" },
            { label: "Closing & Billing", cat: "Closing & Billing" },
            { label: "Ongoing Relationship", cat: "Ongoing" },
          ].map(({ label, cat }) => (
            <div key={cat} className="mb-14">
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/50 mb-5 pl-1">
                {label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {samples
                  .filter((t) => t.category === cat)
                  .map((template) => {
                    const Icon = template.icon
                    return (
                      <Link
                        key={template.id}
                        href={template.href}
                        className="group relative flex flex-col rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-card/90 transition-all duration-200 overflow-hidden"
                      >
                        {/* Card header */}
                        <div className="flex items-start justify-between p-5 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground group-hover:text-primary transition-colors">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-foreground leading-tight">
                                {template.title}
                              </p>
                            </div>
                          </div>
                          {template.badge && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${badgeStyles[template.badgeColor ?? "blue"]}`}>
                              {template.badge}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="px-5 text-xs text-muted-foreground leading-relaxed">
                          {template.description}
                        </p>

                        {/* Preview fields */}
                        <div className="mt-4 mx-5 mb-5 rounded-xl border border-border/60 bg-background/40 p-3 space-y-1.5">
                          {template.preview.map((field) => (
                            <div key={field} className="flex items-center gap-2">
                              <div className="h-px flex-1 bg-border/60 rounded" />
                              <span className="text-[10px] text-muted-foreground/50 shrink-0">{field}</span>
                            </div>
                          ))}
                        </div>

                        {/* Hover CTA */}
                        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center py-3 bg-gradient-to-t from-card/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs font-medium text-primary">Use this template →</span>
                        </div>
                      </Link>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="border-t border-border py-20 px-4 text-center">
        <div className="mx-auto max-w-xl space-y-5">
          <h2 className="text-3xl font-medium tracking-tight text-foreground">
            Ready to protect your next project?
          </h2>
          <p className="text-muted-foreground">
            Start with any template — AI guides you through every field.
          </p>
          <Button asChild size="lg" className="rounded-lg px-8">
            <Link href="/choose">Create your first document</Link>
          </Button>
          <p className="text-xs text-muted-foreground/50">
            No credit card required · Designed to prevent scope creep and payment disputes.
          </p>
        </div>
      </section>
    </div>
  )
}