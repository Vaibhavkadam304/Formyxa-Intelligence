"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Palette,
  Variable as VariableIcon,
  User,
} from "lucide-react";
import type { BrandProfile, SignatoryProfile } from "@/components/editor/types/doc-layout";

/* ═══════════════════════════════════════════════════════════════
   COVER META — the 4 fields that feed the CoverMetadataBlock.
   Split by their "source":
     • Company Details tab  →  provider_company, client_company
     • Variables tab        →  project_name, date
   ═══════════════════════════════════════════════════════════════ */

export type CoverMeta = {
  provider_company: string;
  client_company: string;
  project_name: string;
  date: string;
};

export const EMPTY_COVER_META: CoverMeta = {
  provider_company: "",
  client_company: "",
  project_name: "",
  date: "",
};

/**
 * Variables that always appear in the Variables tab (cover-meta slice).
 * Merge with any template-specific variables before passing to VariablesTab.
 */
const COVER_VARIABLE_DEFS = [
  {
    key: "project_name",
    label: "Project Name",
    description: "Name of this engagement / project",
    placeholder: "e.g. Website Redesign",
    type: "text",
  },
  {
    key: "date",
    label: "Effective Date",
    description: "Date shown on the cover",
    placeholder: "e.g. 2025-06-01",
    type: "date",
  },
] as const;

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export type SidebarTab =
  | "structure"
  | "snippets"
  | "variables"
  | "brand"
  | "signatory";

export type StructurePage = {
  id: string;
  name: string;
  sections: Array<{
    id: string;
    name: string;
    wordCount?: number;
    onClick?: () => void;
  }>;
};

export type FormyxaSidebarProps = {
  enabledTabs?: SidebarTab[];

  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;

  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;

  pages?: StructurePage[];

  /** Template-specific variables (merged with cover defaults) */
  variables?: Array<{
    key?: string;
    name?: string;
    label?: string;
    description?: string;
    type?: string;
    default?: string;
  }>;
  onVariablesChange?: (map: Record<string, string>) => void;

  brand?: BrandProfile | null;
  signatory?: SignatoryProfile | null;

  brandDisabled?: boolean;
  signatoryDisabled?: boolean;

  onBrandChange?: (brand: BrandProfile | null) => void;
  onSignatoryChange?: (s: SignatoryProfile | null) => void;

  onSuggestSection?: (sectionName: string) => void;

  hasSignaturesBlock?: boolean;
  onAddSignaturesBlock?: () => void;
  onRemoveSignaturesBlock?: () => void;

  // ── Cover meta (bidirectional sync with CoverMetadataBlock) ──
  /** Current cover metadata values from the editor block */
  coverMeta?: Partial<CoverMeta>;
  /** Called whenever the user edits cover meta in the sidebar */
  onCoverMetaChange?: (meta: CoverMeta) => void;
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function FormyxaSidebar({
  enabledTabs,
  collapsed,
  onCollapse,
  activeTab,
  onTabChange,
  pages = [
    {
      id: "page-1",
      name: "Page 1",
      sections: [{ id: "doc", name: "Document" }],
    },
  ],
  variables = [],
  brand,
  signatory,
  onVariablesChange,
  onBrandChange,
  onSignatoryChange,
  onSuggestSection,
  hasSignaturesBlock,
  onAddSignaturesBlock,
  onRemoveSignaturesBlock,
  coverMeta,
  onCoverMetaChange,
}: FormyxaSidebarProps) {
  const tabs = useMemo(() => {
    const all = [
      { id: "structure" as const, icon: FileText, label: "Structure" },
      { id: "variables" as const, icon: VariableIcon, label: "Variables" },
      { id: "brand" as const, icon: Palette, label: "Company Details" },
      { id: "signatory" as const, icon: User, label: "Signatory" },
    ];
    if (!enabledTabs || enabledTabs.length === 0) return all;
    return all.filter((t) => enabledTabs.includes(t.id));
  }, [enabledTabs]);

  // Merge template variables with the two cover-meta variable fields
  const mergedVariables = useMemo(() => {
    const templateKeys = new Set(
      variables.map((v) => v.key ?? v.name ?? "")
    );
    // Prepend cover defaults that aren't already in template vars
    const defaults = COVER_VARIABLE_DEFS.filter(
      (d) => !templateKeys.has(d.key)
    ).map((d) => ({
      key: d.key,
      label: d.label,
      description: d.description,
      type: d.type,
      default:
        (coverMeta as any)?.[d.key] ?? "",
    }));
    return [...defaults, ...variables];
  }, [variables, coverMeta]);

  // Handler: when VariablesTab fires onChange, extract cover keys and
  // pass the rest up to onVariablesChange
  const handleVariablesChange = (map: Record<string, string>) => {
    const coverKeys: (keyof CoverMeta)[] = ["project_name", "date"];
    const coverUpdates: Partial<CoverMeta> = {};
    const rest: Record<string, string> = {};

    for (const [k, v] of Object.entries(map)) {
      if (coverKeys.includes(k as keyof CoverMeta)) {
        (coverUpdates as any)[k] = v;
      } else {
        rest[k] = v;
      }
    }

    if (Object.keys(coverUpdates).length > 0 && onCoverMetaChange) {
      onCoverMetaChange({
        ...EMPTY_COVER_META,
        ...coverMeta,
        ...coverUpdates,
      } as CoverMeta);
    }

    onVariablesChange?.(rest);
  };

  return (
    <aside
      className={[
        "bg-card border-r border-border shadow-sm transition-[width] duration-300 ease-in-out flex flex-col",
        collapsed ? "w-14" : "w-[280px]",
      ].join(" ")}
    >
      {/* ── TABS ── */}
      <div className="border-b border-border p-3">
        <div className="flex flex-col gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-xl transition group",
                  collapsed && "justify-center",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
                title={collapsed ? t.label : undefined}
              >
                <Icon className="w-[18px] h-[18px]" />
                {!collapsed && <span className="text-sm">{t.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        {!collapsed && (
          <>
            {activeTab === "structure" && (
              <StructureTab
                pages={pages}
                onSuggestSection={onSuggestSection}
              />
            )}
            {activeTab === "variables" && (
              <VariablesTab
                variables={mergedVariables}
                coverMeta={coverMeta}
                onChange={handleVariablesChange}
              />
            )}
            {activeTab === "brand" && (
              <BrandTab
                brand={brand}
                onBrandChange={onBrandChange}
                coverMeta={coverMeta}
                onCoverMetaChange={onCoverMetaChange}
              />
            )}
            {activeTab === "signatory" && (
              <SignatoryTab
                signatory={signatory}
                onSignatoryChange={onSignatoryChange}
                hasSignaturesBlock={hasSignaturesBlock}
                onAddSignaturesBlock={onAddSignaturesBlock}
                onRemoveSignaturesBlock={onRemoveSignaturesBlock}
              />
            )}
          </>
        )}
      </div>

      {/* ── COLLAPSE ── */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => onCollapse(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STRUCTURE TAB
   ═══════════════════════════════════════════════════════════════ */

const SHORT_THRESHOLD = 15;

function StructureTab({
  pages,
  onSuggestSection,
}: {
  pages: StructurePage[];
  onSuggestSection?: (sectionName: string) => void;
}) {
  const [expanded, setExpanded] = useState<string[]>([pages[0]?.id]);

  const toggle = (id: string) =>
    setExpanded((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  const shortCount = pages
    .flatMap((p) => p.sections)
    .filter(
      (s) => typeof s.wordCount === "number" && s.wordCount < SHORT_THRESHOLD
    ).length;

  return (
    <div className="p-5 space-y-4">
      {shortCount > 0 && onSuggestSection && (
        <button
          onClick={() => onSuggestSection("__open_panel__")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition text-left"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span className="text-[11px] font-semibold text-amber-700 flex-1">
            {shortCount} section{shortCount > 1 ? "s" : ""} need more content
          </span>
          <span className="text-[10px] text-amber-500 font-medium">
            Review →
          </span>
        </button>
      )}

      {pages.map((page) => {
        const isOpen = expanded.includes(page.id);
        return (
          <div key={page.id}>
            <button
              onClick={() => toggle(page.id)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600 transition"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${!isOpen && "-rotate-90"}`}
              />
              {page.name}
            </button>

            {isOpen && page.sections?.length > 0 && (
              <div className="ml-6 mt-2 space-y-1">
                {page.sections.map((section) => {
                  const isShort =
                    typeof section.wordCount === "number" &&
                    section.wordCount < SHORT_THRESHOLD;
                  return (
                    <div key={section.id} className="flex items-center gap-1">
                      <button
                        onClick={section.onClick}
                        className={`flex items-center gap-1.5 flex-1 min-w-0 text-left text-sm px-2 py-1 rounded-md transition ${
                          isShort
                            ? "text-amber-700 hover:bg-amber-50"
                            : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                      >
                        {isShort && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        )}
                        <span className="truncate">{section.name}</span>
                      </button>
                      {isShort && onSuggestSection && (
                        <button
                          title="Get AI suggestion for this section"
                          onClick={() => onSuggestSection(section.name)}
                          className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition text-[11px]"
                        >
                          ✦
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VARIABLES TAB
   Shows cover-meta variables (project_name, date) at the top,
   then any additional template-specific variables below.
   ═══════════════════════════════════════════════════════════════ */

function VariablesTab({
  variables = [],
  coverMeta,
  onChange,
}: {
  variables?: Array<{
    key?: string;
    name?: string;
    label?: string;
    description?: string;
    type?: string;
    default?: string;
  }>;
  coverMeta?: Partial<CoverMeta>;
  onChange?: (map: Record<string, string>) => void;
}) {
  const norm = variables
    .map((v) => ({
      key: v.key ?? v.name ?? "",
      label: v.label ?? v.name ?? v.key ?? "",
      description: v.description,
      type: v.type ?? "text",
      default: v.default ?? "",
    }))
    .filter((v) => v.key);

  // Seed initial values from defaults or coverMeta
  const initial = Object.fromEntries(
    norm.map((v) => [
      v.key,
      (coverMeta as any)?.[v.key] ?? v.default ?? "",
    ])
  );
  const [vals, setVals] = useState<Record<string, string>>(initial);

  // Sync when coverMeta changes from the editor block
  useEffect(() => {
    if (!coverMeta) return;
    setVals((prev) => {
      const next = { ...prev };
      for (const k of ["project_name", "date"] as const) {
        if (coverMeta[k] !== undefined && coverMeta[k] !== prev[k]) {
          next[k] = coverMeta[k] ?? "";
        }
      }
      return next;
    });
  }, [coverMeta]);

  // Sync when variables list changes
  useEffect(() => {
    setVals((prev) =>
      Object.fromEntries(
        norm.map((v) => [
          v.key,
          (coverMeta as any)?.[v.key] ?? v.default ?? prev[v.key] ?? "",
        ])
      )
    );
  }, [variables]);

  const update = (k: string, v: string) => {
    const next = { ...vals, [k]: v };
    setVals(next);
    onChange?.(next);
  };

  // Separate cover-meta variables from template-specific ones
  const coverKeys = new Set(["project_name", "date"]);
  const coverVars = norm.filter((v) => coverKeys.has(v.key));
  const templateVars = norm.filter((v) => !coverKeys.has(v.key));

  return (
    <div className="p-4 space-y-4">
      {/* ── Cover metadata slice ── */}
      {coverVars.length > 0 && (
        <section className="space-y-3">
          <SectionHeader label="Cover Page" />
          {coverVars.map((vv) => (
            <VariableField
              key={vv.key}
              vv={vv}
              value={vals[vv.key] ?? ""}
              onUpdate={update}
            />
          ))}
        </section>
      )}

      {/* ── Template-specific variables ── */}
      {templateVars.length > 0 && (
        <section className="space-y-3">
          {coverVars.length > 0 && (
            <SectionHeader label="Template Variables" />
          )}
          {templateVars.map((vv) => (
            <VariableField
              key={vv.key}
              vv={vv}
              value={vals[vv.key] ?? ""}
              onUpdate={update}
            />
          ))}
        </section>
      )}

      {norm.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No variables defined for this template.
        </p>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-1 border-b border-slate-100">
      {label}
    </p>
  );
}

function VariableField({
  vv,
  value,
  onUpdate,
}: {
  vv: { key: string; label: string; description?: string; type: string };
  value: string;
  onUpdate: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-slate-600 flex justify-between">
        <span>{vv.label}</span>
        {vv.description && (
          <span className="text-[10px] text-slate-400 italic truncate max-w-[120px]">
            {vv.description}
          </span>
        )}
      </label>
      <Field>
        {vv.type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => onUpdate(vv.key, e.target.value)}
            className="w-full bg-transparent border-0 p-0 outline-none focus:outline-none focus:ring-0 text-sm text-slate-900 placeholder:text-slate-400 resize-none"
            rows={3}
            placeholder={`Enter ${vv.label.toLowerCase()}…`}
          />
        ) : (
          <input
            type={vv.type === "date" ? "date" : "text"}
            value={value}
            onChange={(e) => onUpdate(vv.key, e.target.value)}
            className="w-full bg-transparent border-0 p-0 outline-none focus:outline-none focus:ring-0 text-sm text-slate-900 placeholder:text-slate-400"
            placeholder={`Enter ${vv.label.toLowerCase()}…`}
          />
        )}
      </Field>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPANY DETAILS (BRAND) TAB
   Now includes the cover-meta company fields at the top:
     • Prepared By  →  provider_company
     • Prepared For →  client_company
   ═══════════════════════════════════════════════════════════════ */

function BrandTab({
  brand,
  onBrandChange,
  coverMeta,
  onCoverMetaChange,
}: {
  brand?: BrandProfile | null;
  onBrandChange?: (b: BrandProfile | null) => void;
  coverMeta?: Partial<CoverMeta>;
  onCoverMetaChange?: (meta: CoverMeta) => void;
}) {
  // Local state for cover-meta company fields so input stays responsive
  const [providerCompany, setProviderCompany] = useState(
    coverMeta?.provider_company ?? ""
  );
  const [clientCompany, setClientCompany] = useState(
    coverMeta?.client_company ?? ""
  );

  // Sync from editor block
  useEffect(() => {
    setProviderCompany(coverMeta?.provider_company ?? "");
    setClientCompany(coverMeta?.client_company ?? "");
  }, [coverMeta?.provider_company, coverMeta?.client_company]);

  const pushCoverMeta = (patch: Partial<CoverMeta>) => {
    onCoverMetaChange?.({
      ...EMPTY_COVER_META,
      ...coverMeta,
      ...patch,
    } as CoverMeta);
  };

  const updateBrand = (k: keyof BrandProfile, v: string) => {
    if (brand) onBrandChange?.({ ...brand, [k]: v });
  };

  return (
    <div className="p-4 space-y-5">
      {/* ── Cover page companies ── */}
      <section className="space-y-3">
        <SectionHeader label="Cover Page" />

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
            Prepared By
            <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100 text-[9px] font-semibold">
              provider_company
            </span>
          </label>
          <Field>
            <input
              value={providerCompany}
              onChange={(e) => {
                setProviderCompany(e.target.value);
                pushCoverMeta({ provider_company: e.target.value });
              }}
              className="w-full bg-transparent border-0 p-0 outline-none focus:outline-none focus:ring-0 text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="Your company name…"
            />
          </Field>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
            Prepared For
            <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100 text-[9px] font-semibold">
              client_company
            </span>
          </label>
          <Field>
            <input
              value={clientCompany}
              onChange={(e) => {
                setClientCompany(e.target.value);
                pushCoverMeta({ client_company: e.target.value });
              }}
              className="w-full bg-transparent border-0 p-0 outline-none focus:outline-none focus:ring-0 text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="Client company name…"
            />
          </Field>
        </div>
      </section>

      {/* ── Company identity (BrandProfile) ── */}
      {brand && (
        <section className="space-y-3">
          <SectionHeader label="Company Identity" />

          {(
            [
              ["companyName", "Company name"],
              ["addressLine1", "Address line 1"],
              ["addressLine2", "Address line 2"],
              ["phone", "Phone"],
              ["email", "Email"],
            ] as [keyof BrandProfile, string][]
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                {label}
              </label>
              <Field>
                <input
                  className="w-full bg-transparent border-0 p-0 outline-none focus:outline-none focus:ring-0 text-sm text-slate-900 placeholder:text-slate-400"
                  value={(brand as any)[key] ?? ""}
                  onChange={(e) => updateBrand(key, e.target.value)}
                />
              </Field>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIGNATORY TAB  (unchanged)
   ═══════════════════════════════════════════════════════════════ */

function SignatoryTab({
  signatory,
  onSignatoryChange,
  hasSignaturesBlock,
  onAddSignaturesBlock,
  onRemoveSignaturesBlock,
}: {
  signatory?: SignatoryProfile | null;
  onSignatoryChange?: (s: SignatoryProfile | null) => void;
  hasSignaturesBlock?: boolean;
  onAddSignaturesBlock?: () => void;
  onRemoveSignaturesBlock?: () => void;
}) {
  if (!signatory) return null;

  const update = (k: string, v: string) =>
    onSignatoryChange?.({ ...signatory, [k]: v } as any);

  const hasData = !!(signatory.fullName || (signatory as any).signatureUrl);

  return (
    <div className="p-4 space-y-4">
      <h4 className="text-sm font-semibold text-slate-800">
        Authorized signatory
      </h4>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-600">Full name</label>
        <Field>
          <input
            className="w-full bg-transparent border-0 p-0 outline-none focus:outline-none focus:ring-0 text-sm text-slate-900 placeholder:text-slate-400"
            value={signatory.fullName ?? ""}
            placeholder="e.g. Arjun Mehta"
            onChange={(e) => update("fullName", e.target.value)}
          />
        </Field>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-600">Designation</label>
        <Field>
          <input
            className="w-full bg-transparent border-0 p-0 outline-none focus:outline-none focus:ring-0 text-sm text-slate-900 placeholder:text-slate-400"
            value={signatory.designation ?? ""}
            placeholder="e.g. CEO"
            onChange={(e) => update("designation", e.target.value)}
          />
        </Field>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-600">Signature</label>
        <div className="flex items-center gap-3">
          {(signatory as any).signatureUrl ? (
            <div className="relative group">
              <img
                src={(signatory as any).signatureUrl}
                className="h-10 object-contain"
                alt="Signature"
              />
              <button
                onClick={() =>
                  onSignatoryChange?.({
                    ...signatory,
                    signatureUrl: undefined,
                  } as any)
                }
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                title="Remove signature image"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="h-10 w-[140px] border border-dashed border-slate-300 bg-slate-50 rounded-md flex items-center justify-center text-xs text-slate-400">
              No signature
            </div>
          )}
          <label className="text-xs font-medium text-primary cursor-pointer hover:underline">
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                onSignatoryChange?.({
                  ...signatory,
                  signatureUrl: URL.createObjectURL(f),
                } as any);
              }}
            />
          </label>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Acceptance block
        </p>

        {hasSignaturesBlock ? (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Client
                </p>
                <div className="border-b border-slate-300 h-5 mb-1" />
                <p className="text-slate-400 italic">
                  Name &middot; Title &middot; Date
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Provider
                </p>
                <div className="border-b border-indigo-300 h-5 mb-1 flex items-end pb-0.5">
                  {(signatory as any).signatureUrl && (
                    <img
                      src={(signatory as any).signatureUrl}
                      className="h-4 object-contain"
                      alt=""
                    />
                  )}
                </div>
                <p className="text-indigo-600 font-medium truncate">
                  {signatory.fullName || (
                    <span className="italic text-slate-400">Name</span>
                  )}
                </p>
                <p className="text-slate-400 truncate">
                  {signatory.designation || (
                    <span className="italic">Title</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onRemoveSignaturesBlock}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg py-1.5 transition font-medium border border-red-100 hover:border-red-200"
            >
              <span>✕</span> Remove acceptance block
            </button>
          </div>
        ) : (
          <button
            onClick={onAddSignaturesBlock}
            disabled={!hasData}
            className={[
              "w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-medium transition",
              hasData
                ? "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer"
                : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed",
            ].join(" ")}
            title={
              hasData
                ? "Add acceptance block to end of document"
                : "Fill in Full name first"
            }
          >
            <span className="text-base leading-none">+</span>
            Add acceptance block
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FIELD WRAPPER
   ═══════════════════════════════════════════════════════════════ */

function Field({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
      {children}
    </div>
  );
}