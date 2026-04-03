"use client";

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/header";
import { getTemplateBySlug } from "@/lib/useCases";
import { cn } from "@/lib/utils";
import { getIntakeConfigForTemplate } from "@/lib/intakeConfigs";
import { GuidedIntakeWizard } from "@/components/intake/GuidedIntakeWizard";

function NewDocumentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const templateSlugFromUrl =
    searchParams.get("template") ?? "visa-expiration-letter";

  const designFromQuery = searchParams.get("design");
  const presetFromQuery = searchParams.get("preset") ?? "corporate";

  const goToBuilder = (docId: string) => {
    const params = new URLSearchParams();

    if (designFromQuery) params.set("design", designFromQuery);
    if (presetFromQuery) params.set("preset", presetFromQuery);

    const query = params.toString();
    router.push(`/builder/${docId}${query ? `?${query}` : ""}`);
  };

  const templateConfig = getTemplateBySlug(templateSlugFromUrl);

  const backendSlug =
    templateConfig?.backendSlug ?? "website-proposal-standard";

  const intakeConfig = getIntakeConfigForTemplate(templateSlugFromUrl);
  const hasQAMode = !!intakeConfig && intakeConfig.mode !== "free-only";

  const [title, setTitle] = useState(templateConfig?.title ?? "");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"qa" | "free">(
    hasQAMode ? "qa" : "free",
  );

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (intakeConfig) {
      for (const q of intakeConfig.questions) {
        initial[q.id] = "";
      }
    }
    return initial;
  });

  const isQAMode = !!intakeConfig && hasQAMode && mode === "qa";

  function updateAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  const characters = prompt.length;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (isQAMode && intakeConfig) {
      const missing = intakeConfig.questions.find(
        (q) => q.required && !answers[q.id]?.trim(),
      );
      if (missing) {
        setError(`Please fill "${missing.label}" before generating.`);
        return;
      }
    } else {
      if (!prompt.trim()) {
        setError("Please describe your situation before generating.");
        return;
      }
    }

    try {
      setLoading(true);

      const rawTextToSend =
        isQAMode && intakeConfig
          ? intakeConfig.buildRawText(answers)
          : prompt;

      const variables =
        intakeConfig
          ? Object.fromEntries(
              intakeConfig.questions.map((q) => [
                q.id,
                answers[q.id] ?? "",
              ])
            )
          : {};

      const res = await fetch("/api/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backendSlug,
          rawText: isQAMode ? null : rawTextToSend,
          title: title || undefined,
          preset: presetFromQuery,
          mode: isQAMode ? "qa" : "free",
          variables: isQAMode ? variables : undefined,
        }),
      });

      if (!res.ok) {
        let message = "Failed to generate document.";
        try {
          const errJson = await res.json();
          if (errJson?.error) message = errJson.error;
        } catch {
          try {
            const text = await res.text();
            if (text) message = text;
          } catch {}
        }
        console.error("Format API error:", message);
        setError(message);
        return;
      }

      const data = await res.json();

      if (!data?.id) {
        setError("Missing document id from server.");
        return;
      }

      const brand = {
        companyName: answers.company_name,
        addressLine1: answers.company_address_line1,
        addressLine2: answers.company_address_line2,
        phone: answers.company_phone,
        email: answers.company_email,
      };

      await fetch(`/api/documents/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          variables,
        }),
      });

      goToBuilder(data.id);
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f6f7f9]">
      <Header />

      <main className="max-w-3xl mx-auto pt-28 pb-20 px-4">
        <section className="
            rounded-2xl
            border border-border/60
            bg-white
            shadow-[0_1px_3px_rgba(15,23,42,0.08)]
            overflow-hidden
          ">
          <div className="border-b border-border bg-white px-6 py-5">
            <p className="mb-4 text-sm text-slate-500 max-w-2xl">
              Complete the details below to generate your company's official{" "}
              <span className="font-medium text-slate-700">
                {templateConfig?.title ?? "offer letter"}
              </span>.
            </p>

            {intakeConfig && intakeConfig.mode === "qa-or-free" && (
              <div className="mt-4 inline-flex items-center rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode("qa")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                    isQAMode
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Guided Q&amp;A
                </button>

                <button
                  type="button"
                  onClick={() => setMode("free")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                    !isQAMode
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Freeform input
                </button>
              </div>
            )}
          </div>

          <div className="px-6 pb-8 pt-6 space-y-7">
            <div className="space-y-2">
              {error && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              {isQAMode && intakeConfig ? (
                <GuidedIntakeWizard
                  config={intakeConfig}
                  answers={answers}
                  onChange={updateAnswer}
                  onSubmit={handleSubmit}
                  loading={loading}
                />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div
                    className="
                      rounded-2xl border border-border bg-background
                      shadow-[0_1px_3px_rgba(15,23,42,0.06)]
                      focus-within:border-primary focus-within:ring-1
                      focus-within:ring-primary/50
                    "
                  >
                    <textarea
                      className="
                        w-full min-h-[260px] rounded-2xl
                        bg-transparent px-3.5 py-3
                        text-sm leading-relaxed text-foreground
                        outline-none resize-y
                      "
                      placeholder={
                        templateConfig?.examplePrompt ??
                        "Explain what happened, the dates, people involved, and what outcome you want…"
                      }
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <div className="flex items-center justify-between px-3.5 pb-3 pt-1">
                      <p className="text-[11px] text-muted-foreground">
                        Write like you&apos;re telling the full story to a
                        friend. We&apos;ll extract the right details and map
                        them into the template fields.
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        {characters} chars
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="
                        inline-flex w-full md:w-auto items-center justify-center
                        rounded-full bg-gradient-to-r from-indigo-500 to-violet-500
                        px-8 py-2.5
                        text-sm font-semibold text-primary-foreground
                        shadow-[0_16px_40px_rgba(79,70,229,0.45)]
                        transition
                        hover:from-indigo-500 hover:to-indigo-600
                        hover:shadow-[0_18px_50px_rgba(79,70,229,0.55)]
                        disabled:opacity-60 disabled:shadow-none
                      "
                    >
                      {loading
                        ? "Generating with AI…"
                        : "Generate structured draft"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function NewDocumentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f7f9]" />}>
      <NewDocumentPageInner />
    </Suspense>
  );
}