"use client"

import { useRouter } from "next/navigation"
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Clock,
  FileText,
  Sparkles,
  Scale,
  Layers,
  Lock,
  AlertTriangle
} from "lucide-react"

export default function MasterServiceAgreementPreview() {
  const router = useRouter()

  const handleOpenEditor = async () => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Master Service Agreement",
          templateSlug: "master-service-agreement-core",
          preset: "standard",
        }),
      })

      if (!res.ok) {
        console.error("Failed to create document")
        return
      }

      const data = await res.json()
      if (data?.id) router.push(`/builder/${data.id}`)
    } catch (err) {
      console.error("Document creation error:", err)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 antialiased">

      {/* ───────────────────────────────────────── */}
      {/* Header */}
      {/* ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-black text-sm shadow-sm">
            F
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase leading-none">Formyxa</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">
              Intelligence
            </span>
          </div>
          <span className="text-muted-foreground/30 mx-2 text-xl font-light">/</span>
          <span className="text-sm text-muted-foreground font-medium">
            Master Agreement Protocol
          </span>
        </div>

        <button
          onClick={handleOpenEditor}
          className="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-primary/10 flex items-center gap-2 active:scale-95"
        >
          Use Template <ArrowRight className="h-4 w-4" />
        </button>
      </header>

      {/* ───────────────────────────────────────── */}
      {/* Hero */}
      {/* ───────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto pt-20 pb-16 px-6 text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
          <span className="bg-primary/10 text-primary text-[10px] px-3 py-1.5 rounded-md font-bold uppercase tracking-[0.2em] border border-primary/20">
            Core Legal Shield
          </span>
          <div className="flex items-center gap-1.5 text-muted-foreground/60 text-[11px] font-bold uppercase tracking-widest">
            <Clock className="h-3.5 w-3.5" /> Updated Feb 2026
          </div>
        </div>

        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-8 leading-[1.05]">
          Master Service <br className="hidden lg:block" />
          <span className="text-muted-foreground/40">Agreement</span>
        </h1>

        <p className="text-xl text-muted-foreground/80 max-w-2xl leading-relaxed mb-12 font-medium">
          The umbrella contract governing all Statements of Work.
          Built with <span className="text-foreground">IP leverage</span>,
          <span className="text-foreground"> liability caps</span>, and
          <span className="text-foreground"> arbitration clarity</span>.
        </p>

        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Governs All SOWs
          </div>
          <div className="flex items-center gap-2 border-l border-border pl-8">
            <Scale className="h-4 w-4 text-emerald-500" /> Liability Capped
          </div>
          <div className="flex items-center gap-2 border-l border-border pl-8">
            <Lock className="h-4 w-4 text-amber-500" /> IP Retained Until Paid
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────── */}
      {/* Preview Canvas */}
      {/* ───────────────────────────────────────── */}
      <div className="bg-muted/40 border-y border-border py-20 px-6">
        <main className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16">

          {/* Document Preview */}
          <div className="flex-1 relative order-2 lg:order-1 group">
            <div className="absolute -top-6 -left-6 z-20 bg-card border border-border p-4 rounded-2xl shadow-2xl hidden md:block">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2.5 rounded-xl text-primary-foreground shadow-inner">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.15em]">
                    Document Type
                  </p>
                  <p className="text-xs font-bold text-foreground tracking-tight">
                    Master Service Agreement
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full bg-card border border-border rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.12)] overflow-hidden transition-transform duration-500 hover:scale-[1.01]">

              <div className="bg-muted/60 border-b border-border px-10 py-5 flex justify-between">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-border/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-border/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-border/60" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em]">
                  Enterprise Legal Framework
                </span>
              </div>

              <div className="px-16 lg:px-24 py-20 space-y-12">
                <div className="text-center pb-8 border-b border-border">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">
                    Master Service Agreement
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] mt-2">
                    FORMYXA INTELLIGENCE V.2026
                  </p>
                </div>

                <section className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest">
                    1. Scope Governance
                  </h3>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded-full" />
                    <div className="h-3 w-[85%] bg-muted rounded-full" />
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest">
                    2. Intellectual Property
                  </h3>
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">Ownership:</span>
                      <span className="text-xs text-primary font-mono font-bold">
                        Transfers After Full Payment
                      </span>
                    </div>
                    <div className="h-[1px] bg-border" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">Background IP:</span>
                      <span className="text-xs font-mono">
                        Retained by Provider
                      </span>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest">
                    3. Limitation of Liability
                  </h3>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded-full" />
                    <div className="h-3 w-[70%] bg-muted rounded-full" />
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[380px] order-1 lg:order-2 space-y-10">

            <div className="space-y-8">
              <h3 className="text-xl font-black uppercase border-b border-border pb-4">
                Core Protections
              </h3>
              <ul className="space-y-6">
                {[
                  { title: "Liability Cap", desc: "Caps exposure to last 6 months of fees." },
                  { title: "Delaware Arbitration", desc: "AAA binding arbitration clause included." },
                  { title: "Non-Solicitation", desc: "Prevents client from poaching your team." }
                ].map((item) => (
                  <li key={item.title} className="flex gap-5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 bg-primary rounded-[2rem] text-primary-foreground shadow-2xl relative overflow-hidden">
              <Sparkles className="absolute -bottom-6 -right-6 h-32 w-32 text-primary-foreground/10" />
              <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 mb-3">
                Formyxa Intelligence
              </p>
              <h4 className="text-2xl font-black mb-4 leading-tight">
                Generate Your MSA
              </h4>
              <p className="text-sm opacity-80 leading-relaxed mb-8 font-medium">
                Draft an enforceable umbrella agreement with arbitration,
                IP leverage, and risk protection in under 2 minutes.
              </p>
              <button
                onClick={handleOpenEditor}
                className="w-full bg-white text-primary py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-white/20 transition-all active:scale-95"
              >
                Start Drafting
              </button>
            </div>
          </aside>

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 grayscale opacity-40">
            <div className="h-6 w-6 bg-foreground text-background rounded flex items-center justify-center font-black text-[10px]">
              F
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] uppercase">
              Formyxa
            </span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">
            © 2026 Formyxa Intelligence — Enterprise Legal Infrastructure
          </p>
        </div>
      </footer>

    </div>
  )
}