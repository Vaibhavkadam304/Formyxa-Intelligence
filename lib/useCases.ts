export type TemplateCategory = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export type TemplateConfig = {
  slug: string
  backendSlug?: string
  categoryId: string
  title: string
  description: string
  examplePrompt: string
  /** If set, /choose will navigate directly to this route instead of /new */
  customRoute?: string
  previewImage?: string
  /** If false, do not show this template as a separate card on /choose */
  showInCategoryGrid?: boolean
}
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [

  {
    id: "hr-corporate",
    label: "HR & corporate",
    description: "Resignations, salary negotiations and workplace issues.",
    icon: "👔",
  },
  {
    id: "banking-finance",
    label: "Banking & finance",
    description: "Disputes, charge reversals and EMI / loan requests.",
    icon: "🏦",
  },
];

// For now all templates still use a single backend slug.
// Later you can create dedicated prisma Template rows and
// change backendSlug per template.
export const TEMPLATES: TemplateConfig[] = [
 
  // HR & corporate
  {
    slug: "offer-letter-standard",           // 👈 UI slug (and used in /new?template=…)
    backendSlug: "offer-letter-standard",    // 👈 MUST match Prisma Template.slug
    categoryId: "hr-corporate",
    title: "Job offer letter",
    description:
      "Formal job offer letter with role, CTC, start date, probation and notice period.",
    examplePrompt:
      "I want to send a formal offer letter to candidate Rahul Sharma for the role of Senior Marketing Specialist at our Mumbai office. CTC is ₹18 LPA, start date 1st March 2026, 6-month probation and 60-day notice period.",
    // optional:
    // previewImage: "/previews/offer-letter-standard.png",
  },
];

export function getTemplatesForCategory(categoryId: string): TemplateConfig[] {
  return TEMPLATES.filter(
    (t) =>
      t.categoryId === categoryId &&
      (t.showInCategoryGrid !== false), // default = visible
  );
}

export function getTemplateBySlug(slug: string): TemplateConfig | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export function getCategoryById(id: string): TemplateCategory | undefined {
  return TEMPLATE_CATEGORIES.find((c) => c.id === id);
}
