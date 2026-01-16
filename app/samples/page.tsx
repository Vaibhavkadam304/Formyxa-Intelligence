import Link from "next/link"
import { Button } from "@/components/ui/button"

const SAMPLE_DOCS = [
  {
    title: "Offer Letter",
    description: "Standardized employment offer with approved compensation and terms.",
    preview: "/images/samples/offer-letter.jpg",
  },
  {
    title: "Employment Contract",
    description: "Company-approved employment agreement with fixed clauses.",
    preview: "/images/samples/employment-contract.jpg",
  },
  {
    title: "NDA",
    description: "Confidentiality agreement with locked legal language.",
    preview: "/images/samples/nda.png",
  },
  {
    title: "Internship Letter",
    description: "Structured internship confirmation document.",
    preview: "/images/samples/internship-letter.png",
  },
]

export default function SamplesPage() {
  return (
    <section className="bg-background pt-20 pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-2xl space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Example documents
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            These are sample documents generated using Formyxa’s approved structures.
            Organizations define structure once — then reuse it safely across teams.
          </p>
        </div>

        {/* Samples grid */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {SAMPLE_DOCS.map((doc) => (
            <div
              key={doc.title}
              className="space-y-4"
            >
              {/* Preview */}
              <div className="bg-background">
                <img
                  src={doc.preview}
                  alt={`${doc.title} example`}
                  className="w-full border border-border"
                />
              </div>

              {/* Meta */}
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">
                  {doc.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {doc.description}
                </p>

                <div className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-600">✔ Approved structure</span>
                  <span className="text-emerald-600">✔ Locked wording</span>
                  <span className="text-emerald-600">✔ Export-ready</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-start gap-4">
          <Button asChild size="lg">
            <Link href="/choose">
              Set up your company document
            </Link>
          </Button>

          <p className="text-xs text-muted-foreground">
            No credit card required · Built for real organizational workflows
          </p>
        </div>

      </div>
    </section>
  )
}
