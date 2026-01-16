// lib/docLayout.ts
import type { DocLayoutStyle } from "@/types/doc-layout"

/**
 * Visual styles supported in the editor (Offer-letter MVP only)
 */
const DOC_LAYOUTS: Record<string, DocLayoutStyle> = {
  default: {
    shellVariant: "page",
    showLogo: false,
    showSignature: false,
    pageWidthPx: 794,
    minPageHeightPx: 1123,
  },

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

  offer_classic_border: {
    shellVariant: "page",
    showLogo: true,
    showSignature: true,
    pageWidthPx: 794,
    minPageHeightPx: 1123,
  },
}

/**
 * Explicit slug → default layout mapping
 */
const SLUG_STYLE_OVERRIDES: Record<string, keyof typeof DOC_LAYOUTS> = {
  "offer-letter-standard": "offer_modern_blue",
}

/**
 * Decide which layout to use for a given template slug + design key.
 */
export function getLayoutForTemplateSlug(
  slug?: string | null,
  designKey?: string | null,
): DocLayoutStyle {
  // 1️⃣ Explicit designKey always wins
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
