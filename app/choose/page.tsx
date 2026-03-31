"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  AlertTriangle,
  RefreshCcw,
  Shield,
  ClipboardCheck,
  Search,
  Zap,
  Target,
  Cpu,
  TrendingUp,
  Users,
} from "lucide-react"

import Header from "@/components/header"
import Footer from "@/components/footer"

/* ---------------- TEMPLATE CONFIGURATION ---------------- */

type TemplateCard = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  badge?: { text: string; variant: "default" | "critical" }
  theme: "blue" | "orange" | "purple" | "green" | "red" | "indigo"
}

const TEMPLATES: TemplateCard[] = [
  // --- SURVIVORS (From your original list - Keep these for narrative value) ---
  {
    id: "anti-scope-creep-sow",
    title: "Statement of Work (SOW)",
    description: "Define project purpose, detailed scope, and strict exclusions to prevent unpaid revisions.",
    icon: <Shield className="h-5 w-5" />,
    href: "/templates/anti-scope-creep-sow",
    badge: { text: "Most Used", variant: "default" },
    theme: "red",
  },
  {
    id: "quick-close-proposal",
    title: "Sales Proposal (Strategic)",
    description: "Draft high-value pitches with custom 'Why Us' and 'Project Strategy' narrative blocks.",
    icon: <Zap className="h-5 w-5" />,
    href: "/templates/quick-close-proposal",
    badge: { text: "High Growth", variant: "default" },
    theme: "blue",
  },
  {
    id: "creative-retainer-agreement-core",
    title: "Marketing Retainer",
    description: "Describe ongoing service tiers, monthly reporting cadences, and value-add strategies.",
    icon: <RefreshCcw className="h-5 w-5" />,
    href: "/templates/creative-retainer-agreement-core",
    theme: "green",
  },
  {
    id: "profit-guard-change-order",
    title: "Change Order (Scope Update)",
    description: "Explain the 'Why' behind mid-project changes and their technical/financial impact.",
    icon: <ClipboardCheck className="h-5 w-5" />,
    href: "/templates/profit-guard-change-order",
    theme: "indigo",
  },

  // --- NEW HIGH-INTENT TEMPLATES (The "GPT-Killers") ---
  {
    id: "product-requirement-doc",
    title: "PRD (Product Requirements)",
    description: "Draft user stories, success metrics, and functional logic for complex feature builds.",
    icon: <Cpu className="h-5 w-5" />,
    href: "/templates/product-requirement-doc",
    badge: { text: "Product Pick", variant: "default" },
    theme: "purple",
  },
  {
    id: "creative-discovery-brief",
    title: "Creative Discovery Brief",
    description: "Define brand voice, emotional goals, and audience nuances for creative agency projects.",
    icon: <Search className="h-5 w-5" />,
    href: "/templates/creative-discovery-brief",
    theme: "orange",
  },
  {
    id: "grant-funding-proposal",
    title: "Grant / Funding Proposal",
    description: "Write high-impact methodology and community value sections for institutional funding.",
    icon: <FileText className="h-5 w-5" />,
    href: "/templates/grant-funding-proposal",
    badge: { text: "Institutional", variant: "default" },
    theme: "red",
  },
  {
    id: "technical-architecture-spec",
    title: "Technical Architecture Spec",
    description: "Explain data flows, API logic, and security constraints for engineering stakeholders.",
    icon: <Shield className="h-5 w-5" />,
    href: "/templates/technical-architecture-spec",
    theme: "blue",
  },
  {
    id: "content-strategy-narrative",
    title: "Content & Brand Strategy",
    description: "Develop messaging frameworks and tone-of-voice examples to guide brand consistency.",
    icon: <Target className="h-5 w-5" />,
    href: "/templates/content-strategy-narrative",
    theme: "indigo",
  },
  {
    id: "project-case-study",
    title: "Project Case Study",
    description: "Transform raw results into a professional narrative of challenges, solutions, and ROI.",
    icon: <TrendingUp className="h-5 w-5" />,
    href: "/templates/project-case-study",
    theme: "green",
  },
  {
    id: "culture-job-description",
    title: "Culture-Focused Job Post",
    description: "Draft high-intent 'About Us' and 'Mission' sections that attract top-tier talent.",
    icon: <Users className="h-5 w-5" />,
    href: "/templates/culture-job-description",
    theme: "orange",
  },
  {
    id: "business-impact-report",
    title: "Business Impact / ROI Report",
    description: "Summarize project outcomes into a professional executive-level narrative for stakeholders.",
    icon: <FileText className="h-5 w-5" />,
    href: "/templates/business-impact-report",
    badge: { text: "Stakeholder Ready", variant: "default" },
    theme: "purple",
  }
]

/* ---------------- REMOVAL LOG (For your reference) ---------------- 
  - Master Service Agreement: Removed (Too much boilerplate/fixed legal text).
  - Mutual NDA: Removed (Static form letter).
  - IP Transfer Agreement: Removed (Standardized field-filling).
  - Late Payment Notice: Removed (Too short; no drafting value).
  - Termination Agreement: Removed (Too sensitive; fixed legal phrasing).
--------------------------------------------------------------------- */

export default function ChooseTemplatePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTemplates = TEMPLATES.filter(
    (tpl) =>
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-16">

          {/* Header Section */}
          <div className="mb-10 space-y-3">
            <p className="text-xs uppercase tracking-wide pt-10 text-muted-foreground font-semibold">
              FOR HIGH-INTENT DRAFTING & STRATEGY
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Draft Professional Documents in Seconds.
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              Use AI-powered blocks to write custom proposals, specs, and strategies without staring at a blank page.
            </p>
            <div className="pt-4">
              <button
                onClick={() => router.push("/templates/anti-scope-creep-sow")}
                className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-sm"
              >
                Start Your First Project →
              </button>
            </div>
          </div>

          {/* Premium Search Bar */}
          <div className="mb-10 relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search templates (PRD, Strategy, SOW...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[52px] pl-12 pr-6 rounded-xl border border-border/70 bg-card text-base text-foreground placeholder:text-muted-foreground shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
            />
          </div>

          {/* Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => router.push(tpl.href)}
                  className={`
                    group flex flex-col gap-3
                    p-6 w-full
                    bg-card rounded-xl
                    border border-border/60
                    hover:border-primary/40
                    hover:shadow-lg
                    hover:-translate-y-1
                    transition-all duration-200
                    text-left
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2
                  `}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-md bg-muted text-foreground">
                      {tpl.icon}
                    </div>

                    {tpl.badge ? (
                      <span
                        className={`
                          px-2.5 py-0.5 rounded-full
                          text-[10px] font-semibold uppercase tracking-wide
                          whitespace-nowrap shrink-0
                          ${
                              tpl.badge.variant === "default"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted/60 text-muted-foreground"
                            }
                        `}
                      >
                        {tpl.badge.text}
                      </span>
                    ) : (
                      <span />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-border rounded-lg bg-card/50">
              <p className="text-base text-muted-foreground">
                No drafting templates found for "{searchQuery}".
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}