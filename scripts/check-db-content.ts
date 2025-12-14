
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking DB Content...");

    const fc = await prisma.foodCourt.findFirst({
        where: { name: "Demo Food Court" },
        include: {
            restaurants: {
                include: { menu_items: true }
            }
        }
    });

    if (!fc) {
        console.log("❌ Demo Food Court NOT found.");
        return;
    }

    console.log(`✅ Found Food Court: ${fc.name} (ID: ${fc.id})`);
    console.log(`Restaurants: ${fc.restaurants.length}`);

    fc.restaurants.forEach(r => {
        console.log(`   - ${r.name} (Active: ${r.is_active}) [ID: ${r.id}]`);
        console.log(`     Items: ${r.menu_items.length}`);
        r.menu_items.forEach(i => {
            console.log(`       * ${i.name} ($${i.price})`);
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
