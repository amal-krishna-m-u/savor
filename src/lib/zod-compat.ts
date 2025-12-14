import { z } from "zod";

// Minimal Standard Schema definitions
interface StandardSchemaV1<Input, Output> {
    readonly "~standard": {
        readonly version: 1;
        readonly vendor: string;
        readonly validate: (
            value: unknown
        ) =>
            | { readonly issues: ReadonlyArray<StandardSchemaV1.Issue> }
            | { readonly value: Output };
    };
}

namespace StandardSchemaV1 {
    export interface Issue {
        readonly message: string;
        readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
    }
}

export function asStandard<T extends z.ZodTypeAny>(
    zodSchema: T
): StandardSchemaV1<z.input<T>, z.output<T>> {
    return {
        "~standard": {
            version: 1,
            vendor: "zod-adapter",
            validate: (value: unknown) => {
                const result = zodSchema.safeParse(value);
                if (result.success) {
                    return { value: result.data };
                }
                return {
                    issues: result.error.errors.map((err) => ({
                        message: err.message,
                        path: err.path,
                    })),
                };
            },
        },
    };
}
