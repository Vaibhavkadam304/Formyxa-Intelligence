"use client";

import { Editor, EditorContent } from "@tiptap/react";
import type {
  BrandProfile,
  SignatoryProfile,
  DocLayoutStyle,
} from "@/types/doc-layout";

interface DocumentPageShellProps {
  editor: Editor;
  layout: DocLayoutStyle;
  brand?: BrandProfile;
  signatory?: SignatoryProfile;
  title?: string;
  zoom: number;
  onEditHeader?: () => void; // ✅ ADD THIS
}

export function DocumentPageShell({
  editor,
  layout,
  brand,
  signatory,
  title,
  zoom,
  onEditHeader, // ✅ THIS LINE WAS MISSING
}: DocumentPageShellProps) {
  const minPageHeight = layout.minPageHeightPx ?? 1123;

  return (
    <div
      className="offer-page bg-white mx-auto flex flex-col shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_12px_24px_rgba(15,23,42,0.06)]"
      style={{
        minHeight: minPageHeight,
        transform: `scale(${zoom})`,
        transformOrigin: "top left",
      }}
    >
      {/* ================= HEADER (LOCKED STRUCTURE) ================= */}
      <header
          className="offer-header offer-header-clickable"
          onClick={onEditHeader}
        >

        <div className="offer-header-band" />

        <div className="offer-header-content">
          {/* Left: Logo + Company */}
          <div className="offer-header-left">
            {brand?.logoUrl && (
              <img
                src={brand.logoUrl}
                alt="Company logo"
                className="offer-logo"
              />
            )}

            <div className="offer-company">
              <div className="offer-company-name">
                {brand?.companyName ?? "Your Company Name"}
              </div>

              {brand?.addressLine1 && (
                <div className="offer-company-address">
                  {brand.addressLine1}
                </div>
              )}
              {brand?.addressLine2 && (
                <div className="offer-company-address">
                  {brand.addressLine2}
                </div>
              )}
            </div>
          </div>

          {/* Right: Contact */}
          <div className="offer-header-right">
            {brand?.phone && <div>{brand.phone}</div>}
            {brand?.email && <div>{brand.email}</div>}
          </div>
        </div>

        {/* Title */}
        <div className="offer-title">
          <span className="offer-title-text">
            {title ? title.toUpperCase() : "JOB OFFER LETTER"}
          </span>
        </div>
      </header>

      {/* ================= BODY (TipTap only) ================= */}
      <main className="offer-body">
        <EditorContent editor={editor} className="tiptap" />
      </main>

      {/* ================= FOOTER (EMPTY v0) ================= */}
      <footer className="offer-footer" />
    </div>
  );
}
