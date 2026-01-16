// types/doc-layout.ts

export type DocShellVariant = "page" | "plain";

export interface DocLayoutStyle {
  shellVariant: DocShellVariant;
  headerImageUrl?: string | null;
  footerImageUrl?: string | null;
  showLogo?: boolean;
  showSignature?: boolean;
  pageWidthPx?: number;
  minPageHeightPx?: number;
}

export interface BrandProfile {
  companyName: string;
  logoUrl?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface SignatoryProfile {
  fullName: string;
  designation: string;
  signatureImageUrl?: string | null;
}
