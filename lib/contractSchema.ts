// ─────────────────────────────────────────────────────────────────────────────
// FORMYXA — CONTRACT FIELD REGISTRY
// Central schema that makes every document structured legal data.
// ─────────────────────────────────────────────────────────────────────────────

export type FieldType = "currency" | "percentage" | "number" | "text" | "date";

export type FieldSeverity = "error" | "warning" | "info";

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  unit?: string; // "days", "months", "%", "₹"
  hint?: string; // guidance shown on hover
}

export interface ValidationResult {
  fieldKey: string;
  label: string;
  severity: FieldSeverity;
  message: string;
}

// ─── Per-template schemas ─────────────────────────────────────────────────────

export const CONTRACT_SCHEMAS: Record<string, FieldDefinition[]> = {

  "anti-scope-creep-sow-core": [
    {
      key: "project_name",
      label: "Project Name",
      type: "text",
      required: true,
      hint: "Official name of this engagement.",
    },
    {
      key: "launch_date",
      label: "Launch Date",
      type: "date",
      required: true,
      hint: "Specific delivery date — avoid vague ranges.",
    },
    {
      key: "conversion_target",
      label: "Conversion Target %",
      type: "percentage",
      required: true,
      min: 1,
      max: 100,
      hint: "Measurable KPI. Minimum 1% recommended.",
    },
    {
      key: "project_fee",
      label: "Project Fee",
      type: "currency",
      required: true,
      min: 1000,
      hint: "Total engagement value. Minimum ₹1,000 recommended.",
    },
    {
      key: "payment_structure",
      label: "Payment Structure",
      type: "text",
      required: true,
      hint: "e.g. 50% upfront, 50% on delivery.",
    },
    {
      key: "invoice_due_days",
      label: "Invoice Due Days",
      type: "number",
      required: true,
      min: 7,
      max: 90,
      unit: "days",
      hint: "Standard is 15–30 days. Under 7 is unusual.",
    },
    {
      key: "late_interest",
      label: "Late Interest %",
      type: "percentage",
      required: true,
      min: 0.5,
      max: 5,
      hint: "Protects against delayed payment. 1–2% per month is standard.",
    },
    {
      key: "notice_period",
      label: "Notice Period",
      type: "number",
      required: true,
      min: 14,
      unit: "days",
      hint: "Minimum 14 days recommended to reduce dispute risk.",
    },
    {
      key: "hourly_rate",
      label: "Hourly Rate",
      type: "currency",
      required: false,
      min: 500,
      hint: "Rate for out-of-scope work.",
    },
  ],

  "creative-retainer-agreement-core": [
    {
      key: "retainer_fee",
      label: "Monthly Retainer Fee",
      type: "currency",
      required: true,
      min: 5000,
      hint: "Total monthly billing amount.",
    },
    {
      key: "payment_due_days",
      label: "Payment Due Days",
      type: "number",
      required: true,
      min: 7,
      max: 30,
      unit: "days",
      hint: "Invoice payment window.",
    },
    {
      key: "late_interest",
      label: "Late Interest %",
      type: "percentage",
      required: true,
      min: 0.5,
      hint: "Late payment penalty rate per month.",
    },
    {
      key: "revision_limit",
      label: "Revision Rounds",
      type: "number",
      required: true,
      min: 1,
      max: 10,
      hint: "Caps scope creep from unlimited revisions.",
    },
    {
      key: "notice_period",
      label: "Notice Period",
      type: "number",
      required: true,
      min: 30,
      unit: "days",
      hint: "Retainers need at least 30 days notice.",
    },
    {
      key: "liability_cap",
      label: "Liability Cap",
      type: "currency",
      required: false,
      hint: "Limits financial exposure to a multiple of retainer fee.",
    },
  ],
};

// ─── Validation Engine ────────────────────────────────────────────────────────

function parseNumeric(value: string | null | undefined): number | null {
  if (!value) return null;
  // Strip currency symbols, commas, % signs
  const cleaned = value.replace(/[₹$€£,%\s,]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export function validateContractFields(
  templateSlug: string,
  fieldValues: Record<string, string | null>,
): ValidationResult[] {
  const schema = CONTRACT_SCHEMAS[templateSlug];
  if (!schema) return [];

  const results: ValidationResult[] = [];

  for (const field of schema) {
    const raw = fieldValues[field.key];
    const isEmpty = !raw || raw.trim() === "";

    // Required check
    if (field.required && isEmpty) {
      results.push({
        fieldKey: field.key,
        label: field.label,
        severity: "error",
        message: `${field.label} is required.`,
      });
      continue;
    }

    if (isEmpty) continue;

    const num = parseNumeric(raw);

    // Min check
    if (field.min !== undefined && num !== null && num < field.min) {
      const severity: FieldSeverity =
        field.type === "currency" ? "error"
        : field.type === "number" ? "warning"
        : "warning";

      results.push({
        fieldKey: field.key,
        label: field.label,
        severity,
        message: `${field.label} is ${num}${field.unit ? " " + field.unit : ""} — minimum recommended is ${field.min}${field.unit ? " " + field.unit : ""}.`,
      });
    }

    // Max check
    if (field.max !== undefined && num !== null && num > field.max) {
      results.push({
        fieldKey: field.key,
        label: field.label,
        severity: "warning",
        message: `${field.label} is ${num}${field.unit ? " " + field.unit : ""} — unusually high (max typical: ${field.max}${field.unit ? " " + field.unit : ""}).`,
      });
    }
  }

  return results;
}
