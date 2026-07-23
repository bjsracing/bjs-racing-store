// File: src/pages/api/notifications/send.ts
import type { APIRoute } from "astro";
import { sendOrderNotification } from "@/lib/notifications.ts";

export const POST: APIRoute = async ({ request, locals }) => {
  const { session } = locals;
  if (!session) {
    return new Response(JSON.stringify({ message: "Tidak diizinkan" }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const { to, channel, event, data } = body;

    if (!to || !channel || !event) {
      return new Response(
        JSON.stringify({ message: "to, channel, dan event wajib diisi." }),
        { status: 400 },
      );
    }

    const result = await sendOrderNotification({
      to,
      channel,
      event: event as "order_created" | "payment_confirmed" | "order_shipped" | "order_completed" | "order_cancelled",
      data: data || {},
    });

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengirim notifikasi.",
      }),
      { status: 500 },
    );
  }
};
