import { z } from "zod";

export const MenuItemSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    price: z.number().min(0, "Price must be positive"),
    categoryId: z.string().uuid().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    isAvailable: z.boolean().default(true),
});
