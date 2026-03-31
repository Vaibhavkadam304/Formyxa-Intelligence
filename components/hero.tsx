import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-20 pb-24 md:pt-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-14 px-4 sm:px-6 lg:flex-row lg:items-start lg:px-8">

        {/* LEFT */}
        <div className="max-w-xl text-center lg:text-left space-y-7">

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.05] tracking-tight text-foreground">
            Contracts. Structured.
            <br />
            <span className="font-semibold tracking-tight text-primary">
               Locked.
            </span>
          </h1>

          <p className="text-base md:text-lg max-w-[46ch] text-muted-foreground">
            Protect your agency’s revenue with structured Statements of Work, retainers, and service agreements built with built-in guardrails.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-3">
            <Button
              asChild
              size="lg"
              className="
                rounded-lg px-6
                bg-primary text-primary-foreground
                hover:bg-primary/95
                transition-colors
              "
            >
              <Link href="/choose">Create Protected SOW</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="ghost"
              className="
                rounded-lg px-6
                text-primary
                hover:bg-muted
                transition
              "
            >
              <Link href="/samples">View example documents →</Link>
            </Button>
          </div>

          {/* workflow pills */}
          <div className="flex flex-wrap gap-3 pt-4 justify-center lg:justify-start">
            {[
              "Select structure",
              "Define scope & terms",
              "Lock & export",
            ].map((label, i) => (
              <div
                key={label}
                className="
                  flex items-center gap-2
                  rounded-full
                  border border-border
                  bg-card/80
                  px-4 py-1.5
                  text-sm text-muted-foreground
                "
              >
                <span className="font-medium text-foreground">{i + 1}</span>
                {label}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/60 pt-2">
            No credit card required · Designed to prevent scope creep and payment disputes.
          </p>
        </div>

        {/* RIGHT */}
        <div className="relative w-full max-w-md lg:max-w-lg">

          <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/5" />

          <div className="relative w-full max-w-lg lg:max-w-xl">
            <img
              src="/images/hero-img1.png"
              alt="Formyxa incident document template preview"
              className="w-full"
            />
          </div>

          <div
            className="
              absolute -bottom-6 right-6
              w-[260px]
              rounded-2xl
              bg-card
              p-4
              border border-border
              border-t border-primary/30
            "
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-foreground">
                Scope Guard: Enabled
              </span>
            </div>

            <p className="text-muted-foreground leading-snug text-sm">
              This document follows the company’s approved structure.
            </p>

            <div className="mt-2 text-emerald-600 font-medium text-sm">
              ✓ Locked · Ready for export
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
