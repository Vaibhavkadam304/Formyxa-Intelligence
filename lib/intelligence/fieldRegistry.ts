// ─────────────────────────────────────────────────────────────────────────────
// FIELD REGISTRY
// Central schema for all structured contract fields.
// This is what turns a document into structured legal data.
// ─────────────────────────────────────────────────────────────────────────────

export type FieldType =
  | "currency"
  | "percentage"
  | "number"
  | "date"
  | "text"
  | "textarea";

export type FieldDefinition = {
  type: FieldType;
  label: string;
  required: boolean;
  min?: number;
  max?: number;
  hint?: string; // shown in sidebar tooltip
};

export const CONTRACT_FIELD_REGISTRY: Record<string, FieldDefinition> = {
  // ── Identity ────────────────────────────────────────────────────────────────
  project_name: {
    type: "text",
    label: "Project Name",
    required: true,
    hint: "Full name of the engagement or project.",
  },

  // ── Timeline ────────────────────────────────────────────────────────────────
  launch_date: {
    type: "date",
    label: "Launch Date",
    required: true,
    hint: "Target date for final delivery. Must be a specific date.",
  },
  start_date: {
    type: "date",
    label: "Start Date",
    required: false,
  },

  // ── Payment ─────────────────────────────────────────────────────────────────
  project_fee: {
    type: "currency",
    label: "Project Fee",
    required: true,
    min: 1000,
    hint: "Total project fee. Min ₹1,000 recommended.",
  },
  retainer_fee: {
    type: "currency",
    label: "Monthly Retainer Fee",
    required: true,
    min: 1000,
  },
  payment_structure: {
    type: "text",
    label: "Payment Structure",
    required: true,
    hint: "Describe milestone splits, e.g. '50% upfront, 50% on delivery'.",
  },
  invoice_due_days: {
    type: "number",
    label: "Invoice Due Days",
    required: true,
    min: 1,
    max: 90,
    hint: "Days after invoice issuance before payment is due. Standard: 15–30.",
  },
  late_interest: {
    type: "percentage",
    label: "Late Payment Interest",
    required: true,
    min: 0,
    max: 10,
    hint: "Monthly interest % on overdue invoices. 0 means no protection.",
  },

  // ── Termination ─────────────────────────────────────────────────────────────
  notice_period: {
    type: "number",
    label: "Notice Period (days)",
    required: true,
    min: 7,
    hint: "Days of written notice required to terminate. Minimum 14 recommended.",
  },

  // ── Scope Protection ────────────────────────────────────────────────────────
  revision_limit: {
    type: "number",
    label: "Revision Limit",
    required: false,
    min: 1,
    hint: "Max revision rounds included. Prevents scope creep.",
  },
  hourly_rate: {
    type: "currency",
    label: "Hourly Rate (out-of-scope)",
    required: false,
    min: 100,
    hint: "Rate for work beyond defined scope.",
  },

  // ── Objectives ──────────────────────────────────────────────────────────────
  conversion_target: {
    type: "percentage",
    label: "Conversion Target %",
    required: false,
    min: 1,
    max: 100,
  },
};
