// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ENGINE
// Real-time validation of formyxaField values against the field registry.
// Returns structured validation results per field key.
// ─────────────────────────────────────────────────────────────────────────────

import { CONTRACT_FIELD_REGISTRY, FieldDefinition } from "./fieldRegistry";

export type ValidationSeverity = "error" | "warning" | "ok";

export type FieldValidationResult = {
  key: string;
  label: string;
  severity: ValidationSeverity;
  message: string;
  value: string | null;
};

// Parses a raw string value into a number, stripping currency/% symbols
function parseNumeric(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[₹$€£,\s%]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function validateField(
  key: string,
  def: FieldDefinition,
  rawValue: string | null
): FieldValidationResult {
  const label = def.label;
  const isEmpty = !rawValue || rawValue.trim() === "";

  // Required + empty
  if (def.required && isEmpty) {
    return {
      key,
      label,
      severity: "error",
      message: `${label} is required.`,
      value: rawValue,
    };
  }

  // Not required + empty → ok
  if (isEmpty) {
    return { key, label, severity: "ok", message: "", value: rawValue };
  }

  // Numeric range checks for currency / percentage / number
  if (["currency", "percentage", "number"].includes(def.type)) {
    const num = parseNumeric(rawValue);

    if (num === null) {
      return {
        key,
        label,
        severity: "error",
        message: `${label} must be a valid number.`,
        value: rawValue,
      };
    }

    if (def.type === "percentage" && key === "late_interest" && num === 0) {
      return {
        key,
        label,
        severity: "warning",
        message: "No late payment interest defined — exposes you to delayed payment risk.",
        value: rawValue,
      };
    }

    if (def.min !== undefined && num < def.min) {
      const isWarning =
        (key === "notice_period" && num >= 7) ||
        (key === "invoice_due_days" && num >= 1);

      return {
        key,
        label,
        severity: isWarning ? "warning" : "error",
        message: `${label} is ${num}. Recommended minimum is ${def.min}.`,
        value: rawValue,
      };
    }

    if (def.max !== undefined && num > def.max) {
      return {
        key,
        label,
        severity: "warning",
        message: `${label} seems unusually high (${rawValue}).`,
        value: rawValue,
      };
    }
  }

  return { key, label, severity: "ok", message: "", value: rawValue };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: walk the TipTap doc JSON, extract all formyxaField values,
// validate each one against the registry.
// ─────────────────────────────────────────────────────────────────────────────

export function validateDocument(doc: any): FieldValidationResult[] {
  const fieldValues: Record<string, string | null> = {};

  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type === "formyxaField" && node.attrs?.key) {
      fieldValues[node.attrs.key] = node.attrs.value ?? null;
    }
    if (Array.isArray(node.content)) node.content.forEach(walk);
  }

  walk(doc);

  const results: FieldValidationResult[] = [];

  // Validate all fields that exist in the doc
  for (const [key, rawValue] of Object.entries(fieldValues)) {
    const def = CONTRACT_FIELD_REGISTRY[key];
    if (!def) continue;
    results.push(validateField(key, def, rawValue));
  }

  // Also flag required fields from registry that are MISSING from doc
  // (not present at all — i.e., field not inserted)
  // Skip this for now — only validate what's in the doc.

  return results.sort((a, b) => {
    const order = { error: 0, warning: 1, ok: 2 };
    return order[a.severity] - order[b.severity];
  });
}

export function getValidationSummary(results: FieldValidationResult[]) {
  return {
    errors: results.filter((r) => r.severity === "error"),
    warnings: results.filter((r) => r.severity === "warning"),
    ok: results.filter((r) => r.severity === "ok"),
    totalIssues:
      results.filter((r) => r.severity !== "ok").length,
  };
}
