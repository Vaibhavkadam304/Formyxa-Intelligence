"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Send, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/header"
import Footer from "@/components/footer"

/* ---------------- TYPES ---------------- */

type DesignKey =
  | "offer_modern_blue"
  | "offer_minimal_plain"
  | "offer_classic_border"
  | "offer_green_wave"

interface DesignOption {
  id: DesignKey
  name: string
  description: string
  imageUrl: string
}

/* ---------------- DATA ---------------- */

const DESIGNS: DesignOption[] = [
  {
    id: "offer_modern_blue",
    name: "Modern blue header",
    description: "Blue header band with HR signature block.",
    imageUrl: "/previews/offer-modern-blue.png",
  },
  {
    id: "offer_minimal_plain",
    name: "Minimal plain",
    description: "Clean text-only format, company standard.",
    imageUrl: "/previews/offer-modern-pale.jpg",
  },
  {
    id: "offer_classic_border",
    name: "Classic border",
    description: "Formal bordered layout used in enterprises.",
    imageUrl: "/previews/offer-classic-border.jpg",
  },
  {
    id: "offer_green_wave",
    name: "Fresh green wave",
    description: "Modern layout with subtle green header.",
    imageUrl: "/previews/offer-modern-green.jpg",
  },
]

const DOC_TO_TEMPLATE_SLUG: Record<string, string> = {
  "offer-letter": "offer-letter-standard",
  "appointment-letter": "appointment-letter-standard",
  "resignation-letter": "resignation-letter-standard",
}

/* ---------------- PAGE ---------------- */

export default function HROfferWorkspacePage() {
  const router = useRouter()

  const [activeDoc, setActiveDoc] = useState("offer-letter")
  const [preset, setPreset] = useState("corporate")
  const [selectedDesign, setSelectedDesign] =
    useState<DesignKey>("offer_modern_blue")

  const selectedDesignData = DESIGNS.find(
    (d) => d.id === selectedDesign,
  )

  const handleContinue = () => {
    const params = new URLSearchParams({
      template: DOC_TO_TEMPLATE_SLUG[activeDoc],
      preset,
      design: selectedDesign,
    })

    router.push(`/new?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="mx-auto max-w-7xl w-full px-6 pt-28 pb-20 flex-1">
        <div className="flex gap-10 items-start pt-1">

          {/* ---------------- SIDEBAR ---------------- */}
          <aside className="w-64 shrink-0 sticky top-28">
            <div className="rounded-xl bg-card border border-border/60 p-5">

              <h3 className="text-sm font-medium text-foreground mb-1">
                HR & People Operations
              </h3>

              <Badge
                variant="secondary"
                className="mb-5 text-[10px] uppercase tracking-wide"
              >
                HR documents
              </Badge>

              <nav className="space-y-1">
                {[
                  { id: "offer-letter", label: "Offer letter", icon: Send },
                  { id: "appointment-letter", label: "Appointment letter", icon: FileText },
                  { id: "resignation-letter", label: "Resignation letter", icon: FileText },
                ].map((item) => {
                  const Icon = item.icon
                  const isActive = activeDoc === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveDoc(item.id)}
                      className={`
                        w-full flex items-center gap-3
                        rounded-lg px-3 py-2.5 text-sm transition
                        ${
                          isActive
                            ? "bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted/60"
                        }
                      `}
                    >
                      <Icon className="h-4 w-4 opacity-70" />
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* ---------------- MAIN ---------------- */}
          <div className="flex-1 space-y-8">

            {/* Header */}
            <div className="grid grid-cols-[1fr_auto] items-start gap-6">
              {/* Left: title */}
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground font-semibold mt-1">
                  Define your company’s official offer letter
                </h1>

                <p className="text-sm text-muted-foreground max-w-lg mt-1">
                  Structure first, design second — create a document your organization can reuse with confidence.
                </p>
              </div>

              {/* Right: status */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Approved company format · Ready to export
              </div>
            </div>


            {/* Presets */}
            <div className="inline-flex rounded-md bg-muted p-0.5 h-10">
              {[
                { key: "startup", label: "Startup" },
                { key: "corporate", label: "Corporate" },
                { key: "custom", label: "Custom / Legacy" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPreset(item.key)}
                  className={`
                    h-9 px-5 text-sm rounded-sm transition
                    ${
                      preset === item.key
                        ? "bg-card text-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* ---------------- CORE ROW ---------------- */}
            <div className="flex gap-10 items-start">

              {/* LEFT: CONTROLS */}
              <div className="w-[34%]">
                <div className="rounded-xl bg-card border border-border/40 p-5 space-y-4">

                  <h3 className="text-sm font-medium text-foreground font-semibold">
                    Choose format
                  </h3>

                  <div className="space-y-2">
                    {DESIGNS.map((design) => {
                      const isSelected = selectedDesign === design.id

                      return (
                        <button
                          key={design.id}
                          onClick={() => setSelectedDesign(design.id)}
                          className={`
                            relative w-full flex gap-3 rounded-md
                            px-3 py-2.5 text-left transition
                            ${
                              isSelected
                                ? "bg-muted"
                                : "hover:bg-muted/60"
                            }
                          `}
                        >
                          {isSelected && (
                            <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary/60 rounded-full" />
                          )}

                          <div className="mt-0.5">
                            {isSelected ? (
                              <CheckCircle2 className="h-5 w-5 text-primary/80" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border border-border/60" />
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {design.name}
                            </p>
                            {isSelected && (
                              <p className="text-xs text-muted-foreground">
                                {design.description}
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="pt-3 border-t border-border/60">
                    <Button
                        onClick={handleContinue}
                        className="
                          w-full h-10 text-sm font-medium
                          bg-primary text-primary-foreground
                          hover:bg-primary/90
                        "
                      >
                        Use this design
                      </Button>
                  </div>
                </div>
              </div>

              {/* RIGHT: PREVIEW (CENTER-RIGHT) */}
              <div className="w-[58%] sticky top-28 flex justify-center">
                <div className="relative">

                  {/* Stage */}
                  <div className="absolute -inset-4 rounded-3xl bg-muted/40 -z-10" />

                  {/* Status */}
                  {/* <div className="mb-1 text-xs text-muted-foreground flex items-center gap-2 justify-center">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Approved company format · Ready to export
                  </div> */}

                  {/* Document */}
                  <div
                    className="
                      bg-card
                      rounded-xl
                      border border-border/60
                      shadow-[0_28px_56px_-28px_rgba(0,0,0,0.25)]
                      overflow-hidden
                    "
                    style={{ maxWidth: 780 }}
                  >
                    <img
                      src={selectedDesignData?.imageUrl}
                      alt="Official document preview"
                      className="w-full h-auto block object-contain"
                      style={{
                        transform: "scale(1.02)",
                        transformOrigin: "top center",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
