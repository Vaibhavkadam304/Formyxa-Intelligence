import React from "react";

type Preset = "startup" | "corporate" | "custom";
type Design =
  | "modern_blue"
  | "minimal_plain"
  | "classic_border"
  | "fresh_green"
  | null;

export default function OfferLetterPreview({
  preset,
  design,
}: {
  preset: Preset;
  design: Design;
}) {
  const designStyles: Record<string, string> = {
    modern_blue: "border-t-[10px] border-blue-600",
    minimal_plain: "",
    classic_border: "border border-gray-300",
    fresh_green: "border-t-[10px] border-green-500",
  };

  return (
    <div className="flex justify-center p-4">
      <div className="origin-top scale-[0.55]">
        <div
          className={`w-[794px] h-[1123px] bg-white px-16 py-14 rounded shadow ${
            design ? designStyles[design] : ""
          }`}
        >
          {/* Header */}
          <div className="mb-10">
            <div className="text-sm font-semibold">
              Company Name Pvt. Ltd.
            </div>
            <div className="text-xs text-gray-500">
              Company Address · City · Country
            </div>
            <div className="text-xs text-gray-400 mt-4 text-right">
              {preset.toUpperCase()} PRESET
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold mb-6">
            Offer of Employment
          </h1>

          {/* Body */}
          <div className="text-sm text-gray-700 space-y-4 leading-relaxed">
            <p>Dear <strong>[Candidate Name]</strong>,</p>

            <p>
              We are pleased to offer you the position of{" "}
              <strong>[Job Title]</strong> at{" "}
              <strong>Company Name Pvt. Ltd.</strong>
            </p>

            <p>
              Your total annual compensation (CTC) will be{" "}
              <strong>[CTC]</strong>, with an expected start date of{" "}
              <strong>[Start Date]</strong>.
            </p>

            <p>
              This offer is subject to successful completion of all
              verification and onboarding formalities.
            </p>

            <p>
              We look forward to having you as part of our organization.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-16 text-sm">
            <p>Sincerely,</p>
            <div className="mt-6">
              <p className="font-medium">Authorized Signatory</p>
              <p className="text-xs text-gray-500">
                Company Name Pvt. Ltd.
              </p>
            </div>

            <div className="mt-10 text-xs text-gray-400">
              This is a system-generated preview.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
