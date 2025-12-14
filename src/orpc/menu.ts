import { publicProcedure } from "./init";
import { z } from "zod";
import { asStandard } from "@/lib/zod-compat";

// Example Schema
const SearchSchema = z.object({
    query: z.string().min(1),
    foodCourtId: z.string().uuid(),
});

// Example Procedure
export const searchMenu = publicProcedure
    .input(asStandard(SearchSchema))
    .handler(async ({ input }) => {
        // In a real app, we would use Supabase/Prisma to vector search here
        // const { query, foodCourtId } = input;
        // ... logic ...

        return {
            results: [
                { id: "1", name: `Result for ${input.query}`, price: 10.99 },
            ],
        };
    });
