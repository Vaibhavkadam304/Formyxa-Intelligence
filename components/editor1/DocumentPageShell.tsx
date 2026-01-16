// components/editor/DocumentPageShell.tsx
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
}

export function DocumentPageShell({
  editor,
  layout,
  brand,
  signatory,
  title,
  zoom,
}: DocumentPageShellProps) {
  const pageWidth = layout.pageWidthPx ?? 794;
  const minPageHeight = layout.minPageHeightPx ?? 1123;

  return (
    <div
      className="
        bg-white
        shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_18px_40px_rgba(15,23,42,0.08)]
        rounded-md mx-auto
        flex flex-col
      "
      style={{
        width: pageWidth,
        minHeight: minPageHeight,
        transform: `scale(${zoom})`,
        transformOrigin: "top left",
      }}
    >
      {/* HEADER */}
      <div className="px-14 pt-10 pb-4 relative overflow-hidden">
        {layout.headerImageUrl && (
          <img
            src={layout.headerImageUrl}
            alt="Header"
            className="absolute inset-x-0 top-0 h-28 w-full object-cover pointer-events-none select-none"
          />
        )}

        {/* Header content (logo + company + contacts) */}
        <div className="relative mt-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {layout.showLogo && brand?.logoUrl && (
              <img
                src={brand.logoUrl}
                alt={brand.companyName}
                className="h-10 w-auto rounded-sm bg-white object-contain shadow-sm"
              />
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide">
                {brand?.companyName ?? "Your Company Name"}
              </div>
              {brand?.addressLine1 && (
                <div className="text-[10px] text-slate-600">
                  {brand.addressLine1}
                </div>
              )}
              {brand?.addressLine2 && (
                <div className="text-[10px] text-slate-600">
                  {brand.addressLine2}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-0.5 text-right text-[10px] text-slate-600">
            {brand?.phone && <div>{brand.phone}</div>}
            {brand?.email && <div>{brand.email}</div>}
          </div>
        </div>

        {/* Title bar */}
        {title && (
          <div className="mt-6 border-y border-blue-500 py-2 text-center">
            <span className="text-xs font-semibold tracking-[0.2em] text-blue-700">
              {title.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* BODY – actual TipTap editor */}
      <div className="px-14 py-6 flex-1">
        <EditorContent editor={editor} className="tiptap" />
      </div>

      {/* FOOTER */}
      <div className="px-14 pb-10 pt-4 mt-auto">
        {/* Footer graphic */}
        {layout.footerImageUrl && (
          <img
            src={layout.footerImageUrl}
            alt="Footer"
            className="mt-6 h-20 w-full select-none object-cover pointer-events-none"
          />
        )}
      </div>
    </div>
  );
}
