"use server";

import { parseWithZod } from "@conform-to/zod";
import { MenuItemSchema } from "@/lib/schemas/menu";
import { redirect } from "next/navigation";

export async function createMenuItem(prevState: unknown, formData: FormData) {
    const submission = parseWithZod(formData, {
        schema: MenuItemSchema,
    });

    if (submission.status !== "success") {
        return submission.reply();
    }

    // TODO: Save to Database (Prisma)
    // await prisma.menuItem.create({ data: submission.value });

    redirect("/dashboard/menu");
}
