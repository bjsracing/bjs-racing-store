// File: src/pages/api/admin/analytics.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@/lib/supabaseServer.ts";
import { requireAdmin } from "@/lib/adminAuth.ts";

export const GET: APIRoute = async (context) => {
  const admin = await requireAdmin(context);
  if (!admin.ok) {
    return new Response(JSON.stringify({ message: admin.message }), {
      status: admin.status,
    });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const {
      data: orders,
      error: ordersError,
    } = await supabaseAdmin
      .from("orders")
      .select("id, status, total_amount, created_at, payment_gateway_fee, shipping_cost")
      .gte("created_at", thirtyDaysAgoStr)
      .order("created_at", { ascending: true });

    if (ordersError) throw ordersError;

    const totalRevenue = orders.reduce<number>(
      (sum, order) => sum + (order.total_amount || 0),
      0,
    );
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
      const status = order.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const paymentMethods = orders.reduce<Record<string, number>>((acc, order) => {
      const gateway = "midtrans";
      acc[gateway] = (acc[gateway] || 0) + 1;
      return acc;
    }, {});

    const shippingTotal = orders.reduce<number>(
      (sum, order) => sum + (order.shipping_cost || 0),
      0,
    );
    const gatewayFeeTotal = orders.reduce<number>(
      (sum, order) => sum + (order.payment_gateway_fee || 0),
      0,
    );

    const dailyRevenue = orders.reduce<Record<string, number>>((acc, order) => {
      const date = new Date(order.created_at).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + (order.total_amount || 0);
      return acc;
    }, {});

    const {
      data: topProducts,
      error: topProductsError,
    } = await supabaseAdmin.rpc("get_best_selling_products", {
      start_date: thirtyDaysAgoStr,
      end_date: new Date().toISOString(),
      category_filter: null,
    });

    if (topProductsError) {
      console.error("Best selling products error:", topProductsError);
    }

    return new Response(
      JSON.stringify({
        summary: {
          totalRevenue,
          totalOrders,
          avgOrderValue,
          shippingTotal,
          gatewayFeeTotal,
        },
        statusCounts,
        paymentMethods,
        dailyRevenue,
        topProducts: topProducts || [],
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin analytics error:", error);
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error ? error.message : "Gagal memuat analytics.",
      }),
      { status: 500 },
    );
  }
};
