// app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params

  try {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { template: true },
    })

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json(doc)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const { brand, variables, contentHtml, contentJson } = body as {
      brand?: Record<string, any>;
      variables?: Record<string, any>;
      contentHtml?: string;
      contentJson?: any;
    };

    if (contentJson !== undefined) {
      const ok =
        (contentJson && contentJson.type === "doc") ||
        (contentJson && contentJson.kind === "sectioned-proposal:v1");

      if (!ok) {
        return NextResponse.json(
          { error: "Invalid contentJson" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(brand !== undefined ? { brand } : {}),
        ...(variables !== undefined ? { variables } : {}),
        ...(contentHtml !== undefined ? { contentHtml } : {}),
        ...(contentJson !== undefined ? { contentJson } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
