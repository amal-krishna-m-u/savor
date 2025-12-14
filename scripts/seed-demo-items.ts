
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Demo Items...");

    const fc = await prisma.foodCourt.findFirst({
        where: { name: "Demo Food Court" },
        include: { restaurants: true }
    });

    if (!fc || fc.restaurants.length === 0) {
        console.error("❌ Demo data missing structure. Run get-demo-url.ts first or check DB.");
        return;
    }

    const restaurant = fc.restaurants[0];

    // Create Categories
    console.log("Creating categories...");
    const mains = await prisma.category.create({ data: { name: "Mains", restaurant_id: restaurant.id } });
    const drinks = await prisma.category.create({ data: { name: "Drinks", restaurant_id: restaurant.id } });

    console.log(`Adding items to ${restaurant.name} (${restaurant.id})...`);

    // Use explicit IDs for categories
    await prisma.menuItem.createMany({
        data: [
            {
                name: "Robo Burger",
                price: 15.0,
                description: "Byte sized delight",
                category_id: mains.id,
                restaurant_id: restaurant.id,
                image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
            },
            {
                name: "Neural Noodles",
                price: 12.0,
                description: "Spicy and smart",
                category_id: mains.id,
                restaurant_id: restaurant.id,
                image_url: "https://images.unsplash.com/photo-1552611052-33e04de081de?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
            },
            {
                name: "Algorithm Ale",
                price: 8.0,
                description: "Refreshing logic",
                category_id: drinks.id,
                restaurant_id: restaurant.id,
                image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
            }
        ]
    });

    console.log("✅ Items added!");
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
