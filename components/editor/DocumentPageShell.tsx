"use client";

import { Editor, EditorContent } from "@tiptap/react";
import type {
  BrandProfile,
  SignatoryProfile,
  DocLayoutStyle,
} from "@/components/editor/types/doc-layout";

interface DocumentPageShellProps {
  editor: Editor;
  layout: DocLayoutStyle;
  brand?: BrandProfile;
  signatory?: SignatoryProfile;
  title?: string;
  zoom: number;
  onEditHeader?: () => void;
}

export function DocumentPageShell({
  editor,
  layout,
  brand,
  signatory,
  title,
  zoom,
  onEditHeader,
}: DocumentPageShellProps) {
  const minPageHeight = layout.minPageHeightPx ?? 1123;

  return (
    <div
      className="document-page flex flex-col"
      style={{
        minHeight: minPageHeight,
        zoom: zoom,
      }}
    >
      {layout.showHeader !== false && (
        <header
          className={`document-header ${
            layout.headerEditable ? "document-header-clickable" : ""
          }`}
          onClick={layout.headerEditable ? onEditHeader : undefined}
        >
          <div className="document-title">
            <span className="document-title-text">
              {title ? title.toUpperCase() : "DOCUMENT TITLE"}
            </span>
          </div>
        </header>
      )}

      <main className="document-body">
        <EditorContent editor={editor} className="tiptap" />
      </main>

      <footer className="document-footer" />
    </div>
  );
}
