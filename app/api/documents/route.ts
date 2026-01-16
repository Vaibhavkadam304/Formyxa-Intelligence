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
): any {
  if (node == null || typeof node !== "object") return node;

  const cloned: any = Array.isArray(node) ? [...node] : { ...node };

  if (cloned.type === "text" && typeof cloned.text === "string") {
    let t = cloned.text as string;
    for (const [key, value] of Object.entries(vars ?? {})) {
      t = t.replaceAll(`{{${key}}}`, String(value ?? ""));
    }
    cloned.text = t;
  }

  if (Array.isArray(cloned.content)) {
    cloned.content = cloned.content.map((child: any) =>
      fillTiptapPlaceholders(child, vars),
    );
  }

  if (Array.isArray(cloned.marks)) {
    cloned.marks = cloned.marks.map((m: any) =>
      fillTiptapPlaceholders(m, vars),
    );
  }

  return cloned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { templateSlug, title, variables } = body as {
      templateSlug?: string;
      title?: string;
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

    let contentJson: any = null;
    if (template.contentJsonTemplate) {
      contentJson = fillTiptapPlaceholders(
        template.contentJsonTemplate as any,
        defaultVars,
      );
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
