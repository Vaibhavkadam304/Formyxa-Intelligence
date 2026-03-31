// prisma/seed.js
// ──────────────────────────────────────────────────────────────────────────────
// FINAL COMPLETE SEED — All templates including Master Service Agreement
//   • Incident Postmortem
//   • Anti-Scope Creep SOW
//   • Creative Services Retainer Agreement
//   • Master Service Agreement (Professional Services Shield) ← NEW
//
// MSA KEY FIXES vs previous version:
//   ✅ All section headings have required: true so extractRequiredSections() works
//   ✅ aiConfig.requiredSections match heading text AFTER number-strip
//   ✅ formyxaField nodes use value: "" not just placeholder (so extractFieldValues works)
//   ✅ type: "msa" registered with full riskFocus for AI layer
// ──────────────────────────────────────────────────────────────────────────────

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import * as adapterPg from "@prisma/adapter-pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

console.log("▶ seed.js loaded, DATABASE_URL present:", !!process.env.DATABASE_URL);

const { Pool }    = pg;
const { PrismaPg } = adapterPg;
const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });


// ─────────────────────────────────────────────────────────────────────────────
//  INCIDENT POSTMORTEM (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export const incidentPostmortemContentJson = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [
        { type: "formyxaField", attrs: { key: "incident_title", label: "Incident title", required: true, bold: true } },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Summary: " },
        { type: "formyxaField", attrs: { key: "summary", label: "Summary", multiline: true, required: true } },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Root Cause: " },
        { type: "formyxaField", attrs: { key: "root_cause", label: "Root cause analysis", multiline: true, required: true } },
      ],
    },
  ],
};

export const incidentPostmortemPlaceholderSchema = {
  "Incident title":            { label: "Incident title" },
  "Click to set incident date":{ label: "Incident date" },
  "Assign owner":              { label: "Owner" },
  "Sev-1 / Sev-2 / Sev-3":   { label: "Severity" },
  summary:                     { label: "Summary", multiline: true },
  impact:                      { label: "Impact", multiline: true },
  timeline:                    { label: "Timeline entry" },
  root_cause:                  { label: "Root cause analysis", multiline: true },
  action_items:                { label: "Action items" },
  lessons_learned:             { label: "Lessons learned", multiline: true },
};


// ─────────────────────────────────────────────────────────────────────────────
//  ANTI-SCOPE CREEP SOW
// ─────────────────────────────────────────────────────────────────────────────

export const antiScopeCreepSowJson = {
  type: "doc",
  content: [

    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Statement of Work" }] },

    // META TABLE
    {
      type: "table",
      attrs: { class: "meta-table" },
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Client", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "client_name", label: "Client Name", value: "", required: true } }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Effective Date", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "effective_date", label: "Effective Date", value: "", required: true } }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Service Provider", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "provider_name", label: "Service Provider Name", value: "", required: true } }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Project Lead", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "project_lead", label: "Project Lead Name", value: "", required: true } }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Project Name", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", attrs: { colspan: 3 }, content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "project_name", label: "Project Name", value: "", required: true } }] }] },
          ],
        },
      ],
    },

    { type: "paragraph" },

    // 1. PROJECT PURPOSE
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "1. Project Purpose" }] },
    { type: "paragraph" },
    { type: "paragraph" },
    { type: "paragraph" },

    // 2. SCOPE OF SERVICES
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "2. Scope of Services" }] },
    { type: "paragraph", content: [{ type: "text", text: "The Service Provider will perform the following services:" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph" }] },
        { type: "listItem", content: [{ type: "paragraph" }] },
        { type: "listItem", content: [{ type: "paragraph" }] },
      ],
    },

    // 3. SCHEDULE & MILESTONES
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "3. Schedule & Milestones" }] },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Milestone" }] }] },
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Deliverable" }] }] },
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Timeline" }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "M1" }] }] },
            { type: "tableCell", content: [{ type: "paragraph" }] },
            { type: "tableCell", content: [{ type: "paragraph" }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "M2" }] }] },
            { type: "tableCell", content: [{ type: "paragraph" }] },
            { type: "tableCell", content: [{ type: "paragraph" }] },
          ],
        },
      ],
    },

    // 4. PAYMENT TERMS
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "4. Payment Terms" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "The Client agrees to pay a total project fee of " },
        { type: "formyxaField", attrs: { key: "project_fee", label: "Project Fee", value: "", required: true, bold: true } },
        { type: "text", text: ", payable as follows: " },
        { type: "formyxaField", attrs: { key: "payment_structure", label: "Payment Structure", value: "50% upfront and 50% upon final delivery", required: true } },
        { type: "text", text: ". All invoices are due within " },
        { type: "formyxaField", attrs: { key: "invoice_due_days", label: "Invoice Due Days", value: "15", required: true } },
        { type: "text", text: " days of issuance. Late payments shall incur interest at " },
        { type: "formyxaField", attrs: { key: "late_interest", label: "Late Interest %", value: "1.5%", required: true } },
        { type: "text", text: " per month." },
      ],
    },

    // 5. EXCLUSIONS
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "5. Exclusions" }] },
    { type: "paragraph", content: [{ type: "text", text: "The following items are explicitly out of scope unless agreed in writing:" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Additional features or functionality not described in Section 2." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Third-party software, API, or licensing fees." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Ongoing maintenance, support, or hosting beyond the agreed timeline." }] }] },
      ],
    },

    // 6. REVISION POLICY
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "6. Revision Policy" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This project includes up to " },
        { type: "formyxaField", attrs: { key: "revision_rounds", label: "Revision Rounds", value: "2", required: true } },
        { type: "text", text: " rounds of revisions per deliverable. A revision is defined as minor modifications and does not include new features or structural changes. Additional revisions will be billed at the standard hourly rate." },
      ],
    },

    // 7. CHANGE MANAGEMENT
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "7. Change Management" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Any work outside the agreed Scope of Services must be submitted as a written Change Request. The Service Provider will assess the cost and timeline impact before proceeding. No additional work will begin without written approval from both parties. Out-of-scope work may be billed at an hourly rate of " },
        { type: "formyxaField", attrs: { key: "hourly_rate", label: "Hourly Rate", value: "" } },
        { type: "text", text: " per hour unless otherwise agreed in writing." },
      ],
    },

    // 8. INTELLECTUAL PROPERTY
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "8. Intellectual Property" }] },
    { type: "paragraph", content: [{ type: "text", text: "Ownership of all final deliverables transfers to the Client upon receipt of full payment. The Service Provider retains ownership of pre-existing tools, frameworks, methodologies, and proprietary systems used to produce the deliverables." }] },

    // 9. TERMINATION
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "9. Termination" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Either party may terminate this Agreement with " },
        { type: "formyxaField", attrs: { key: "notice_period", label: "Notice Period (days)", value: "30", required: true } },
        { type: "text", text: " days\u2019 written notice. The Client shall remain responsible for payment of all completed work and approved milestones up to the effective date of termination." },
      ],
    },

    // 10. GOVERNING LAW
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "10. Governing Law & Jurisdiction" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This Agreement shall be governed by the laws of " },
        { type: "formyxaField", attrs: { key: "governing_law", label: "Governing Jurisdiction", value: "", required: true } },
        { type: "text", text: ". Any disputes shall be resolved through " },
        { type: "formyxaField", attrs: { key: "dispute_resolution", label: "Dispute Resolution Method", value: "arbitration" } },
        { type: "text", text: "." },
      ],
    },

    // 11. ACCEPTANCE
    { type: "paragraph" },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "11. Acceptance" }] },
    { type: "paragraph", content: [{ type: "text", text: "By signing below, the parties acknowledge that they have read, understood, and agree to all terms and conditions set forth in this Statement of Work. This document becomes legally binding upon execution by both parties." }] },
    { type: "paragraph" },
    { type: "signaturesBlock", attrs: { leftTitle: "CLIENT", rightTitle: "SERVICE PROVIDER" } },
  ],
};


// ─────────────────────────────────────────────────────────────────────────────
//  CREATIVE SERVICES RETAINER AGREEMENT
// ─────────────────────────────────────────────────────────────────────────────

export const creativeRetainerAgreementJson = {
  type: "doc",
  content: [

    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Creative Services Retainer Agreement" }] },

    {
      type: "paragraph",
      content: [
        { type: "text", text: "This Retainer Agreement (the \u201cAgreement\u201d) is entered into as of " },
        { type: "formyxaField", attrs: { key: "effective_date", label: "Effective Date", value: "", placeholder: "Enter effective date" } },
        { type: "text", text: ", by and between:" },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Service Provider: " },
        { type: "formyxaField", attrs: { key: "provider_name", label: "Service Provider Name", value: "", placeholder: "Enter full legal name" } },
        { type: "text", text: ", located at " },
        { type: "formyxaField", attrs: { key: "provider_address", label: "Service Provider Address", value: "", placeholder: "Enter registered address" } },
        { type: "text", text: "." },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Client: " },
        { type: "formyxaField", attrs: { key: "client_name", label: "Client Company Name", value: "", placeholder: "Enter client legal name" } },
        { type: "text", text: ", located at " },
        { type: "formyxaField", attrs: { key: "client_address", label: "Client Address", value: "", placeholder: "Enter client address" } },
        { type: "text", text: "." },
      ],
    },

    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "1. Term and Renewal" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This Agreement shall commence on the Effective Date and remain in effect for an initial term of " },
        { type: "formyxaField", attrs: { key: "term_months", label: "Initial Term (months)", value: "", placeholder: "e.g. 12" } },
        { type: "text", text: " months. Upon expiration, this Agreement shall automatically renew on a rolling monthly basis unless terminated by either party with " },
        { type: "formyxaField", attrs: { key: "notice_days", label: "Notice Days", value: "", placeholder: "30" } },
        { type: "text", text: " days written notice." },
      ],
    },

    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "2. Scope of Services & Deliverables" }] },
    { type: "paragraph", content: [{ type: "text", text: "During the Term, the Service Provider agrees to provide the following recurring monthly services to the Client:" }] },
    {
      type: "paragraph",
      attrs: { field: "scope_of_services", instructional: true },
      content: [{ type: "text", text: "Describe the monthly deliverables and recurring services included in this retainer (e.g. SEO, paid media management, design sprints, content production). Include any express exclusions." }],
    },
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Out of Scope" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Any tasks, requests, or deliverables not explicitly listed above are considered out of scope. Out-of-scope work will be evaluated and billed separately at the standard overage rate of " },
        { type: "formyxaField", attrs: { key: "overage_rate", label: "Overage Hourly Rate", value: "", placeholder: "e.g. \u20b92,000/hr or $75/hr" } },
        { type: "text", text: " per hour, or formalised under a separate Statement of Work (SOW)." },
      ],
    },

    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "3. Compensation & Invoicing" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "The Client agrees to pay a fixed monthly Retainer Fee of " },
        { type: "formyxaField", attrs: { key: "retainer_fee", label: "Monthly Retainer Fee", value: "", placeholder: "e.g. \u20b980,000 or $3,000" } },
        { type: "text", text: " (the \u201cRetainer Fee\u201d)." },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Invoicing: " },
            { type: "text", text: "Invoices will be issued on the " },
            { type: "formyxaField", attrs: { key: "invoice_day", label: "Invoice Day", value: "", placeholder: "1st" } },
            { type: "text", text: " of each month." },
          ]}],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Payment Terms: " },
            { type: "text", text: "Payment is due Net " },
            { type: "formyxaField", attrs: { key: "invoice_due_days", label: "Payment Due Days", value: "", placeholder: "15" } },
            { type: "text", text: " days from the invoice date via " },
            { type: "formyxaField", attrs: { key: "payment_method", label: "Payment Method", value: "", placeholder: "e.g. Bank Transfer / Razorpay" } },
            { type: "text", text: "." },
          ]}],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Late Payments: " },
            { type: "text", text: "The Service Provider reserves the right to halt all ongoing work if payment is not received within " },
            { type: "formyxaField", attrs: { key: "late_grace_days", label: "Late Grace Days", value: "", placeholder: "7" } },
            { type: "text", text: " days of the due date. A late fee of " },
            { type: "formyxaField", attrs: { key: "late_interest", label: "Late Interest %", value: "", placeholder: "1.5%" } },
            { type: "text", text: " per month will apply to all overdue balances." },
          ]}],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Rollover Policy: " },
            { type: "text", text: "Unused hours or deliverables " },
            { type: "formyxaField", attrs: { key: "rollover_policy", label: "Rollover Policy", value: "", placeholder: "shall not roll over" } },
            { type: "text", text: " to the following billing cycle." },
          ]}],
        },
      ],
    },

    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "4. Client Responsibilities & Approvals" }] },
    { type: "paragraph", content: [{ type: "text", text: "The Service Provider\u2019s ability to meet agreed timelines is contingent on the Client\u2019s timely provision of assets, platform access, brand guidelines, and consolidated feedback." }] },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Deemed Approval: " },
        { type: "text", text: "If the Service Provider submits a deliverable for review, the Client has " },
        { type: "formyxaField", attrs: { key: "approval_days", label: "Approval Window (business days)", value: "", placeholder: "3" } },
        { type: "text", text: " business days to provide consolidated feedback. If no feedback is received within this window, the deliverable shall be deemed approved and the Service Provider may proceed to the next phase without liability." },
      ],
    },

    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "5. Intellectual Property Rights" }] },
    { type: "paragraph", content: [{ type: "text", text: "Upon receipt of full and final payment for the respective billing cycle, the Service Provider grants the Client all rights, title, and interest in the final, published deliverables produced under that cycle. The Service Provider retains the right to use non-confidential elements of the work for portfolio, marketing, and case study purposes, unless expressly restricted in writing." }] },
    { type: "paragraph", content: [{ type: "text", text: "If the Client fails to make payment for any billing cycle, the Service Provider retains full ownership of all materials produced in that cycle, and the Client is strictly prohibited from using, publishing, or distributing such work." }] },

    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "6. Independent Contractor & Confidentiality" }] },
    { type: "paragraph", content: [{ type: "text", text: "The Service Provider acts solely as an independent contractor and not as an employee, partner, or agent of the Client. Both parties agree to maintain strict confidentiality regarding all proprietary data, business strategies, pricing information, and trade secrets disclosed during this engagement, and to not disclose such information to any third party without prior written consent." }] },

    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "7. Limitation of Liability" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "The Service Provider shall not be liable for any indirect, incidental, special, or consequential damages, including but not limited to loss of revenue, loss of profits, or business interruption, arising from the services rendered under this Agreement. The maximum aggregate liability of the Service Provider under this Agreement shall not exceed the total Retainer Fees paid by the Client in the " },
        { type: "formyxaField", attrs: { key: "liability_cap_months", label: "Liability Cap (months)", value: "", placeholder: "3" } },
        { type: "text", text: " months immediately preceding the claim." },
      ],
    },

    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "8. Termination" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Either party may terminate this Agreement without cause by providing " },
        { type: "formyxaField", attrs: { key: "notice_days", label: "Notice Days", value: "", placeholder: "30" } },
        { type: "text", text: " days written notice to the other party. The Client shall remain responsible for the full Retainer Fee for the entire duration of the notice period, and the Service Provider shall continue to fulfil the agreed scope of services until the effective termination date." },
      ],
    },

    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "9. Governing Law & Dispute Resolution" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This Agreement constitutes the entire understanding between the parties and supersedes all prior discussions, representations, or agreements. It shall be governed by and construed in accordance with the laws of " },
        { type: "formyxaField", attrs: { key: "governing_law", label: "Governing Law", value: "", placeholder: "e.g. India or New York, USA" } },
        { type: "text", text: ". Any dispute arising under this Agreement shall be resolved through binding arbitration in the applicable jurisdiction before recourse to litigation." },
      ],
    },

    { type: "paragraph" },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "10. Acceptance" }] },
    { type: "paragraph", content: [{ type: "text", text: "By signing below, the parties agree to be bound by the terms of this Creative Services Retainer Agreement. This Agreement takes effect on the date of the last signature below." }] },
    { type: "paragraph" },
    { type: "signaturesBlock", attrs: { leftTitle: "CLIENT", rightTitle: "SERVICE PROVIDER" } },
  ],
};

export const creativeRetainerPlaceholderSchema = {
  effective_date:       { label: "Effective Date",                          type: "date"     },
  provider_name:        { label: "Service Provider Name",                   type: "text"     },
  provider_address:     { label: "Service Provider Address",                type: "address"  },
  client_name:          { label: "Client Company Name",                     type: "text"     },
  client_address:       { label: "Client Address",                          type: "address"  },
  term_months:          { label: "Initial Term (months)",                   type: "number"   },
  notice_days:          { label: "Termination Notice (days)",               type: "number"   },
  scope_of_services:    { label: "Monthly Deliverables & Services",         type: "text"     },
  overage_rate:         { label: "Overage Hourly Rate",                     type: "currency" },
  retainer_fee:         { label: "Monthly Retainer Fee",                    type: "currency" },
  invoice_day:          { label: "Invoice Day of Month",                    type: "number"   },
  invoice_due_days:     { label: "Payment Due (Net days)",                  type: "number"   },
  payment_method:       { label: "Payment Method",                          type: "text"     },
  late_grace_days:      { label: "Late Payment Grace Period (days)",        type: "number"   },
  late_interest:        { label: "Late Interest Rate (% per month)",        type: "number"   },
  rollover_policy:      { label: "Unused Hours / Deliverables Rollover",    type: "dropdown" },
  approval_days:        { label: "Deemed Approval Window (business days)",  type: "number"   },
  liability_cap_months: { label: "Liability Cap (months of retainer fees)", type: "number"   },
  governing_law:        { label: "Governing Law (State / Country)",         type: "text"     },
};


// ─────────────────────────────────────────────────────────────────────────────
//  MASTER SERVICE AGREEMENT — Professional Services Shield
//
//  ✅ KEY FIXES:
//     • All level-2 headings have required: true  → extractRequiredSections() works
//     • All formyxaField nodes have value: ""      → extractFieldValues() returns "" not undefined
//     • aiConfig.requiredSections = stripped heading text (no "N. " prefix)
//     • type: "msa" with full riskFocus for AI review layer
// ─────────────────────────────────────────────────────────────────────────────

export const masterServiceAgreementJson = {
  type: "doc",
  content: [

    // ── TITLE ────────────────────────────────────────────────────────────────
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Master Service Agreement" }] },
    { type: "paragraph", content: [{ type: "text", marks: [{ type: "italic" }], text: "Professional Services Shield" }] },

    // ── META TABLE ───────────────────────────────────────────────────────────
    {
      type: "table",
      attrs: { class: "meta-table" },
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Client", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "client_name", label: "Client Legal Name", value: "", required: true } }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Effective Date", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "effective_date", label: "Effective Date", value: "", required: true } }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Service Provider", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "provider_name", label: "Service Provider Legal Name", value: "", required: true } }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Provider Address", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "provider_address", label: "Registered Address", value: "", required: true } }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Client Address", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", attrs: { colspan: 3 }, content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "client_address", label: "Client Registered Address", value: "", required: true } }] }] },
          ],
        },
      ],
    },

    { type: "paragraph" },

    // ── RECITALS ─────────────────────────────────────────────────────────────
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This Master Service Agreement (the \u201cAgreement\u201d) is entered into as of the Effective Date above, by and between " },
        { type: "formyxaField", attrs: { key: "provider_name", label: "Service Provider Name", value: "", required: true } },
        { type: "text", text: " (\u201cService Provider\u201d) and " },
        { type: "formyxaField", attrs: { key: "client_name", label: "Client Name", value: "", required: true } },
        { type: "text", text: " (\u201cClient\u201d). This Agreement governs all professional services provided by the Service Provider to the Client." },
      ],
    },

    { type: "paragraph" },

    // ── 1. THE PARTIES ────────────────────────────────────────────────────────
    // ✅ required: true so extractRequiredSections() picks this up
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "1. The Parties" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "The Service Provider, " },
        { type: "formyxaField", attrs: { key: "provider_name", label: "Service Provider Name", value: "", required: true } },
        { type: "text", text: ", and the Client, " },
        { type: "formyxaField", attrs: { key: "client_name", label: "Client Name", value: "", required: true } },
        { type: "text", text: ", collectively referred to as the \u201cParties,\u201d agree to be bound by the terms of this Agreement. Individual project engagements will be governed by separate Statements of Work (\u201cSOWs\u201d) executed under this Agreement." },
      ],
    },

    // ── 2. SCOPE OF SERVICES (ANTI-SCOPE CREEP) ──────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "2. Scope of Services (Anti-Scope Creep)" }] },
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "2.1 Included Services" }] },
    { type: "paragraph", content: [{ type: "text", text: "The Service Provider shall perform only the services explicitly described in the applicable SOW or written project brief agreed by both parties. Services included under this Agreement are:" }] },
    {
      type: "paragraph",
      attrs: { field: "included_services", instructional: true },
      content: [{ type: "text", text: "Enter specific deliverables and services here. Be as precise as possible \u2014 only what is listed here is in scope." }],
    },
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "2.2 Exclusions \u2014 The Revenue Guard" }] },
    { type: "paragraph", content: [{ type: "text", text: "Anything not explicitly listed in Section 2.1 is considered \u201cOut of Scope.\u201d The following items are specifically excluded from this Agreement and will not be delivered without a signed Change Order and additional payment:" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "exclusion_1", label: "Exclusion 1", value: "", placeholder: "e.g. 24/7 Support" } }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "exclusion_2", label: "Exclusion 2", value: "", placeholder: "e.g. Unlimited Revisions" } }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "exclusion_3", label: "Exclusion 3", value: "", placeholder: "e.g. Third-party software licensing" } }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Any feature, functionality, platform, or integration not described in the applicable SOW." }] }] },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Out-of-scope work requested by the Client will be scoped, priced, and executed under a written Change Order at an hourly rate of " },
        { type: "formyxaField", attrs: { key: "overage_rate", label: "Overage Hourly Rate", value: "", placeholder: "e.g. $150/hr" } },
        { type: "text", text: " or as otherwise agreed in writing. No additional work shall commence without written authorisation from both Parties." },
      ],
    },

    // ── 3. COMPENSATION & LATE FEES ───────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "3. Compensation & Late Fees" }] },
    // Fee summary table
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Item" }] }] },
            { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Detail" }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Total Project Fee", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "project_fee", label: "Total Project Fee", value: "", required: true, bold: true } }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Payment Schedule", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "payment_schedule", label: "Payment Schedule", value: "", placeholder: "e.g. 50% upfront, 50% on delivery", required: true } }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Invoice Due", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [
              { type: "text", text: "Within " },
              { type: "formyxaField", attrs: { key: "invoice_due_days", label: "Invoice Due Days", value: "", placeholder: "15", required: true } },
              { type: "text", text: " days of receipt" },
            ]}] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Late Payment Penalty", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [
              { type: "formyxaField", attrs: { key: "late_interest", label: "Late Interest % per month", value: "", placeholder: "1.5%", required: true } },
              { type: "text", text: " per month on outstanding balance" },
            ]}] },
          ],
        },
      ],
    },
    { type: "paragraph" },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Client agrees to pay all invoices within " },
        { type: "formyxaField", attrs: { key: "invoice_due_days", label: "Invoice Due Days", value: "", placeholder: "15", required: true } },
        { type: "text", text: " days of receipt. Any payment not received by the due date shall accrue interest at a rate of " },
        { type: "formyxaField", attrs: { key: "late_interest", label: "Late Interest %", value: "", placeholder: "1.5%", required: true } },
        { type: "text", text: " per month on the outstanding balance. If payment is overdue by more than " },
        { type: "formyxaField", attrs: { key: "halt_grace_days", label: "Work Halt Grace Days", value: "", placeholder: "7" } },
        { type: "text", text: " days, the Service Provider reserves the right to immediately suspend all work until payment is received in full, without liability for resulting delays." },
      ],
    },

    // ── 4. INTELLECTUAL PROPERTY — OWNERSHIP LEVERAGE ────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "4. Intellectual Property \u2014 Ownership Leverage" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "The Parties agree that all work product, deliverables, designs, code, copy, creative assets, and materials produced under this Agreement (\u201cWork Product\u201d) shall be owned exclusively by the Client " },
        { type: "text", marks: [{ type: "bold" }], text: "ONLY AFTER" },
        { type: "text", text: " full and final payment has been received by the Service Provider in full." },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "Until such time as all outstanding fees have been paid:" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "The Service Provider retains all intellectual property rights, title, and interest in the Work Product." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "The Client is expressly prohibited from using, publishing, distributing, selling, or transferring the Work Product in any form." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "The Service Provider may seek injunctive relief without bond or surety to enforce this clause." }] }] },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "The Service Provider retains perpetual ownership of all pre-existing tools, frameworks, methodologies, proprietary systems, and background IP used to produce the Work Product. The Service Provider is granted the right to feature non-confidential Work Product in its portfolio and marketing materials unless expressly restricted in writing." }] },

    // ── 5. TERMINATION & KILL-FEE ─────────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "5. Termination & Kill-Fee" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Either party may terminate this Agreement with " },
        { type: "formyxaField", attrs: { key: "notice_period", label: "Notice Period (days)", value: "", placeholder: "14", required: true } },
        { type: "text", text: " days\u2019 written notice to the other party." },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Kill-Fee (Client-Initiated Termination): " },
        { type: "text", text: "In the event of termination initiated by the Client prior to project completion, the Client shall pay a Kill-Fee equal to " },
        { type: "text", marks: [{ type: "bold" }], text: "100% of the fees for work completed" },
        { type: "text", text: " up to the termination date, plus an administrative fee of " },
        { type: "formyxaField", attrs: { key: "kill_fee_admin_pct", label: "Kill-Fee Admin %", value: "", placeholder: "10%", required: true } },
        { type: "text", text: " of the remaining contract value. Any non-refundable third-party costs already incurred by the Service Provider on behalf of the Client shall also be billed in full." },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Provider-Initiated Termination: " },
        { type: "text", text: "If the Service Provider terminates this Agreement, the Client shall be entitled to a prorated refund of any pre-paid fees for services not yet rendered, and all completed Work Product shall transfer to the Client upon settlement of outstanding balances." },
      ],
    },

    // ── 6. CHANGE MANAGEMENT ─────────────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "6. Change Management" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "All change requests must be submitted in writing using a Change Order form. The Service Provider will assess the scope, cost, and timeline impact of each request within " },
        { type: "formyxaField", attrs: { key: "change_review_days", label: "Change Review Days", value: "", placeholder: "3" } },
        { type: "text", text: " business days. No additional or modified work shall commence until both Parties have signed the Change Order. Verbal approvals or approvals by email without a signed Change Order are not binding on the Service Provider." },
      ],
    },

    // ── 7. REVISION POLICY ────────────────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "7. Revision Policy" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Each deliverable includes up to " },
        { type: "formyxaField", attrs: { key: "revision_rounds", label: "Revision Rounds", value: "", placeholder: "2", required: true } },
        { type: "text", text: " rounds of revisions. A \u201crevision\u201d means minor adjustments to existing work and does not include new features, structural redesigns, or changes to the agreed brief. Additional revision rounds beyond this limit will be billed at " },
        { type: "formyxaField", attrs: { key: "overage_rate", label: "Overage Hourly Rate", value: "", placeholder: "e.g. $150/hr" } },
        { type: "text", text: " per hour." },
      ],
    },

    // ── 8. DEEMED APPROVAL ────────────────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "8. Deemed Approval" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Upon delivery of any deliverable, the Client has " },
        { type: "formyxaField", attrs: { key: "approval_days", label: "Approval Window (business days)", value: "", placeholder: "3" } },
        { type: "text", text: " business days to provide consolidated written feedback. If no feedback is received within this window, the deliverable shall be deemed approved by the Client and the Service Provider may proceed to the next phase without further liability for that deliverable." },
      ],
    },

    // ── 9. CONFIDENTIALITY ────────────────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "9. Confidentiality" }] },
    { type: "paragraph", content: [{ type: "text", text: "Both Parties agree to hold in strict confidence all proprietary information, trade secrets, business strategies, pricing, financial data, client lists, and technical information disclosed during this engagement. Neither Party shall disclose such information to any third party without prior written consent, except as required by law. This obligation survives the termination of this Agreement for a period of three (3) years." }] },

    // ── 10. INDEPENDENT CONTRACTOR ────────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "10. Independent Contractor" }] },
    { type: "paragraph", content: [{ type: "text", text: "The Service Provider is an independent contractor and not an employee, partner, joint venturer, or agent of the Client. The Service Provider retains the right to perform services for other clients during the term of this Agreement, provided doing so does not create a conflict of interest or breach of confidentiality obligations." }] },

    // ── 11. LIMITATION OF LIABILITY ───────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "11. Limitation of Liability" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "To the maximum extent permitted by applicable law, the Service Provider\u2019s total liability to the Client under this Agreement shall not exceed the total fees paid by the Client in the " },
        { type: "formyxaField", attrs: { key: "liability_cap_months", label: "Liability Cap (months)", value: "", placeholder: "3" } },
        { type: "text", text: " months immediately preceding the event giving rise to the claim. In no event shall the Service Provider be liable for indirect, consequential, incidental, special, or punitive damages, including loss of profits or business interruption." },
      ],
    },

    // ── 12. GOVERNING LAW & DISPUTE RESOLUTION ────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "12. Governing Law & Dispute Resolution" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This Agreement shall be governed by and construed in accordance with the laws of " },
        { type: "formyxaField", attrs: { key: "governing_law", label: "Governing Jurisdiction", value: "", placeholder: "e.g. State of Delaware, USA", required: true } },
        { type: "text", text: ". Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach thereof, shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding " },
        { type: "formyxaField", attrs: { key: "dispute_resolution", label: "Dispute Resolution Method", value: "", placeholder: "arbitration", required: true } },
        { type: "text", text: " under the rules of the applicable jurisdiction." },
      ],
    },

    // ── 13. GENERAL PROVISIONS ────────────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "13. General Provisions" }] },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Entire Agreement: " },
            { type: "text", text: "This Agreement, together with any applicable SOWs and Change Orders, constitutes the entire agreement between the Parties and supersedes all prior discussions, representations, or agreements." },
          ]}],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Amendments: " },
            { type: "text", text: "No modification of this Agreement shall be binding unless in writing and signed by authorised representatives of both Parties." },
          ]}],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Severability: " },
            { type: "text", text: "If any provision of this Agreement is found to be unenforceable, the remaining provisions shall continue in full force and effect." },
          ]}],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Force Majeure: " },
            { type: "text", text: "Neither Party shall be liable for delays or failures in performance resulting from events beyond their reasonable control, including acts of God, governmental actions, or natural disasters." },
          ]}],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Non-Solicitation: " },
            { type: "text", text: "During the term of this Agreement and for " },
            { type: "formyxaField", attrs: { key: "non_solicit_months", label: "Non-Solicitation Period (months)", value: "", placeholder: "12" } },
            { type: "text", text: " months thereafter, neither Party shall solicit or hire the other Party\u2019s employees or contractors without prior written consent." },
          ]}],
        },
      ],
    },

    // ── 14. ACCEPTANCE & EXECUTION ────────────────────────────────────────────
    { type: "paragraph" },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "14. Acceptance & Execution" }] },
    { type: "paragraph", content: [{ type: "text", text: "By signing below, the authorised representatives of the Parties acknowledge that they have read, understood, and agree to all terms and conditions of this Master Service Agreement. This Agreement becomes legally binding upon execution by both Parties and shall remain in effect until terminated in accordance with Section 5." }] },
    { type: "paragraph" },
    { type: "signaturesBlock", attrs: { leftTitle: "CLIENT", rightTitle: "SERVICE PROVIDER" } },
  ],
};

export const masterServiceAgreementPlaceholderSchema = {
  client_name:          { label: "Client Legal Name",                        type: "text"     },
  effective_date:       { label: "Effective Date",                           type: "date"     },
  provider_name:        { label: "Service Provider Legal Name",              type: "text"     },
  provider_address:     { label: "Service Provider Registered Address",      type: "address"  },
  client_address:       { label: "Client Registered Address",                type: "address"  },
  included_services:    { label: "Included Services / Deliverables",         type: "text"     },
  exclusion_1:          { label: "Exclusion 1",                              type: "text"     },
  exclusion_2:          { label: "Exclusion 2",                              type: "text"     },
  exclusion_3:          { label: "Exclusion 3",                              type: "text"     },
  overage_rate:         { label: "Out-of-Scope Hourly Rate",                 type: "currency" },
  project_fee:          { label: "Total Project Fee",                        type: "currency" },
  payment_schedule:     { label: "Payment Schedule",                         type: "text"     },
  invoice_due_days:     { label: "Invoice Due (days)",                       type: "number"   },
  late_interest:        { label: "Late Interest Rate (% per month)",         type: "number"   },
  halt_grace_days:      { label: "Work Halt Grace Period (days)",            type: "number"   },
  notice_period:        { label: "Termination Notice Period (days)",         type: "number"   },
  kill_fee_admin_pct:   { label: "Kill-Fee Administrative % of remainder",   type: "number"   },
  change_review_days:   { label: "Change Order Review Time (business days)", type: "number"   },
  revision_rounds:      { label: "Included Revision Rounds",                 type: "number"   },
  approval_days:        { label: "Deemed Approval Window (business days)",   type: "number"   },
  liability_cap_months: { label: "Liability Cap (months of fees)",           type: "number"   },
  governing_law:        { label: "Governing Jurisdiction (State / Country)",  type: "text"    },
  dispute_resolution:   { label: "Dispute Resolution Method",                type: "dropdown" },
  non_solicit_months:   { label: "Non-Solicitation Period (months)",         type: "number"   },
};


// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SEED
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed.main()");
  const existingCount = await prisma.template.count();
  console.log("📊 Existing templates count before upsert:", existingCount);

  // ── Incident Postmortem ──────────────────────────────────────────────────
  console.log("🛠  Upserting incident-postmortem-core...");
  await prisma.template.upsert({
    where:  { slug: "incident-postmortem-core" },
    update: {
      name: "Incident Postmortem (RCA)",
      type: "incident",
      placeholderSchema: incidentPostmortemPlaceholderSchema,
      contentJsonTemplate: { standard: incidentPostmortemContentJson },
      supportedPresets: ["standard"],
    },
    create: {
      slug: "incident-postmortem-core",
      name: "Incident Postmortem (RCA)",
      type: "incident",
      placeholderSchema: incidentPostmortemPlaceholderSchema,
      contentJsonTemplate: { standard: incidentPostmortemContentJson },
      supportedPresets: ["standard"],
    },
  });

  // ── Anti-Scope Creep SOW ─────────────────────────────────────────────────
  console.log("🛠  Upserting anti-scope-creep-sow-core...");
  await prisma.template.upsert({
    where:  { slug: "anti-scope-creep-sow-core" },
    update: {
      name: "Anti-Scope Creep SOW",
      type: "sow",
      aiConfig: {
        documentType: "Statement of Work",
        requiredSections: [
          "Project Purpose",
          "Scope of Services",
          "Schedule & Milestones",
          "Payment Terms",
          "Exclusions",
          "Revision Policy",
          "Change Management",
          "Intellectual Property",
          "Termination",
          "Governing Law & Jurisdiction",
        ],
        riskFocus: ["scope creep protection", "payment protection", "revision limits", "ip ownership", "jurisdiction clarity"],
      },
      contentJsonTemplate: { standard: antiScopeCreepSowJson },
      supportedPresets: ["standard"],
    },
    create: {
      slug: "anti-scope-creep-sow-core",
      name: "Anti-Scope Creep SOW",
      type: "sow",
      aiConfig: {
        documentType: "Statement of Work",
        requiredSections: [
          "Project Purpose",
          "Scope of Services",
          "Schedule & Milestones",
          "Payment Terms",
          "Exclusions",
          "Revision Policy",
          "Change Management",
          "Intellectual Property",
          "Termination",
          "Governing Law & Jurisdiction",
        ],
        riskFocus: ["scope creep protection", "payment protection", "revision limits", "ip ownership", "jurisdiction clarity"],
      },
      contentJsonTemplate: { standard: antiScopeCreepSowJson },
      supportedPresets: ["standard"],
    },
  });

  // ── Creative Retainer Agreement ──────────────────────────────────────────
  console.log("🛠  Upserting creative-retainer-agreement-core...");
  await prisma.template.upsert({
    where:  { slug: "creative-retainer-agreement-core" },
    update: {
      name: "Creative Services Retainer Agreement",
      type: "retainer",
      aiConfig: {
        documentType: "Creative Services Retainer Agreement",
        requiredSections: [
          "Term and Renewal",
          "Scope of Services & Deliverables",
          "Compensation & Invoicing",
          "Client Responsibilities & Approvals",
          "Intellectual Property Rights",
          "Independent Contractor & Confidentiality",
          "Limitation of Liability",
          "Termination",
          "Governing Law & Dispute Resolution",
        ],
        riskFocus: ["monthly fee clarity", "overage billing", "deemed approval", "ip on payment", "notice period", "liability cap"],
      },
      placeholderSchema: creativeRetainerPlaceholderSchema,
      contentJsonTemplate: { standard: creativeRetainerAgreementJson },
      supportedPresets: ["standard"],
    },
    create: {
      slug: "creative-retainer-agreement-core",
      name: "Creative Services Retainer Agreement",
      type: "retainer",
      aiConfig: {
        documentType: "Creative Services Retainer Agreement",
        requiredSections: [
          "Term and Renewal",
          "Scope of Services & Deliverables",
          "Compensation & Invoicing",
          "Client Responsibilities & Approvals",
          "Intellectual Property Rights",
          "Independent Contractor & Confidentiality",
          "Limitation of Liability",
          "Termination",
          "Governing Law & Dispute Resolution",
        ],
        riskFocus: ["monthly fee clarity", "overage billing", "deemed approval", "ip on payment", "notice period", "liability cap"],
      },
      placeholderSchema: creativeRetainerPlaceholderSchema,
      contentJsonTemplate: { standard: creativeRetainerAgreementJson },
      supportedPresets: ["standard"],
    },
  });

  // ── Master Service Agreement — Professional Services Shield ──────────────
  console.log("🛠  Upserting master-service-agreement-core...");
  await prisma.template.upsert({
    where:  { slug: "master-service-agreement-core" },
    update: {
      name: "Master Service Agreement",
      type: "msa",
      aiConfig: {
        documentType: "Master Service Agreement",
        // ✅ These MUST match heading text AFTER stripping "N. " prefix
        // extractRequiredSections() does: text.replace(/^\d+\.\s*/, "")
        // so "1. The Parties" → "The Parties" → must appear here exactly
        requiredSections: [
          "The Parties",
          "Scope of Services (Anti-Scope Creep)",
          "Compensation & Late Fees",
          "Intellectual Property \u2014 Ownership Leverage",
          "Termination & Kill-Fee",
          "Change Management",
          "Revision Policy",
          "Deemed Approval",
          "Confidentiality",
          "Independent Contractor",
          "Limitation of Liability",
          "Governing Law & Dispute Resolution",
          "General Provisions",
        ],
        riskFocus: [
          "scope creep prevention via explicit exclusions list",
          "kill-fee clause on client-initiated early termination",
          "ip withheld until full payment received",
          "late fee enforcement and work suspension trigger",
          "deemed approval window to prevent indefinite delays",
          "change order gate for all scope additions",
          "non-solicitation of staff and contractors",
          "liability cap as multiple of fees paid",
          "governing jurisdiction and dispute resolution method",
        ],
      },
      placeholderSchema: masterServiceAgreementPlaceholderSchema,
      contentJsonTemplate: { standard: masterServiceAgreementJson },
      supportedPresets: ["standard"],
    },
    create: {
      slug: "master-service-agreement-core",
      name: "Master Service Agreement",
      type: "msa",
      aiConfig: {
        documentType: "Master Service Agreement",
        requiredSections: [
          "The Parties",
          "Scope of Services (Anti-Scope Creep)",
          "Compensation & Late Fees",
          "Intellectual Property \u2014 Ownership Leverage",
          "Termination & Kill-Fee",
          "Change Management",
          "Revision Policy",
          "Deemed Approval",
          "Confidentiality",
          "Independent Contractor",
          "Limitation of Liability",
          "Governing Law & Dispute Resolution",
          "General Provisions",
        ],
        riskFocus: [
          "scope creep prevention via explicit exclusions list",
          "kill-fee clause on client-initiated early termination",
          "ip withheld until full payment received",
          "late fee enforcement and work suspension trigger",
          "deemed approval window to prevent indefinite delays",
          "change order gate for all scope additions",
          "non-solicitation of staff and contractors",
          "liability cap as multiple of fees paid",
          "governing jurisdiction and dispute resolution method",
        ],
      },
      placeholderSchema: masterServiceAgreementPlaceholderSchema,
      contentJsonTemplate: { standard: masterServiceAgreementJson },
      supportedPresets: ["standard"],
    },
  });

  const afterCount = await prisma.template.count();
  console.log("📊 Templates count after upsert:", afterCount);
  console.log("✅ Seeding complete");
}


main()
  .catch((e) => {
    console.error("❌ Seeding failed");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("🔌 Disconnecting PrismaClient and pg pool");
    await prisma.$disconnect();
    await pool.end();
  });