import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@couple-counseling.kr" },
    update: {},
    create: {
      id: "demo-user",
      name: "사용자",
      email: "demo@couple-counseling.kr",
    },
  });

  await prisma.counselorProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      displayName: "김지수 상담사",
      specialty: "부부상담, 감정중심치료(EFT)",
    },
  });

  console.log("Seed complete:", { user: user.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
