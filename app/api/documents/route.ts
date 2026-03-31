import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type PlaceholderSchema = Record<
  string,
  { label: string; type: string; hint?: string }
>;

function fillTiptapPlaceholders(
  node: any,
  vars: Record<string, any>,
  schema?: PlaceholderSchema | null
): any {
  if (node == null || typeof node !== "object") return node;

  const cloned: any = Array.isArray(node) ? [...node] : { ...node };

  if (cloned.type === "text" && typeof cloned.text === "string") {
    let t = cloned.text;

    // 1️⃣ Replace {{key}} style placeholders
    const matches = t.match(/{{(.*?)}}/g);
    if (matches) {
      for (const m of matches) {
        const key = m.slice(2, -2).trim();
        const val = vars?.[key];
        t = t.replaceAll(m, val != null ? String(val) : "");
      }
    }

    // 2️⃣ NEW: Replace human hint text like "Enter project name"
    if (schema) {
      for (const [key, meta] of Object.entries(schema)) {
        const label = (meta?.label ?? "").trim();
        if (!label) continue;

        const hint1 = `Enter ${label}`;
        const hint2 = label;

        const value = vars?.[key];
        if (!value) continue;

        if (t.includes(hint1)) {
          t = t.replaceAll(hint1, String(value));
        } else if (t.includes(hint2)) {
          t = t.replaceAll(hint2, String(value));
        }
      }
    }

    cloned.text = t;
  }

  // ✅ Handle coverMetadata atom — replace {{key}} in attrs
  if (cloned.type === "coverMetadata" && cloned.attrs) {
    const filledAttrs: Record<string, string> = {};
    for (const [k, v] of Object.entries(cloned.attrs)) {
      if (typeof v === "string") {
        let val = v;
        const ms = val.match(/{{(.*?)}}/g);
        if (ms) {
          for (const m of ms) {
            const key = m.slice(2, -2).trim();
            val = val.replaceAll(m, vars?.[key] != null ? String(vars[key]) : "");
          }
        }
        filledAttrs[k] = val;
      } else {
        filledAttrs[k] = v as string;
      }
    }
    cloned.attrs = { ...cloned.attrs, ...filledAttrs };
    return cloned; // atom — no children to recurse into
  }

  // 🔥 Handle instructional field blocks (Confluence-style)
  if (
    cloned.attrs?.instructional &&
    typeof cloned.attrs?.field === "string"
  ) {
    const key = cloned.attrs.field;
    const value = vars?.[key];

    if (value) {
      cloned.content = [
        {
          type: "text",
          text: String(value),
        },
      ];
    }

    return cloned;
  }


  if (Array.isArray(cloned.content)) {
    cloned.content = cloned.content.map((child: any) =>
      fillTiptapPlaceholders(child, vars, schema)
    );
  }

  if (Array.isArray(cloned.marks)) {
    cloned.marks = cloned.marks.map((m: any) =>
      fillTiptapPlaceholders(m, vars, schema)
    );
  }

  return cloned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { templateSlug, title, variables, preset } = body as {
      templateSlug?: string;
      title?: string;
      preset?: string;
      variables?: Record<string, any>;
    };

    const template = await prisma.template.findUnique({
      where: { slug: templateSlug ?? "website-proposal-standard" },
    });

    if (!template) {
      return NextResponse.json(
        { error: `Template not found for slug "${templateSlug}"` },
        { status: 404 },
      );
    }

    const placeholderSchema =
      (template.placeholderSchema as PlaceholderSchema | null) ?? null;

    // Build a safe variables object matching the placeholder schema
    const defaultVars: Record<string, any> = {};
    if (placeholderSchema) {
      for (const key of Object.keys(placeholderSchema)) {
        defaultVars[key] = variables?.[key] ?? "";
      }
    }

    // Preserve any extra keys (like internal flags)
    if (variables) {
      for (const [k, v] of Object.entries(variables)) {
        if (!(k in defaultVars)) {
          defaultVars[k] = v;
        }
      }
    }

    const templateContentMap =
      template.contentJsonTemplate as Record<string, any> | null;

    let contentJson: any = null;

    if (templateContentMap) {
      const presetKey =
        preset && templateContentMap[preset]
          ? preset
          : "standard";

      const baseTemplate = templateContentMap[presetKey];

      if (baseTemplate) {
        contentJson = fillTiptapPlaceholders(
          baseTemplate,
          defaultVars,
          placeholderSchema
        );
      }
    }



    const doc = await prisma.document.create({
      data: {
        title: title ?? template.name ?? "Untitled document",
        templateId: template.id,
        variables: defaultVars,
        ...(contentJson ? { contentJson } : {}),
      },
    });

    return NextResponse.json({ id: doc.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}