"use client";

import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { MenuItemSchema } from "@/lib/schemas/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMenuItem } from "@/app/dashboard/menu/actions"; // Server Action
import { useActionState } from "react";

export function MenuForm() {
    const [lastResult, action] = useActionState(createMenuItem, undefined);
    const [form, fields] = useForm({
        lastResult,
        onValidate({ formData }) {
            return parseWithZod(formData, { schema: MenuItemSchema });
        },
        shouldValidate: "onBlur",
    });

    return (
        <form
            action={action}
            className="space-y-8 max-w-xl"
            {...getFormProps(form)}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={fields.name.id}>Name</Label>
                    <Input {...getInputProps(fields.name, { type: "text" })} />
                    <p className="text-sm text-red-500">{fields.name.errors}</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor={fields.description.id}>Description</Label>
                    <Textarea {...getInputProps(fields.description, { type: "text" })} />
                    <p className="text-sm text-red-500">{fields.description.errors}</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor={fields.price.id}>Price ($)</Label>
                    <Input {...getInputProps(fields.price, { type: "number" })} step="0.01" />
                    <p className="text-sm text-red-500">{fields.price.errors}</p>
                </div>

                {/* Category Setup Omitted for brevity in MVP step - would be a Select */}
            </div>

            <Button type="submit">Save Item</Button>
        </form>
    );
}
