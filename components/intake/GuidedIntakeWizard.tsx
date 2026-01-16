"use client";

import { useMemo, useState, FormEvent } from "react";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type {
  TemplateIntakeConfig,
  IntakeQuestion,
  IntakeStepConfig,
} from "@/lib/intakeConfigs";

interface GuidedIntakeWizardProps {
  config: TemplateIntakeConfig;
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
}

export function GuidedIntakeWizard({
  config,
  answers,
  onChange,
  onSubmit,
  loading,
}: GuidedIntakeWizardProps) {
  const allQuestions = config.questions;

  const steps: IntakeStepConfig[] =
    config.steps ?? [
      {
        id: "default",
        label: "Details",
        title: config.qaTitle ?? "Answer a few quick questions",
        subtitle: config.qaSubtitle,
        questionIds: allQuestions.map((q) => q.id),
      },
    ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStep = steps[currentIndex];
  const isLastStep = currentIndex === steps.length - 1;

  const questionsById = useMemo(() => {
    const map = new Map<string, IntakeQuestion>();
    allQuestions.forEach((q) => map.set(q.id, q));
    return map;
  }, [allQuestions]);

  const fieldsForCurrentStep = currentStep.questionIds
    .map((id) => questionsById.get(id))
    .filter((q): q is IntakeQuestion => Boolean(q));

  const stepHasMissingRequired = fieldsForCurrentStep.some((field) => {
    if (!field.required) return false;
    return !(answers[field.id] ?? "").trim();
  });

  const goNext = () => {
    if (!isLastStep) setCurrentIndex((i) => i + 1);
  };

  const goBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const triggerParentSubmit = () => {
    onSubmit({ preventDefault() {} } as FormEvent<HTMLFormElement>);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="max-w-3xl mx-auto">
      <section>
        <div className="rounded-2xl border border-slate-100 bg-white p-6">

          {/* HORIZONTAL STEP PROGRESS */}
          {steps.length > 1 && (
            <div className="mb-6">
              <StepProgressHorizontal
                steps={steps}
                currentIndex={currentIndex}
              />
            </div>
          )}

          {/* FIELD GROUP */}
          <div className="rounded-xl bg-slate-50/60 p-4">
            <div className="space-y-4">
              {fieldsForCurrentStep.slice(0, 5).map((field) => (
                <FieldInput
                  key={field.id}
                  field={field}
                  value={answers[field.id] ?? ""}
                  onChange={(v) => onChange(field.id, v)}
                />
              ))}
            </div>
          </div>

          {/* FOOTER NAV */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-slate-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={isLastStep ? triggerParentSubmit : goNext}
              disabled={loading || stepHasMissingRequired}
              className="inline-flex items-center gap-1 rounded-full px-6"
            >
              {isLastStep
                ? "Confirm & generate offer letter"
                : `Continue`}
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>

        </div>
      </section>

    </form>
  );
}

/* ---------------- PROGRESS RAIL ---------------- */

function StepProgressHorizontal({
  steps,
  currentIndex,
}: {
  steps: IntakeStepConfig[];
  currentIndex: number;
}) {
  return (
    <div className="relative mb-8">
      {/* BASE LINE */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-300" />

      {/* STEPS */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center">
              {/* DOT */}
              <div
                className={cn(
                  "z-10 flex h-3 w-3 items-center justify-center rounded-full bg-white",
                  isCompleted && "bg-indigo-600",
                  isActive &&
                    !isCompleted &&
                    "bg-indigo-500 ring-4 ring-indigo-100",
                  !isCompleted && !isActive && "bg-slate-400"
                )}
              >
                {isCompleted && (
                  <Check className="h-2 w-2 text-white" />
                )}
              </div>

              {/* OPTIONAL LABEL */}
              <span className="mt-2 text-xs text-slate-500">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ---------------- FIELD ---------------- */

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: IntakeQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const isFilled = Boolean(value);
  const isLong = field.type === "long";
  const isSelect = field.type === "select";

  const baseClass =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm transition focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:bg-white";

  const bgClass = isFilled ? "bg-slate-100/70" : "bg-white";

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-900">
        {field.label}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {isSelect && field.options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(baseClass, bgClass)}
        >
          <option value="">Select an option</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : isLong ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cn(baseClass, bgClass, "min-h-[96px] resize-y")}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cn(baseClass, bgClass)}
        />
      )}

      {field.helperText && (
        <p className="text-xs text-slate-500">{field.helperText}</p>
      )}
    </div>
  );
}
