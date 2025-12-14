import { os } from "@orpc/server";
import { z } from "zod";

// Initialize oRPC builder
// export const os = os; // os is already imported

// Define a public procedure (no auth required)
export const publicProcedure = os;

// Define an authenticated procedure (checks for user session)
// We will integrate this with our AuthContext later
export const protectedProcedure = os.use(async ({ next, context }) => {
    // TODO: Add actual auth check integration here when Context is fully wired
    // For now, it passes through
    return next({
        context: {
            ...context,
            user: { id: "mock-user" }, // Mock
        },
    });
});
