// ─────────────────────────────────────────────────────────────────────────────
// SECTION QUALITY ENGINE
// Pure client-side rules that analyse the TEXT content of narrative paragraphs.
// Runs after every doc change. Zero AI. Zero API.
// Flags things like "Background has no measurable objective."
// ─────────────────────────────────────────────────────────────────────────────

export type SectionQualityFlag = {
  id: string;
  section: string;      // heading text, e.g. "Background"
  severity: "warning" | "info";
  message: string;      // shown in panel
  hint: string;         // short fix suggestion
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function hasMetric(text: string): boolean {
  // Contains a number, percentage, date, or measurable quantity
  return /\d/.test(text) ||
    /\b(increase|reduce|improve|achieve|deliver|complete|target|goal|by|within)\b/i.test(text);
}

function hasExclusionLanguage(text: string): boolean {
  return /\b(not include|not cover|exclud|out of scope|does not|will not|outside)\b/i.test(text);
}

function hasClientName(text: string): boolean {
  return /\b(client|company|organisation|organization|business)\b/i.test(text);
}

function isTemplateDefault(text: string): boolean {
  // Heuristic: template defaults tend to be professional and include "Service Provider"
  // User notes tend to be messy, short, and informal
  return text.includes("Service Provider") || text.includes("hereby agrees");
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-section rule definitions
// ─────────────────────────────────────────────────────────────────────────────

type SectionRule = {
  matchHeading: (h: string) => boolean;
  checks: Array<{
    id: string;
    test: (text: string) => boolean; // returns TRUE when there is a problem
    severity: "warning" | "info";
    message: string;
    hint: string;
  }>;
};

const SECTION_RULES: SectionRule[] = [
  {
    matchHeading: (h) => /background/i.test(h),
    checks: [
      {
        id: "bg_no_metric",
        test: (t) => !isTemplateDefault(t) && !hasMetric(t) && wordCount(t) > 5,
        severity: "warning",
        message: "Background is missing a measurable business objective.",
        hint: "Add a specific goal, metric, or timeline (e.g. 'targeting 30% faster load times').",
      },
      {
        id: "bg_no_client",
        test: (t) => !isTemplateDefault(t) && !hasClientName(t) && wordCount(t) > 5,
        severity: "info",
        message: "Background doesn't reference the Client or their business context.",
        hint: "Mention who commissioned this work and why.",
      },
    ],
  },
  {
    matchHeading: (h) => /scope|summary of scope/i.test(h),
    checks: [
      {
        id: "scope_no_exclusions",
        test: (t) => !isTemplateDefault(t) && !hasExclusionLanguage(t) && wordCount(t) > 10,
        severity: "warning",
        message: "Scope section doesn't define what's excluded.",
        hint: "Add 'This does not include...' to prevent scope creep disputes.",
      },
    ],
  },
  {
    matchHeading: (h) => /objective/i.test(h),
    checks: [
      {
        id: "obj_no_metric",
        test: (t) => !hasMetric(t) && wordCount(t) > 5,
        severity: "info",
        message: "Objectives section has no measurable targets.",
        hint: "Add specific numbers or dates (e.g. 'by June 30' or 'improve by 20%').",
      },
    ],
  },
  {
    matchHeading: (h) => /termination/i.test(h),
    checks: [
      {
        id: "term_no_days",
        test: (t) => wordCount(t) > 5 && !/\d+[\s-]?day/i.test(t),
        severity: "warning",
        message: "Termination clause doesn't specify a notice period in days.",
        hint: "Add a specific day count (e.g. '14 days written notice').",
      },
    ],
  },
  {
    matchHeading: (h) => /additional service|out.of.scope|change/i.test(h),
    checks: [
      {
        id: "aos_no_rate",
        test: (t) => wordCount(t) > 5 && !/rate|hour|per|₹|\$|fee/i.test(t),
        severity: "info",
        message: "Additional services clause has no billing rate.",
        hint: "Specify the hourly rate for out-of-scope work.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Extract narrative sections from TipTap doc JSON
// Returns { heading, paragraphText } for sections with real prose content
// ─────────────────────────────────────────────────────────────────────────────

type NarrativeSection = {
  heading: string;
  paragraphs: string[];
};

function extractNarrativeSections(doc: any): NarrativeSection[] {
  const sections: NarrativeSection[] = [];
  let current: NarrativeSection | null = null;

  function walk(node: any) {
    if (!node || typeof node !== "object") return;

    if (node.type === "heading" && node.attrs?.level === 2) {
      const text = (node.content ?? [])
        .map((c: any) => c.text || "")
        .join("")
        .trim()
        .replace(/^\d+\.\s*/, "");
      current = { heading: text, paragraphs: [] };
      sections.push(current);
      return;
    }

    if (node.type === "paragraph" && current) {
      // Extract plain text from paragraph, skip formyxaField nodes
      const text = (node.content ?? [])
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text || "")
        .join("")
        .trim();
      if (text.length > 0) {
        current.paragraphs.push(text);
      }
      return;
    }

    if (Array.isArray(node.content)) node.content.forEach(walk);
  }

  (doc?.content ?? []).forEach(walk);
  return sections;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: run all section quality rules against a TipTap doc
// ─────────────────────────────────────────────────────────────────────────────

export function runSectionQuality(doc: any): SectionQualityFlag[] {
  const sections = extractNarrativeSections(doc);
  const flags: SectionQualityFlag[] = [];

  for (const section of sections) {
    const combinedText = section.paragraphs.join(" ");
    if (!combinedText || combinedText.length < 10) continue;

    for (const rule of SECTION_RULES) {
      if (!rule.matchHeading(section.heading)) continue;

      for (const check of rule.checks) {
        if (check.test(combinedText)) {
          flags.push({
            id: `${check.id}_${section.heading}`,
            section: section.heading,
            severity: check.severity,
            message: check.message,
            hint: check.hint,
          });
        }
      }
    }
  }

  return flags;
}
