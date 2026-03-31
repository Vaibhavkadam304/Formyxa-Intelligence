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
    slug: "offer-letter-standard",
    backendSlug: "offer-letter-standard",
    categoryId: "hr-corporate",
    title: "Job offer letter",
    description:
      "Formal job offer letter with role, CTC, start date, probation and notice period.",
    examplePrompt:
      "I want to send a formal offer letter to candidate Rahul Sharma...",
  },

  // 🔥 ADD THIS
  {
    slug: "anti-scope-creep-sow-core",
    backendSlug: "anti-scope-creep-sow-core", // MUST match Prisma seed
    categoryId: "hr-corporate", // or create new category later
    title: "Anti-Scope Creep SOW",
    description:
      "Structured scope of work template with locked exclusions and revision limits.",
    examplePrompt:
      "Create a scope of work for a website redesign project including 3 landing pages and 2 rounds of revisions.",
  },
  {
    slug: "creative-retainer-agreement-core",  // frontend slug
    backendSlug: "creative-retainer-agreement-core", // MUST match Prisma seed
    categoryId: "hr-corporate", // or create a new category (recommended)
    title: "Creative Retainer Agreement",
    description:
      "Monthly creative services agreement with payment protection, IP ownership clarity and termination safeguards.",
    examplePrompt:
      "Create a 6-month creative retainer agreement for social media design and video editing services.",
  },
  {
    slug: "master-service-agreement-core",
    backendSlug: "master-service-agreement-core", // MUST match Prisma seed
    categoryId: "hr-corporate",
    title: "Master Service Agreement",
    description:
      "Comprehensive MSA with IP ownership leverage, kill-fee termination, liability cap, non-solicitation, and governing law.",
    examplePrompt:
      "Create a Master Service Agreement between my agency PixelForge Studio and client NovaTech AI Solutions.",
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