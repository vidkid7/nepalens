const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Get all photo IDs
  const photos = await p.photo.findMany({ select: { id: true }, orderBy: { createdAt: 'asc' } });
  console.log('Total photos:', photos.length);
  
  // Mark roughly half as premium (every other photo)
  const premiumIds = photos.filter((_, i) => i % 2 === 0).map(p => p.id);
  const freeIds = photos.filter((_, i) => i % 2 !== 0).map(p => p.id);
  
  await p.photo.updateMany({ where: { id: { in: premiumIds } }, data: { isPremium: true } });
  await p.photo.updateMany({ where: { id: { in: freeIds } }, data: { isPremium: false } });
  
  console.log('Premium:', premiumIds.length, ' Free:', freeIds.length);
  await p['$'+'disconnect']();
}
main();
