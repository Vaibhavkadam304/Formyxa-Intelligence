"use client";

import { useMemo, useState } from "react";
import {
  Blocks,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Palette,
  Variable as VariableIcon,
  User,
} from "lucide-react";
import type { BrandProfile, SignatoryProfile } from "@/types/doc-layout";

/* ================= TYPES ================= */

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
  variables?: Array<{ name: string; description?: string }>;

  brand?: BrandProfile | null;
  signatory?: SignatoryProfile | null;

  brandDisabled?: boolean;
  signatoryDisabled?: boolean;

  onBrandChange?: (brand: BrandProfile | null) => void;
  onSignatoryChange?: (s: SignatoryProfile | null) => void;
};

/* ================= COMPONENT ================= */

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
  onBrandChange,
  onSignatoryChange,
}: FormyxaSidebarProps) {
  const tabs = useMemo(() => {
    const all = [
      { id: "structure" as const, icon: FileText, label: "Structure" },
      { id: "snippets" as const, icon: Blocks, label: "Snippets" },
      { id: "variables" as const, icon: VariableIcon, label: "Variables" },
      { id: "brand" as const, icon: Palette, label: "Company Details" },
      { id: "signatory" as const, icon: User, label: "Signatory" },
    ];
    

    if (!enabledTabs || enabledTabs.length === 0) return all;
    return all.filter((t) => enabledTabs.includes(t.id));
  }, [enabledTabs]);

  return (
    <aside
      className={[
        "bg-slate-50 border-r border-slate-200 transition-all duration-300 flex flex-col",
        collapsed ? "w-14" : "w-[260px]",
      ].join(" ")}
    >
      {/* ================= TABS ================= */}
      <div className="border-b border-border/60 p-2">
        <div className="flex flex-col gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-md transition",
                  collapsed && "justify-center",
                  isActive
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                ].join(" ")}
                title={collapsed ? t.label : undefined}
              >
                <Icon className="w-5 h-5 opacity-70" />
                {!collapsed && <span className="text-sm">{t.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 overflow-y-auto">
        {!collapsed && (
          <>
            {activeTab === "structure" && <StructureTab pages={pages} />}
            {activeTab === "snippets" && <SnippetsTab />}
            {activeTab === "variables" && <VariablesTab variables={variables} />}
            {activeTab === "brand" && (
              <BrandTab brand={brand} onBrandChange={onBrandChange} />
            )}
            {activeTab === "signatory" && (
              <SignatoryTab
                signatory={signatory}
                onSignatoryChange={onSignatoryChange}
              />
            )}
          </>
        )}
      </div>

      {/* ================= COLLAPSE ================= */}
      <div className="border-t border-border/60 p-2">
        <button
          onClick={() => onCollapse(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-2 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md transition"
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

/* ================= SUB TABS ================= */

function StructureTab({ pages }: { pages: StructurePage[] }) {
  const [expanded, setExpanded] = useState<string[]>([pages[0]?.id]);

  const toggle = (id: string) =>
    setExpanded((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="p-4 space-y-2">
      {pages.map((page) => (
        <div key={page.id}>
          <button
            onClick={() => toggle(page.id)}
            className="flex items-center gap-2 text-sm"
          >
            <ChevronDown
              className={`w-4 h-4 transition ${
                !expanded.includes(page.id) && "-rotate-90"
              }`}
            />
            {page.name}
          </button>
        </div>
      ))}
    </div>
  );
}

function SnippetsTab() {
  return <div className="p-4 text-sm text-muted-foreground">Coming soon</div>;
}

function VariablesTab() {
  return (
    <div className="p-4 text-sm text-muted-foreground">
      Variables disabled
    </div>
  );
}

/* ================= BRAND ================= */

function BrandTab({
  brand,
  onBrandChange,
}: {
  brand?: BrandProfile | null;
  onBrandChange?: (b: BrandProfile | null) => void;
}) {
  if (!brand) return null;

  const update = (k: keyof BrandProfile, v: string) =>
    onBrandChange?.({ ...brand, [k]: v });

  return (
    <div className="p-4 space-y-5">
      <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
        Company identity
      </h4>
      <div className="h-px bg-slate-200 mt-3" />

      <Field label="Company name">
        <input
         className="
            w-full
            bg-transparent
            border-0
            p-0
            outline-none
            focus:outline-none
            focus:ring-0
            text-sm text-slate-900
            placeholder:text-slate-400
          "
          value={brand.companyName ?? ""}
          onChange={(e) => update("companyName", e.target.value)}
        />
      </Field>

      <Field label="Address line 1">
        <input
          className="
            w-full
            bg-transparent
            border-0
            p-0
            outline-none
            focus:outline-none
            focus:ring-0
            text-sm text-slate-900
            placeholder:text-slate-400
          "
          value={brand.addressLine1 ?? ""}
          onChange={(e) => update("addressLine1", e.target.value)}
        />
      </Field>

      <Field label="Address line 2">
        <input
          className="
            w-full
            bg-transparent
            border-0
            p-0
            outline-none
            focus:outline-none
            focus:ring-0
            text-sm text-slate-900
            placeholder:text-slate-400
          "
          value={brand.addressLine2 ?? ""}
          onChange={(e) => update("addressLine2", e.target.value)}
        />
      </Field>

      <Field label="Phone">
        <input
          className="
            w-full
            bg-transparent
            border-0
            p-0
            outline-none
            focus:outline-none
            focus:ring-0
            text-sm text-slate-900
            placeholder:text-slate-400
          "
          value={brand.phone ?? ""}
          onChange={(e) => update("phone", e.target.value)}
        />
      </Field>

      <Field label="Email">
        <input
          className="
            w-full
            bg-transparent
            border-0
            p-0
            outline-none
            focus:outline-none
            focus:ring-0
            text-sm text-slate-900
            placeholder:text-slate-400
          "
          value={brand.email ?? ""}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>
    </div>
  );
}

/* ================= SIGNATORY ================= */

function SignatoryTab({
  signatory,
  onSignatoryChange,
}: {
  signatory?: SignatoryProfile | null;
  onSignatoryChange?: (s: SignatoryProfile | null) => void;
}) {
  if (!signatory) return null;

  const update = (k: keyof SignatoryProfile, v: string) =>
    onSignatoryChange?.({ ...signatory, [k]: v });

  return (
    <div className="p-4 space-y-4">
      <h4 className="text-sm font-semibold">Authorized signatory</h4>

      <Field label="Full name">
        <input
          className="
            w-full
            bg-transparent
            border-0
            p-0
            outline-none
            focus:outline-none
            focus:ring-0
            text-sm text-slate-900
            placeholder:text-slate-400
          "
          value={signatory.fullName ?? ""}
          onChange={(e) => update("fullName", e.target.value)}
        />
      </Field>

      <Field label="Designation">
        <input
          className="
            w-full
            bg-transparent
            border-0
            p-0
            outline-none
            focus:outline-none
            focus:ring-0
            text-sm text-slate-900
            placeholder:text-slate-400
          "
          value={signatory.designation ?? ""}
          onChange={(e) => update("designation", e.target.value)}
        />
      </Field>

      <Field label="Signature">
        <div className="flex items-center gap-3">
          {signatory.signatureUrl ? (
            <img src={signatory.signatureUrl} className="h-10 object-contain" />
          ) : (
            <div className="h-10 w-[140px] border border-slate-300 bg-slate-50 rounded-md flex items-center justify-center text-xs text-muted-foreground">
              No signature
            </div>
          )}

          <label className="text-xs text-primary cursor-pointer">
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
                });
              }}
            />
          </label>
        </div>
      </Field>
    </div>
  );
}

/* ================= FIELD ================= */

function Field({ label, children }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-slate-600">
        {label}
      </label>

      <div
          className="
            w-full
            rounded-md
            bg-white
            border border-slate-300
            px-3 py-2
            text-sm text-slate-900
            shadow-[0_1px_0_rgba(0,0,0,0.02)]
            transition
            focus-within:border-indigo-500
            focus-within:ring-2 focus-within:ring-indigo-500/20
          "
        >
        {children}
      </div>
    </div>
  );
}