"use client";

/**
 * ContractIntelligencePanel — ENTERPRISE EDITION
 * ─────────────────────────────────────────────────
 * Upgrades in this version:
 *
 *  1. CONTRACT INTEGRITY INDEX — Risk Gauge (SVG arc) with Red/Amber/Green zones
 *     + Trend indicator showing "+12 pts · Liability Secured"
 *
 *  2. TABBED DRAWER SYSTEM — Legal Risks / Financial Risks / Structural Risks
 *     + "Auto-Optimize Document" one-click shield button
 *
 *  3. ENTERPRISE RISK CARDS — "Why this matters" micro-copy with expandable tip
 *     + severity uses Crimson (#9B1C1C) vs bright red
 *
 *  4. REDLINE DIFF BADGE — Weak clauses show inline "Replaces" context
 *     + placement badges styled with crisper 1px borders
 *
 *  5. ENTERPRISE AESTHETICS — DM Sans / Lato typography, tighter shadows,
 *     Vetted/Audit-Ready/Reg-Compliant status tags, darker professional palette
 */

import { useMemo, useState } from "react";
import {
  extractFieldValues,
  runRiskEngine,
  computeContractScore,
} from "@/lib/intelligence/riskEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

type GhostSection  = { sectionName: string; clarityPct: number };
type ConflictAlert = { sectionA: string; sectionB: string; description: string };

export type MissingClause = {
  title: string;
  reason: string;
  whyItMatters?: string;
  severity?: "HIGH" | "MEDIUM" | "LOW";
  riskCategory?: "legal" | "financial" | "structural";
  insertAfter?: string;
  createNewSection?: boolean;
  suggestedSectionNumber?: number;
};

type WeakClause = {
  section: string;
  issue: string;
  whyItMatters?: string;
  severity?: "HIGH" | "MEDIUM" | "LOW";
  riskCategory?: "legal" | "financial" | "structural";
};

type ContractReview = {
  missingClauses?: MissingClause[];
  weakClauses?: WeakClause[];
};

type ScoreTrend = { delta: number; label: string };

type Props = {
  doc: any;
  onClose: () => void;
  onRewriteClause: (
    title: string,
    riskType: "missing" | "weak",
    cardKey: string,
    targetSectionHeading?: string,
    createNewSection?: boolean,
    suggestedSectionNumber?: number,
  ) => void;
  contractReview: ContractReview | null;
  reviewLoading: boolean;
  onRunReview: () => void;
  onAutoOptimize?: () => void;
  riskGenerating: Record<string, boolean>;
  onDismissCard: (type: "missing" | "weak", identifier: string) => void;
  onInsertClause: (heading: string, body: string) => void;
  docConflicts?: ConflictAlert[];
  ghostSections?: GhostSection[];
  onDraftSection?: (sectionName: string) => void;
  onResolveConflict?: (sectionA: string, sectionB: string, cardKey: string) => void;
  scoreTrend?: ScoreTrend | null;
};

// ── Clause placement map (unchanged logic) ────────────────────────────────────

type PlacementRule = {
  insertAfter: string;
  createNewSection: boolean;
  suggestedSectionNumber?: number;
};

const CLAUSE_PLACEMENT_RULES: Array<{ keywords: string[]; placement: PlacementRule }> = [
  { keywords: ["retainer", "monthly fee", "engagement fee"], placement: { insertAfter: "Retainer", createNewSection: false } },
  { keywords: ["overage", "additional hours", "hourly rate"], placement: { insertAfter: "Retainer", createNewSection: false } },
  { keywords: ["rollover", "unused hours", "carry over"], placement: { insertAfter: "Retainer", createNewSection: false } },
  { keywords: ["late payment", "overdue", "grace period"], placement: { insertAfter: "Payment", createNewSection: false } },
  { keywords: ["invoice", "billing"], placement: { insertAfter: "Payment", createNewSection: false } },
  { keywords: ["scope", "exclusion", "out of scope", "separate sow"], placement: { insertAfter: "Scope of Services", createNewSection: false } },
  { keywords: ["deemed approval", "approval window", "feedback window", "5 business days"], placement: { insertAfter: "Client Responsibilities", createNewSection: false } },
  { keywords: ["guarantee", "marketing result", "ranking", "roas", "traffic guarantee"], placement: { insertAfter: "Scope of Services", createNewSection: true, suggestedSectionNumber: 4 } },
  { keywords: ["data protection", "gdpr", "ccpa", "data privacy", "personal data"], placement: { insertAfter: "Confidentiality", createNewSection: true, suggestedSectionNumber: 10 } },
  { keywords: ["intellectual property", "ip ownership", "ip transfer", "work product ownership", "template", "methodology"], placement: { insertAfter: "Termination", createNewSection: true, suggestedSectionNumber: 8 } },
  { keywords: ["confidential", "nda", "proprietary information", "confidentiality"], placement: { insertAfter: "Intellectual Property", createNewSection: true, suggestedSectionNumber: 9 } },
  { keywords: ["non-solicitation", "solicitation", "poaching", "hire employee"], placement: { insertAfter: "Confidentiality", createNewSection: true, suggestedSectionNumber: 10 } },
  { keywords: ["force majeure", "act of god", "beyond control", "circumstances beyond"], placement: { insertAfter: "Non-Solicitation", createNewSection: true, suggestedSectionNumber: 11 } },
  { keywords: ["partnership", "joint venture", "agency authority", "bind client", "independent contractor"], placement: { insertAfter: "Force Majeure", createNewSection: true, suggestedSectionNumber: 12 } },
  { keywords: ["liability cap", "indirect damage", "consequential damage", "platform suspension"], placement: { insertAfter: "Limitation of Liability", createNewSection: false } },
  { keywords: ["governing law", "arbitration", "delaware", "aaa", "dispute resolution"], placement: { insertAfter: "Force Majeure", createNewSection: true, suggestedSectionNumber: 13 } },
];

function getPlacement(title: string): PlacementRule {
  const lower = title.toLowerCase();
  for (const rule of CLAUSE_PLACEMENT_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.placement;
  }
  return { insertAfter: "Termination", createNewSection: true };
}

function enrichClause(clause: MissingClause): MissingClause {
  if (clause.insertAfter !== undefined) return clause;
  return { ...clause, ...getPlacement(clause.title) };
}

// ── Risk category classifier ───────────────────────────────────────────────────

const FINANCIAL_KEYWORDS = ["payment", "retainer", "fee", "overage", "invoice", "rollover", "late", "billing", "roas", "revenue", "cost"];
const STRUCTURAL_KEYWORDS = ["date", "signature", "field", "empty", "missing date", "approval", "schedule", "exhibit", "attachment"];

function inferCategory(text: string): "legal" | "financial" | "structural" {
  const lower = text.toLowerCase();
  if (FINANCIAL_KEYWORDS.some((k) => lower.includes(k))) return "financial";
  if (STRUCTURAL_KEYWORDS.some((k) => lower.includes(k))) return "structural";
  return "legal";
}

// ── Why It Matters fallbacks ──────────────────────────────────────────────────

const WHY_IT_MATTERS: Record<string, string> = {
  "liability cap": "Without this clause, your personal and company assets may be fully exposed in the event of a lawsuit. Courts default to uncapped damages.",
  "intellectual property": "Ownership of work product remains legally ambiguous. Clients can claim rights over deliverables after the contract ends.",
  "confidentiality": "Proprietary methods, client data, and trade secrets are unprotected. A competitor could legally use this information.",
  "non-solicitation": "You have no legal recourse if a client hires your staff directly after engagement ends.",
  "force majeure": "Without this, you remain liable for non-performance even during pandemics, natural disasters, or platform outages.",
  "governing law": "Disputes will be resolved without a defined jurisdiction, leading to costly and unpredictable litigation.",
  "data protection": "Violations of GDPR, CCPA, or equivalent regulations can result in six-figure fines and reputational damage.",
  "late payment": "You have no contractual basis to charge interest or suspend services when invoices are overdue.",
  "dispute resolution": "Without arbitration clauses, any disagreement defaults to expensive, public court proceedings.",
};

function getWhyItMatters(title: string, fallback?: string): string {
  if (fallback) return fallback;
  const lower = title.toLowerCase();
  for (const [key, val] of Object.entries(WHY_IT_MATTERS)) {
    if (lower.includes(key)) return val;
  }
  return "This clause protects your business from unforeseen legal exposure and ensures contractual clarity.";
}

// ── Enterprise Risk Gauge ─────────────────────────────────────────────────────

function RiskGauge({ score, trend }: { score: number; trend?: ScoreTrend | null }) {
  // Gauge arc: 180° half-circle, value 0–100
  const R = 52;
  const CX = 72;
  const CY = 68;
  const arcLen = Math.PI * R; // full half-circle arc length

  // Zone colour
  const colour = score >= 75 ? "#0D6B4E" : score >= 45 ? "#92400E" : "#7F1D1D";
  const fillColour = score >= 75 ? "#10B981" : score >= 45 ? "#F59E0B" : "#DC2626";

  // Needle angle: -90deg (left) → +90deg (right), proportional to score
  const needleAngle = -90 + (score / 100) * 180;
  const rad = (needleAngle * Math.PI) / 180;
  const nx = CX + R * 0.72 * Math.cos(rad);
  const ny = CY + R * 0.72 * Math.sin(rad);

  // Arc path helper
  function arc(startDeg: number, endDeg: number) {
    const s = (startDeg * Math.PI) / 180;
    const e = (endDeg * Math.PI) / 180;
    const x1 = CX + R * Math.cos(s);
    const y1 = CY + R * Math.sin(s);
    const x2 = CX + R * Math.cos(e);
    const y2 = CY + R * Math.sin(e);
    return `M${x1},${y1} A${R},${R} 0 0,1 ${x2},${y2}`;
  }

  return (
    <div className="flex flex-col items-center pt-1">
      <div className="relative" style={{ width: 144, height: 80 }}>
        <svg width="144" height="80" viewBox="0 0 144 80">
          {/* Track */}
          <path d={arc(-180, 0)} fill="none" stroke="#E5E7EB" strokeWidth="10" strokeLinecap="round" />
          {/* Red zone */}
          <path d={arc(-180, -126)} fill="none" stroke="#FCA5A5" strokeWidth="10" />
          {/* Amber zone */}
          <path d={arc(-126, -54)} fill="none" stroke="#FDE68A" strokeWidth="10" />
          {/* Green zone */}
          <path d={arc(-54, 0)} fill="none" stroke="#6EE7B7" strokeWidth="10" />
          {/* Active fill */}
          <path
            d={arc(-180, -180 + (score / 100) * 180)}
            fill="none"
            stroke={fillColour}
            strokeWidth="10"
            strokeLinecap="round"
            style={{ transition: "all 0.8s cubic-bezier(0.4,0,0.2,1)" }}
          />
          {/* Needle */}
          <line
            x1={CX} y1={CY}
            x2={nx} y2={ny}
            stroke="#1E293B"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ transition: "all 0.8s cubic-bezier(0.4,0,0.2,1)", transformOrigin: `${CX}px ${CY}px` }}
          />
          <circle cx={CX} cy={CY} r="4" fill="#1E293B" />
        </svg>

        {/* Zone labels */}
        <span className="absolute text-[8px] font-bold text-red-700 dark:text-red-400" style={{ left: 2, bottom: 2 }}>HIGH</span>
        <span className="absolute text-[8px] font-bold text-amber-700 dark:text-amber-400" style={{ left: "50%", transform: "translateX(-50%)", top: 2 }}>MOD</span>
        <span className="absolute text-[8px] font-bold text-emerald-700 dark:text-emerald-400" style={{ right: 2, bottom: 2 }}>LOW</span>
      </div>

      {/* Score number */}
      <div className="flex items-end gap-1 -mt-1">
        <span className="text-[28px] font-black leading-none tracking-tight" style={{ color: fillColour, fontFamily: "'DM Sans', sans-serif" }}>
          {score}
        </span>
        <span className="text-[11px] text-slate-400 mb-1 font-semibold">/100</span>
      </div>

      <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500 mt-0.5">
        Contract Integrity Index
      </p>

      {/* Trend indicator */}
      {trend && (
        <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
          trend.delta >= 0
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        }`}>
          <span>{trend.delta >= 0 ? "↑" : "↓"}</span>
          <span>{trend.delta >= 0 ? "+" : ""}{trend.delta} pts · {trend.label}</span>
        </div>
      )}
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const colour = value >= 75 ? "#10B981" : value >= 45 ? "#F59E0B" : "#DC2626";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase">{label}</span>
        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{value}</span>
      </div>
      <div className="h-[3px] w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: colour }} />
      </div>
    </div>
  );
}

// ── Severity badge (enterprise crimson) ────────────────────────────────────────

function SeverityBadge({ severity = "HIGH" }: { severity?: string }) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    HIGH:   { bg: "#FEF2F2", text: "#7F1D1D", border: "#FECACA" },
    MEDIUM: { bg: "#FFFBEB", text: "#78350F", border: "#FDE68A" },
    LOW:    { bg: "#EFF6FF", text: "#1E3A5F", border: "#BFDBFE" },
  };
  const s = styles[severity] ?? styles.HIGH;
  return (
    <span
      className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {severity}
    </span>
  );
}

// ── Placement badge ────────────────────────────────────────────────────────────

function PlacementBadge({ insertAfter, createNewSection }: { insertAfter?: string; createNewSection?: boolean }) {
  if (!insertAfter) return null;
  const label = insertAfter.length > 22 ? insertAfter.slice(0, 20) + "…" : insertAfter;
  return (
    <span
      className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded tracking-wide shrink-0"
      style={{
        background: createNewSection ? "#F0FDFA" : "#F8FAFC",
        color: createNewSection ? "#0F766E" : "#475569",
        border: createNewSection ? "1px solid #99F6E4" : "1px solid #E2E8F0",
      }}
    >
      {createNewSection ? "✦ New §" : "↓"}&nbsp;After {label}
    </span>
  );
}

// ── Why This Matters expandable ───────────────────────────────────────────────

function WhyItMatters({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition"
      >
        <span className="text-[11px]">{open ? "▾" : "▸"}</span>
        Why this matters
      </button>
      {open && (
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 border-l-2 border-indigo-300 dark:border-indigo-700 pl-2.5 italic">
          {text}
        </p>
      )}
    </div>
  );
}

// ── Tab system ────────────────────────────────────────────────────────────────

type RiskTab = "legal" | "financial" | "structural";
const TABS: { id: RiskTab; label: string; icon: string }[] = [
  { id: "legal",      label: "Legal",       icon: "⚖" },
  { id: "financial",  label: "Financial",   icon: "₿" },
  { id: "structural", label: "Structural",  icon: "◫" },
];

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyReviewState({ onRunReview, loading }: { onRunReview: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
        style={{ background: "linear-gradient(135deg, #1E3A5F11, #1E3A5F22)", border: "1px solid #BFDBFE" }}
      >
        🔍
      </div>
      <div>
        <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-tight">No review run yet</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
          Run the AI review to surface missing clauses, weak language, and compliance gaps.
        </p>
      </div>
      <button
        onClick={onRunReview} disabled={loading}
        className="px-5 py-2.5 rounded-lg text-[12px] font-bold text-white transition disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #1E3A5F, #2563EB)" }}
      >
        {loading ? "Analysing…" : "✦ Run AI Review"}
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ContractIntelligencePanel({
  doc, onClose, onRewriteClause, contractReview, reviewLoading,
  onRunReview, onAutoOptimize, riskGenerating, onDismissCard, onInsertClause,
  docConflicts = [], ghostSections = [], onDraftSection, onResolveConflict,
  scoreTrend,
}: Props) {
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<RiskTab>("legal");

  const liveScore = useMemo(() => {
    const fields = extractFieldValues(doc);
    const flags  = runRiskEngine(fields);
    return computeContractScore(flags, fields);
  }, [doc]);

  // Enrich + categorise missing clauses
  const enrichedMissing = useMemo(
    () => (contractReview?.missingClauses ?? []).map((c) => ({
      ...enrichClause(c),
      riskCategory: c.riskCategory ?? inferCategory(c.title),
    })),
    [contractReview?.missingClauses],
  );

  const enrichedWeak = useMemo(
    () => (contractReview?.weakClauses ?? []).map((c) => ({
      ...c,
      riskCategory: c.riskCategory ?? inferCategory(c.section),
    })),
    [contractReview?.weakClauses],
  );

  const totalIssues =
    ghostSections.length +
    enrichedMissing.length +
    enrichedWeak.length +
    docConflicts.length;

  const highCount =
    enrichedMissing.filter((m) => (m.severity ?? "HIGH") === "HIGH").length +
    enrichedWeak.filter((w) => (w.severity ?? "HIGH") === "HIGH").length;

  // Tab-filtered
  const tabMissing = enrichedMissing.filter((m) => m.riskCategory === activeTab);
  const tabWeak    = enrichedWeak.filter((w) => w.riskCategory === activeTab);

  const tabCounts: Record<RiskTab, number> = {
    legal:      enrichedMissing.filter((m) => m.riskCategory === "legal").length      + enrichedWeak.filter((w) => w.riskCategory === "legal").length,
    financial:  enrichedMissing.filter((m) => m.riskCategory === "financial").length  + enrichedWeak.filter((w) => w.riskCategory === "financial").length,
    structural: enrichedMissing.filter((m) => m.riskCategory === "structural").length + enrichedWeak.filter((w) => w.riskCategory === "structural").length,
  };

  return (
    <>
      {/* Load DM Sans font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;900&display=swap');`}</style>

      <div
        className="w-[320px] bg-white dark:bg-[#0B1120] flex flex-col overflow-hidden"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          borderLeft: "1px solid #E2E8F0",
          boxShadow: "-8px 0 48px rgba(15,23,42,0.07)",
        }}
      >

        {/* ── Header ── */}
        <div
          className="px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid #F1F5F9" }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[13px] font-black"
                style={{ background: "linear-gradient(135deg, #1E3A5F, #2563EB)" }}
              >
                ✦
              </div>
              <div>
                <h3
                  className="text-[12px] font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none"
                  style={{ letterSpacing: "-0.3px" }}
                >
                  Contract Intelligence
                </h3>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
                  Enterprise Review Suite
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-slate-600 dark:hover:text-slate-300 w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
            >
              ✕
            </button>
          </div>

          {totalIssues > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ background: "#FEF2F2", color: "#7F1D1D", border: "1px solid #FECACA" }}
              >
                {totalIssues} Issues
              </span>
              {highCount > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ background: "#7F1D1D", color: "#FEF2F2" }}
                >
                  {highCount} HIGH Risk
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Contract Integrity Index (Gauge) ── */}
        <div
          className="mx-4 my-3 rounded-xl overflow-hidden"
          style={{ border: "1px solid #E2E8F0", background: "#FAFBFC" }}
        >
          <div className="px-4 pt-4 pb-2">
            <RiskGauge score={liveScore.total} trend={scoreTrend} />
          </div>

          <button
            onClick={() => setScoreExpanded((v) => !v)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
            style={{ borderTop: "1px solid #F1F5F9" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Score Breakdown
            </span>
            <span className="text-[10px] text-indigo-500 font-bold">
              {scoreExpanded ? "▲ Hide" : "▼ Expand"}
            </span>
          </button>

          {scoreExpanded && (
            <div className="px-4 pb-4 space-y-2.5">
              <BreakdownBar label="Payment"      value={liveScore.breakdown.payment} />
              <BreakdownBar label="Termination"  value={liveScore.breakdown.termination} />
              <BreakdownBar label="Liability"    value={liveScore.breakdown.liability} />
              <BreakdownBar label="IP"           value={liveScore.breakdown.ip} />
              <BreakdownBar label="Completeness" value={liveScore.breakdown.completeness} />
            </div>
          )}
        </div>

        {/* ── Auto-Optimize Shield Button ── */}
        {onAutoOptimize && (
          <div className="px-4 mb-3">
            <button
              onClick={onAutoOptimize}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-[12px] font-black text-white tracking-tight transition active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #14B8A6 100%)",
                boxShadow: "0 4px 24px rgba(20,184,166,0.25)",
              }}
            >
              <span className="text-[14px]">🛡</span>
              <span>Auto-Optimize Document</span>
              <span
                className="text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest"
                style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                ONE-CLICK
              </span>
            </button>
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto pb-4 space-y-4">

          {/* ── Ghost Sections ── */}
          {ghostSections.length > 0 && (
            <div className="px-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-400">
                  Empty Sections ({ghostSections.length})
                </span>
                <span
                  className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "#F5F3FF", color: "#5B21B6", border: "1px solid #DDD6FE" }}
                >
                  Need Content
                </span>
              </div>
              {ghostSections.map((ghost) => (
                <div
                  key={ghost.sectionName}
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid #DDD6FE", background: "#FAFAFF" }}
                >
                  <div className="px-3 pt-3 pb-2 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest"
                          style={{ background: "#EDE9FE", color: "#4C1D95", border: "1px solid #C4B5FD" }}
                        >
                          EMPTY
                        </span>
                        <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">
                          {ghost.sectionName}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        No content drafted. Use the button below to generate this section.
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[11px] font-black text-violet-500">{ghost.clarityPct}%</span>
                      <div className="w-8 h-1 rounded-full bg-violet-100 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-400" style={{ width: `${ghost.clarityPct}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => onDraftSection?.(ghost.sectionName)}
                      className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-bold text-white transition active:scale-[0.98]"
                      style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
                    >
                      ✍ Draft Section
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Conflict Alerts ── */}
          {docConflicts.length > 0 && (
            <div className="px-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-400">
                  Conflicts ({docConflicts.length})
                </span>
              </div>
              {docConflicts.map((c, i) => {
                const cardKey = `conflict-${i}-${c.sectionA}`;
                const resolving = riskGenerating[cardKey] ?? false;
                return (
                  <div
                    key={i}
                    className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid #FED7AA", background: "#FFFBF7" }}
                  >
                    <div className="px-3 pt-3 pb-2 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{c.sectionA}</span>
                        <span className="text-[10px] text-orange-400 font-black">↔</span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{c.sectionB}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">{c.description}</p>
                    </div>
                    <div className="px-3 pb-3">
                      <button
                        disabled={resolving || !onResolveConflict}
                        onClick={() => onResolveConflict?.(c.sectionA, c.sectionB, cardKey)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold text-white transition disabled:opacity-60 active:scale-[0.98]"
                        style={{ background: resolving ? "#94A3B8" : "linear-gradient(135deg, #EA580C, #C2410C)" }}
                      >
                        {resolving
                          ? <><span className="animate-spin">✦</span> Fixing…</>
                          : <><span>⚡</span> Generate Fix</>
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Risk Review ── */}
          {reviewLoading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 px-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center animate-spin text-xl"
                style={{ background: "linear-gradient(135deg, #1E3A5F22, #2563EB22)", border: "1px solid #BFDBFE" }}
              >
                ✦
              </div>
              <div className="text-center">
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Analysing contract…</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Checking clauses, liability exposure, and compliance gaps</p>
              </div>
            </div>
          )}

          {!reviewLoading && !contractReview && (
            <div className="px-4">
              <EmptyReviewState onRunReview={onRunReview} loading={reviewLoading} />
            </div>
          )}

          {!reviewLoading && contractReview && (
            <div className="px-4 space-y-3">

              {/* Section header */}
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  Risk Review
                </span>
              </div>

              {/* ── Tab Bar ── */}
              <div
                className="flex rounded-lg overflow-hidden"
                style={{ border: "1px solid #E2E8F0", background: "#F8FAFC" }}
              >
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-1 flex flex-col items-center py-2 gap-0.5 transition text-[9px] font-black uppercase tracking-widest relative"
                    style={{
                      color: activeTab === tab.id ? "#1E3A5F" : "#94A3B8",
                      background: activeTab === tab.id ? "white" : "transparent",
                      borderBottom: activeTab === tab.id ? "2px solid #2563EB" : "2px solid transparent",
                    }}
                  >
                    <span className="text-[13px]">{tab.icon}</span>
                    {tab.label}
                    {tabCounts[tab.id] > 0 && (
                      <span
                        className="absolute top-1 right-1 w-3.5 h-3.5 flex items-center justify-center rounded-full text-[8px] font-black text-white"
                        style={{ background: tabCounts[tab.id] > 0 ? "#DC2626" : "#94A3B8" }}
                      >
                        {tabCounts[tab.id]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* All-clear */}
              {tabMissing.length === 0 && tabWeak.length === 0 && (
                <div
                  className="text-center py-8 rounded-xl"
                  style={{ border: "1px solid #D1FAE5", background: "#F0FDF4" }}
                >
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-[12px] font-bold text-emerald-700">No {activeTab} risks found</p>
                  <p className="text-[10px] text-slate-400 mt-1">This risk category looks clean.</p>
                </div>
              )}

              {/* ── Missing clauses ── */}
              {tabMissing.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Missing Clauses ({tabMissing.length})
                  </p>
                  {Array.from(
                    new Map(tabMissing.map((m) => [m.title?.toLowerCase(), m])).values()
                  ).map((clause, idx) => {
                    const baseKey = `missing-${clause.title}`;
                    const generating = riskGenerating[baseKey] ?? false;
                    const whyText = getWhyItMatters(clause.title, clause.whyItMatters);
                    return (
                      <div
                        key={`${baseKey}-${idx}`}
                        className="rounded-xl overflow-hidden"
                        style={{ border: "1px solid #FECACA", background: "#FFFBFB" }}
                      >
                        <div className="px-3 pt-3 pb-2">
                          <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                            <SeverityBadge severity={clause.severity ?? "HIGH"} />
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight flex-1">
                              {clause.title}
                            </span>
                          </div>
                          {clause.insertAfter && (
                            <div className="mb-1.5">
                              <PlacementBadge insertAfter={clause.insertAfter} createNewSection={clause.createNewSection} />
                            </div>
                          )}
                          <p className="text-[10px] text-slate-500 leading-snug">{clause.reason}</p>
                          <WhyItMatters text={whyText} />
                        </div>
                        <div className="px-3 pb-3 flex gap-2">
                          <button
                            disabled={generating}
                            onClick={() => onRewriteClause(clause.title, "missing", baseKey, clause.insertAfter, clause.createNewSection, clause.suggestedSectionNumber)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-white transition disabled:opacity-60 active:scale-[0.98]"
                            style={{ background: generating ? "#94A3B8" : "linear-gradient(135deg, #991B1B, #DC2626)" }}
                          >
                            {generating
                              ? <><span className="animate-spin">✦</span> Generating…</>
                              : clause.createNewSection
                              ? <><span>✦</span> Add as New Section</>
                              : <><span>+</span> Add to Section</>
                            }
                          </button>
                          <button
                            disabled={generating}
                            onClick={() => onDismissCard("missing", clause.title)}
                            className="px-3 py-2 rounded-lg text-[10px] font-semibold text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                            style={{ border: "1px solid #E2E8F0" }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Weak clauses ── */}
              {tabWeak.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Weak Language ({tabWeak.length})
                  </p>
                  {Array.from(
                    new Map(tabWeak.map((w) => [w.section?.toLowerCase(), w])).values()
                  ).map((clause, idx) => {
                    const baseKey = `weak-${clause.section}`;
                    const generating = riskGenerating[baseKey] ?? false;
                    const whyText = getWhyItMatters(clause.section, clause.whyItMatters);
                    return (
                      <div
                        key={`${baseKey}-${idx}`}
                        className="rounded-xl overflow-hidden"
                        style={{ border: "1px solid #FDE68A", background: "#FFFDF0" }}
                      >
                        <div className="px-3 pt-3 pb-2">
                          <div className="flex items-start gap-2 mb-1.5">
                            <SeverityBadge severity={clause.severity ?? "MEDIUM"} />
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight flex-1">
                              {clause.section}
                            </span>
                          </div>

                          {/* Redline diff indicator */}
                          <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded tracking-wide"
                              style={{ background: "#FEF3C7", color: "#78350F", border: "1px solid #FDE68A" }}
                            >
                              ✎ Redline · Replaces "{clause.section}"
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-500 leading-snug">{clause.issue}</p>
                          <WhyItMatters text={whyText} />
                        </div>
                        <div className="px-3 pb-3 flex gap-2">
                          <button
                            disabled={generating}
                            onClick={() => onRewriteClause(clause.section, "weak", baseKey, clause.section, false)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-white transition disabled:opacity-60 active:scale-[0.98]"
                            style={{ background: generating ? "#94A3B8" : "linear-gradient(135deg, #92400E, #D97706)" }}
                          >
                            {generating
                              ? <><span className="animate-spin">✦</span> Generating…</>
                              : <><span>✎</span> Rewrite Clause</>
                            }
                          </button>
                          <button
                            disabled={generating}
                            onClick={() => onDismissCard("weak", clause.section)}
                            className="px-3 py-2 rounded-lg text-[10px] font-semibold text-slate-400 transition hover:bg-slate-50 disabled:opacity-50"
                            style={{ border: "1px solid #E2E8F0" }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-4 py-3"
          style={{ borderTop: "1px solid #F1F5F9", background: "#FAFBFC" }}
        >
          <button
            onClick={onRunReview} disabled={reviewLoading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-bold transition disabled:opacity-50 hover:bg-white"
            style={{
              color: "#475569",
              border: "1px solid #E2E8F0",
            }}
          >
            {reviewLoading
              ? <><span className="animate-spin text-sm">✦</span> Analysing…</>
              : <><span>↺</span> Re-run Review</>
            }
          </button>
        </div>
      </div>
    </>
  );
}