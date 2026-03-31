// ─────────────────────────────────────────────────────────────────────────────
// lib/intelligence/conflictDetector.ts
//
// Scans a TipTap document for sections that contain contradictory values
// about the same legal concept (payment terms, notice periods, liability caps).
//
// Returns ConflictAlert[] — same type used by ClauseReviewModal.
// ─────────────────────────────────────────────────────────────────────────────

import type { ConflictAlert } from "@/components/editor/ClauseReviewModal";

// ─────────────────────────────────────────────────────────────────────────────
// Extract named sections from the doc as { heading, text }[]
// ─────────────────────────────────────────────────────────────────────────────

type DocSection = { heading: string; text: string };

function extractSections(doc: any): DocSection[] {
  const sections: DocSection[] = [];
  let current: DocSection | null = null;

  function walk(node: any) {
    if (!node || typeof node !== "object") return;

    if (node.type === "heading" && node.attrs?.level === 2) {
      const heading = (node.content ?? [])
        .map((c: any) => c.text || "")
        .join("")
        .trim()
        .replace(/^\d+\.\s*/, "");
      current = { heading, text: "" };
      sections.push(current);
      return;
    }

    if (current && node.type === "text" && node.text) {
      current.text += node.text + " ";
    }

    if (Array.isArray(node.content)) node.content.forEach(walk);
  }

  (doc?.content ?? []).forEach(walk);
  return sections;
}

// ─────────────────────────────────────────────────────────────────────────────
// Value extractors for specific legal concepts
// ─────────────────────────────────────────────────────────────────────────────

type ConceptExtractor = {
  id: string;
  description: string;
  // Returns the matched value string, or null if not found
  extract: (text: string) => string | null;
};

const CONCEPT_EXTRACTORS: ConceptExtractor[] = [
  {
    id: "payment_days",
    description: "Payment due date",
    extract: (text) => {
      const m = text.match(/(\d+)\s*days?\s*(after|from|of|within|net)/i)
        ?? text.match(/net\s*(\d+)/i)
        ?? text.match(/within\s*(\d+)\s*days?/i)
        ?? text.match(/due\s+(?:within\s+)?(\d+)\s*days?/i);
      if (m) return `${m[1]} days`;
      if (/immediately|on receipt|upon receipt/i.test(text)) return "immediate";
      return null;
    },
  },
  {
    id: "notice_days",
    description: "Termination notice period",
    extract: (text) => {
      if (!/terminat|notice|cancell/i.test(text)) return null;
      const m = text.match(/(\d+)\s*days?\s*(?:written\s+)?notice/i)
        ?? text.match(/notice\s+(?:period\s+of\s+)?(\d+)\s*days?/i)
        ?? text.match(/(\d+)[- ]day\s+notice/i);
      return m ? `${m[1]} days notice` : null;
    },
  },
  {
    id: "late_interest",
    description: "Late payment interest rate",
    extract: (text) => {
      if (!/late|overdue|interest/i.test(text)) return null;
      const m = text.match(/([\d.]+)\s*%\s*(?:per\s+month|monthly|p\.?m\.?)/i)
        ?? text.match(/interest\s+(?:at|of)\s+([\d.]+)\s*%/i);
      return m ? `${m[1]}% per month` : null;
    },
  },
  {
    id: "liability_cap",
    description: "Liability cap amount",
    extract: (text) => {
      if (!/liabilit|cap|limit/i.test(text)) return null;
      const m = text.match(/(?:cap(?:ped)?|limit(?:ed)?)\s+(?:at|to)\s+([₹$€£]?\s*[\d,]+(?:\s*(?:lakh|lakhs|crore|k|K|M))?)/i)
        ?? text.match(/([₹$€£]?\s*[\d,]+(?:\s*(?:lakh|lakhs|crore|k|K|M))?)\s+(?:cap|limit)/i);
      return m ? m[1].trim() : null;
    },
  },
  {
    id: "ip_ownership",
    description: "IP / work product ownership",
    extract: (text) => {
      if (!/intellectual|ip\b|copyright|ownership|work product/i.test(text)) return null;
      if (/client\s+(?:shall\s+)?(?:own|retain|hold)/i.test(text)) return "Client owns";
      if (/service\s*provider\s+(?:shall\s+)?(?:own|retain|hold)/i.test(text)) return "Provider owns";
      if (/assigned?\s+to\s+client/i.test(text)) return "Assigned to Client";
      if (/assigned?\s+to\s+(?:service\s*)?provider/i.test(text)) return "Assigned to Provider";
      return null;
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Run conflict detection
// ─────────────────────────────────────────────────────────────────────────────

export function detectConflicts(doc: any): ConflictAlert[] {
  const sections = extractSections(doc);
  const conflicts: ConflictAlert[] = [];

  for (const extractor of CONCEPT_EXTRACTORS) {
    // Find all sections that mention this concept
    const mentions: Array<{ heading: string; value: string }> = [];

    for (const section of sections) {
      const value = extractor.extract(section.text);
      if (value) {
        mentions.push({ heading: section.heading, value });
      }
    }

    // If two sections have different values for the same concept → conflict
    if (mentions.length >= 2) {
      for (let i = 0; i < mentions.length - 1; i++) {
        for (let j = i + 1; j < mentions.length; j++) {
          const a = mentions[i];
          const b = mentions[j];
          // Only flag if the values are genuinely different
          if (a.value.toLowerCase().trim() !== b.value.toLowerCase().trim()) {
            conflicts.push({
              id: `${extractor.id}-${i}-${j}`,
              sectionA: a.heading,
              valueA: a.value,
              sectionB: b.heading,
              valueB: b.value,
              description: `${extractor.description} is defined differently in "${a.heading}" and "${b.heading}". This contradiction could make the contract unenforceable.`,
            });
          }
        }
      }
    }
  }

  return conflicts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get conflicts relevant to a specific clause topic
// (used to filter which conflicts to show per risk card)
// ─────────────────────────────────────────────────────────────────────────────

export function getConflictsForSection(
  allConflicts: ConflictAlert[],
  sectionTitle: string,
): ConflictAlert[] {
  const lower = sectionTitle.toLowerCase();
  return allConflicts.filter(
    (c) =>
      c.sectionA.toLowerCase().includes(lower) ||
      c.sectionB.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower),
  );
}