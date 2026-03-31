// ─────────────────────────────────────────────────────────────────────────────
// FORMYXA — RISK RULE ENGINE + CONTRACT SCORE
// Pure client-side intelligence. No AI needed.
// ─────────────────────────────────────────────────────────────────────────────

export type RiskSeverity = "critical" | "high" | "medium" | "low";

export interface RiskFlag {
  id: string;
  severity: RiskSeverity;
  category: "payment" | "scope" | "termination" | "ip" | "liability" | "compliance";
  title: string;
  message: string;
  fix?: string; // actionable advice
}

export interface ScoreBreakdown {
  payment: number;       // 0–100
  scope: number;
  termination: number;
  liability: number;
  overall: number;
}

// ─────────────────────────────────────────────────────────────────────────────

function num(val: string | null | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[₹$€£,%\s,]/g, "")) || 0;
}

function filled(val: string | null | undefined): boolean {
  return !!val && val.trim().length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// SOW RULES
// ─────────────────────────────────────────────────────────────────────────────

function runSowRules(fields: Record<string, string | null>): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // ── Payment ──────────────────────────────────────────────────────────────

  if (!filled(fields.late_interest)) {
    flags.push({
      id: "no_late_fee",
      severity: "critical",
      category: "payment",
      title: "No Late Payment Interest",
      message: "Without a late fee clause, clients have no financial incentive to pay on time.",
      fix: "Add 1.5% per month late interest.",
    });
  } else if (num(fields.late_interest) < 1) {
    flags.push({
      id: "low_late_fee",
      severity: "medium",
      category: "payment",
      title: "Late Interest Below Standard",
      message: `${fields.late_interest}% late interest is below the 1–2% standard. May not deter delayed payments.`,
      fix: "Consider raising to at least 1%.",
    });
  }

  if (!filled(fields.project_fee)) {
    flags.push({
      id: "no_project_fee",
      severity: "critical",
      category: "payment",
      title: "Project Fee Undefined",
      message: "A contract without a defined fee is unenforceable for payment recovery.",
      fix: "Define the total project fee.",
    });
  }

  const invoiceDays = num(fields.invoice_due_days);
  if (invoiceDays > 0 && invoiceDays > 45) {
    flags.push({
      id: "long_invoice_period",
      severity: "medium",
      category: "payment",
      title: "Long Invoice Period",
      message: `${invoiceDays}-day payment terms extend cash flow risk. Standard is 15–30 days.`,
      fix: "Reduce to 30 days maximum.",
    });
  }

  // Check for upfront payment protection
  const paymentStructure = (fields.payment_structure || "").toLowerCase();
  if (
    filled(fields.payment_structure) &&
    !paymentStructure.includes("upfront") &&
    !paymentStructure.includes("advance") &&
    !paymentStructure.includes("deposit")
  ) {
    flags.push({
      id: "no_upfront",
      severity: "high",
      category: "payment",
      title: "No Upfront Payment",
      message: "Payment structure has no advance deposit. Risk of non-payment for work delivered.",
      fix: "Include at least 30–50% upfront.",
    });
  }

  // ── Scope ─────────────────────────────────────────────────────────────────

  if (!filled(fields.launch_date)) {
    flags.push({
      id: "no_deadline",
      severity: "high",
      category: "scope",
      title: "No Delivery Deadline",
      message: "No defined launch date creates ambiguity on when the project should be complete.",
      fix: "Add a specific launch date.",
    });
  }

  if (!filled(fields.hourly_rate)) {
    flags.push({
      id: "no_hourly_rate",
      severity: "low",
      category: "scope",
      title: "No Out-of-Scope Rate",
      message: "Without an hourly rate for additional work, scope expansion cannot be billed.",
      fix: "Define a standard hourly rate for change requests.",
    });
  }

  // ── Termination ───────────────────────────────────────────────────────────

  const noticeDays = num(fields.notice_period);
  if (!filled(fields.notice_period)) {
    flags.push({
      id: "no_notice_period",
      severity: "critical",
      category: "termination",
      title: "No Termination Notice Period",
      message: "Without a notice period, clients can terminate immediately with zero compensation.",
      fix: "Add minimum 14-day notice period.",
    });
  } else if (noticeDays < 14) {
    flags.push({
      id: "short_notice_period",
      severity: "high",
      category: "termination",
      title: "Short Notice Period",
      message: `${noticeDays}-day notice is below the recommended 14-day minimum.`,
      fix: "Increase to at least 14 days.",
    });
  }

  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// RETAINER RULES
// ─────────────────────────────────────────────────────────────────────────────

function runRetainerRules(fields: Record<string, string | null>): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (!filled(fields.retainer_fee)) {
    flags.push({
      id: "no_retainer_fee",
      severity: "critical",
      category: "payment",
      title: "Monthly Fee Undefined",
      message: "No retainer amount makes this agreement unenforceable.",
      fix: "Define the monthly retainer fee.",
    });
  }

  if (!filled(fields.late_interest)) {
    flags.push({
      id: "no_late_fee_retainer",
      severity: "high",
      category: "payment",
      title: "No Late Payment Penalty",
      message: "Monthly retainers without late fees create chronic payment delays.",
      fix: "Add 1.5% per month late interest.",
    });
  }

  if (!filled(fields.revision_limit)) {
    flags.push({
      id: "no_revision_cap",
      severity: "critical",
      category: "scope",
      title: "No Revision Limit",
      message: "Unlimited revisions in a retainer is a direct path to scope creep and burnout.",
      fix: "Cap revisions at 2–3 rounds per deliverable.",
    });
  } else if (num(fields.revision_limit) > 5) {
    flags.push({
      id: "high_revision_limit",
      severity: "medium",
      category: "scope",
      title: "High Revision Cap",
      message: `${fields.revision_limit} revision rounds is generous. Consider reducing to protect time.`,
      fix: "3 rounds is the industry standard.",
    });
  }

  const noticeDays = num(fields.notice_period);
  if (!filled(fields.notice_period)) {
    flags.push({
      id: "no_notice_retainer",
      severity: "critical",
      category: "termination",
      title: "No Termination Notice",
      message: "Retainers need notice periods to protect recurring income.",
      fix: "Add 30-day termination notice.",
    });
  } else if (noticeDays < 30) {
    flags.push({
      id: "short_notice_retainer",
      severity: "high",
      category: "termination",
      title: "Short Notice Period for Retainer",
      message: `${noticeDays} days is below the 30-day standard for retainer agreements.`,
      fix: "Increase to 30 days minimum.",
    });
  }

  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

function severityPenalty(flag: RiskFlag): number {
  return { critical: 25, high: 15, medium: 8, low: 3 }[flag.severity];
}

function scoreCategory(flags: RiskFlag[], category: RiskFlag["category"]): number {
  const categoryFlags = flags.filter((f) => f.category === category);
  const penalty = categoryFlags.reduce((sum, f) => sum + severityPenalty(f), 0);
  return Math.max(0, 100 - penalty);
}

export function calculateContractScore(flags: RiskFlag[]): ScoreBreakdown {
  const payment = scoreCategory(flags, "payment");
  const scope = scoreCategory(flags, "scope");
  const termination = scoreCategory(flags, "termination");
  const liability = scoreCategory(flags, "liability");

  const overall = Math.round((payment * 0.35 + scope * 0.25 + termination * 0.25 + liability * 0.15));

  return { payment, scope, termination, liability, overall };
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL INTELLIGENCE
// ─────────────────────────────────────────────────────────────────────────────

export interface FinancialInsight {
  label: string;
  value: string;
  type: "info" | "warning" | "good";
}

export function computeFinancialInsights(
  templateSlug: string,
  fields: Record<string, string | null>,
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  if (templateSlug.includes("sow")) {
    const fee = num(fields.project_fee);
    const interest = num(fields.late_interest);
    const invoiceDays = num(fields.invoice_due_days);

    if (fee > 0 && interest > 0) {
      const dailyRisk = (fee * (interest / 100)) / 30;
      insights.push({
        label: "Late payment cost per day",
        value: `₹${Math.round(dailyRisk).toLocaleString("en-IN")}`,
        type: "info",
      });
    }

    if (fee > 0) {
      const suggestedUpfront = fee * 0.5;
      insights.push({
        label: "Recommended upfront (50%)",
        value: `₹${suggestedUpfront.toLocaleString("en-IN")}`,
        type: "good",
      });
    }

    if (fee > 0) {
      const liabilityCap = fee * 1.5;
      insights.push({
        label: "Suggested liability cap (1.5×)",
        value: `₹${liabilityCap.toLocaleString("en-IN")}`,
        type: "info",
      });
    }

    const paymentStr = (fields.payment_structure || "").toLowerCase();
    if (paymentStr.includes("10%") || paymentStr.includes("20%")) {
      insights.push({
        label: "Upfront payment warning",
        value: "Low advance — non-payment risk is elevated",
        type: "warning",
      });
    }
  }

  if (templateSlug.includes("retainer")) {
    const monthly = num(fields.retainer_fee);
    if (monthly > 0) {
      insights.push({
        label: "Annual contract value",
        value: `₹${(monthly * 12).toLocaleString("en-IN")}`,
        type: "good",
      });

      const liabilityCap = monthly * 3;
      insights.push({
        label: "Suggested liability cap (3× monthly)",
        value: `₹${liabilityCap.toLocaleString("en-IN")}`,
        type: "info",
      });
    }
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — run rules for any template
// ─────────────────────────────────────────────────────────────────────────────

export function runRiskRules(
  templateSlug: string,
  fields: Record<string, string | null>,
): RiskFlag[] {
  if (templateSlug.includes("sow")) return runSowRules(fields);
  if (templateSlug.includes("retainer")) return runRetainerRules(fields);
  return [];
}
