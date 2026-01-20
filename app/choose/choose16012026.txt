"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import Header from "@/components/header"
import Footer from "@/components/footer"
import type { TemplateConfig } from "@/lib/useCases"
import { getTemplatesForCategory } from "@/lib/useCases"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

/* ---------------- ORG-FIRST CATEGORIES ---------------- */

type OrgCategory = {
  id: string
  label: string
  description: string
  icon: string
  templateCategoryIds: string[]
}

const ORG_CATEGORIES: OrgCategory[] = [
  {
    id: "hr",
    label: "HR & People Operations",
    description:
      "Hiring, employment lifecycle, and internal people processes.",
    icon: "👥",
    templateCategoryIds: ["hr-corporate"],
  },
  {
    id: "finance",
    label: "Finance & Administration",
    description:
      "Official finance-related communications such as payment and refund confirmations.",
    icon: "💼",
    templateCategoryIds: ["banking-finance"],
  },
  {
    id: "legal",
    label: "Legal & Compliance",
    description:
      "Company-approved legal and compliance documents.",
    icon: "⚖️",
    templateCategoryIds: ["legal-semi-legal"],
  },
]

/* ---------------- OFFER DESIGN VARIANTS ---------------- */

type OfferDesignKey =
  | "offer_modern_blue"
  | "offer_minimal_plain"
  | "offer_classic_border"
  | "offer_green_wave"

const OFFER_DESIGNS = [
  { key: "offer_modern_blue", label: "Modern blue header" },
  { key: "offer_minimal_plain", label: "Minimal plain" },
  { key: "offer_classic_border", label: "Classic border" },
  { key: "offer_green_wave", label: "Fresh green wave" },
]

type TemplateWithImage = TemplateConfig & {
  previewImage?: string
}

/* ---------------- PAGE ---------------- */

export default function ChoosePurposePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedOrgCategoryId, setSelectedOrgCategoryId] =
    useState<string | null>(null)

  const [openDesignForSlug, setOpenDesignForSlug] =
    useState<string | null>(null)

  const selectedOrgCategory = ORG_CATEGORIES.find(
    (c) => c.id === selectedOrgCategoryId,
  )

  const templates: TemplateWithImage[] =
    selectedOrgCategory?.templateCategoryIds.flatMap((catId) =>
      getTemplatesForCategory(catId),
    ) ?? []

  useEffect(() => {
    const fromQuery = searchParams.get("category")
    if (fromQuery) setSelectedOrgCategoryId(fromQuery)
  }, [searchParams])

  /* ---------- ROUTING ---------- */

  const closeAll = () => {
    setSelectedOrgCategoryId(null)
    setOpenDesignForSlug(null)
  }

  const handleUseTemplate = (tpl: TemplateConfig) => {
    if (tpl.slug === "offer-letter-standard") {
      setOpenDesignForSlug(tpl.slug)
      return
    }

    closeAll()
    tpl.customRoute
      ? router.push(tpl.customRoute)
      : router.push(`/new?template=${encodeURIComponent(tpl.slug)}`)
  }

  const handleOfferDesignSelect = (design: OfferDesignKey) => {
    closeAll()
    router.push(
      `/new?template=offer-letter-standard&design=${design}`,
    )
  }

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 pt-28 pb-20 space-y-12">

        {/* -------- HEADER -------- */}
        <section className="text-center space-y-3">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            Document categories
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Official documents used by organizations to operate
          </h1>

          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Standardized document categories your company relies on — starting with HR and people operations.
          </p>

          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            Each document is created once, approved, and reused across your organization.
          </p>
        </section>

        {/* -------- CATEGORY GRID -------- */}
        <section>
          <div className="rounded-2xl border border-border bg-muted/30 px-6 py-8">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              {ORG_CATEGORIES.map((cat) => {
                const isComingSoon =
                  cat.id === "finance" || cat.id === "legal"

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (cat.id === "hr") {
                        router.push("/org/hr/offer-letter")
                        return
                      }
                      if (isComingSoon) return
                      setSelectedOrgCategoryId(cat.id)
                    }}
                    className={`
                      relative group h-[200px]
                      rounded-xl border p-5 text-left transition
                      ${
                        isComingSoon
                          ? "bg-muted/40 border-border cursor-not-allowed opacity-70"
                          : "bg-card border-border hover:-translate-y-0.5 hover:shadow-sm"
                      }
                    `}
                  >
                    {/* Primary category accent */}
                    {cat.id === "hr" && (
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/70 rounded-t-xl" />
                    )}

                    {/* Muted icon */}
                    <div className="text-2xl opacity-80 grayscale-[20%]">
                      {cat.icon}
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-foreground">
                      {cat.label}
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {cat.description}
                    </p>

                    {/* Neutral coming soon */}
                    {isComingSoon && (
                      <div className="mt-3 inline-block rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Coming soon
                      </div>
                    )}

                    {/* Calmer explore link */}
                    {cat.id === "hr" && (
                      <div className="mt-4 text-[11px] text-muted-foreground">
                        Explore company-ready documents →
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      {/* -------- MODAL -------- */}
      <Dialog open={!!selectedOrgCategoryId} onOpenChange={closeAll}>
        <DialogContent className="max-w-5xl bg-transparent border-0 p-0">
          <VisuallyHidden>
            <DialogTitle>Document list</DialogTitle>
          </VisuallyHidden>

          <div className="rounded-2xl bg-card border border-border max-h-[80vh] flex flex-col shadow-lg">
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  {selectedOrgCategory?.label}
                </DialogTitle>
                <DialogDescription>
                  Select an approved document used consistently across your organization.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-6 py-5 overflow-y-auto grid gap-4 md:grid-cols-2">
              {templates.map((tpl) => {
                const showDesignPicker =
                  tpl.slug === "offer-letter-standard" &&
                  openDesignForSlug === tpl.slug

                return (
                  <div key={tpl.slug} className="space-y-2">
                    <button
                      onClick={() => handleUseTemplate(tpl)}
                      className="
                        group w-full rounded-xl
                        border border-border bg-card
                        p-4 text-left transition
                        hover:-translate-y-0.5 hover:shadow-sm
                      "
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {tpl.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {tpl.description}
                      </p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {tpl.slug === "offer-letter-standard"
                          ? "Choose official design →"
                          : "Use as company document →"}
                      </div>
                    </button>

                    {showDesignPicker && (
                      <div className="grid gap-2 sm:grid-cols-3">
                        {OFFER_DESIGNS.map((d) => (
                          <button
                            key={d.key}
                            onClick={() =>
                              handleOfferDesignSelect(
                                d.key as OfferDesignKey,
                              )
                            }
                            className="
                              rounded-lg border border-border
                              bg-card p-2 text-xs
                              hover:border-primary/60
                            "
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {templates.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No documents configured yet.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
