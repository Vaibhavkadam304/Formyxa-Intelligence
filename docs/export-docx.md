# /api/export-docx – Editor Export Contract

This route is used by `/builder/[id]` to export edited documents as DOCX.

## Request (Next.js → Flask)

`POST /api/export-docx`

The JSON body sent to Flask looks like:

```jsonc
{
  "fileName": "Visa expiration notice.docx",
  "contentJson": { /* TipTap JSON */ },

  "templateSlug": "visa-expiration-letter",

  "brand": {
    "companyName": "Your Company Name",
    "logoUrl": "https://cdn.formyxa.com/brand/logo.png",
    "addressLine1": "123 Business Street",
    "addressLine2": "City, Country",
    "phone": "+91-00000-00000",
    "email": "hr@company.com"
  },

  "signatory": {
    "fullName": "HR Manager Name",
    "designation": "HR Manager",
    "signatureImageUrl": "https://cdn.formyxa.com/signatures/hr-manager.png"
  }
}
