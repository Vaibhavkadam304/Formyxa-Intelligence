// app/builder/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BuilderClient from "./BuilderClient";

type Vars = Record<string, any>;

type Brand = {
  companyName?: string;
  logoUrl?: string | null;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
  email?: string;
};

const EMPTY_DOC = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BuilderPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const search = await searchParams;

  if (!id) notFound();

  /* -------------------- DESIGN KEY -------------------- */

  const designParam = search?.design;
  const initialDesignKey =
    typeof designParam === "string"
      ? designParam
      : Array.isArray(designParam)
      ? designParam[0]
      : undefined;

  /* -------------------- DB -------------------- */

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { template: true },
  });

  if (!doc) notFound();

  /* -------------------- BRAND & VARIABLES -------------------- */

  const brand = (doc.brand as Brand | null) ?? null;
  const vars = (doc.variables ?? {}) as Vars;

  const signatory = {
    fullName: vars.signatory_name ?? "",
    designation: vars.signatory_designation ?? "",
    signatureImageUrl: vars.signature_image ?? null,
  };

  /* -------------------- RESOLVE BRAND (UI ONLY) -------------------- */

  const pick = (v?: unknown, fallback = ""): string =>
    typeof v === "string" && v.trim().length > 0 ? v : fallback;

  const resolvedBrand = brand
    ? {
        companyName: pick(vars.company_name, brand.companyName),
        logoUrl: brand.logoUrl ?? null,
        addressLine1: pick(
          vars.company_address_line1,
          brand.addressLine1
        ),
        addressLine2: pick(
          vars.company_address_line2,
          brand.addressLine2
        ),
        phone: pick(vars.company_phone, brand.phone),
        email: pick(vars.company_email, brand.email),
      }
    : null;

  const effectiveSignatory = {
    fullName: signatory.fullName,
    designation: signatory.designation,
    signatureImageUrl: signatory.signatureImageUrl ?? null,
  };

  /* -------------------- CONTENT (STRICT) -------------------- */

  let initialContentJson: any = doc.contentJson ?? null;

  if (typeof initialContentJson === "string") {
    try {
      initialContentJson = JSON.parse(initialContentJson);
    } catch {
      initialContentJson = null;
    }
  }

  const isValidDoc =
    initialContentJson &&
    initialContentJson.type === "doc" &&
    Array.isArray(initialContentJson.content);

  if (!isValidDoc) {
    console.error(
      "❌ Invalid or missing contentJson for document:",
      doc.id
    );
    initialContentJson = EMPTY_DOC;
  }

  /* -------------------- RENDER -------------------- */

  return (
    <BuilderClient
      docId={doc.id}
      title={doc.title}
      initialContentJson={initialContentJson}
      templateSlug={doc.template.slug}
      brand={resolvedBrand}
      signatory={effectiveSignatory}
      initialDesignKey={initialDesignKey}
    />
  );
}
