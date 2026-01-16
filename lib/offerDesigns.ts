// // lib/offerDesigns.ts

// export type OfferDesignKey =
//   | "offer_modern_blue"
//   | "offer_minimal_plain"
//   | "offer_classic_border";

// export const OFFER_DESIGNS: {
//   key: OfferDesignKey;
//   label: string;
//   description: string;
//   preview?: string; // optional image path
// }[] = [
//   {
//     key: "offer_modern_blue",
//     label: "Modern blue header",
//     description: "Blue wave header + HR signature block.",
//     preview: "/previews/offer-modern-blue.png",
//   },
//   {
//     key: "offer_minimal_plain",
//     label: "Minimal plain",
//     description: "No header image, just clean text + signature.",
//     preview: "/previews/offer-minimal-plain.png",
//   },
//   {
//     key: "offer_classic_border",
//     label: "Classic border",
//     description: "Thin border, serif headings, formal HR feel.",
//     preview: "/previews/offer-classic-border.png",
//   },
// ];



// lib/offerDesigns.ts

export type OfferDesignKey =
  | "offer_modern_blue"
  | "offer_minimal_plain"
  | "offer_classic_border";

export type OfferDesign = {
  key: OfferDesignKey;
  label: string;
  description: string;
  preview?: string;
  cssClass: string; // 🔑 maps to CSS
};

export const OFFER_DESIGNS: OfferDesign[] = [
  {
    key: "offer_modern_blue",
    label: "Modern blue header",
    description: "Blue header with clean HR layout.",
    preview: "/previews/offer-modern-blue.png",
    cssClass: "offer-modern-blue",
  },
  {
    key: "offer_minimal_plain",
    label: "Minimal plain",
    description: "Clean text-only professional offer letter.",
    preview: "/previews/offer-minimal-plain.png",
    cssClass: "offer-minimal-plain",
  },
  {
    key: "offer_classic_border",
    label: "Classic border",
    description: "Formal bordered layout with serif headings.",
    preview: "/previews/offer-classic-border.png",
    cssClass: "offer-classic-border",
  },
];
