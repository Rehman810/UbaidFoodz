import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.menuItem.findMany({
    where: { OR: [{ imageUrl: "" }, { imageUrl: { equals: "" } }] },
    select: { name: true, category: true },
    orderBy: { name: "asc" },
  });
  if (!rows.length) {
    console.log("Every dish has an image URL.");
    return;
  }
  console.log(`${rows.length} dish(es) with no image:`);
  for (const row of rows) console.log(`- ${row.category}: ${row.name}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
