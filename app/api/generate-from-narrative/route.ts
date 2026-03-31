// app/api/generate-from-narrative/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const runtime = "nodejs";

type TemplateProfile = {
  label: string;
  tone: string;
  context: string;
  fieldRules: string;
};

const TEMPLATE_PROFILES: Record<string, TemplateProfile> = {
  // ── STATEMENT OF WORK ─────────────────────────────────────────────────────
  "anti-scope-creep-sow-core": {
    label: "Statement of Work",
    tone: "formal, enforceable contract language",
    context: "defining project scope, deliverables, timeline, and payment for a professional service engagement",
    fieldRules: `
FIELD FILLING RULES — READ CAREFULLY:

SHORT / FACTUAL FIELDS (copy from description — do NOT rephrase):
- client_name        → Full legal name of the client. E.g. "TechNova Solutions Pvt Ltd"
- provider_name      → Full legal name of the service provider.
- project_lead       → Person's name only. E.g. "Vaibhav Kadam"
- effective_date     → Date only. E.g. "15 February 2026"
- project_name       → Short title. E.g. "CRM Implementation"
- project_fee        → Exact fee with currency symbol. E.g. "₹4,50,000" or "$5,000"
- payment_structure  → How payment is split. E.g. "40% on signing, 30% at mid-point, 30% on delivery"
- invoice_due_days   → Number only. E.g. "15"
- late_interest      → Percentage only. E.g. "2%" or "1.5%"
- revision_rounds    → Number only. E.g. "2"
- hourly_rate        → Rate with currency. E.g. "₹2,000" or "$75"
- notice_period      → Number only. E.g. "30"
- governing_law      → Country or state. E.g. "India" or "New York, USA"
- dispute_resolution → "arbitration" or "litigation" or as specified
- launch_date        → Date if mentioned.
- conversion_target  → Percentage if mentioned.

NARRATIVE FIELDS (2-4 sentences of formal contract prose):
- project_purpose    → What the project is for, why it was commissioned, intended outcome.

LIST FIELDS (3-5 items, each on its own line starting with "- "):
- scope_summary      → Each deliverable or workstream as a separate bullet.

CRITICAL: If a value is mentioned in the description, you MUST fill it.
Do NOT leave a field blank if the information exists in the description.
Do NOT invent values not in the description — return "" only for truly missing data.`,
  },

  "anti-scope-creep-sow": {
    label: "Statement of Work",
    tone: "formal, enforceable contract language",
    context: "defining project scope, deliverables, timeline, and payment",
    fieldRules: `
- Scope: define what IS and IS NOT included.
- Timeline: specific dates or milestones.
- Payment: fee amount, billing frequency, due date.
- Termination: notice period and outstanding fee obligations.
- Do NOT invent values unless stated.`,
  },

  // ── CREATIVE SERVICES RETAINER AGREEMENT ─────────────────────────────────
  "creative-retainer-agreement-core": {
    label: "Creative Services Retainer Agreement",
    tone: "formal, commercially protective retainer contract language",
    context: "defining ongoing monthly services, billing structure, overage terms, IP ownership, deemed approval, and termination rights for an agency or freelancer retainer",
    fieldRules: `
FIELD FILLING RULES — READ CAREFULLY:

SHORT / FACTUAL FIELDS (copy from description exactly — do NOT rephrase or invent):
- client_name          → Full legal name of the client. E.g. "TechNova Solutions Pvt Ltd"
- provider_name        → Full legal name of the service provider. E.g. "Kadam Creative Studio"
- effective_date       → Date only. E.g. "1 March 2026"
- provider_address     → Registered address of the provider.
- client_address       → Address of the client.
- term_months          → Number only. E.g. "12"
- notice_days          → Number only. E.g. "30"
- retainer_fee         → Exact monthly fee with currency symbol. E.g. "₹80,000" or "$3,000"
- invoice_day          → Day of month only. E.g. "1" or "15"
- invoice_due_days     → Number only. E.g. "15" (recommend 7–15 for retainers; flag if >30)
- payment_method       → E.g. "Bank Transfer" or "Razorpay" or "Stripe"
- late_grace_days      → Number only. E.g. "7"
- late_interest        → Percentage only. E.g. "1.5%" or "2%"
- overage_rate         → Rate with currency. E.g. "₹2,000/hr" or "$75/hr"
- approval_days        → Number only (business days). E.g. "3"
- liability_cap_months → Number only. E.g. "3"
- governing_law        → Country or state. E.g. "India" or "New York, USA"
- rollover_policy      → Exact policy phrase. E.g. "shall not roll over" or "shall roll over for one billing cycle"

NARRATIVE / LIST FIELDS:
- scope_of_services    → Describe the recurring monthly deliverables included in the retainer.
                         Write each deliverable or service category on its own line starting with "- ".
                         E.g.:
                         - Monthly SEO audit and keyword reporting
                         - 8 long-form blog posts per month
                         - Paid media management (Google + Meta) up to ₹5L ad spend
                         Include any express exclusions mentioned (e.g. "Video production is excluded").

CRITICAL RULES:
1. If a value is in the description, you MUST fill it. Never leave a known field blank.
2. Do NOT invent fee amounts, notice periods, rollover terms, or interest rates unless the description states them.
3. Return "" only when the information is genuinely absent from the description.
4. scope_of_services should reflect what is actually stated — do not generate generic placeholders.`,
  },

  // ── SERVICE AGREEMENT ─────────────────────────────────────────────────────
  "service-agreement": {
    label: "Service Agreement",
    tone: "formal service contract language",
    context: "defining professional services scope, fees, responsibilities, and protections",
    fieldRules: `
- Separate client vs provider responsibilities clearly.
- Include rate structure (fixed/hourly/milestone) as stated.
- Balance indemnification and liability clauses.
- Define what is protected by confidentiality and for how long.
- Do NOT invent liability caps unless a specific amount is mentioned.`,
  },

  // ── MASTER SERVICE AGREEMENT ──────────────────────────────────────────────
  "master-service-agreement-core": {
    label: "Master Service Agreement",
    tone: "formal, commercially protective MSA contract language",
    context: "establishing the governing terms for all professional services between the parties, covering scope, payment, kill-fee, IP leverage, change management, revision policy, and deemed approval",
    fieldRules: `
FIELD FILLING RULES — READ CAREFULLY:

SHORT / FACTUAL FIELDS (copy from description exactly — do NOT rephrase or invent):
- client_name          → Full legal name of the client. E.g. "TechNova Solutions Pvt Ltd"
- provider_name        → Full legal name of the service provider. E.g. "Kadam Creative Studio"
- effective_date       → Date only. E.g. "1 March 2026"
- provider_address     → Registered address of the provider.
- client_address       → Address of the client.
- project_fee          → Exact total project fee with currency. E.g. "₹4,50,000" or "$15,000"
- payment_schedule     → How payment is split. E.g. "50% on signing, 25% at mid-point, 25% on delivery"
- invoice_due_days     → Number only. E.g. "15" (recommend 15–30; flag if >30)
- late_interest        → Percentage only. E.g. "1.5%" or "2%"
- halt_grace_days      → Number only. E.g. "7" (days before work suspension kicks in)
- notice_period        → Number only. E.g. "14" or "30"
- kill_fee_admin_pct   → Percentage only. E.g. "10%" (admin fee on top of completed work)
- change_review_days   → Number only. E.g. "3" (business days to assess change orders)
- revision_rounds      → Number only. E.g. "2"
- overage_rate         → Rate with currency. E.g. "$150/hr" or "₹2,000/hr"
- approval_days        → Number only. E.g. "3" (deemed approval business days)
- liability_cap_months → Number only. E.g. "3" (months of fees as liability ceiling)
- governing_law        → Country or state. E.g. "State of Delaware, USA" or "India"
- dispute_resolution   → "arbitration" or "litigation" or as stated
- non_solicit_months   → Number only. E.g. "12"

LIST FIELDS (one item per line, each starting with "- "):
- included_services    → Each service or deliverable explicitly in scope.
- exclusion_1          → First explicit exclusion (e.g. "24/7 on-call support")
- exclusion_2          → Second explicit exclusion
- exclusion_3          → Third explicit exclusion

CRITICAL RULES:
1. If a value is in the description, you MUST fill it. Never leave a known field blank.
2. Do NOT invent fee amounts, notice periods, kill-fee percentages, or revision rounds unless the description states them.
3. Return "" only when the information is genuinely absent from the description.
4. included_services must reflect actual deliverables stated — do not generate generic placeholders.
5. For exclusion fields, infer reasonable exclusions from the described scope (e.g. if scope is web design, exclusion could be "SEO" or "Content Writing" if not mentioned).`,
  },
};

const DEFAULT_PROFILE: TemplateProfile = {
  label: "Professional Document",
  tone: "formal, professional language",
  context: "capturing the key terms of a professional engagement",
  fieldRules: `
- Write complete, formal content for each field.
- If a field is not inferable from the description, return "".`,
};

const GENERIC_BOILERPLATE_CLAUSES = [
  "confidentiality", "non-disclosure", "nda",
  "liability", "limitation of liability",
  "intellectual property", "ip rights", "ip ownership",
  "governing law", "jurisdiction", "dispute resolution", "arbitration",
  "force majeure", "indemnification", "indemnity",
  "warranty", "warranties", "disclaimer",
  "entire agreement", "severability", "waiver",
];

// ─────────────────────────────────────────────────────────────────────────────
// EXTRA INFO PLACEMENT MAP
//
// Deterministic rules that tell the BuilderClient Insert handler WHERE each
// type of extra clause belongs in the document — and whether it needs a brand
// new H2 section heading (createNewSection: true) or just gets appended as a
// paragraph inside an existing section (createNewSection: false).
//
// insertAfter must substring-match an existing heading in the live document.
// The BuilderClient does a case-insensitive search, so partial matches work.
// ─────────────────────────────────────────────────────────────────────────────

type ExtraInfoPlacement = {
  insertAfter: string;     // heading text of the section to insert after
  createNewSection: boolean; // true = create new H2 heading + body
};

const EXTRA_INFO_PLACEMENT_RULES: Array<{
  keywords: string[];
  placement: ExtraInfoPlacement;
}> = [
  // Financial addenda — append inside existing payment section, no new heading
  { keywords: ["rollover", "unused hours", "carry over", "hour bank"],
    placement: { insertAfter: "Compensation", createNewSection: false } },
  { keywords: ["overage", "hourly rate", "out-of-scope rate"],
    placement: { insertAfter: "Compensation", createNewSection: false } },
  { keywords: ["late payment", "late fee", "grace period", "interest rate"],
    placement: { insertAfter: "Compensation", createNewSection: false } },
  { keywords: ["work suspension", "pause work", "suspend services"],
    placement: { insertAfter: "Compensation", createNewSection: false } },
  { keywords: ["invoice", "billing cycle", "billing date"],
    placement: { insertAfter: "Compensation", createNewSection: false } },

  // Scope addenda — append inside scope section, no new heading
  { keywords: ["exclusion", "out of scope", "separate sow", "not included"],
    placement: { insertAfter: "Scope of Services", createNewSection: false } },
  { keywords: ["deemed approval", "approval window", "feedback window", "5 business days"],
    placement: { insertAfter: "Client Responsibilities", createNewSection: false } },

  // No marketing guarantee — needs its own section after scope
  { keywords: ["guarantee", "marketing result", "ranking", "roas", "traffic guarantee", "no guarantee"],
    placement: { insertAfter: "Scope of Services", createNewSection: true } },

  // Standalone legal sections — ALL need their own H2 headings
  { keywords: ["intellectual property", "ip ownership", "ip transfer", "work product", "template", "methodology", "pre-existing ip"],
    placement: { insertAfter: "Termination", createNewSection: true } },
  { keywords: ["confidential", "confidentiality", "nda", "non-disclosure", "proprietary information"],
    placement: { insertAfter: "Intellectual Property", createNewSection: true } },
  { keywords: ["non-solicitation", "solicitation", "poaching", "hire employee", "hire contractor"],
    placement: { insertAfter: "Confidentiality", createNewSection: true } },
  { keywords: ["force majeure", "act of god", "beyond control", "circumstances beyond"],
    placement: { insertAfter: "Non-Solicitation", createNewSection: true } },
  { keywords: ["data protection", "gdpr", "ccpa", "data privacy", "personal data", "data breach"],
    placement: { insertAfter: "Confidentiality", createNewSection: true } },
  { keywords: ["no partnership", "independent contractor", "no joint venture", "agency authority", "bind the other"],
    placement: { insertAfter: "Force Majeure", createNewSection: true } },
  { keywords: ["governing law", "delaware", "arbitration", "aaa", "dispute resolution", "jurisdiction"],
    placement: { insertAfter: "Force Majeure", createNewSection: true } },

  // Liability specifics — append inside existing liability section
  { keywords: ["liability cap", "six months", "6 months", "indirect damage", "platform suspension", "consequential"],
    placement: { insertAfter: "Limitation of Liability", createNewSection: false } },

  // MSA-specific addenda
  { keywords: ["kill-fee", "kill fee", "early termination fee", "cancellation fee"],
    placement: { insertAfter: "Termination & Kill-Fee", createNewSection: false } },
  { keywords: ["change order", "change request", "change management", "scope change"],
    placement: { insertAfter: "Change Management", createNewSection: false } },
  { keywords: ["revision", "revision round", "revision cap", "additional revision"],
    placement: { insertAfter: "Revision Policy", createNewSection: false } },
  { keywords: ["work suspension", "suspend work", "halt work", "pause delivery"],
    placement: { insertAfter: "Compensation & Late Fees", createNewSection: false } },
];

/** Returns the correct placement for an extraInfo item based on its label/content. */
function getExtraInfoPlacement(label: string, content: string): ExtraInfoPlacement {
  const search = `${label} ${content}`.toLowerCase();
  for (const rule of EXTRA_INFO_PLACEMENT_RULES) {
    if (rule.keywords.some((k) => search.includes(k))) {
      return rule.placement;
    }
  }
  // Generic fallback: append at end as new section after Termination
  return { insertAfter: "Termination", createNewSection: true };
}

/** Enriches a raw extraInfo item with deterministic placement metadata. */
function enrichExtraInfoPlacement(item: any): any {
  const placement = getExtraInfoPlacement(
    item.label ?? "",
    item.content ?? "",
  );
  return {
    ...item,
    insertAfter: placement.insertAfter,
    createNewSection: placement.createNewSection,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// extractFieldsWithSections
//
// ROOT BUG FIX: The old version only checked node.attrs?.field (legacy nodes).
// Our SOW template uses formyxaField nodes with node.attrs?.key.
// Without this fix, the AI received an empty field list → returned all "" →
// nothing was filled in the document.
// ─────────────────────────────────────────────────────────────────────────────
function extractFieldsWithSections(
  templateDoc: any,
): Array<{ field: string; section: string; label: string }> {
  const result: Array<{ field: string; section: string; label: string }> = [];
  const seen = new Set<string>();
  let currentSection = "Document";

  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;

    if (node.type === "heading") {
      currentSection =
        (node.content ?? [])
          .map((c: any) => c.text || "")
          .join("")
          .trim()
          .replace(/^\d+\.\s*/, "") || "Section";
    }

    // Legacy paragraph placeholder (node.attrs.field)
    if (node.attrs?.field && !seen.has(node.attrs.field)) {
      seen.add(node.attrs.field);
      result.push({
        field: node.attrs.field,
        section: currentSection,
        label: node.attrs.label ?? node.attrs.field,
      });
    }

    // formyxaField inline node (node.attrs.key) ← THE FIX
    if (node.type === "formyxaField" && node.attrs?.key && !seen.has(node.attrs.key)) {
      seen.add(node.attrs.key);
      result.push({
        field: node.attrs.key,
        section: currentSection,
        label: node.attrs.label ?? node.attrs.key,
      });
    }

    if (Array.isArray(node.content)) node.content.forEach(walk);
  };

  (templateDoc?.content ?? []).forEach(walk);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateSlug, description } = body as {
      templateSlug?: string;
      description?: string;
    };

    if (!templateSlug || !description?.trim()) {
      return NextResponse.json(
        { error: "templateSlug and description are required" },
        { status: 400 },
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Formyxa",
      },
    });

    const template = await prisma.template.findUnique({ where: { slug: templateSlug } });
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    if (!template.contentJsonTemplate) return NextResponse.json({ error: "Template has no structured fields" }, { status: 400 });

    const baseDoc = (template.contentJsonTemplate as any).standard ?? template.contentJsonTemplate;
    const fieldsWithSections = extractFieldsWithSections(baseDoc);
    const uniqueFields = Array.from(new Set(fieldsWithSections.map((f) => f.field)));

    const templateCoversText = fieldsWithSections
      .filter((f, i, arr) => arr.findIndex((x) => x.section === f.section) === i)
      .map((f) => `- ${f.section}`)
      .join("\n");

    // Label-annotated field list helps AI understand what each key means
    const fieldLabelMap = fieldsWithSections
      .map((f) => `    "${f.field}": ""   // → ${f.label}  [${f.section}]`)
      .join(",\n");

    const profile = TEMPLATE_PROFILES[templateSlug] ?? DEFAULT_PROFILE;

    console.log(`[generate-from-narrative] slug=${templateSlug} profile="${profile.label}" fields=${uniqueFields.length}`);

    const prompt = `
You are a senior commercial drafting assistant.

Document type: ${profile.label}
Drafting tone: ${profile.tone}
Purpose: ${profile.context}

ABSOLUTE RULES:
1. Fill EVERY field listed in fieldValues — especially short factual ones (names, fees, dates, numbers).
2. If the user description contains a value for a field, YOU MUST fill it. This is mandatory.
3. Return "" only when the information is genuinely absent from the description.
4. Do NOT use markdown (no **, no ##, no ---).
5. Do NOT repeat field names in content.

FIELD-SPECIFIC RULES:
${profile.fieldRules}

TEMPLATE SECTIONS ALREADY COVERED:
${templateCoversText}

extraInfo RULES:
"extraInfo" captures information from the description that does NOT match any field above.
These are statements you could not place in fieldValues.
Examples: a specific SLA, a sub-contractor clause, a penalty clause, a custom warranty.

Each extraInfo item:
- "label":   Short descriptive title (e.g. "SLA Commitment", "Sub-Contractor Rights")
- "content": The ready-to-insert clause or statement (1-3 sentences, formal contract language)
- "section": The best matching section name to insert near (from the sections list above)

Return "extraInfo": [] if everything in the description was placed in fieldValues.
Do NOT put generic legal boilerplate (liability, IP, NDA etc.) in extraInfo.
Maximum 5 extraInfo items.

RETURN STRICT JSON ONLY — no markdown, no code fences, no commentary:

{
  "fieldValues": {
${fieldLabelMap}
  },
  "suggestedClauses": [],
  "extraInfo": [
    { "label": "", "content": "", "section": "" }
  ]
}

CRITICAL FOR RETAINER AGREEMENTS — the following clause types require their OWN standalone section with a new heading (not appended inside Limitation of Liability):
- Intellectual Property / IP Ownership → insert as new section after Termination
- Confidentiality / NDA → insert as new section after IP
- Non-Solicitation → insert as new section after Confidentiality
- Force Majeure → insert as new section after Non-Solicitation
- Data Protection / GDPR / CCPA → insert as new section after Confidentiality
- No Partnership / Independent Contractor → insert as new section after Force Majeure
- Governing Law / Arbitration → insert as new section after Force Majeure
These should NEVER be placed near Limitation of Liability.
Financial terms (overage rate, rollover, late payment) → append inside Compensation section.

User Description:
${description}
`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You are a ${profile.label} drafting assistant. Fill EVERY field in fieldValues from the user description. Output JSON only. No markdown, no commentary.`,
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[generate-from-narrative] Invalid JSON:", cleaned.slice(0, 500));
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // Ensure all expected keys exist (in case AI omitted some)
    if (!parsed.fieldValues || typeof parsed.fieldValues !== "object") parsed.fieldValues = {};
    for (const f of uniqueFields) {
      if (!(f in parsed.fieldValues)) parsed.fieldValues[f] = "";
    }

    // Hard-filter suggestedClauses
    const templateSectionNamesLower = fieldsWithSections
      .map((f) => f.section.toLowerCase().replace(/^\d+\.\s*/, "").trim());
    const descriptionLower = description.toLowerCase();

    if (Array.isArray(parsed.suggestedClauses)) {
      parsed.suggestedClauses = parsed.suggestedClauses.filter((clause: any) => {
        const title = (clause.title || "").toLowerCase().trim();
        if (!title) return false;
        if (templateSectionNamesLower.some((s) => s.includes(title) || title.includes(s))) return false;
        if (GENERIC_BOILERPLATE_CLAUSES.some((g) => title.includes(g))) return false;
        const firstKeyword = title.split(" ").find((w: string) => w.length > 3) ?? title.split(" ")[0];
        if (!descriptionLower.includes(firstKeyword)) return false;
        return true;
      });
    } else {
      parsed.suggestedClauses = [];
    }

    // Validate and cap extraInfo, then enrich with deterministic placement metadata
    if (!Array.isArray(parsed.extraInfo)) parsed.extraInfo = [];
    parsed.extraInfo = parsed.extraInfo
      .filter((item: any) => item?.label?.trim() && item?.content?.trim())
      .slice(0, 5)
      // KEY FIX: overwrite AI's section guess with deterministic placement rules
      .map((item: any) => enrichExtraInfoPlacement(item));

    const filledCount = Object.values(parsed.fieldValues).filter(Boolean).length;
    console.log(`[generate-from-narrative] filled=${filledCount}/${uniqueFields.length} extras=${parsed.extraInfo.length} suggestions=${parsed.suggestedClauses.length}`);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[generate-from-narrative] Error:", error);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}