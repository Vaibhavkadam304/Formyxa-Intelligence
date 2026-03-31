import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CTA() {
  return (
    <section
      id="pricing"
      className="py-20 md:py-28 bg-background"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div
          className="
            relative mx-auto max-w-3xl
            rounded-2xl
            border border-border
            bg-card
            px-6 py-10 sm:px-10 sm:py-14
            text-center
            shadow-sm
          "
        >
          {/* Trust badge */}
          <div
            className="
              inline-flex items-center gap-2
              rounded-full
              border border-border
              bg-muted
              px-3 py-1
              text-xs font-medium
              text-muted-foreground
            "
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            Built for agencies and freelancers
          </div>

          {/* Headline */}
          <h2 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight text-foreground text-balance">
            Ready to lock in your next agreement?
          </h2>

          {/* Supporting copy */}
          <p className="mt-4 max-w-xl mx-auto text-base md:text-lg text-muted-foreground">
            Create structured Statements of Work and service agreements with built-in scope and payment guardrails — ready to export and sign.
          </p>

          {/* CTA */}
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              asChild
              className="
                rounded-lg px-6 py-2.5
                bg-primary text-primary-foreground
                hover:bg-primary/90
                transition-colors
              "
            >
              <Link href="/choose">Create Protected SOW</Link>
            </Button>
          </div>

          {/* Reassurance row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>✓ No credit card required</span>
            <span>✓ Export-ready DOCX & PDF</span>
            <span>✓ Structured guardrails built in</span>
          </div>
        </div>
      </div>
    </section>
  )
}