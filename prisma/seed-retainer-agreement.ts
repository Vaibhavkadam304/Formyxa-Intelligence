// prisma/seed.js
// ──────────────────────────────────────────────────────────────────────────────
// UPDATED: antiScopeCreepSowJson — now includes:
//   • Meta-grid table (Client, Service Provider, Project Name, Project Lead, Effective Date)
//   • Currency-neutral defaults (removed ₹ hardcoding)
//   • Generic objective defaults (removed website-specific values)
//   • Added missing sections: Exclusions, Revision Policy, Change Management, IP, Governing Law
//   • Works for agencies, freelancers AND MNCs
// ──────────────────────────────────────────────────────────────────────────────

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { PrismaClient } from "@prisma/client";
import pg from "pg";
import * as adapterPg from "@prisma/adapter-pg";

// --- ESM-safe __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- load .env from project root ---
dotenv.config({
  path: path.resolve(__dirname, "..", ".env"),
});

console.log(
  "▶ seed.js file loaded, DATABASE_URL present:",
  !!process.env.DATABASE_URL
);

// --- DB + Prisma setup ---
const { Pool } = pg;
const { PrismaPg } = adapterPg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });



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
        {
          type: "formyxaField",
          attrs: {
            key: "incident_title",
            label: "Incident title",
            required: true,
            bold: true,
          },
        },
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
  "Incident title": { label: "Incident title" },
  "Click to set incident date": { label: "Incident date" },
  "Assign owner": { label: "Owner" },
  "Sev-1 / Sev-2 / Sev-3": { label: "Severity" },
  summary: { label: "Summary", multiline: true },
  impact: { label: "Impact", multiline: true },
  timeline: { label: "Timeline entry" },
  root_cause: { label: "Root cause analysis", multiline: true },
  action_items: { label: "Action items" },
  lessons_learned: { label: "Lessons learned", multiline: true },
};



// ─────────────────────────────────────────────────────────────────────────────
//  ANTI-SCOPE CREEP SOW — UPDATED (Universal: Agencies / Freelancers / MNCs)
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
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "client_name", label: "Client Name", required: true } }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Effective Date", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "effective_date", label: "Effective Date", required: true } }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Service Provider", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "provider_name", label: "Service Provider Name", required: true } }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Project Lead", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "project_lead", label: "Project Lead Name", required: true } }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Project Name", marks: [{ type: "bold" }] }] }] },
            { type: "tableCell", attrs: { colspan: 3 }, content: [{ type: "paragraph", content: [{ type: "formyxaField", attrs: { key: "project_name", label: "Project Name", required: true } }] }] },
          ],
        },
      ],
    },

    { type: "paragraph" },

    // 1. PROJECT PURPOSE
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "1. Project Purpose" }] },
    { type: "paragraph" },
    { type: "paragraph" },
    { type: "paragraph" },

    // 2. SCOPE OF SERVICES
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "2. Scope of Services" }] },
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
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "3. Schedule & Milestones" }] },
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
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "4. Payment Terms" }] },
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
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "5. Exclusions" }] },
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
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "6. Revision Policy" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This project includes up to " },
        { type: "formyxaField", attrs: { key: "revision_rounds", label: "Revision Rounds", value: "2", required: true } },
        { type: "text", text: " rounds of revisions per deliverable. A revision is defined as minor modifications and does not include new features or structural changes. Additional revisions will be billed at the standard hourly rate." },
      ],
    },

    // 7. CHANGE MANAGEMENT
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "7. Change Management" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Any work outside the agreed Scope of Services must be submitted as a written Change Request. The Service Provider will assess the cost and timeline impact before proceeding. No additional work will begin without written approval from both parties. Out-of-scope work may be billed at an hourly rate of " },
        { type: "formyxaField", attrs: { key: "hourly_rate", label: "Hourly Rate", value: "" } },
        { type: "text", text: " per hour unless otherwise agreed in writing." },
      ],
    },

    // 8. INTELLECTUAL PROPERTY
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "8. Intellectual Property" }] },
    { type: "paragraph", content: [{ type: "text", text: "Ownership of all final deliverables transfers to the Client upon receipt of full payment. The Service Provider retains ownership of pre-existing tools, frameworks, methodologies, and proprietary systems used to produce the deliverables." }] },

    // 9. TERMINATION
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "9. Termination" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Either party may terminate this Agreement with " },
        { type: "formyxaField", attrs: { key: "notice_period", label: "Notice Period (days)", value: "30", required: true } },
        { type: "text", text: " days' written notice. The Client shall remain responsible for payment of all completed work and approved milestones up to the effective date of termination." },
      ],
    },

    // 10. GOVERNING LAW
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "10. Governing Law & Jurisdiction" }] },
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
//  ✅ Uses signaturesBlock — identical pattern to SOW.
//     The Signatory panel (left sidebar) populates name, title, signature image.
//     Manual name/title/date paragraphs have been REMOVED.
// ─────────────────────────────────────────────────────────────────────────────

export const creativeRetainerAgreementJson = {
  type: "doc",
  content: [

    // ── DOCUMENT TITLE ──────────────────────────────────────────────────────
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Creative Services Retainer Agreement" }] },

    // ── PARTIES BLOCK ────────────────────────────────────────────────────────
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This Retainer Agreement (the \u201cAgreement\u201d) is entered into as of " },
        { type: "formyxaField", attrs: { key: "effective_date", label: "Effective Date", placeholder: "Enter effective date" } },
        { type: "text", text: ", by and between:" },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Service Provider: " },
        { type: "formyxaField", attrs: { key: "provider_name", label: "Service Provider Name", placeholder: "Enter full legal name" } },
        { type: "text", text: ", located at " },
        { type: "formyxaField", attrs: { key: "provider_address", label: "Service Provider Address", placeholder: "Enter registered address" } },
        { type: "text", text: "." },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Client: " },
        { type: "formyxaField", attrs: { key: "client_name", label: "Client Company Name", placeholder: "Enter client legal name" } },
        { type: "text", text: ", located at " },
        { type: "formyxaField", attrs: { key: "client_address", label: "Client Address", placeholder: "Enter client address" } },
        { type: "text", text: "." },
      ],
    },

    // ── 1. TERM & RENEWAL ────────────────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "1. Term and Renewal" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This Agreement shall commence on the Effective Date and remain in effect for an initial term of " },
        { type: "formyxaField", attrs: { key: "term_months", label: "Initial Term (months)", placeholder: "e.g. 12" } },
        { type: "text", text: " months. Upon expiration, this Agreement shall automatically renew on a rolling monthly basis unless terminated by either party with " },
        { type: "formyxaField", attrs: { key: "notice_days", label: "Notice Days", placeholder: "30" } },
        { type: "text", text: " days written notice." },
      ],
    },

    // ── 2. SCOPE OF SERVICES ─────────────────────────────────────────────────
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
        { type: "formyxaField", attrs: { key: "overage_rate", label: "Overage Hourly Rate", placeholder: "e.g. \u20b92,000/hr or $75/hr" } },
        { type: "text", text: " per hour, or formalised under a separate Statement of Work (SOW)." },
      ],
    },

    // ── 3. COMPENSATION & INVOICING ──────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "3. Compensation & Invoicing" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "The Client agrees to pay a fixed monthly Retainer Fee of " },
        { type: "formyxaField", attrs: { key: "retainer_fee", label: "Monthly Retainer Fee", placeholder: "e.g. \u20b980,000 or $3,000" } },
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
            { type: "formyxaField", attrs: { key: "invoice_day", label: "Invoice Day", placeholder: "1st" } },
            { type: "text", text: " of each month." },
          ]}],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Payment Terms: " },
            { type: "text", text: "Payment is due Net " },
            { type: "formyxaField", attrs: { key: "invoice_due_days", label: "Payment Due Days", placeholder: "15" } },
            { type: "text", text: " days from the invoice date via " },
            { type: "formyxaField", attrs: { key: "payment_method", label: "Payment Method", placeholder: "e.g. Bank Transfer / Razorpay" } },
            { type: "text", text: "." },
          ]}],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Late Payments: " },
            { type: "text", text: "The Service Provider reserves the right to halt all ongoing work if payment is not received within " },
            { type: "formyxaField", attrs: { key: "late_grace_days", label: "Late Grace Days", placeholder: "7" } },
            { type: "text", text: " days of the due date. A late fee of " },
            { type: "formyxaField", attrs: { key: "late_interest", label: "Late Interest %", placeholder: "1.5%" } },
            { type: "text", text: " per month will apply to all overdue balances." },
          ]}],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [
            { type: "text", marks: [{ type: "bold" }], text: "Rollover Policy: " },
            { type: "text", text: "Unused hours or deliverables " },
            { type: "formyxaField", attrs: { key: "rollover_policy", label: "Rollover Policy", placeholder: "shall not roll over" } },
            { type: "text", text: " to the following billing cycle." },
          ]}],
        },
      ],
    },

    // ── 4. CLIENT RESPONSIBILITIES & APPROVALS ───────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "4. Client Responsibilities & Approvals" }] },
    { type: "paragraph", content: [{ type: "text", text: "The Service Provider\u2019s ability to meet agreed timelines is contingent on the Client\u2019s timely provision of assets, platform access, brand guidelines, and consolidated feedback." }] },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Deemed Approval: " },
        { type: "text", text: "If the Service Provider submits a deliverable for review, the Client has " },
        { type: "formyxaField", attrs: { key: "approval_days", label: "Approval Window (business days)", placeholder: "3" } },
        { type: "text", text: " business days to provide consolidated feedback. If no feedback is received within this window, the deliverable shall be deemed approved and the Service Provider may proceed to the next phase without liability." },
      ],
    },

    // ── 5. INTELLECTUAL PROPERTY RIGHTS ─────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "5. Intellectual Property Rights" }] },
    { type: "paragraph", content: [{ type: "text", text: "Upon receipt of full and final payment for the respective billing cycle, the Service Provider grants the Client all rights, title, and interest in the final, published deliverables produced under that cycle. The Service Provider retains the right to use non-confidential elements of the work for portfolio, marketing, and case study purposes, unless expressly restricted in writing." }] },
    { type: "paragraph", content: [{ type: "text", text: "If the Client fails to make payment for any billing cycle, the Service Provider retains full ownership of all materials produced in that cycle, and the Client is strictly prohibited from using, publishing, or distributing such work." }] },

    // ── 6. INDEPENDENT CONTRACTOR & CONFIDENTIALITY ──────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "6. Independent Contractor & Confidentiality" }] },
    { type: "paragraph", content: [{ type: "text", text: "The Service Provider acts solely as an independent contractor and not as an employee, partner, or agent of the Client. Both parties agree to maintain strict confidentiality regarding all proprietary data, business strategies, pricing information, and trade secrets disclosed during this engagement, and to not disclose such information to any third party without prior written consent." }] },

    // ── 7. LIMITATION OF LIABILITY ───────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "7. Limitation of Liability" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "The Service Provider shall not be liable for any indirect, incidental, special, or consequential damages, including but not limited to loss of revenue, loss of profits, or business interruption, arising from the services rendered under this Agreement. The maximum aggregate liability of the Service Provider under this Agreement shall not exceed the total Retainer Fees paid by the Client in the " },
        { type: "formyxaField", attrs: { key: "liability_cap_months", label: "Liability Cap (months)", placeholder: "3" } },
        { type: "text", text: " months immediately preceding the claim." },
      ],
    },

    // ── 8. TERMINATION ───────────────────────────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "8. Termination" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Either party may terminate this Agreement without cause by providing " },
        { type: "formyxaField", attrs: { key: "notice_days", label: "Notice Days", placeholder: "30" } },
        { type: "text", text: " days written notice to the other party. The Client shall remain responsible for the full Retainer Fee for the entire duration of the notice period, and the Service Provider shall continue to fulfil the agreed scope of services until the effective termination date." },
      ],
    },

    // ── 9. GOVERNING LAW & DISPUTE RESOLUTION ────────────────────────────────
    { type: "heading", attrs: { level: 2, required: true }, content: [{ type: "text", text: "9. Governing Law & Dispute Resolution" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This Agreement constitutes the entire understanding between the parties and supersedes all prior discussions, representations, or agreements. It shall be governed by and construed in accordance with the laws of " },
        { type: "formyxaField", attrs: { key: "governing_law", label: "Governing Law", placeholder: "e.g. India or New York, USA" } },
        { type: "text", text: ". Any dispute arising under this Agreement shall be resolved through binding arbitration in the applicable jurisdiction before recourse to litigation." },
      ],
    },

    // ── 10. ACCEPTANCE ───────────────────────────────────────────────────────
    { type: "paragraph" },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "10. Acceptance" }] },
    { type: "paragraph", content: [{ type: "text", text: "By signing below, the parties agree to be bound by the terms of this Creative Services Retainer Agreement. This Agreement takes effect on the date of the last signature below." }] },
    { type: "paragraph" },

    // ✅ signaturesBlock — exact same pattern as SOW.
    // Renders the two-column CLIENT / SERVICE PROVIDER signature UI.
    // Name, title, designation and signature image are fed from the
    // Signatory panel in the left sidebar — no manual fields needed here.
    { type: "signaturesBlock", attrs: { leftTitle: "CLIENT", rightTitle: "SERVICE PROVIDER" } },

  ], // end content[]
};

// ── placeholderSchema — signatory fields are intentionally excluded.
//    signaturesBlock reads directly from the Signatory panel, not placeholderSchema.
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
//  MAIN SEED
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed.main()");

  const existingCount = await prisma.template.count();
  console.log("📊 Existing templates count before upsert:", existingCount);

  // ── Incident Postmortem ──────────────────────────────────────────────────
  console.log("🛠  Upserting incident-postmortem-core...");
  await prisma.template.upsert({
    where: { slug: "incident-postmortem-core" },
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
    where: { slug: "anti-scope-creep-sow-core" },
    update: {
      name: "Anti-Scope Creep SOW",
      type: "sow",
      aiConfig: {
        documentType: "Statement of Work",
        requiredSections: [
          "Project Purpose", "Scope of Services", "Schedule & Milestones",
          "Payment Terms", "Exclusions", "Revision Policy",
          "Change Management", "Intellectual Property", "Termination", "Governing Law",
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
          "Project Purpose", "Scope of Services", "Schedule & Milestones",
          "Payment Terms", "Exclusions", "Revision Policy",
          "Change Management", "Intellectual Property", "Termination", "Governing Law",
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
    where: { slug: "creative-retainer-agreement-core" },
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