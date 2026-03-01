import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sets = await prisma.slideshowSet.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
    include: { slides: true }
  });
  for (const s of sets) {
    console.log(`Set Name: ${s.name}`);
    console.log(`ModelPath: ${s.modelImagePath}`);
    console.log(`Generated model name: ${s.name.split('—')[0]}`);
    if (s.slides.length > 0) {
        console.log(`Slide 0 refHashes: ${s.slides[0].inputJson}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
