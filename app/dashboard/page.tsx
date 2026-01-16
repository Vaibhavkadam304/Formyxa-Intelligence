"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/header";
import { TEMPLATE_CATEGORIES } from "@/lib/useCases";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto pt-28 pb-16 px-4 space-y-10">
        {/* Hero / main call-to-action */}
        <section className="flex flex-col gap-4 rounded-2xl border bg-card px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Step 1 · Start new document
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Create visa, legal and HR letters with one clean workflow.
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Choose a purpose, let AI fill a locked template, and only edit the
              important details. No more broken formatting or messy copy-paste.
            </p>
          </div>

          <button
            onClick={() => router.push("/choose")}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 sm:mt-0"
          >
            Start
          </button>
        </section>

        {/* Quick category shortcuts */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Quick purposes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEMPLATE_CATEGORIES.slice(0, 6).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  router.push(`/choose?category=${encodeURIComponent(category.id)}`)
                }
                className="flex flex-col items-start gap-1 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:bg-accent hover:shadow-md"
              >
                <span className="text-lg">{category.icon}</span>
                <span className="font-medium text-foreground">
                  {category.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {category.description}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Placeholder for future: recent documents */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            Recent documents
          </h2>
          <p className="text-xs text-muted-foreground">
            Later, when auth + Prisma queries are ready, you can show the
            user&apos;s last few letters here.
          </p>
        </section>
      </main>
    </div>
  );
}
