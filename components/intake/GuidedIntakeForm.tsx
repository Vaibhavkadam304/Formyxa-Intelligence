"use client";

import { TemplateIntakeConfig } from "@/lib/intakeConfigs";

type GuidedIntakeFormProps = {
  config: TemplateIntakeConfig;
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
};

export function GuidedIntakeForm({
  config,
  answers,
  onChange,
}: GuidedIntakeFormProps) {
  return (
    <div className="space-y-4">
      {config.questions.map((q) => {
        const value = answers[q.id] ?? "";
        const commonClasses = `
          w-full rounded-xl border border-border bg-background
          px-3.5 py-2.5 text-sm text-foreground
          shadow-[0_1px_2px_rgba(15,23,42,0.04)]
          outline-none
          focus-visible:border-primary
          focus-visible:ring-2
          focus-visible:ring-primary/60
          focus-visible:ring-offset-2
          focus-visible:ring-offset-card
        `;

        return (
          <div key={q.id} className="space-y-1">
            <p className="text-[11px] text-muted-foreground">{q.label}</p>
            {q.type === "long" ? (
              <textarea
                className={commonClasses + " min-h-[120px] resize-y"}
                placeholder={q.placeholder}
                value={value}
                onChange={(e) => onChange(q.id, e.target.value)}
              />
            ) : (
              <input
                className={commonClasses}
                placeholder={q.placeholder}
                value={value}
                onChange={(e) => onChange(q.id, e.target.value)}
              />
            )}
            {q.helperText && (
              <p className="text-[11px] text-muted-foreground">
                {q.helperText}
              </p>
            )}
          </div>
        );
      })}

      <p className="text-[11px] text-muted-foreground">
        We’ll use these answers to fill your proposal. You can still edit
        everything in the next step.
      </p>
    </div>
  );
}
