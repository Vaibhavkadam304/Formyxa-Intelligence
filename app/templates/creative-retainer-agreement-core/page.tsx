"use client"

import { useRouter } from "next/navigation"
import { 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Users, 
  ArrowRight, 
  Clock, 
  FileText,
  ChevronRight,
  Sparkles,
  RefreshCcw,
  Scale
} from "lucide-react"

export default function MasterRetainerPreview() {
  const router = useRouter()

  const handleOpenEditor = async () => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Creative Services Retainer Agreement",
          templateSlug: "creative-retainer-agreement-core",
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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-colors duration-300 antialiased">
      
      {/* ── Editorial Navigation ────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-black text-sm shadow-sm">
            F
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight uppercase leading-none">Formyxa</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none mt-1">Intelligence</span>
          </div>
          <span className="text-muted-foreground/30 mx-2 text-xl font-light">/</span>
          <span className="text-sm text-muted-foreground font-medium">Retainer Protocol</span>
        </div>
        
        <button
          onClick={handleOpenEditor}
          className="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-primary/10 flex items-center gap-2 active:scale-95"
        >
          Use Template <ArrowRight className="h-4 w-4" />
        </button>
      </header>

      {/* ── Hero Section ───────────────────── */}
      <section className="max-w-4xl mx-auto pt-20 pb-16 px-6 text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
          <span className="bg-primary/10 text-primary text-[10px] px-3 py-1.5 rounded-md font-bold uppercase tracking-[0.2em] border border-primary/20">
            MRR Optimization
          </span>
          <div className="flex items-center gap-1.5 text-muted-foreground/60 text-[11px] font-bold uppercase tracking-widest">
            <Clock className="h-3.5 w-3.5" /> Updated Feb 2026
          </div>
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-foreground mb-8 leading-[1.05]">
          Master Retainer <br className="hidden lg:block" /> 
          <span className="text-muted-foreground/40">Agreement</span>
        </h1>
        
        <p className="text-xl text-muted-foreground/80 max-w-2xl leading-relaxed mb-12 font-medium">
          Scale your recurring revenue with a professional retainer framework. 
          Includes <span className="text-foreground">auto-renewal clauses</span> and <span className="text-foreground">late-fee protection</span>.
        </p>

        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-primary" /> Auto-Renewal Ready
          </div>
          <div className="flex items-center gap-2 border-l border-border pl-8">
            <Scale className="h-4 w-4 text-emerald-500" /> Liability Protected
          </div>
          <div className="flex items-center gap-2 border-l border-border pl-8">
            <Sparkles className="h-4 w-4 text-amber-500" /> AI-Ghost Drafted
          </div>
        </div>
      </section>

      {/* ── Document Canvas ──────────────────────────────────────── */}
      <div className="bg-muted/40 border-y border-border py-20 px-6">
        <main className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16">
          
          {/* Document Preview Card */}
          <div className="flex-1 relative order-2 lg:order-1 group">
            <div className="absolute -top-6 -left-6 z-20 bg-card border border-border p-4 rounded-2xl shadow-2xl hidden md:block">
              <div className="flex items-center gap-3">
                 <div className="bg-primary p-2.5 rounded-xl text-primary-foreground shadow-inner">
                    <FileText className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.15em]">Document Type</p>
                    <p className="text-xs font-bold text-foreground tracking-tight">Master Agreement</p>
                 </div>
              </div>
            </div>

            <div className="
              w-full bg-card border border-border rounded-2xl
              shadow-[0_40px_100px_rgba(0,0,0,0.12)]
              overflow-hidden transition-transform duration-500 hover:scale-[1.01]
            ">
              {/* Header Bar */}
              <div className="bg-muted/60 border-b border-border px-10 py-5 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-border/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-border/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-border/60" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em]">Standard Execution Protocol</span>
              </div>

              {/* The "Paper" */}
              <div className="px-16 lg:px-24 py-20 space-y-12">
                <div className="text-center pb-8 border-b border-border">
                  <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase">Master Retainer Agreement</h2>
                  <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] mt-2">FORMYXA INTELLIGENCE V.2026</p>
                </div>

                <section className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/[0.03] border border-dashed border-primary/20">
                    <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">Parties</p>
                    <p className="text-sm text-muted-foreground italic">Agreement entered between [Service Provider] and [Client Company]...</p>
                  </div>
                </section>

                <section className="relative">
                   {/* Risk Tooltip */}
                  <div className="absolute -right-8 top-0 translate-x-full hidden xl:block">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg shadow-sm max-w-[200px] animate-in fade-in zoom-in duration-500">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Zap className="h-3 w-3 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-wider">MRR Risk</span>
                      </div>
                      <p className="text-[10px] text-amber-800 font-medium leading-tight">
                        Auto-renewal ensures continuity. Ensure 30-day notice is fixed to prevent gaps.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-4">1. Term and Renewal</h3>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted/60 rounded-full" />
                    <div className="h-3 w-[90%] bg-muted/60 rounded-full" />
                    <div className="h-3 w-[40%] bg-primary/20 rounded-full border border-primary/10" />
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest">2. Compensation</h3>
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">Monthly Fee:</span>
                      <span className="text-xs text-primary font-mono font-bold">$[Amount]</span>
                    </div>
                    <div className="h-[1px] bg-border" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">Late Fee:</span>
                      <span className="text-xs text-foreground font-mono">1.5% / month</span>
                    </div>
                  </div>
                </section>

                {/* Abstract Visual Sections */}
                <div className="opacity-20 pointer-events-none space-y-8 pt-8">
                  <div className="h-4 w-1/3 bg-foreground rounded" />
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-muted rounded" />
                    <div className="h-2 w-full bg-muted rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value Props Sidebar */}
          <aside className="w-full lg:w-[380px] order-1 lg:order-2 space-y-10">
            <div className="space-y-8">
              <h3 className="text-xl font-black text-foreground tracking-tight uppercase border-b border-border pb-4">Retainer Safeguards</h3>
              <ul className="space-y-6">
                {[
                  { title: "Rollover Management", desc: "Clear logic for unused hours to prevent backlog debt." },
                  { title: "Payment Stoppage", desc: "Legal right to halt work if invoices are 7 days overdue." },
                  { title: "Deemed Approval", desc: "Prevent project stalls with automatic feedback windows." }
                ].map((item) => (
                  <li key={item.title} className="flex gap-5 group">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground tracking-tight">{item.title}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1.5 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Call to Action */}
            <div className="p-8 bg-primary rounded-[2rem] text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden group">
               <Sparkles className="absolute -bottom-6 -right-6 h-32 w-32 text-primary-foreground/10 group-hover:scale-110 transition-transform duration-700" />
               <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 mb-3">Formyxa Intelligence</p>
               <h4 className="text-2xl font-black mb-4 leading-tight">Generate Clauses</h4>
               <p className="text-sm opacity-80 leading-relaxed mb-8 font-medium">
                 Our AI will draft your specific service categories and rollover policies based on your business model.
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

      {/* ── Strategic Drafting Section ────────────────────────── */}
      <section className="max-w-4xl mx-auto py-32 px-6">
        <h2 className="text-4xl font-black text-foreground mb-12 tracking-tighter">Engineered for Consistency</h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center">
              <ShieldCheck className="text-primary h-6 w-6" />
            </div>
            <h4 className="text-xl font-bold tracking-tight">IP Retention</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ownership only transfers upon <strong>full and final payment</strong> of the respective billing cycle.
            </p>
          </div>
          <div className="space-y-4">
            <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center">
              <Zap className="text-amber-500 h-6 w-6" />
            </div>
            <h4 className="text-xl font-bold tracking-tight">Late Fee Triggers</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automated 1.5% interest clauses protect your cash flow from chronic late-payers.
            </p>
          </div>
        </div>

        <div className="mt-20 p-12 bg-muted/30 rounded-[3rem] border border-border flex flex-col items-center text-center gap-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
             <div className="max-w-md">
                <h4 className="text-2xl font-bold text-foreground tracking-tight">Ready to lock in your next retainer?</h4>
                <p className="text-sm text-muted-foreground font-medium mt-2">Generate a legally-vetted agreement in under 2 minutes.</p>
             </div>
             <button 
              onClick={handleOpenEditor}
              className="bg-foreground text-background px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl active:scale-95"
             >
                Initialize Editor
             </button>
          </div>
      </section>

      {/* ── Minimalist Footer ─────────────────────────────────────── */}
      <footer className="border-t border-border py-16 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-3 grayscale opacity-40">
              <div className="h-6 w-6 bg-foreground text-background rounded flex items-center justify-center font-black text-[10px]">F</div>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase">Formyxa</span>
           </div>
           <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">
             © 2026 Formyxa Intelligence — Vetted for Professional Services
           </p>
        </div>
      </footer>
    </div>
  )
}