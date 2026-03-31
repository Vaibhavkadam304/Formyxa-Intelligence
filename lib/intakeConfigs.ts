// lib/intakeConfigs.ts

// -------------------- Types --------------------

export type IntakeFieldType = "short" | "long" | "select";
export type IntakeMode = "free-only" | "qa-only" | "qa-or-free";

export interface IntakeQuestion {
  id: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  type?: IntakeFieldType;
  options?: string[];
  required?: boolean;
}

export interface IntakeStepConfig {
  id: string;
  label: string;
  title: string;
  subtitle?: string;
  questionIds: string[];
}

export interface TemplateIntakeConfig {
  templateSlug: string;
  mode: IntakeMode;
  qaTitle?: string;
  qaSubtitle?: string;
  questions: IntakeQuestion[];
  steps?: IntakeStepConfig[];
  buildRawText: (answers: Record<string, string>) => string;
}

// ==========================================================
// OFFER LETTER
// ==========================================================

const offerQuestions: IntakeQuestion[] = [
  { id: "company_name", label: "Company name", required: true },
  { id: "company_address_line1", label: "Company address – line 1" },
  { id: "company_address_line2", label: "Company address – line 2" },
  { id: "company_phone", label: "Company phone" },
  { id: "company_email", label: "Company email" },

  { id: "candidate_name", label: "Candidate full name", required: true },
  { id: "candidate_address", label: "Candidate address", type: "long" },

  { id: "job_title", label: "Job title", required: true },
  { id: "work_location", label: "Work location", required: true },

  { id: "offer_date", label: "Offer letter date" },
  { id: "start_date", label: "Joining date" },
  { id: "salary_ctc", label: "Annual CTC", required: true },
  { id: "probation_period", label: "Probation period" },
  { id: "notice_period", label: "Notice period" },
  { id: "acceptance_deadline", label: "Acceptance deadline" },
  { id: "reporting_manager", label: "Reporting manager" },
];

const offerSteps: IntakeStepConfig[] = [
  {
    id: "company",
    label: "Company",
    title: "Company details",
    questionIds: [
      "company_name",
      "company_address_line1",
      "company_address_line2",
      "company_phone",
      "company_email",
    ],
  },
  {
    id: "candidate",
    label: "Candidate",
    title: "Candidate & role",
    questionIds: [
      "candidate_name",
      "candidate_address",
      "job_title",
      "work_location",
    ],
  },
  {
    id: "offer",
    label: "Offer",
    title: "Offer details",
    questionIds: [
      "offer_date",
      "start_date",
      "salary_ctc",
      "probation_period",
      "notice_period",
      "acceptance_deadline",
      "reporting_manager",
    ],
  },
];

// ==========================================================
// ANTI-SCOPE CREEP SOW (Minimal – 4 Questions)
// ==========================================================

const sowQuestions: IntakeQuestion[] = [
  {
    id: "project_name",
    label: "Project name",
    required: true,
  },
  {
    id: "client_name",
    label: "Client name",
    required: true,
  },
  {
    id: "main_deliverables",
    label: "Main deliverables",
    type: "long",
    required: true,
  },
  {
    id: "revision_rounds",
    label: "Number of revision rounds included",
    required: true,
  },
];

const sowSteps: IntakeStepConfig[] = [
  {
    id: "project",
    label: "Project",
    title: "Project details",
    questionIds: ["project_name", "client_name"],
  },
  {
    id: "scope",
    label: "Scope",
    title: "Scope definition",
    questionIds: ["main_deliverables", "revision_rounds"],
  },
];

// ==========================================================
// ALL INTAKE CONFIGS
// ==========================================================

export const INTAKE_CONFIGS: TemplateIntakeConfig[] = [
  {
    templateSlug: "offer-letter-standard",
    mode: "qa-or-free",
    qaTitle: "Create a job offer letter",
    qaSubtitle:
      "Answer a few questions and we’ll generate a formal job offer letter.",
    questions: offerQuestions,
    steps: offerSteps,
    buildRawText(answers) {
      return `
Company: ${answers.company_name || ""}
Candidate: ${answers.candidate_name || ""}
Job title: ${answers.job_title || ""}
CTC: ${answers.salary_ctc || ""}
Start date: ${answers.start_date || ""}

Generate a professional job offer letter.
      `.trim();
    },
  },

  {
    templateSlug: "anti-scope-creep-sow-core",
    mode: "qa-only", // 🔥 IMPORTANT
    qaTitle: "Create Anti-Scope Creep SOW",
    qaSubtitle:
      "Answer a few questions and we’ll generate a protected scope of work.",
    questions: sowQuestions,
    steps: sowSteps,
    buildRawText(answers) {
      return `
Project: ${answers.project_name}
Client: ${answers.client_name}
Deliverables: ${answers.main_deliverables}
Revision rounds included: ${answers.revision_rounds}

Generate a structured Anti-Scope Creep SOW with clear included deliverables and strict revision limits.
      `.trim();
    },
  },
];

// -------------------- Helper --------------------

export function getIntakeConfigForTemplate(slug: string) {
  return INTAKE_CONFIGS.find((cfg) => cfg.templateSlug === slug);
}
