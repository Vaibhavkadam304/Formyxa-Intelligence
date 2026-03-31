"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { useEffect, useRef, useState, useCallback } from "react";

export function FormyxaFieldView({ node, updateAttributes }: any) {
  const { label, value, bold } = node.attrs;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value ?? "");
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isEditing) setDraft(value ?? "");
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Commit on outside click
  useEffect(() => {
    if (!isEditing) return;
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        commit();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isEditing, draft]);

  const commit = useCallback(() => {
    setIsEditing(false);
    updateAttributes({ value: draft.trim() || null });
  }, [draft, updateAttributes]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    setDraft(value ?? "");
  }, [value]);

  const displayText = value ?? "";
  const isEmpty = !displayText;

  // ── Shared text style so chip & input look identical ──
  const textStyle: React.CSSProperties = {
    fontSize: "inherit",
    fontFamily: "inherit",
    fontWeight: bold ? 600 : "inherit",
    lineHeight: "inherit",
    color: isEmpty ? "#9ba8c2" : "inherit",
    fontStyle: isEmpty ? "italic" : "normal",
  };

  return (
    <NodeViewWrapper
      as="span"
      ref={wrapperRef}
      contentEditable={false}
      style={{ display: "inline", position: "relative" }}
    >
      {!isEditing ? (
        /* ── DISPLAY: soft underline chip ── */
        <span
          role="button"
          tabIndex={0}
          title={`Click to edit: ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            setDraft(value ?? "");
            setIsEditing(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setDraft(value ?? "");
              setIsEditing(true);
            }
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            ...textStyle,
            display: "inline",
            cursor: "text",
            userSelect: "none",
            paddingBottom: "1px",
            // Dotted underline always; solid + highlight on hover
            borderBottom: hovered
              ? "2px solid #4f6de8"
              : `1.5px ${isEmpty ? "dashed" : "dotted"} #94a3c4`,
            background: hovered ? "rgba(79,109,232,0.06)" : "transparent",
            borderRadius: hovered ? "2px" : "0",
            transition: "border-color 0.15s, background 0.15s",
            color: hovered
              ? "#3b54d4"
              : isEmpty
              ? "#9ba8c2"
              : "inherit",
            padding: hovered ? "0 2px 1px" : "0 0 1px",
          }}
        >
          {displayText || label}
        </span>
      ) : (
        /* ── EDIT: floating input overlay ── */
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            position: "relative",
            zIndex: 50,
          }}
        >
          {/* Input that sits inline, styled to match doc text */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#ffffff",
              borderBottom: "2px solid #4f6de8",
              boxShadow: "0 2px 8px rgba(79,109,232,0.18), 0 1px 3px rgba(0,0,0,0.08)",
              borderRadius: "3px 3px 0 0",
              padding: "0 4px 0 2px",
            }}
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commit(); }
                if (e.key === "Escape") { e.preventDefault(); cancel(); }
                e.stopPropagation();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder={label}
              style={{
                ...textStyle,
                border: "none",
                outline: "none",
                background: "transparent",
                color: "#1e2a4a",
                fontStyle: "normal",
                padding: "1px 0",
                // auto-size: at least label width, grows with content
                minWidth: `${Math.max((draft || label).length, 3) + 1}ch`,
                width: `${Math.max(draft.length || 0, label.length, 3) + 1}ch`,
              }}
            />

            {/* ✓ confirm */}
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); commit(); }}
              title="Confirm (Enter)"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "17px", height: "17px", marginLeft: "2px",
                borderRadius: "3px", border: "none",
                background: "#4f6de8", color: "#fff",
                cursor: "pointer", fontSize: "10px",
                flexShrink: 0, lineHeight: 1,
              }}
            >✓</button>

            {/* ✕ cancel */}
            <button
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); cancel(); }}
              title="Cancel (Esc)"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "17px", height: "17px", marginLeft: "2px",
                borderRadius: "3px",
                border: "1px solid #e2e5ed", background: "#f8f9fb", color: "#8492a8",
                cursor: "pointer", fontSize: "10px",
                flexShrink: 0, lineHeight: 1,
              }}
            >✕</button>
          </span>
        </span>
      )}
    </NodeViewWrapper>
  );
}
