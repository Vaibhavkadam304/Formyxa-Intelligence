"use client";

import { useMemo, useState } from "react";

import { JsonEditor } from "@/components/editor/JsonEditor";
import { AIToolbar } from "@/components/editor/AIToolbar";
import { FormyxaToolbar } from "@/components/editor/FormyxaToolbar";
import { FormyxaSidebar } from "@/components/editor/FormyxaSidebar";
import type { StructurePage } from "@/components/editor/FormyxaSidebar";

import type { BrandProfile, SignatoryProfile } from "@/types/doc-layout";

type BuilderClientProps = {
  docId: string;
  title: string;
  initialContentJson?: any;
  templateSlug: string;
  brand: BrandProfile | null;
  signatory: SignatoryProfile | null;
  initialDesignKey?: string;
};

function ensureDocxName(name: string) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Untitled Document.docx";
  return trimmed.toLowerCase().endsWith(".docx")
    ? trimmed
    : `${trimmed}.docx`;
}

function extractHeadings(doc: any): Array<{ id: string; name: string }> {
  const out: Array<{ id: string; name: string }> = [];
  const walk = (n: any) => {
    if (!n) return;
    if (Array.isArray(n)) return n.forEach(walk);

    if (n.type === "heading") {
      const text =
        (n.content || [])
          .map((c: any) => (c.type === "text" ? c.text : ""))
          .join("")
          .trim() || "Heading";
      out.push({ id: `h-${out.length + 1}`, name: text });
    }
    if (Array.isArray(n.content)) n.content.forEach(walk);
  };
  walk(doc?.content || []);
  return out.slice(0, 12);
}

export default function BuilderClient({
  docId,
  title,
  initialContentJson,
  templateSlug,
  brand,
  signatory,
  initialDesignKey,
}: BuilderClientProps) {
  const initialDoc = useMemo(
    () =>
      initialContentJson ?? {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
      },
    [initialContentJson],
  );

  const [contentJson, setContentJson] = useState<any>(initialDoc);
  const [editor, setEditor] = useState<any>(null);

  const [fileName, setFileName] = useState(
    ensureDocxName(title || "Untitled Document"),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const designKey = initialDesignKey ?? "offer_minimal_plain";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] =
    useState<"structure" | "snippets" | "variables" | "brand">("structure");

  const [showAIToolbar, setShowAIToolbar] = useState(false);
  const [toolbarPosition] = useState({ top: 280, left: 300 });

  /** ✅ SINGLE SOURCE OF TRUTH */
  
  const [brandState, setBrandState] = useState<BrandProfile | null>(brand);


  async function handleBrandChange(nextBrand: BrandProfile | null) {
    setBrandState(nextBrand);

    try {
      await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: nextBrand,
        }),
      });
    } catch (err) {
      console.error("Failed to save brand", err);
    }
  }

  async function handleSave(docOverride?: any, fileNameOverride?: string) {
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentJson: docOverride ?? contentJson,
          brand: brandState,
          signatory,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      if (fileNameOverride) setFileName(fileNameOverride);
      setMessage("Saved");
      return true;
    } catch (err) {
      console.error(err);
      setMessage("Could not save");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload(docOverride?: any, fileNameOverride?: string) {
    const json = docOverride ?? contentJson;
    const name = fileNameOverride ?? fileName;

    const ok = await handleSave(json, name);
    if (!ok) return;

    try {
      const res = await fetch(`/api/export-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: name,
          contentJson: json,
          templateSlug,
          designKey,
          brand: brandState,
          signatory,
        }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setMessage("Could not download DOCX");
    }
  }

  const pages: StructurePage[] = useMemo(() => {
    const headings = extractHeadings(contentJson);
    return [
      {
        id: "page-1",
        name: "Document",
        sections: headings.map((h) => ({
          id: h.id,
          name: h.name,
          onClick: () => {
            document
              .getElementById("formyxa-doc-top")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          },
        })),
      },
    ];
  }, [contentJson]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7ff] text-slate-900">
      <FormyxaToolbar
        documentName={fileName}
        onDocumentNameChange={(n) => setFileName(ensureDocxName(n))}
        editor={editor}
        saving={saving}
        statusText={message}
        onSave={() => handleSave()}
        onExport={() => handleDownload()}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      <div className="flex flex-1">
        <FormyxaSidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pages={pages}
          brand={brandState}
          onBrandChange={handleBrandChange}
          signatory={signatory}
        />

        <JsonEditor
          key={docId}
          chrome="canvas"
          zoom={zoom}
          onZoomChange={setZoom}
          onEditorReady={setEditor}
          initialDoc={contentJson}
          fileName={fileName}
          onFileNameChange={(n) => setFileName(ensureDocxName(n))}
          onDocChange={(doc) => setContentJson(doc)}
          onSave={handleSave}
          onExport={handleDownload}
          templateSlug={templateSlug}
          designKey={designKey}
          brand={brandState || undefined}
          signatory={signatory || undefined}
          onEditHeader={() => {
            setSidebarCollapsed(false);
            setActiveTab("brand");
          }}
        />

        {showAIToolbar && (
          <AIToolbar
            position={toolbarPosition}
            onClose={() => setShowAIToolbar(false)}
          />
        )}
      </div>
    </div>
  );
}
