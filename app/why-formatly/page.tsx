// app/why-formatly/page.tsx

import { CheckCircle2, Sparkles, ArrowRight, LayoutTemplate } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function WhyFormatlyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-16">
        {/* Hero */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              Why Formatly instead of plain GPT?
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                GPT writes text.
              </span>{" "}
              Formatly creates{" "}
              <span className="underline decoration-emerald-400/70 decoration-2 underline-offset-4">
                submission-ready documents.
              </span>
            </h1>
            <p className="max-w-xl text-sm text-slate-300 sm:text-base">
              GPT can generate paragraphs. Formatly turns your information into{" "}
              <strong className="font-semibold text-slate-100">
                professionally formatted DOCX/PDF
              </strong>{" "}
              with fixed templates, placeholders, and flawless layout that you can
              submit to clients, embassies, HR, or institutions.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Link href="/templates">
                  <Sparkles className="h-4 w-4" />
                  Try a template
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-slate-600 bg-slate-900/60 text-slate-100 hover:bg-slate-800"
              >
                <Link href="/builder/demo">
                  <LayoutTemplate className="h-4 w-4" />
                  View sample document
                </Link>
              </Button>
            </div>

            <p className="text-xs text-slate-400">
              Perfect for visa letters, proposals, refund letters, HR notices, and more.
            </p>
          </div>

          {/* Side highlight card */}
          <Card className="mt-4 w-full max-w-sm border-emerald-500/30 bg-slate-900/80 backdrop-blur md:mt-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Structured, not random
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Every document follows a pre-built template with clear sections, placeholders,
                and export-safe formatting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-200">
              <p className="font-medium text-slate-100">
                When you need documents that look like they came from a professional agency —
                not from a chat box.
              </p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Standard headings, spacing, and fonts
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Category-specific sections (visa, proposal, refund, HR, etc.)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Only edit placeholders — layout stays perfect
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Comparison section */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              The big difference:{" "}
              <span className="text-emerald-300">“anything” text vs. “correct” documents.</span>
            </h2>
            <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
              GPT is great for brainstorming and rough drafts. Formatly is built for documents
              you can actually{" "}
              <span className="font-semibold text-slate-100">submit, send, or print</span>.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* GPT side */}
            <Card className="border-slate-700 bg-slate-950/70">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-100">
                  Using GPT alone
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Good for ideas, but unreliable for final, formal documents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li>• Free-flow text, no stable structure</li>
                  <li>• Tone, format, and length change every time</li>
                  <li>• Missing mandatory lines or details is common</li>
                  <li>• No control over margins, styles, spacing</li>
                  <li>• Pasting into Word often breaks formatting</li>
                  <li>• Not optimized for DOCX/PDF export</li>
                </ul>
              </CardContent>
            </Card>

            {/* Formatly side */}
            <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-emerald-200">
                  Using Formatly
                </CardTitle>
                <CardDescription className="text-xs text-emerald-100/70">
                  Professional, repeatable, submission-ready output.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-emerald-50">
                  <li>• Fixed templates for each document type</li>
                  <li>• Standard legal/professional headings & sections</li>
                  <li>• Clearly marked placeholders only where you edit</li>
                  <li>• Layout, spacing, and fonts controlled via DOCX</li>
                  <li>• Same structure and tone every single time</li>
                  <li>• Built for reliable DOCX/PDF export</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature grid derived from your points 1–7 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why professionals choose Formatly
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Structured, legally-acceptable documents"
              description="Templates for visa letters, proposals, refund letters and more — each with the correct sections, tone, and flow."
            />
            <FeatureCard
              title="Consistency, not randomness"
              description="Generate the same document type 10 times and get the same reliable structure and styling every time."
            />
            <FeatureCard
              title="Pixel-perfect DOCX layout"
              description="Margins, line spacing, heading hierarchy, and signature areas are all handled by real Word templates."
            />
            <FeatureCard
              title="Protected formatting"
              description="Users only edit placeholders. The underlying template stays intact, so your document always looks professionally designed."
            />
            <FeatureCard
              title="Category-specific experiences"
              description="A visa expiration notice is not a website proposal. Formatly treats each document type as its own product."
            />
            <FeatureCard
              title="No more blank page"
              description="Instead of 'write something', users simply fill fields like client name, passport number, reason, scope, timeline, and terms."
            />
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-4 flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-6 shadow-[0_0_40px_rgba(16,185,129,0.25)] md:flex-row md:items-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold sm:text-xl">
              Ready to see the difference in your own document?
            </h3>
            <p className="max-w-xl text-sm text-slate-300">
              Start with a template, fill in a few placeholders, and download a DOCX that you can
              send to a client, submit to an embassy, or share with your HR team.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="gap-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              <Link href="/templates">
                Get started with templates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-600 bg-slate-900/60 text-slate-100 hover:bg-slate-800"
            >
              <Link href="/builder/demo">
                Preview a sample document
              </Link>
            </Button>
          </div>
        </section>
      </section>
    </main>
  )
}

type FeatureCardProps = {
  title: string
  description: string
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <Card className="h-full border-slate-700 bg-slate-950/70">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-xs text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-300 sm:text-sm">{description}</p>
      </CardContent>
    </Card>
  )
}
