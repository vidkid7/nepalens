const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Add isPremium column to photos if it doesn't exist
  await p['$'+'executeRawUnsafe']('ALTER TABLE photos ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false');
  console.log('Added isPremium to photos');
  
  // Add isPremium column to videos if it doesn't exist
  await p['$'+'executeRawUnsafe']('ALTER TABLE videos ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false');
  console.log('Added isPremium to videos');
  
  await p['$'+'disconnect']();
}
main();
