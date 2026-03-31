// scripts/printDoc.js
// Usage: node scripts/printDoc.js <documentId>
const { PrismaClient } = require('@prisma/client');

(async () => {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node scripts/printDoc.js <documentId>');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!doc) {
      console.log('Document not found:', id);
      return;
    }

    console.log('doc.id:', doc.id);
    console.log('doc.title:', doc.title);
    console.log('template.slug:', doc.template?.slug);
    console.log('template.supportedPresets:', doc.template?.supportedPresets);
    console.log('contentJson (preview):', JSON.stringify(doc.contentJson)?.slice(0, 1000));
    console.log('placeholderSchema:', JSON.stringify(doc.template?.placeholderSchema)?.slice(0, 1000));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
