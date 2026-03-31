import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 HELPERS — Structure / Parser
// ─────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_PREFIXES = [
  "enter ", "provide ", "specify ", "describe ",
  "state ", "define ", "insert ", "add ", "write ",
];

function isPlaceholderText(text: string): boolean {
  if (!text || text.trim().length === 0) return true;
  const lower = text.trim().toLowerCase();
  return PLACEHOLDER_PREFIXES.some((p) => lower.startsWith(p));
}

function extractTextFromJson(json: any, placeholderTexts: Set<string>): string {
  let text = "";
  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type === "paragraph" && node.attrs?.field) {
      const paraText = (node.content ?? []).map((c: any) => c.text || "").join("").trim();
      if (node.attrs?.instructional === true || isPlaceholderText(paraText) || placeholderTexts.has(paraText)) return;
    }
    if (node.type === "text" && node.text) text += node.text + " ";
    if (Array.isArray(node.content)) node.content.forEach(walk);
  }
  walk(json);
  return text.trim();
}

function extractRequiredSections(templateDoc: any): string[] {
  const sections: string[] = [];
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (n.type === "heading" && n.attrs?.required) {
        const text = (n.content ?? []).map((c: any) => c.text || "").join("").trim();
        const clean = text.replace(/^\d+\.\s*/, "");
        if (clean) sections.push(clean);
      }
      if (n.content) walk(n.content);
    }
  };
  walk(templateDoc?.content ?? []);
  return sections;
}

function extractExistingHeadings(doc: any): string[] {
  const headings: string[] = [];
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (n.type === "heading") {
        const text = (n.content ?? []).map((c: any) => c.text || "").join("").trim();
        if (text) headings.push(text.replace(/^\d+\.\s*/, "").toLowerCase());
      }
      if (n.content) walk(n.content);
    }
  };
  walk(doc?.content ?? []);
  return headings;
}

type FieldPlaceholder = { fieldKey: string; placeholderText: string; sectionHeading: string };
type UnfilledField    = { fieldKey: string; placeholderText: string; sectionHeading: string };

function extractTemplatePlaceholders(templateDoc: any): FieldPlaceholder[] {
  const result: FieldPlaceholder[] = [];
  let currentHeading = "Document";
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "heading") {
      currentHeading = (node.content ?? []).map((c: any) => c.text || "").join("").trim()
        .replace(/^\d+\.\s*/, "") || "Section";
    }
    if (node.type === "paragraph" && node.attrs?.field) {
      const text = (node.content ?? []).map((c: any) => c.text || "").join("").trim();
      if (text) result.push({ fieldKey: node.attrs.field, placeholderText: text, sectionHeading: currentHeading });
    }
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  (templateDoc?.content ?? []).forEach(walk);
  return result;
}

function detectUnfilledByTemplateComparison(liveDoc: any, templatePlaceholders: FieldPlaceholder[]): UnfilledField[] {
  const liveFieldTexts = new Map<string, string>();
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "paragraph" && node.attrs?.field) {
      const text = (node.content ?? []).map((c: any) => c.text || "").join("").trim();
      liveFieldTexts.set(node.attrs.field, text);
    }
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  (liveDoc?.content ?? []).forEach(walk);
  const unfilled: UnfilledField[] = [];
  for (const tpl of templatePlaceholders) {
    const liveText = liveFieldTexts.get(tpl.fieldKey);
    if (liveText === undefined || liveText === "" || liveText === tpl.placeholderText || isPlaceholderText(liveText)) {
      unfilled.push({ fieldKey: tpl.fieldKey, placeholderText: tpl.placeholderText, sectionHeading: tpl.sectionHeading });
    }
  }
  return unfilled;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — Deterministic Rule Engine
// ─────────────────────────────────────────────────────────────────────────────

// SOW section map
const SOW_RULE_TO_SECTION: Record<string, string> = {
  l2_no_fee:               "Payment Terms",
  l2_no_late_fee:          "Payment Terms",
  l2_low_late_fee:         "Payment Terms",
  l2_long_invoice:         "Payment Terms",
  l2_no_payment_structure: "Payment Schedule",
  l2_no_upfront:           "Payment Schedule",
  l2_no_deadline:          "Schedule & Milestones",
  l2_no_hourly_rate:       "Additional Services",
  l2_no_revision_cap:      "Scope of Work",
  l2_no_notice:            "Termination",
  l2_short_notice:         "Termination",
  l2_no_ip:                "Intellectual Property",
  l2_no_liability_cap:     "Limitation of Liability",
};

// Retainer section map — matches exact heading text in the retainer seed
const RETAINER_RULE_TO_SECTION: Record<string, string> = {
  l2_no_retainer_fee:       "Compensation & Invoicing",
  l2_no_late_fee:           "Compensation & Invoicing",
  l2_low_late_fee:          "Compensation & Invoicing",
  l2_long_invoice:          "Compensation & Invoicing",
  l2_no_overage_rate:       "Scope of Services & Deliverables",
  l2_no_approval_window:    "Client Responsibilities & Approvals",
  l2_no_rollover_policy:    "Compensation & Invoicing",
  l2_no_notice:             "Termination",
  l2_short_notice:          "Termination",
  l2_no_ip:                 "Intellectual Property Rights",
  l2_no_liability_cap:      "Limitation of Liability",
};

// MSA section map — matches exact heading text in the MSA seed
const MSA_RULE_TO_SECTION: Record<string, string> = {
  l2_msa_no_payment_days:    "Compensation & Late Fees",
  l2_msa_no_late_fee:        "Compensation & Late Fees",
  l2_msa_low_late_fee:       "Compensation & Late Fees",
  l2_msa_long_invoice:       "Compensation & Late Fees",
  l2_msa_no_notice:          "Term & Termination — Kill-Fee",
  l2_msa_short_notice:       "Term & Termination — Kill-Fee",
  l2_msa_no_ip:              "Intellectual Property — Ownership Leverage",
  l2_msa_no_liability_cap:   "Limitation of Liability",
  l2_msa_no_jurisdiction:    "Governing Law & Dispute Resolution",
  l2_msa_no_non_solicit:     "Confidentiality — Non-Solicitation",
  l2_msa_no_change_mgmt:     "Change Management",
  l2_msa_no_confidentiality: "Confidentiality Policy",
};

type L2Flag = {
  id: string;
  title: string;
  issue: string;
  riskLevel: "High" | "Medium" | "Low";
  penalty: number;
  category: "payment" | "scope" | "termination" | "ip" | "liability";
  targetSectionHeading: string;
};

function parseNum(val: string | null | undefined): number | null {
  if (!val) return null;
  const n = parseFloat(val.replace(/[₹$€£,\s%]/g, ""));
  return isNaN(n) ? null : n;
}

function hasTerm(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((t) => lower.includes(t));
}

// ── SOW Deterministic Rules ───────────────────────────────────────────────────
function runSOWRules(
  fields: Record<string, string | null>,
  existingHeadings: string[],
): L2Flag[] {
  const flags: L2Flag[] = [];

  function push(id: string, title: string, issue: string, riskLevel: L2Flag["riskLevel"], penalty: number, category: L2Flag["category"]) {
    flags.push({ id, title, issue, riskLevel, penalty, category, targetSectionHeading: SOW_RULE_TO_SECTION[id] ?? title });
  }

  // ── PAYMENT ───────────────────────────────────────────────────────────────
  const fee = parseNum(fields.project_fee);
  if (!fee) push("l2_no_fee", "Project Fee Undefined",
    "No total fee is specified. The contract is unenforceable for payment recovery without a defined amount.", "High", 20, "payment");

  const lateInterest = parseNum(fields.late_interest);
  if (lateInterest === null || lateInterest === 0) {
    push("l2_no_late_fee", "No Late Payment Interest",
      "Without a late fee clause, clients have no financial incentive to pay on time.", "High", 18, "payment");
  } else if (lateInterest < 1) {
    push("l2_low_late_fee", "Late Interest Below Standard",
      `${lateInterest}% monthly late interest is below the 1–2% industry standard.`, "Medium", 8, "payment");
  }

  const invoiceDays = parseNum(fields.invoice_due_days);
  if (invoiceDays !== null && invoiceDays > 45) {
    push("l2_long_invoice", "Long Invoice Window",
      `${invoiceDays}-day payment terms extend cash flow risk. Standard is 15–30 days.`, "Medium", 8, "payment");
  }

  const paymentStructure = fields.payment_structure ?? "";
  if (!paymentStructure.trim()) {
    push("l2_no_payment_structure", "No Payment Schedule",
      "No payment milestones defined. Without a billing schedule, 100% of project risk falls on the provider.", "High", 18, "payment");
  } else if (!hasTerm(paymentStructure, ["upfront", "advance", "deposit", "50%", "30%"])) {
    push("l2_no_upfront", "No Upfront Deposit",
      "Payment structure has no advance deposit. Risk of non-payment for delivered work.", "Medium", 10, "payment");
  }

  // ── SCOPE ─────────────────────────────────────────────────────────────────
  if (!fields.launch_date?.trim()) {
    push("l2_no_deadline", "No Delivery Deadline",
      "No defined launch or delivery date creates ambiguity about project completion.", "High", 15, "scope");
  }

  if (!fields.hourly_rate?.trim()) {
    push("l2_no_hourly_rate", "No Out-of-Scope Rate",
      "Without an hourly rate for additional work, scope expansion cannot be billed.", "Medium", 8, "scope");
  }

  const revisionLimit = parseNum(fields.revision_limit);
  if (revisionLimit === null) {
    push("l2_no_revision_cap", "No Revision Cap",
      "Unlimited revisions is the #1 cause of project overruns.", "High", 15, "scope");
  }

  // ── TERMINATION ───────────────────────────────────────────────────────────
  const noticeDays = parseNum(fields.notice_period);
  if (noticeDays === null) {
    push("l2_no_notice", "No Termination Notice Period",
      "Without a notice period, clients can terminate immediately with zero compensation.", "High", 20, "termination");
  } else if (noticeDays < 14) {
    push("l2_short_notice", `Short Notice Period (${noticeDays} days)`,
      `${noticeDays}-day notice is below the recommended 14-day minimum.`, "Medium", 8, "termination");
  }

  // ── IP ────────────────────────────────────────────────────────────────────
  const hasIpSection = existingHeadings.some(
    (h) => h.includes("intellectual") || h.includes(" ip ") || h.includes("ownership") || h.includes("proprietary"),
  );
  if (!hasIpSection) {
    push("l2_no_ip", "No Intellectual Property Clause",
      "Missing IP clause leaves ownership of deliverables legally ambiguous.", "High", 18, "ip");
  }

  // ── LIABILITY ─────────────────────────────────────────────────────────────
  const hasLiabilitySection = existingHeadings.some(
    (h) => h.includes("liability") || h.includes("limitation") || h.includes("indemnif"),
  );
  if (!hasLiabilitySection) {
    push("l2_no_liability_cap", "No Liability Cap",
      "Without a liability limitation clause, your financial exposure is uncapped.", "Medium", 10, "liability");
  }

  return flags;
}

// ── Retainer Deterministic Rules ──────────────────────────────────────────────
function runRetainerRules(
  fields: Record<string, string | null>,
  existingHeadings: string[],
): L2Flag[] {
  const flags: L2Flag[] = [];

  function push(id: string, title: string, issue: string, riskLevel: L2Flag["riskLevel"], penalty: number, category: L2Flag["category"]) {
    flags.push({ id, title, issue, riskLevel, penalty, category, targetSectionHeading: RETAINER_RULE_TO_SECTION[id] ?? title });
  }

  // ── PAYMENT ───────────────────────────────────────────────────────────────
  const retainerFee = parseNum(fields.retainer_fee);
  if (!retainerFee) push(
    "l2_no_retainer_fee", "Monthly Retainer Fee Undefined",
    "No monthly fee is specified. The retainer is commercially unenforceable without a defined recurring amount.",
    "High", 20, "payment"
  );

  const lateInterest = parseNum(fields.late_interest);
  if (lateInterest === null || lateInterest === 0) {
    push("l2_no_late_fee", "No Late Payment Interest",
      "Without a late fee clause, clients have no financial incentive to pay on time.", "High", 18, "payment");
  } else if (lateInterest < 1) {
    push("l2_low_late_fee", "Late Interest Below Standard",
      `${lateInterest}% monthly late interest is below the 1–2% industry standard.`, "Medium", 8, "payment");
  }

  const invoiceDays = parseNum(fields.invoice_due_days);
  if (invoiceDays !== null && invoiceDays > 30) {
    push("l2_long_invoice", "Long Invoice Window for Retainer",
      `${invoiceDays}-day payment terms disrupt monthly cash flow. Recommend Net 7–15 for retainers.`, "Medium", 10, "payment");
  }

  // ── SCOPE ─────────────────────────────────────────────────────────────────
  if (!fields.overage_rate?.trim()) {
    push("l2_no_overage_rate", "No Overage Rate Defined",
      "Without an hourly overage rate, all out-of-scope work requested by the client cannot be billed.", "Medium", 8, "scope");
  }

  if (!fields.approval_days?.trim()) {
    push("l2_no_approval_window", "No Deemed Approval Window",
      "Without a deemed-approval clause, clients can delay sign-off indefinitely, blocking delivery milestones.", "Medium", 8, "scope");
  }

  if (!fields.rollover_policy?.trim()) {
    push("l2_no_rollover_policy", "Rollover Policy Not Defined",
      "Ambiguous unused-hours rollover terms are a common source of month-end billing disputes.", "Low", 5, "scope");
  }

  // ── TERMINATION ───────────────────────────────────────────────────────────
  const noticeDays = parseNum(fields.notice_days ?? fields.notice_period);
  if (noticeDays === null) {
    push("l2_no_notice", "No Termination Notice Period",
      "Without a notice period, clients can cancel a retainer immediately with zero compensation during wind-down.", "High", 20, "termination");
  } else if (noticeDays < 14) {
    push("l2_short_notice", `Short Notice Period (${noticeDays} days)`,
      `${noticeDays}-day notice is below the recommended 30-day minimum for monthly retainers.`, "Medium", 8, "termination");
  }

  // ── IP ────────────────────────────────────────────────────────────────────
  const hasIpSection = existingHeadings.some(
    (h) => h.includes("intellectual") || h.includes("ip") || h.includes("ownership") || h.includes("proprietary"),
  );
  if (!hasIpSection) {
    push("l2_no_ip", "No Intellectual Property Clause",
      "Missing IP clause leaves ownership of all monthly deliverables legally ambiguous.", "High", 18, "ip");
  }

  // ── LIABILITY ─────────────────────────────────────────────────────────────
  const hasLiabilitySection = existingHeadings.some(
    (h) => h.includes("liability") || h.includes("limitation") || h.includes("indemnif"),
  );
  if (!hasLiabilitySection) {
    push("l2_no_liability_cap", "No Liability Cap",
      "Without a liability limitation clause, your financial exposure across all monthly deliverables is uncapped.", "Medium", 10, "liability");
  }

  return flags;
}

// ── MSA Deterministic Rules ───────────────────────────────────────────────────
function runMSARules(
  fields: Record<string, string | null>,
  existingHeadings: string[],
): L2Flag[] {
  const flags: L2Flag[] = [];

  function push(id: string, title: string, issue: string, riskLevel: L2Flag["riskLevel"], penalty: number, category: L2Flag["category"]) {
    flags.push({ id, title, issue, riskLevel, penalty, category, targetSectionHeading: MSA_RULE_TO_SECTION[id] ?? title });
  }

  // ── PAYMENT ───────────────────────────────────────────────────────────────
  const paymentDays = parseNum(fields.payment_due_days);
  if (paymentDays === null) {
    push("l2_msa_no_payment_days", "Payment Due Date Undefined",
      "No invoice due date is specified. Without a defined payment window, collection is legally ambiguous.", "High", 18, "payment");
  } else if (paymentDays > 45) {
    push("l2_msa_long_invoice", "Long Invoice Window",
      `${paymentDays}-day payment terms extend cash flow risk. Standard for MSAs is 15–30 days.`, "Medium", 8, "payment");
  }

  const lateInterest = parseNum(fields.late_interest);
  if (lateInterest === null || lateInterest === 0) {
    push("l2_msa_no_late_fee", "No Late Payment Interest",
      "Without a late fee clause across all SOW engagements, clients have no financial incentive to pay on time.", "High", 18, "payment");
  } else if (lateInterest < 1) {
    push("l2_msa_low_late_fee", "Late Interest Below Standard",
      `${lateInterest}% monthly late interest is below the 1–2% industry standard for commercial agreements.`, "Medium", 8, "payment");
  }

  // ── TERMINATION ───────────────────────────────────────────────────────────
  const noticeDays = parseNum(fields.notice_period);
  if (noticeDays === null) {
    push("l2_msa_no_notice", "No Termination Notice Period",
      "Without a notice period, either party can terminate all SOW engagements immediately with zero compensation.", "High", 20, "termination");
  } else if (noticeDays < 14) {
    push("l2_msa_short_notice", `Short Notice Period (${noticeDays} days)`,
      `${noticeDays}-day notice is below the recommended 30-day minimum for a Master Service Agreement.`, "Medium", 10, "termination");
  }

  // ── IP ────────────────────────────────────────────────────────────────────
  const hasIpSection = existingHeadings.some(
    (h) => h.includes("intellectual") || h.includes("ownership") || h.includes("ip") || h.includes("proprietary"),
  );
  if (!hasIpSection) {
    push("l2_msa_no_ip", "No Intellectual Property Clause",
      "Without an IP clause, ownership of all work product across every SOW engagement is legally ambiguous.", "High", 20, "ip");
  }

  // ── LIABILITY ─────────────────────────────────────────────────────────────
  const hasLiabilitySection = existingHeadings.some(
    (h) => h.includes("liability") || h.includes("limitation") || h.includes("indemnif"),
  );
  if (!hasLiabilitySection) {
    push("l2_msa_no_liability_cap", "No Liability Cap",
      "An MSA without a liability limitation exposes the Service Provider to uncapped financial risk across all engagements.", "High", 20, "liability");
  }

  const liabilityCap = parseNum(fields.liability_cap_multiplier);
  if (hasLiabilitySection && liabilityCap === null) {
    push("l2_msa_no_liability_cap", "Liability Cap Amount Undefined",
      "A liability section exists but no cap amount is defined. Specify a monetary ceiling (e.g. 3× monthly fees).", "Medium", 10, "liability");
  }

  // ── GOVERNING LAW ─────────────────────────────────────────────────────────
  const jurisdiction = fields.governing_jurisdiction;
  if (!jurisdiction?.trim()) {
    push("l2_msa_no_jurisdiction", "No Governing Jurisdiction",
      "Without a governing law clause, any dispute would require expensive jurisdictional litigation before reaching the merits.", "High", 15, "scope");
  }

  // ── NON-SOLICITATION ─────────────────────────────────────────────────────
  const hasNonSolicit = existingHeadings.some(
    (h) => h.includes("non-solicit") || h.includes("non solicit") || h.includes("solicitation"),
  );
  if (!hasNonSolicit) {
    push("l2_msa_no_non_solicit", "No Non-Solicitation Clause",
      "Without a non-solicitation clause, clients can poach your team members after accessing your key personnel.", "Medium", 8, "scope");
  }

  // ── CHANGE MANAGEMENT ────────────────────────────────────────────────────
  const hasChangeMgmt = existingHeadings.some(
    (h) => h.includes("change") || h.includes("variation"),
  );
  if (!hasChangeMgmt) {
    push("l2_msa_no_change_mgmt", "No Change Management Clause",
      "Without a change management process, clients can expand scope without formal approval or additional fees.", "High", 15, "scope");
  }

  // ── CONFIDENTIALITY ───────────────────────────────────────────────────────
  const hasConfidentiality = existingHeadings.some(
    (h) => h.includes("confidential") || h.includes("nda") || h.includes("non-disclosure"),
  );
  if (!hasConfidentiality) {
    push("l2_msa_no_confidentiality", "No Confidentiality Clause",
      "An MSA without a confidentiality clause leaves sensitive business information and trade secrets unprotected.", "High", 15, "scope");
  }

  return flags;
}

// ── Route to correct rule engine based on template slug ───────────────────────
function runDeterministicRules(
  fields: Record<string, string | null>,
  existingHeadings: string[],
  templateSlug?: string,
): L2Flag[] {
  if (templateSlug?.includes("master-service") || templateSlug?.includes("msa")) {
    return runMSARules(fields, existingHeadings);
  }
  if (templateSlug?.includes("retainer")) {
    return runRetainerRules(fields, existingHeadings);
  }
  return runSOWRules(fields, existingHeadings);
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — Health Score
// ─────────────────────────────────────────────────────────────────────────────

function computeHealthScore(l2Flags: L2Flag[], aiWeakCount: number, aiMissingCount: number): number {
  const penalty = l2Flags.reduce((s, f) => s + f.penalty, 0);
  const aiPenalty = aiWeakCount * 5 + aiMissingCount * 8;
  return Math.max(0, Math.min(100, 100 - penalty - aiPenalty));
}

// ─────────────────────────────────────────────────────────────────────────────
// Template Risk Profiles — Layer 3 focus areas
// ─────────────────────────────────────────────────────────────────────────────

type RiskProfile = { label: string; focusClauses: string[] };

const RISK_PROFILES: Record<string, RiskProfile> = {
  // Retainer — heading text must exactly match the seed contentJsonTemplate headings
  "creative-retainer-agreement-core": {
    label: "Creative Services Retainer Agreement",
    focusClauses: [
      "Scope of Services & Deliverables",
      "Compensation & Invoicing",
      "Client Responsibilities & Approvals",
      "Termination",
    ],
  },

  // SOW
  "anti-scope-creep-sow-core": {
    label: "Statement of Work",
    focusClauses: ["Scope", "Deliverables", "Project Purpose", "Change Management"],
  },

  // MSA
  "master-service-agreement-core": {
    label: "Master Service Agreement",
    focusClauses: [
      "Compensation & Late Fees",
      "Intellectual Property — Ownership Leverage",
      "Term & Termination — Kill-Fee",
      "Limitation of Liability",
      "Governing Law & Dispute Resolution",
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Extract specific clause texts by heading name (Layer 3 targeting)
// ─────────────────────────────────────────────────────────────────────────────

function extractClauseTexts(doc: any, targetHeadings: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  let currentHeading: string | null = null;
  let collecting = false;
  let buffer: string[] = [];

  function flush() {
    if (currentHeading && collecting && buffer.length) {
      result[currentHeading] = buffer.join(" ").trim();
    }
    buffer = [];
  }

  function walk(node: any) {
    if (!node || typeof node !== "object") return;
    if (node.type === "heading") {
      flush();
      const text = (node.content ?? []).map((c: any) => c.text || "").join("").trim().replace(/^\d+\.\s*/, "");
      const match = targetHeadings.find((t) => text.toLowerCase().includes(t.toLowerCase()));
      currentHeading = match ?? text;
      collecting = !!match;
      return;
    }
    if (collecting && node.type === "text" && node.text) buffer.push(node.text);
    if (Array.isArray(node.content)) node.content.forEach(walk);
  }

  (doc?.content ?? []).forEach(walk);
  flush();
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentText, templateSlug, fields: clientFields } = body;

    // Parse document JSON
    let documentJson: any = null;
    if (typeof documentText === "string") {
      try { documentJson = JSON.parse(documentText); } catch { documentJson = null; }
    } else if (typeof documentText === "object" && documentText !== null) {
      documentJson = documentText;
    }

    // ── LAYER 1: Template structure comparison ──────────────────────────────
    let requiredSections: string[] = [];
    let missingSectionsFromTemplate: string[] = [];
    let templatePlaceholders: FieldPlaceholder[] = [];
    let placeholderTextSet = new Set<string>();

    if (templateSlug) {
      const template = await prisma.template.findUnique({ where: { slug: templateSlug } });
      if (template?.contentJsonTemplate) {
        const baseDoc = (template.contentJsonTemplate as any).standard ?? template.contentJsonTemplate;
        requiredSections = extractRequiredSections(baseDoc);
        templatePlaceholders = extractTemplatePlaceholders(baseDoc);
        placeholderTextSet = new Set(templatePlaceholders.map((p) => p.placeholderText));
        if (documentJson) {
          const existingHeadings = extractExistingHeadings(documentJson);
          missingSectionsFromTemplate = requiredSections.filter(
            (r) => !existingHeadings.some((e) => e.includes(r.toLowerCase())),
          );
        }
      }
    }

    const unfilledFields = documentJson ? detectUnfilledByTemplateComparison(documentJson, templatePlaceholders) : [];
    const unfilledBySectionMap = new Map<string, UnfilledField[]>();
    for (const f of unfilledFields) {
      const list = unfilledBySectionMap.get(f.sectionHeading) ?? [];
      list.push(f);
      unfilledBySectionMap.set(f.sectionHeading, list);
    }

    // ── LAYER 2: Deterministic rules ────────────────────────────────────────
    const existingHeadings = documentJson ? extractExistingHeadings(documentJson) : [];
    const fields: Record<string, string | null> = clientFields ?? {};
    // Pass templateSlug so the engine picks SOW vs retainer rules
    const l2Flags = runDeterministicRules(fields, existingHeadings, templateSlug);

    const deterministicWeakClauses = l2Flags.map((f) => ({
      section: f.title,
      issue: f.issue,
      riskLevel: f.riskLevel,
      source: "rule-engine" as const,
      targetSectionHeading: f.targetSectionHeading,
    }));

    // ── LAYER 3: Targeted AI — only vague semantic clauses ──────────────────
    const finalText = documentJson ? extractTextFromJson(documentJson, placeholderTextSet) : "";
    const riskProfile = RISK_PROFILES[templateSlug] ?? {
      label: "Professional Contract",
      focusClauses: ["Scope", "Deliverables", "Termination"],
    };

    const clauseTexts = documentJson ? extractClauseTexts(documentJson, riskProfile.focusClauses) : {};
    const clauseSnippet = Object.entries(clauseTexts)
      .map(([heading, text]) => `### ${heading}\n${text || "(empty)"}`)
      .join("\n\n")
      .slice(0, 2500) || "(Document not filled yet)";

    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: { "HTTP-Referer": "http://localhost:3000", "X-Title": "Formyxa" },
    });

    const prompt = `
You are a senior commercial contract lawyer. Evaluate ONLY the following specific clauses for vague language.

Document type: ${riskProfile.label}

CLAUSES TO EVALUATE:
${clauseSnippet}

RULES:
1. Only flag content that genuinely exists but is vague or lacks specificity.
2. For each finding, include "targetSectionHeading" — the exact heading string as it appears in the document (copy it verbatim from the clause text above). This is critical for precise in-document editing.
3. Return strict JSON only.

{
  "weakClauses": [{ "section": "", "issue": "", "riskLevel": "Low | Medium | High", "targetSectionHeading": "" }],
  "missingClauses": [{ "title": "", "reason": "", "targetSectionHeading": "" }]
}
`;

    let aiResult: { weakClauses: any[]; missingClauses: any[] } = { weakClauses: [], missingClauses: [] };

    try {
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return strict JSON only." },
          { role: "user", content: prompt },
        ],
      });
      const raw = JSON.parse(completion.choices[0]?.message?.content || "{}");
      aiResult.weakClauses = raw.weakClauses ?? [];
      aiResult.missingClauses = raw.missingClauses ?? [];
    } catch (aiErr) {
      console.error("[review-contract] Layer 3 AI call failed:", aiErr);
    }

    // ── MERGE: L1 + L2 + L3 ─────────────────────────────────────────────────

    const aiMissingTitles = new Set(aiResult.missingClauses.map((m: any) => m.title.toLowerCase()));
    const allMissingClauses: any[] = [...aiResult.missingClauses];

    for (const absent of missingSectionsFromTemplate) {
      if (!aiMissingTitles.has(absent.toLowerCase())) {
        allMissingClauses.push({
          title: absent,
          reason: "This required section is structurally absent from the document.",
          source: "structure",
          targetSectionHeading: absent,
        });
      }
    }

    for (const [sectionHeading] of unfilledBySectionMap.entries()) {
      const key = sectionHeading.toLowerCase();
      if (!allMissingClauses.some((m: any) => m.title.toLowerCase().includes(key))) {
        allMissingClauses.push({
          title: sectionHeading,
          reason: "Section not filled in yet — still contains placeholder content.",
          source: "unfilled",
          targetSectionHeading: sectionHeading,
        });
      }
    }

    const l2SectionTitles = new Set(deterministicWeakClauses.map((w) => w.section.toLowerCase()));
    const aiWeakFiltered = aiResult.weakClauses
      .filter((w: any) => !l2SectionTitles.has((w.section ?? "").toLowerCase()))
      .map((w: any) => ({ ...w, source: "ai" }));

    const allWeakClauses = [...deterministicWeakClauses, ...aiWeakFiltered];

    // ── Score ────────────────────────────────────────────────────────────────
    const healthScore = computeHealthScore(l2Flags, aiResult.weakClauses.length, allMissingClauses.length);
    const riskScore   = Math.max(1, Math.min(10, Math.round((100 - healthScore) / 10)));

    return NextResponse.json({
      healthScore,
      riskScore,
      missingClauses: allMissingClauses,
      weakClauses: allWeakClauses,
      commercialImprovements: [],
    });

  } catch (err) {
    console.error("Review Contract Error:", err);
    return NextResponse.json({ error: "AI review failed" }, { status: 500 });
  }
}