"use server";

import { createClient } from "@/utils/supabase/server";
import { CartItem } from "@/lib/store/cart";
import { revalidatePath } from "next/cache";

export type PlaceOrderResult = {
    success: boolean;
    message?: string;
    orderIds?: string[];
};

export async function placeOrder(
    tableId: string,
    items: any[], // Relaxed type to accept hydration
    sessionId?: string
): Promise<PlaceOrderResult> {
    const supabase = await createClient();

    if (!items || items.length === 0) {
        return { success: false, message: "Cart is empty" };
    }

    // 1. Group items by Restaurant
    const ordersByRestaurant: Record<
        string,
        { total: number; items: any[] }
    > = {};

    for (const item of items) {
        if (!ordersByRestaurant[item.restaurantId]) {
            ordersByRestaurant[item.restaurantId] = { total: 0, items: [] };
        }
        const group = ordersByRestaurant[item.restaurantId];
        group.items.push({
            item_id: item.menuId || item.id, // Prefer MenuID if available (from hydration), else fallback to ID
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        });
        group.total += item.price * item.quantity;
    }

    // 2. Create Order Records
    const createdIds: string[] = [];

    try {
        const promises = Object.entries(ordersByRestaurant).map(
            async ([restaurantId, data]) => {
                const { data: order, error } = await supabase
                    .from("orders")
                    .insert({
                        table_id: tableId,
                        restaurant_id: restaurantId,
                        status: "pending",
                        payment_status: "unpaid",
                        total_amount: data.total,
                        items: data.items,
                    })
                    .select("id")
                    .single();

                if (error) {
                    console.error("Order error", error);
                    throw new Error(`Failed to create order for restaurant ${restaurantId}`);
                }
                return order.id;
            }
        );

        const results = await Promise.all(promises);
        createdIds.push(...results);

        // 3. Clear Cart Session
        if (sessionId) {
            await supabase
                .from("cart_items")
                .delete()
                .eq("session_id", sessionId);

            // Optionally update session status to 'ordered' if we want to force a new session ID
            // await supabase.from("cart_sessions").update({ status: 'ordered' }).eq('id', sessionId);
        }

        return { success: true, orderIds: createdIds };
    } catch (error) {
        console.error("Place Order Error:", error);
        return { success: false, message: "Failed to place items. Please try again." };
    }
}
