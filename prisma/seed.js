// prisma/seed.js


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

// --- DB + Prisma setup (same as your old logic) ---
const { Pool } = pg;
const { PrismaPg } = adapterPg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// offer letter article
console.log("🛠  Upserting offer-letter-standard...");

const offerLetterContentJson = {
  type: "doc",
  content: [
    // Date (top-right style but text-only)
    {
      type: "paragraph",
      attrs: { textAlign: "right" },
      content: [
        { type: "text", text: "{{offer_date}}", marks: [{ type: "bold" }] },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Candidate block
    {
      type: "paragraph",
      content: [
        { type: "text", text: "{{candidate_name}}", marks: [{ type: "bold" }] },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "{{candidate_address}}" }],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Salutation
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Dear " },
        {
          type: "text",
          text: "{{candidate_name}}",
          marks: [{ type: "bold" }],
        },
        { type: "text", text: "," },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Paragraph 1
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text:
            "I am pleased to extend an informal offer of employment to you for the position of ",
        },
        {
          type: "text",
          text: "{{job_title}}",
          marks: [{ type: "bold" }],
        },
        {
          type: "text",
          text:
            ". After reviewing your qualifications and experience, we believe that your skills align well with our organizational needs and objectives.",
        },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Paragraph 2 (all employment details)
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Your proposed start date will be " },
        {
          type: "text",
          text: "{{start_date}}",
          marks: [{ type: "bold" }],
        },
        { type: "text", text: ", and your primary work location will be " },
        {
          type: "text",
          text: "{{work_location}}",
          marks: [{ type: "bold" }],
        },
        {
          type: "text",
          text: ". You will report directly to ",
        },
        {
          type: "text",
          text: "{{reporting_manager}}",
          marks: [{ type: "bold" }],
        },
        {
          type: "text",
          text: ". Your annual compensation package will be ",
        },
        {
          type: "text",
          text: "{{salary_ctc}}",
          marks: [{ type: "bold" }],
        },
        {
          type: "text",
          text:
            ". The role will include a probation period of ",
        },
        {
          type: "text",
          text: "{{probation_period}}",
          marks: [{ type: "bold" }],
        },
        {
          type: "text",
          text:
            ", and a notice period of ",
        },
        {
          type: "text",
          text: "{{notice_period}}",
          marks: [{ type: "bold" }],
        },
        { type: "text", text: "." },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Disclaimer
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text:
            "This informal job offer is an expression of our interest in having you join our team and is not legally binding until a formal contract of employment is signed by both parties.",
        },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Acceptance line
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text:
            "If you wish to proceed, please confirm your acceptance of this offer on or before ",
        },
        {
          type: "text",
          text: "{{acceptance_deadline}}",
          marks: [{ type: "bold" }],
        },
        { type: "text", text: "." },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Closing
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text:
            "We look forward to the opportunity to work with you and hope to welcome you to our team soon.",
        },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Sign-off
    { type: "paragraph", content: [{ type: "text", text: "Sincerely," }] },

    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "{{signatory_name}}",
          marks: [{ type: "bold" }],
        },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "{{signatory_designation}}" }],
    },
  ],
};




// const corporateOfferLetterJson = offerLetterContentJson;

const customOfferLetterJson = offerLetterContentJson;

// const corporateOfferLetterJson = {
//   ...offerLetterContentJson,
//   content: offerLetterContentJson.content.map((node) => {
//     if (
//       node.type === "paragraph" &&
//       node.content?.some((c) =>
//         c.text?.includes(
//           "I am pleased to extend an informal offer of employment"
//         )
//       )
//     ) {
//       return {
//         type: "paragraph",
//         content: [
//           {
//             type: "text",
//             text:
//               "We are pleased to inform you that you have been selected for the position of ",
//           },
//           {
//             type: "text",
//             text: "{{job_title}}",
//             marks: [{ type: "bold" }],
//           },
//           {
//             type: "text",
//             text:
//               ". Based on our evaluation process, your qualifications and experience align well with the requirements of this role.",
//           },
//         ],
//       };
//     }
//     return node;
//   }),
// };

const corporateOfferLetterJson = {
  type: "doc",
  content: [
    // Date
    {
      type: "paragraph",
      content: [
        { type: "text", text: "{{offer_date}}", marks: [{ type: "bold" }] },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Candidate block
    { type: "paragraph", content: [{ type: "text", text: "To," }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "{{candidate_name}}", marks: [{ type: "bold" }] },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "{{candidate_address}}" }],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Salutation
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Dear " },
        {
          type: "text",
          text: "{{candidate_name}}",
          marks: [{ type: "bold" }],
        },
        { type: "text", text: "," },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Subject
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Sub: ", marks: [{ type: "bold" }] },
        {
          type: "text",
          text: "Offer of Employment",
          marks: [{ type: "underline" }],
        },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Intro
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text:
            "Further to our discussions, we are pleased to offer you the role of ",
        },
        {
          type: "text",
          text: "{{job_title}}",
          marks: [{ type: "bold" }],
        },
        {
          type: "text",
          text:
            " on the following terms and conditions, subject to Company policies:",
        },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Start date
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Your date of joining will be " },
        {
          type: "text",
          text: "{{start_date}}",
          marks: [{ type: "bold" }],
        },
        { type: "text", text: "." },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Clauses
    {
      type: "orderedList",
      attrs: { order: 1 },
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Compensation: ", marks: [{ type: "bold" }] },
                {
                  type: "text",
                  text:
                    "Your total compensation will be ",
                },
                {
                  type: "text",
                  text: "{{salary_ctc}}",
                  marks: [{ type: "bold" }],
                },
                {
                  type: "text",
                  text:
                    " per annum (CTC), payable monthly in arrears, subject to applicable statutory deductions.",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text:
                    "Working Hours & Location: ",
                  marks: [{ type: "bold" }],
                },
                {
                  type: "text",
                  text:
                    "Your normal working hours and place of work shall be as per Company policy and business requirements.",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Reporting: ", marks: [{ type: "bold" }] },
                { type: "text", text: "You will report directly to " },
                {
                  type: "text",
                  text: "{{reporting_manager}}",
                  marks: [{ type: "bold" }],
                },
                { type: "text", text: "." },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Probation: ", marks: [{ type: "bold" }] },
                {
                  type: "text",
                  text: "You will be on probation for a period of ",
                },
                {
                  type: "text",
                  text: "{{probation_period}}",
                  marks: [{ type: "bold" }],
                },
                { type: "text", text: "." },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Notice Period: ",
                  marks: [{ type: "bold" }],
                },
                {
                  type: "text",
                  text:
                    "The notice period applicable to this role shall be ",
                },
                {
                  type: "text",
                  text: "{{notice_period}}",
                  marks: [{ type: "bold" }],
                },
                { type: "text", text: "." },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Confidentiality: ",
                  marks: [{ type: "bold" }],
                },
                {
                  type: "text",
                  text:
                    "You shall maintain strict confidentiality of all Company information during and after your employment.",
                },
              ],
            },
          ],
        },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Legal
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text:
            "This offer is conditional upon satisfactory background verification and may be withdrawn by the Company at any time in the event of an unsatisfactory outcome of such verification.",
        },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Acceptance
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text:
            "If you wish to proceed, please confirm your acceptance of this offer on or before ",
        },
        {
          type: "text",
          text: "{{acceptance_deadline}}",
          marks: [{ type: "bold" }],
        },
        { type: "text", text: "." },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Closing
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "We look forward to welcoming you to the organization.",
        },
      ],
    },

    { type: "paragraph", content: [{ type: "text", text: "" }] },

    // Signature
    { type: "paragraph", content: [{ type: "text", text: "Sincerely," }] },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "{{signatory_name}}",
          marks: [{ type: "bold" }],
        },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "{{signatory_designation}}" }],
    },
  ],
};




const startupOfferLetterJson = {
  ...offerLetterContentJson,
  content: offerLetterContentJson.content.map((node) => {
    if (
      node.type === "paragraph" &&
      node.content?.some((c) =>
        c.text?.includes(
          "I am pleased to extend an informal offer of employment"
        )
      )
    ) {
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text:
              "We’re excited to offer you an informal opportunity for the role of ",
          },
          {
            type: "text",
            text: "{{job_title}}",
            marks: [{ type: "bold" }],
          },
          {
            type: "text",
            text:
              ". We were impressed by your background and believe you would be a great fit for our growing team, with meaningful opportunities to learn and make an impact from day one.",
          },
        ],
      };
    }
    return node;
  }),
};



const offerLetterPlaceholderSchema = {
  offer_date: { label: "Date of letter" },
  candidate_name: { label: "Candidate full name" },
  candidate_address: { label: "Candidate address" },
  job_title: { label: "Job title / designation" },
  start_date: { label: "Start date" },
  work_location: { label: "Work location" },
  salary_ctc: { label: "Annual CTC (e.g. ₹18,00,000)" },
  probation_period: { label: "Probation period (e.g. 6 months)" },
  reporting_manager: { label: "Reporting manager name/designation" },
  notice_period: { label: "Notice period (e.g. 60 days)" },
  acceptance_deadline: { label: "Last date to accept offer" },
  signatory_name: { label: "HR signatory name" },
  signatory_designation: { label: "HR signatory designation" },
};



//
// ----------------- MAIN -----------------
//

async function main() {
  console.log("🌱 Starting seed.main()");

  const existingCount = await prisma.template.count();
  console.log("📊 Existing templates count before upsert:", existingCount);

  const offerTemplate = await prisma.template.upsert({
    where: { slug: "offer-letter-standard" },

    update: {
      name: "Offer letter",
      type: "letter",

      placeholderSchema: offerLetterPlaceholderSchema,

      contentJsonTemplate: {
        corporate: corporateOfferLetterJson,
        startup: startupOfferLetterJson,
        custom: customOfferLetterJson, // fallback
      },

      supportedPresets: ["corporate", "startup", "custom"],
    },

    create: {
      slug: "offer-letter-standard",
      name: "Offer letter",
      type: "letter",

      placeholderSchema: offerLetterPlaceholderSchema,

      contentJsonTemplate: {
        corporate: corporateOfferLetterJson,
        startup: startupOfferLetterJson,
        custom: corporateOfferLetterJson,
      },

      supportedPresets: ["corporate", "startup", "custom"],
    },
  });

  console.log("✅ Upserted offer letter template with id:", offerTemplate.id);

  const afterCount = await prisma.template.count();
  console.log("📊 Templates count after upsert:", afterCount);

  console.log("✅ Seeding complete (v0: templates only)");
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
