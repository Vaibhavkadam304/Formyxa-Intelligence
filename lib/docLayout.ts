// lib/docLayout.ts
import type { DocLayoutStyle } from "@/components/editor/types/doc-layout"

/**
 * Visual styles supported in the editor
 */
const DOC_LAYOUTS: Record<string, DocLayoutStyle> = {

  // ── Generic fallback ──────────────────────────────────────────────────────
  default: {
    shellVariant: "page",
    showLogo: false,
    showSignature: false,
    pageWidthPx: 794,
    minPageHeightPx: 1123,
  },

  // ── SOW / Agreements / Retainers / Legal docs ─────────────────────────────
  // All contract/legal templates share this layout.
  // The h2 left-border accent styling comes from globals.css — no extra config needed here.
  sow_standard: {
    shellVariant: "page",
    showHeader: true,         // show the filename title banner
    headerEditable: false,
    showLogo: false,
    showSignature: false,
    pageWidthPx: 794,
    minPageHeightPx: 1123,
  },

  // ── Incident / Postmortem (no header banner) ──────────────────────────────
  incident_plain: {
    shellVariant: "page",
    showHeader: false,
    headerEditable: false,
    showLogo: false,
    showSignature: false,
    pageWidthPx: 794,
    minPageHeightPx: 1123,
  },

  // ── Offer letters ─────────────────────────────────────────────────────────
  offer_modern_blue: {
    shellVariant: "page",
    headerImageUrl: "/graphics/offer/header-mod-blue.png",
    footerImageUrl: "/graphics/offer/footer-wave-blue.png",
    showLogo: true,
    showSignature: true,
    pageWidthPx: 794,
    minPageHeightPx: 1123,
  },

  offer_green_wave: {
    shellVariant: "page",
    headerImageUrl: "/graphics/offer/header-green-wave.webp",
    footerImageUrl: "/graphics/offer/footer-green-wave.webp",
    showLogo: true,
    showSignature: true,
    pageWidthPx: 794,
    minPageHeightPx: 1123,
  },

  offer_minimal_plain: {
    shellVariant: "page",
    showLogo: true,
    showSignature: true,
    pageWidthPx: 794,
    minPageHeightPx: 1123,
  },
}

/**
 * Explicit slug → default layout mapping.
 *
 * Convention:
 *  - All *-sow-*, *-retainer-*, *-agreement-*, *-nda-* slugs → sow_standard
 *  - Offer letters → their specific design key
 *  - Incident → incident_plain
 *
 * Add new templates here — no code changes needed elsewhere.
 */
const SLUG_STYLE_OVERRIDES: Record<string, keyof typeof DOC_LAYOUTS> = {
  // ── SOW / Legal / Agreement templates ──
  "anti-scope-creep-sow-core":          "sow_standard",
  "creative-retainer-agreement-core":   "sow_standard",

  // ── Future templates (add as you create them) ──
  // "marketing-retainer-core":         "sow_standard",
  // "service-agreement-core":          "sow_standard",
  // "nda-core":                        "sow_standard",
  // "consulting-agreement-core":       "sow_standard",

  // ── Offer letters ──
  "offer-letter-standard":              "offer_modern_blue",

  // ── Incident / RCA ──
  "incident-postmortem-core":           "incident_plain",
};

export function getLayoutForTemplateSlug(
  slug?: string | null,
  designKey?: string | null,
): DocLayoutStyle {
  // 1️⃣ Explicit designKey always wins (e.g. user manually picked a theme)
  if (designKey && DOC_LAYOUTS[designKey]) {
    return DOC_LAYOUTS[designKey]
  }

  // 2️⃣ Slug-based default
  if (slug && SLUG_STYLE_OVERRIDES[slug]) {
    return DOC_LAYOUTS[SLUG_STYLE_OVERRIDES[slug]]
  }

  // 3️⃣ Safe fallback
  return DOC_LAYOUTS.default
}