"use client";

import { useMemo, useState } from "react";
import {
  Blocks,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Palette,
  Search,
  Variable as VariableIcon,
} from "lucide-react";
import type { BrandProfile, SignatoryProfile } from "@/types/doc-layout";

export type SidebarTab = "structure" | "snippets" | "variables" | "brand";

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
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;

  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;

  pages?: StructurePage[];

  variables?: Array<{ name: string; description?: string }>;

  brand?: BrandProfile | null;
  signatory?: SignatoryProfile | null;
};

export function FormyxaSidebar({
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
  variables = [
    { name: "{{client_name}}", description: "Client full name" },
    { name: "{{project_type}}", description: "Type of project" },
    { name: "{{timeline}}", description: "Project timeline" },
  ],
  brand,
  signatory,
}: FormyxaSidebarProps) {
  const tabs = useMemo(
    () => [
      { id: "structure" as const, icon: FileText, label: "Structure" },
      { id: "snippets" as const, icon: Blocks, label: "Snippets" },
      { id: "variables" as const, icon: VariableIcon, label: "Variables" },
      { id: "brand" as const, icon: Palette, label: "Brand" },
    ],
    [],
  );

  return (
    <div
      className={[
        "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-[280px]",
      ].join(" ")}
    >
      {/* Tabs */}
      <div className="border-b border-slate-200 p-2">
        <div className="flex flex-col gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-slate-700 hover:bg-slate-50",
                ].join(" ")}
                title={collapsed ? t.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{t.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!collapsed && (
          <>
            {activeTab === "structure" && <StructureTab pages={pages} />}
            {activeTab === "snippets" && <SnippetsTab />}
            {activeTab === "variables" && <VariablesTab variables={variables} />}
            {activeTab === "brand" && <BrandTab brand={brand} signatory={signatory} />}
          </>
        )}
      </div>

      {/* Collapse */}
      <div className="border-t border-slate-200 p-2">
        <button
          onClick={() => onCollapse(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
    </div>
  );
}

function StructureTab({ pages }: { pages: StructurePage[] }) {
  const [expanded, setExpanded] = useState<string[]>(pages.map((p) => p.id).slice(0, 1));
  const [activeSection, setActiveSection] = useState<string>(pages?.[0]?.sections?.[0]?.id ?? "");

  const toggle = (id: string) => {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="p-4">
      <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3 px-2">Document structure</h3>

      <div className="space-y-1">
        {pages.map((page) => {
          const isOpen = expanded.includes(page.id);
          return (
            <div key={page.id}>
              <button
                onClick={() => toggle(page.id)}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <ChevronDown className={["w-4 h-4 flex-shrink-0 transition-transform", isOpen ? "rotate-0" : "-rotate-90"].join(" ")} />
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>{page.name}</span>
              </button>

              {isOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {page.sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveSection(s.id);
                        s.onClick?.();
                      }}
                      className={[
                        "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                        activeSection === s.id ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SnippetsTab() {
  const [q, setQ] = useState("");

  const snippets = [
    { id: "intro", title: "Proposal introduction", description: "Standard opening paragraph for client proposals" },
    { id: "scope", title: "Scope of work", description: "Deliverables + what’s included" },
    { id: "pricing", title: "Pricing table", description: "Pricing breakdown section" },
    { id: "timeline", title: "Project timeline", description: "Milestones & phases" },
  ];

  const filtered = snippets.filter(
    (s) => s.title.toLowerCase().includes(q.toLowerCase()) || s.description.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="p-4">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search snippets"
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((s) => (
          <div key={s.id} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 transition-colors">
            <h4 className="text-sm text-slate-900 mb-1">{s.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariablesTab({ variables }: { variables: Array<{ name: string; description?: string }> }) {
  const [q, setQ] = useState("");

  const filtered = variables.filter(
    (v) => v.name.toLowerCase().includes(q.toLowerCase()) || (v.description || "").toLowerCase().includes(q.toLowerCase()),
  );

  const copy = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search variables"
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((v) => (
          <button
            key={v.name}
            onClick={() => copy(v.name)}
            className="w-full text-left hover:bg-slate-50 border border-slate-200 rounded-lg p-3 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <code className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">{v.name}</code>
              <Copy className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
            {v.description ? <p className="text-xs text-slate-600">{v.description}</p> : null}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-primary/10 border border-primary/15 rounded-lg">
        <p className="text-xs text-primary">Click any variable to copy, then paste into your document.</p>
      </div>
    </div>
  );
}

function BrandTab({ brand, signatory }: { brand?: BrandProfile | null; signatory?: SignatoryProfile | null }) {
  return (
    <div className="p-4 space-y-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">Brand</div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="text-xs text-slate-500 mb-1">Company</div>
        <div className="text-sm text-slate-900 truncate">{brand?.companyName || "Not selected"}</div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="text-xs text-slate-500 mb-1">Signatory</div>
        <div className="text-sm text-slate-900 truncate">{signatory?.fullName || "Not selected"}</div>
      </div>
    </div>
  );
}
