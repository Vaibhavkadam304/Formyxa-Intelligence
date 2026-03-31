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
  Sparkles
} from "lucide-react"

export default function FormyxaTemplatePreview() {
  const router = useRouter()

  const handleOpenEditor = async () => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Anti-Scope Creep SOW",
        templateSlug: "anti-scope-creep-sow-core",
        preset: "standard",
      }),
    })

    const data = await res.json()
    if (data?.id) router.push(`/builder/${data.id}`)
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
          <span className="text-sm text-muted-foreground font-medium">Templates</span>
        </div>
        
        <button
          onClick={handleOpenEditor}
          className="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-primary/10 flex items-center gap-2 active:scale-95"
        >
          Use Template <ArrowRight className="h-4 w-4" />
        </button>
      </header>

      {/* ── Hero Section: High-End Typography ───────────────────── */}
      <section className="max-w-4xl mx-auto pt-20 pb-16 px-6 text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
          <span className="bg-primary/10 text-primary text-[10px] px-3 py-1.5 rounded-md font-bold uppercase tracking-[0.2em] border border-primary/20">
            Professional Standard
          </span>
          <div className="flex items-center gap-1.5 text-muted-foreground/60 text-[11px] font-bold uppercase tracking-widest">
            <Clock className="h-3.5 w-3.5" /> Updated Feb 2026
          </div>
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-foreground mb-8 leading-[1.05]">
          Anti-Scope Creep <br className="hidden lg:block" /> 
          <span className="text-muted-foreground/40">Statement of Work</span>
        </h1>
        
        <p className="text-xl text-muted-foreground/80 max-w-2xl leading-relaxed mb-12 font-medium">
          A legally-vetted, industry-standard SOW designed for tech agencies and freelancers. 
          Includes <span className="text-foreground">12 pre-configured sections</span> to protect your margins.
        </p>

        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Built for Agencies & Freelancers
          </div>
          <div className="flex items-center gap-2 border-l border-border pl-8">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Attorney-Reviewed
          </div>
          <div className="flex items-center gap-2 border-l border-border pl-8">
            <Sparkles className="h-4 w-4 text-amber-500" /> AI-Ready
          </div>
        </div>
      </section>

      {/* ── Document Canvas ──────────────────────────────────────── */}
      <div className="bg-muted/40 border-y border-border py-20 px-6">
        <main className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16">
          
          {/* Document Preview Card */}
          <div className="flex-1 relative order-2 lg:order-1 group">
            <div className="absolute -top-6 -left-6 z-20 bg-card border border-border p-4 rounded-2xl shadow-2xl hidden md:block animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3">
                 <div className="bg-primary p-2.5 rounded-xl text-primary-foreground shadow-inner">
                    <ShieldCheck className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.15em]">Security</p>
                    <p className="text-xs font-bold text-foreground tracking-tight">Enterprise Standard</p>
                 </div>
              </div>
            </div>

            <div className="
              w-full bg-card border border-border rounded-2xl
              shadow-[0_40px_100px_rgba(0,0,0,0.12)]
              dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)]
              overflow-hidden transition-transform duration-500 hover:scale-[1.01]
            ">
              {/* Browser/Editor Style Bar */}
              <div className="bg-muted/60 border-b border-border px-10 py-5 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-border/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-border/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-border/60" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.25em]">Execution Protocol</span>
              </div>

              {/* The actual Paper content */}
              <div className="px-16 lg:px-24 py-20 space-y-16 legal-doc">
                <div className="text-center pb-12 border-b border-border">
                  <h2 className="text-4xl font-black text-foreground tracking-tighter border-none p-0 uppercase">Statement of Work</h2>
                  <div className="mt-4 flex justify-center">
                    <div className="h-1 w-12 bg-primary rounded-full" />
                  </div>
                </div>

                <section>
                  <label className="text-[10px] font-black text-primary uppercase mb-4 tracking-[0.2em] block">Required Input</label>
                  <div className="p-5 rounded-xl bg-primary/[0.03] border border-dashed border-primary/20 flex flex-col gap-1">
                    <p className="text-sm font-bold text-foreground tracking-tight">Project Identification:</p>
                    <p className="text-sm italic text-primary/60 font-medium">Click to enter project name in editor...</p>
                  </div>
                </section>

                

                <section className="space-y-6">

                {/* Floating Risk Alert Tooltip */}
                  <div className="absolute -right-4 top-0 translate-x-full hidden xl:block animate-pulse">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg shadow-sm max-w-[180px]">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Zap className="h-3 w-3 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Risk Detected</span>
                      </div>
                      <p className="text-[10px] text-amber-800 font-medium leading-tight">
                        "Regular Updates" is a soft clause. Define frequency to prevent over-servicing.
                      </p>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground m-0 tracking-tight italic">2. Scope Objectives</h3>
                  <ul className="space-y-4 m-0 p-0 list-none">
                    {[1, 2].map((i) => (
                      <li key={i} className="p-4 rounded-xl border border-border text-muted-foreground/60 italic text-sm flex items-center gap-4 bg-muted/20">
                        <div className="h-5 w-5 rounded-md bg-muted border border-border flex items-center justify-center font-black text-[10px] text-foreground">{i}</div>
                        Define deliverable {i} via AI assistant...
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Abstract Ghost Sections */}
                {["Timeline & Deadlines", "Payment Schedule", "Termination & IP"].map((text) => (
                  <section key={text} className="opacity-25 grayscale">
                    <h3 className="text-lg font-bold text-foreground mb-3 m-0 tracking-tight">{text}</h3>
                    <div className="space-y-2">
                      <div className="h-2.5 w-full bg-muted rounded-full" />
                      <div className="h-2.5 w-3/4 bg-muted rounded-full" />
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>

          {/* Value Props Sidebar */}
          <aside className="w-full lg:w-[380px] order-1 lg:order-2 space-y-10">
            <div className="space-y-8">
              <h3 className="text-xl font-black text-foreground tracking-tight uppercase border-b border-border pb-4">Inclusions</h3>
              <ul className="space-y-6">
                {[
                  { title: "Revision Caps", desc: "Automatic triggers to prevent endless change requests." },
                  { title: "Milestone Linking", desc: "Release payments only when specific outcomes are met." },
                  { title: "IP Protection", desc: "Clear ownership transfer upon final payment." }
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

            {/* Premium AI Drafting Card */}
            <div className="p-8 bg-primary rounded-[2rem] text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden group">
               <Zap className="absolute -bottom-6 -right-6 h-32 w-32 text-primary-foreground/10 group-hover:scale-110 transition-transform duration-700" />
               <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 mb-3">AI Ghost Fill</p>
               <h4 className="text-2xl font-black mb-4 leading-tight">Draft in Seconds</h4>
               <p className="text-sm opacity-80 leading-relaxed mb-8 font-medium">
                 Our AI identifies every placeholder and drafts legally-sound clauses based on your goals.
               </p>
               <button 
                onClick={handleOpenEditor}
                className="w-full bg-white text-primary py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-white/20 transition-all active:scale-95"
               >
                 Activate AI Drafting
               </button>
            </div>
          </aside>
        </main>
      </div>

      {/* ── Best Practices ────────────────────────────────────────── */}
      {/* ── Strategic Drafting (Feature-Focused) ────────────────────────── */}
      <section className="max-w-4xl mx-auto py-32 px-6">
        <h2 className="text-4xl font-black text-foreground mb-12 tracking-tighter">Powered by Formyxa Intelligence</h2>
        <div className="space-y-12">
          {[
            { 
              id: "01", 
              title: "Automated Risk Analysis", 
              body: "Our engine scans your draft in real-time to identify 'Soft Clauses'—vague language like 'as needed' or 'regular updates'—that typically lead to scope creep and lost margins." 
            },
            { 
              id: "02", 
              title: "Contextual Ghost Drafting", 
              body: "Don't just fill in blanks. Our AI Ghost Text understands the legal hierarchy of an SOW, drafting professional, enforceable clauses that adapt to your specific project category." 
            },
            { 
              id: "03", 
              title: "Structural Integrity Guardrails", 
              body: "The editor performs a final 'AI Check' before export, ensuring essential protections like IP transfer, milestone-linked payments, and revision caps are present and properly formatted." 
            }
          ].map((item) => (
            <div key={item.id} className="flex gap-8 group">
              <span className="text-5xl font-black text-muted-foreground/10 tabular-nums group-hover:text-primary/20 transition-colors duration-500">
                {item.id}
              </span>
              <div className="pt-2">
                <h4 className="text-xl font-bold text-foreground tracking-tight mb-2 flex items-center gap-3">
                  {item.title}
                  {item.id === "01" && <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded uppercase tracking-widest font-black">Pro</span>}
                </h4>
                <p className="text-muted-foreground/70 leading-relaxed font-medium max-w-2xl">
                  {item.body}
                </p>
              </div>
            </div>
          ))}

          <div className="mt-20 p-12 bg-muted/30 rounded-[3rem] border border-border flex flex-col items-center text-center gap-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
             <div className="max-w-md">
                <h4 className="text-2xl font-bold text-foreground tracking-tight">Secure your next project.</h4>
                <p className="text-sm text-muted-foreground font-medium mt-2">Join 500+ agencies using Formyxa to automate legal operations.</p>
             </div>
             <button 
              onClick={handleOpenEditor}
              className="bg-foreground text-background px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl active:scale-95"
             >
               Start Building Now
             </button>
          </div>
        </div>
      </section>

      {/* ── Minimalist Footer ─────────────────────────────────────── */}
      <footer className="border-t border-border py-16 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-3 grayscale opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="h-6 w-6 bg-foreground text-background rounded flex items-center justify-center font-black text-[10px]">F</div>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase">Formyxa</span>
           </div>
           <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">
             © 2026 Formyxa Intelligence — Vetted for CRM & Software Implementation
           </p>
        </div>
      </footer>

      {/* ── Floating Support ──────────────────────────────────────── */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="h-14 w-14 bg-card border border-border text-foreground rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
          <HelpCircle className="h-6 w-6 text-muted-foreground" />
        </button>
      </div>

    </div>
  )
}