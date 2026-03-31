// ─────────────────────────────────────────────────────────────────────────────
// RISK RULE ENGINE v3
// Deterministic risk rules + clause templates + financial impact.
// Added: Payment Benchmark Rulebook, IP clause, tightened score weights.
// ─────────────────────────────────────────────────────────────────────────────

export type RiskSeverity = "high" | "medium" | "low";

export type RiskCategory =
  | "payment"
  | "scope"
  | "termination"
  | "ip"
  | "liability";

export type ClauseTemplate = {
  heading: string;
  body: string;
};

export type FinancialImpact = {
  scenario: string;
  consequence: string;
  compute?: (fields: Record<string, string | null>) => string | null;
};

export type RiskFlag = {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  title: string;
  message: string;
  why: string;
  fix: string;
  clauseTemplate?: ClauseTemplate;
  financialImpact?: FinancialImpact;
};

export type ContractScore = {
  total: number;
  breakdown: {
    payment: number;
    scope: number;
    termination: number;
    ip: number;
    liability: number;
  };
  grade: "A" | "B" | "C" | "D" | "F";
  humanSummary: string;
  topImprovement: string;
};

// ─────────────────────────────────────────────────────────────────────────────

function num(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[₹$€£,\s%]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function has(raw: string | null | undefined): boolean {
  return !!raw && raw.trim().length > 0;
}

function fmt(n: number): string {
  return "₹\u00a0" + n.toLocaleString("en-IN");
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT BENCHMARK RULEBOOK
// A "perfect" payment clause must contain:
//  1. Total amount (project_fee / retainer_fee)
//  2. Milestones / Schedule (payment_structure with split)
//  3. Late fee policy (late_interest >= 1%)
//  4. Invoice terms (invoice_due_days <= 30)
// ─────────────────────────────────────────────────────────────────────────────

type PaymentBenchmarkResult = {
  score: number;        // 0–100 for just this clause
  missing: string[];    // human-readable missing elements
};

export function scorePaymentClause(fields: Record<string, string | null>): PaymentBenchmarkResult {
  const missing: string[] = [];
  let score = 100;

  // 1. Total amount
  const fee = num(fields.project_fee ?? fields.retainer_fee);
  if (!fee) {
    missing.push("Total contract amount");
    score -= 25;
  }

  // 2. Milestones / Schedule
  const ps = fields.payment_structure ?? "";
  const hasMilestone = /milestone|stage|phase|upfront|advance|deposit|50%|30%|40%|split/i.test(ps);
  if (!has(ps) || !hasMilestone) {
    missing.push("Milestone / payment schedule");
    score -= 25;
  }

  // 3. Late fee policy
  const interest = num(fields.late_interest);
  if (interest === null || interest === 0) {
    missing.push("Late fee policy");
    score -= 25;
  } else if (interest < 1) {
    missing.push("Late fee at standard rate (1%+)");
    score -= 10;
  }

  // 4. Invoice terms
  const invoiceDays = num(fields.invoice_due_days);
  if (invoiceDays === null) {
    missing.push("Invoice due date / payment terms");
    score -= 15;
  } else if (invoiceDays > 45) {
    missing.push("Invoice terms within 30-day standard");
    score -= 8;
  }

  return { score: Math.max(0, score), missing };
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

type RuleCheck = (fields: Record<string, string | null>) => RiskFlag | null;

const RISK_RULES: Array<{ id: string; check: RuleCheck }> = [

  // ── PAYMENT: Total Amount ─────────────────────────────────────────────────
  {
    id: "no_fee",
    check: (f) => {
      const fee = num(f.project_fee ?? f.retainer_fee);
      if (fee !== null && fee > 0) return null;
      return {
        id: "no_fee",
        category: "payment",
        severity: "high",
        title: "Project Fee Undefined",
        message: "A contract without a defined fee is unenforceable for payment recovery.",
        why: "Without a specific monetary amount, a court has nothing to enforce. The contract becomes a promise with no legal teeth.",
        fix: "Define the total project fee",
        clauseTemplate: {
          heading: "Project Fee",
          body: "The total fee for the services described in this agreement is ₹[AMOUNT], exclusive of applicable taxes.",
        },
      };
    },
  },

  // ── PAYMENT: Late Fee ─────────────────────────────────────────────────────
  {
    id: "no_late_fee",
    check: (f) => {
      const val = num(f.late_interest);
      if (val !== null && val > 0) return null;
      return {
        id: "no_late_fee",
        category: "payment",
        severity: "high",
        title: "No Late Payment Interest",
        message: "Clients can delay invoices indefinitely with zero financial consequence.",
        why: "A late payment clause creates a financial penalty that incentivises on-time payment. Without it, you have no legal lever to accelerate collection beyond chasing emails.",
        fix: "Add late payment clause",
        clauseTemplate: {
          heading: "Late Payment",
          body: "Invoices unpaid after the due date will accrue interest at 1.5% per month (18% per annum) on the outstanding balance, compounded monthly, until payment is received in full.",
        },
        financialImpact: {
          scenario: "If client delays payment by 60 days",
          consequence: "",
          compute: (fields) => {
            const fee = num(fields.project_fee ?? fields.retainer_fee);
            if (!fee) return null;
            return `you lose approx. ${fmt(Math.round(fee * 0.015 * 2))} in opportunity cost`;
          },
        },
      };
    },
  },

  {
    id: "low_late_fee",
    check: (f) => {
      const val = num(f.late_interest);
      if (val === null || val === 0 || val >= 1) return null;
      return {
        id: "low_late_fee",
        category: "payment",
        severity: "medium",
        title: "Late Interest Below Standard",
        message: `${val}% monthly interest is below the 1–2% market standard. Clients may treat it as negligible.`,
        why: "At less than 1% per month, the cost of delay is lower than the cost of capital for most businesses — so clients have no reason to pay on time.",
        fix: "Raise to 1.5% per month",
        clauseTemplate: {
          heading: "Late Payment",
          body: "Invoices unpaid after the due date will accrue interest at 1.5% per month on the outstanding balance until payment is received in full.",
        },
      };
    },
  },

  // ── PAYMENT: Invoice Terms ────────────────────────────────────────────────
  {
    id: "long_invoice_window",
    check: (f) => {
      const val = num(f.invoice_due_days);
      if (val === null || val <= 30) return null;
      return {
        id: "long_invoice_window",
        category: "payment",
        severity: "medium",
        title: "Long Invoice Window",
        message: `${val}-day payment terms extend your cash flow risk. Standard is 15–30 days.`,
        why: "Every extra day of payment terms is a day you've funded your client's operations. At 45+ days you're effectively providing them an interest-free loan.",
        fix: "Reduce to 30 days",
        financialImpact: {
          scenario: `${val} days vs. 30 days on invoicing`,
          consequence: "",
          compute: (fields) => {
            const fee = num(fields.project_fee ?? fields.retainer_fee);
            if (!fee || !val) return null;
            const extraDays = val - 30;
            const dailyCost = Math.round((fee * 0.12) / 365 * extraDays);
            return `costs you approx. ${fmt(dailyCost)} in financing cost per invoice`;
          },
        },
      };
    },
  },

  // ── PAYMENT: Milestone Schedule ───────────────────────────────────────────
  {
    id: "no_payment_structure",
    check: (f) => {
      if (has(f.payment_structure)) return null;
      return {
        id: "no_payment_structure",
        category: "payment",
        severity: "high",
        title: "No Payment Schedule",
        message: "Without a defined payment split, 100% of project risk falls on you.",
        why: "If a client cancels mid-project and there's no milestone billing, you may have delivered significant work with no contractual basis to demand payment.",
        fix: "Add payment milestone clause",
        clauseTemplate: {
          heading: "Payment Schedule",
          body: "The total project fee shall be paid as follows: 50% (advance) due upon signing of this agreement; 50% (final payment) due upon project delivery and acceptance.",
        },
      };
    },
  },

  {
    id: "no_upfront",
    check: (f) => {
      const ps = (f.payment_structure || "").toLowerCase();
      const hasUpfront = ps.includes("upfront") || ps.includes("advance") || ps.includes("deposit");
      if (!has(f.payment_structure) || hasUpfront) return null;
      return {
        id: "no_upfront",
        category: "payment",
        severity: "medium",
        title: "No Upfront Deposit",
        message: "No advance deposit in payment structure. Risk of non-payment for completed work.",
        why: "An upfront payment filters out non-serious clients and ensures you recover at least partial costs if the project is abandoned mid-way.",
        fix: "Add 30–50% advance clause",
        clauseTemplate: {
          heading: "Advance Payment",
          body: "A non-refundable advance of 50% of the total project fee is due upon signing. Work will commence only upon receipt of this advance. The remaining 50% is due upon final delivery.",
        },
        financialImpact: {
          scenario: "If client defaults at 80% completion",
          consequence: "",
          compute: (fields) => {
            const fee = num(fields.project_fee ?? fields.retainer_fee);
            if (!fee) return null;
            return `you have ${fmt(Math.round(fee * 0.8))} at risk with no advance protection`;
          },
        },
      };
    },
  },

  // ── SCOPE ─────────────────────────────────────────────────────────────────

  {
    id: "no_revision_cap",
    check: (f) => {
      if (has(f.revision_limit)) return null;
      return {
        id: "no_revision_cap",
        category: "scope",
        severity: "high",
        title: "No Revision Cap",
        message: "Clients can request unlimited changes. This is the #1 cause of project overruns.",
        why: "Without a revision limit, every deliverable can be revised endlessly. What starts as a 10-day project can stretch to 30+ days with no additional billing rights.",
        fix: "Add revision limit clause",
        clauseTemplate: {
          heading: "Revision Policy",
          body: "The project includes up to 2 rounds of revisions per deliverable. A revision round is defined as a consolidated set of changes submitted in a single communication. Additional revisions beyond this limit will be billed at the out-of-scope hourly rate defined in this agreement.",
        },
        financialImpact: {
          scenario: "Each extra revision round on a project",
          consequence: "",
          compute: (fields) => {
            const rate = num(fields.hourly_rate);
            if (!rate) return null;
            return `costs approx. ${fmt(Math.round(rate * 8))} of unbilled time (8 hrs avg)`;
          },
        },
      };
    },
  },

  {
    id: "no_additional_services_rate",
    check: (f) => {
      if (has(f.hourly_rate)) return null;
      return {
        id: "no_additional_services_rate",
        category: "scope",
        severity: "medium",
        title: "No Out-of-Scope Rate",
        message: "No hourly rate for additional work. Scope changes become unenforceable negotiations.",
        why: "When clients request extras, you need a pre-agreed rate to bill them. Without it, every change request is a fresh negotiation where the client holds leverage.",
        fix: "Add hourly rate clause",
        clauseTemplate: {
          heading: "Additional Services",
          body: "Any work outside the defined scope of this agreement will be treated as additional services. Additional services require a written change request approved by both parties and will be billed at ₹2,500 per hour, invoiced separately from the project fee.",
        },
      };
    },
  },

  // ── TERMINATION ───────────────────────────────────────────────────────────

  {
    id: "no_notice_period",
    check: (f) => {
      if (has(f.notice_period)) return null;
      return {
        id: "no_notice_period",
        category: "termination",
        severity: "high",
        title: "No Termination Notice Period",
        message: "The contract can be ended immediately with zero compensation.",
        why: "Without a notice period, a client can terminate the moment they are unhappy — even mid-project — and walk away owing nothing for work in progress.",
        fix: "Add termination clause",
        clauseTemplate: {
          heading: "Termination",
          body: "Either party may terminate this agreement by providing 14 days written notice to the other party. Upon termination, the Client shall pay for all work completed up to the termination date, calculated on a pro-rata basis. Any advance payments made are non-refundable.",
        },
        financialImpact: {
          scenario: "If client terminates at project midpoint",
          consequence: "",
          compute: (fields) => {
            const fee = num(fields.project_fee ?? fields.retainer_fee);
            if (!fee) return null;
            return `you have ${fmt(Math.round(fee * 0.5))} of work with no payment guarantee`;
          },
        },
      };
    },
  },

  {
    id: "short_notice_period",
    check: (f) => {
      const val = num(f.notice_period);
      if (val === null || val >= 14) return null;
      return {
        id: "short_notice_period",
        category: "termination",
        severity: "medium",
        title: "Short Termination Notice",
        message: `${val}-day notice is below the recommended 14-day minimum. Clients can exit very quickly.`,
        why: "14 days gives you time to invoice outstanding work, wrap deliverables, and find a replacement project. Less than that leaves you scrambling.",
        fix: "Extend to 14 days",
        clauseTemplate: {
          heading: "Termination Notice",
          body: "Either party may terminate this agreement by providing not less than 14 days written notice. The Client remains obligated to pay for all services rendered and expenses incurred up to the effective date of termination.",
        },
      };
    },
  },

  // ── INTELLECTUAL PROPERTY ─────────────────────────────────────────────────

  {
    id: "no_ip_clause",
    check: (f) => {
      // This rule fires when ip_ownership field is absent or not set
      if (has(f.ip_ownership)) return null;
      return {
        id: "no_ip_clause",
        category: "ip",
        severity: "high",
        title: "No Intellectual Property Clause",
        message: "Ownership of deliverables is legally ambiguous without an IP clause.",
        why: "Without explicit IP assignment, courts in many jurisdictions default ownership of creative work to the creator — not the client. This can lead to ownership disputes after delivery.",
        fix: "Add IP ownership clause",
        clauseTemplate: {
          heading: "Intellectual Property",
          body: "Upon receipt of full payment, the Service Provider assigns to the Client all rights, title, and interest in the deliverables produced under this agreement, including copyright. Until full payment is received, all work product remains the exclusive property of the Service Provider. The Service Provider retains the right to display the work in their portfolio.",
        },
      };
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACT FIELD VALUES FROM TIPTAP DOC
// ─────────────────────────────────────────────────────────────────────────────

export function extractFieldValues(doc: any): Record<string, string | null> {
  const values: Record<string, string | null> = {};
  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type === "formyxaField" && node.attrs?.key) {
      values[node.attrs.key] = node.attrs.value ?? null;
    }
    if (Array.isArray(node.content)) node.content.forEach(walk);
  }
  walk(doc);
  return values;
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function runRiskEngine(fields: Record<string, string | null>): RiskFlag[] {
  const flags: RiskFlag[] = [];
  for (const rule of RISK_RULES) {
    const result = rule.check(fields);
    if (result) flags.push(result);
  }
  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT SCORE + HUMAN NARRATIVE
// ─────────────────────────────────────────────────────────────────────────────

export function computeContractScore(
  flags: RiskFlag[],
  fields: Record<string, string | null>,
): ContractScore {
  // Tightened deduction weights per spec
  const SEVERITY_COST = { high: 25, medium: 12, low: 4 };
  const CATEGORY_MAX  = { payment: 40, scope: 25, termination: 20, ip: 10, liability: 5 };

  const deductions: Record<string, number> = { payment: 0, scope: 0, termination: 0, ip: 0, liability: 0 };

  for (const flag of flags) {
    deductions[flag.category] = Math.min(
      (deductions[flag.category] || 0) + SEVERITY_COST[flag.severity],
      CATEGORY_MAX[flag.category as keyof typeof CATEGORY_MAX] ?? 20,
    );
  }

  const breakdown = {
    payment:     Math.max(0, 100 - Math.round((deductions.payment     / CATEGORY_MAX.payment)     * 100)),
    scope:       Math.max(0, 100 - Math.round((deductions.scope       / CATEGORY_MAX.scope)       * 100)),
    termination: Math.max(0, 100 - Math.round((deductions.termination / CATEGORY_MAX.termination) * 100)),
    ip:          Math.max(0, 100 - Math.round((deductions.ip          / CATEGORY_MAX.ip)          * 100)),
    liability:   75, // default — no client-side liability data yet
  };

  const total = Math.round(
    breakdown.payment     * 0.40 +
    breakdown.scope       * 0.25 +
    breakdown.termination * 0.20 +
    breakdown.ip          * 0.10 +
    breakdown.liability   * 0.05,
  );

  const grade: ContractScore["grade"] =
    total >= 90 ? "A" : total >= 75 ? "B" : total >= 60 ? "C" : total >= 45 ? "D" : "F";

  const humanSummary =
    total >= 90 ? "Your contract is strongly protected. You've covered all key risk areas." :
    total >= 75 ? "Your contract is well structured with minor gaps worth addressing." :
    total >= 60 ? "Your contract is moderately protected. Several areas need attention." :
    total >= 45 ? "Your contract has significant gaps. Clients could exploit these weaknesses." :
                  "Your contract is high risk. Critical protections are missing.";

  const weakest = Object.entries(breakdown).sort(([, a], [, b]) => a - b)[0];
  const improvements: Record<string, string> = {
    payment:     "Adding a complete payment clause (amount + milestones + late fee) will protect your cash flow immediately.",
    scope:       "Defining a revision limit will reduce scope creep risk by up to 40%.",
    termination: "A 14-day notice clause will ensure you're compensated if a client exits early.",
    ip:          "Clarifying IP ownership prevents disputes over your work after delivery.",
    liability:   "Capping liability limits your financial exposure in worst-case scenarios.",
  };
  const topImprovement = improvements[weakest[0]] ?? "Fill all fields to get a complete risk assessment.";

  return { total, breakdown, grade, humanSummary, topImprovement };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT BENCHMARK EXPORT (for UI display)
// ─────────────────────────────────────────────────────────────────────────────
export { scorePaymentClause };