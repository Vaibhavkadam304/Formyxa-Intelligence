// app/api/format/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractVariablesWithLLM } from "@/lib/extractVariables";

type PlaceholderSchema = Record<
  string,
  { label: string; type: string; hint?: string }
>;

export const runtime = "nodejs";

const LEAVE_TEMPLATE_MAP: Record<string, string> = {
  "Personal reasons": "leave-application-personal",
  "Medical leave": "leave-application-medical",
  "Exam leave": "leave-application-exam",
  "Family function": "leave-application-family-function",
  "Marriage leave": "leave-application-marriage",
  "Vacation / Annual leave": "leave-application-vacation",
  "Emergency leave": "leave-application-emergency",
  "Bereavement leave": "leave-application-bereavement",
  "Maternity leave": "leave-application-maternity",
  "Paternity leave": "leave-application-paternity",
  "Half-day leave": "leave-application-half-day",
  "One-day leave": "leave-application-one-day",
  "Five-day leave": "leave-application-five-day",
}

/**
 * Recursively walk a TipTap JSON doc and replace {{placeholders}}
 * in all text nodes using the provided variables.
 *
 * If a variable is missing/empty, we fall back to a visible
 * {Label from schema} or {key} so the user can fill it later.
 */


function fillTiptapPlaceholders(
  node: any,
  vars: Record<string, any>,
  schema?: PlaceholderSchema | null,
): any {
  if (node == null || typeof node !== "object") return node;

  // clone node so we don't mutate the template
  const cloned: any = Array.isArray(node) ? [...node] : { ...node };

  // replace in text nodes
  if (cloned.type === "text" && typeof cloned.text === "string") {
    let t = cloned.text as string;

    const matches = t.match(/{{(.*?)}}/g);
    if (matches) {
      for (const raw of matches) {
        const key = raw.slice(2, -2).trim(); // remove {{ }}

        const value = vars?.[key];
        const hasValue =
          value !== undefined &&
          value !== null &&
          String(value).trim().length > 0;

        const label = schema?.[key]?.label;
        const fallback = label ? `{${label}}` : `{${key}}`;

        const replacement = hasValue ? String(value) : fallback;

        t = t.replaceAll(raw, replacement);
      }
    }

    cloned.text = t;
  }

  // recurse into children
  if (Array.isArray(cloned.content)) {
    cloned.content = cloned.content.map((child: any) =>
      fillTiptapPlaceholders(child, vars, schema),
    );
  }

  // also recurse into marks (just in case)
  if (Array.isArray(cloned.marks)) {
    cloned.marks = cloned.marks.map((m: any) =>
      fillTiptapPlaceholders(m, vars, schema),
    );
  }

  return cloned;
}

/**
 * Post-process LLM variables so it can't "invent" values:
 * - if value equals the schema label → treat as empty
 * - if value looks like a placeholder ({{...}} or {...}) → empty
 * - if the value (or its digits-only form) does NOT appear in rawText → empty
 *
 * This means amount, invoice number, etc. only get filled when
 * the user actually provided them somewhere in rawText.
 */
function sanitizeVariables(
  vars: Record<string, any>,
  rawText: string,
  schema?: PlaceholderSchema | null,
): Record<string, string> {
  const cleaned: Record<string, string> = {};
  const rawLower = rawText.toLowerCase();
  const rawDigits = rawText.replace(/\D/g, "");

  for (const [key, val] of Object.entries(vars ?? {})) {
    let s = val == null ? "" : String(val).trim();
    if (!s) {
      cleaned[key] = "";
      continue;
    }

    const label = schema?.[key]?.label?.trim();

    // LLM just echoed the label (e.g. "Product / service")
    if (label && s.toLowerCase() === label.toLowerCase()) {
      cleaned[key] = "";
      continue;
    }

    // It returned a placeholder-style value
    if (/^{{.*}}$/.test(s) || /^\{.*\}$/.test(s)) {
      cleaned[key] = "";
      continue;
    }

    // Guard against hallucinations:
    const sLower = s.toLowerCase();
    const sDigits = s.replace(/\D/g, "");

    const digitsInRaw = sDigits
      ? rawDigits.includes(sDigits)
      : true;

    if (!rawLower.includes(sLower) && !digitsInRaw) {
      // value not present anywhere in user text → drop it
      cleaned[key] = "";
      continue;
    }

    cleaned[key] = s;
  }

  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      templateSlug,
      backendSlug,
      rawText,
      title,
      preset = "corporate", // ✅ ADD THIS
    } = body as {
      templateSlug?: string;
      backendSlug?: string;
      rawText?: string;
      title?: string;
      preset?: string;
    };

    /* 🟢 SPECIAL CASE: ultra-fast leave application flow
       backendSlug === "leave-application-smart"
       rawText is expected to be a JSON string like:
       {
         "leave_type": "Medical leave",
         "start_date": "2026-03-01",
         "end_date": "2026-03-05",
         "recipient_name": "HR Manager",
         "colleague_name": "Priya"
       }
    */
    if (backendSlug === "leave-application-smart") {
      let data: any = {};
      if (rawText && typeof rawText === "string") {
        try {
          data = JSON.parse(rawText);
        } catch {
          // if parsing fails, keep data = {}
        }
      }

      const leaveType: string = data.leave_type || "Personal reasons";

      const leaveTemplateSlug =
        LEAVE_TEMPLATE_MAP[leaveType] || "leave-application-personal";

      const leaveTemplate = await prisma.template.findUnique({
        where: { slug: leaveTemplateSlug },
      });

      if (!leaveTemplate) {
        return NextResponse.json(
          { error: `Leave template not found for "${leaveTemplateSlug}"` },
          { status: 400 },
        );
      }

      // Minimal variables set for all leave variants
      const variables = {
        leave_type: leaveType,
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        recipient_name: data.recipient_name || "",
        colleague_name: data.colleague_name || "",
      };



      // Let /builder rebuild content from template.contentJsonTemplate + variables
      const doc = await prisma.document.create({
        data: {
          title:
            title ||
            leaveTemplate.name ||
            `Leave application - ${leaveType.toLowerCase()}`,
          templateId: leaveTemplate.id,
          variables,
          contentJson: null,
        },
      });

      return NextResponse.json({ id: doc.id }, { status: 201 });
    }

    // 🔽 Normal LLM-based flow for all other templates

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return NextResponse.json(
        { error: "rawText is required" },
        { status: 400 },
      );
    }

    // Prefer backendSlug → then templateSlug → then a sane default
    const slug =
      backendSlug ??
      templateSlug ??
      "website-proposal-standard";

    const template = await prisma.template.findUnique({
      where: { slug },
    });

    if (!template) {
      return NextResponse.json(
        { error: `Template not found for slug "${slug}"` },
        { status: 404 },
      );
    }

    const placeholderSchema =
      (template.placeholderSchema as PlaceholderSchema | null) ?? null;

    // ✅ TipTap JSON-based templates
    if (template.contentJsonTemplate) {
      // 1) Call LLM to get structured variables for THIS template
      const rawVariables = await extractVariablesWithLLM({
        templateSlug: template.slug,
        templateName: template.name,
        placeholderSchema,
        rawText,
      });

      // 2) Strip out guessed / example values that didn't come from the user
      const variables = sanitizeVariables(
        rawVariables ?? {},
        rawText,
        placeholderSchema,
      );

      const brandVars = {
        company_name: variables.company_name ?? "",
        company_address_line1: variables.company_address_line1 ?? "",
        company_address_line2: variables.company_address_line2 ?? "",
        company_phone: variables.company_phone ?? "",
        company_email: variables.company_email ?? "",
      };

      // 3) Start from base template JSON and fill all {{placeholders}}
      let baseDoc: any = template.contentJsonTemplate;

      // Parse if string
      if (typeof baseDoc === "string") {
        try {
          baseDoc = JSON.parse(baseDoc);
        } catch {
          baseDoc = null;
        }
      }

      // 🔥 APPLY PRESET HERE (CRITICAL)
      if (baseDoc && typeof baseDoc === "object") {
        baseDoc =
          baseDoc[preset] ??
          baseDoc.corporate ??
          baseDoc.custom ??
          baseDoc;
      }

      if (!baseDoc || baseDoc.type !== "doc") {
        console.error("❌ Invalid template JSON after preset resolution");
        baseDoc = { type: "doc", content: [] };
      }

      if (typeof baseDoc === "string") {
        try {
          baseDoc = JSON.parse(baseDoc);
        } catch (err) {
          console.error(
            "[/api/format] contentJsonTemplate is string but invalid JSON",
            err,
          );
          baseDoc = { type: "doc", content: [] };
        }
      }

      const filledDoc = fillTiptapPlaceholders(
        baseDoc,
        { ...brandVars, ...variables },
        placeholderSchema
      );

      // 4) Save document with filled JSON
      const doc = await prisma.document.create({
          data: {
            title: title || template.name || "Untitled document",
            templateId: template.id,

            // ✅ THIS is what header reads
            brand: {
              companyName: brandVars.company_name,
              addressLine1: brandVars.company_address_line1,
              addressLine2: brandVars.company_address_line2,
              phone: brandVars.company_phone,
              email: brandVars.company_email,
            },

            variables,
            contentJson: filledDoc,
          },
        });


      return NextResponse.json({ id: doc.id }, { status: 201 });
    }

    // If some template has no TipTap JSON yet
    return NextResponse.json(
      { error: "This template is not a TipTap JSON template" },
      { status: 400 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}