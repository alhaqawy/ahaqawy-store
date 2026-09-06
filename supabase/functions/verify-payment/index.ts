import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { payment_id, order_id } = await req.json();

    if (!payment_id || !order_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "payment_id و order_id مطلوبان",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const moyasarSecretKey = Deno.env.get("MOYASAR_SECRET_KEY");

    if (!moyasarSecretKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "MOYASAR_SECRET_KEY غير مضبوط",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const moyasarResponse = await fetch(
      `https://api.moyasar.com/v1/payments/${encodeURIComponent(payment_id)}`,
      {
        headers: {
          Authorization:
            `Basic ${btoa(`${moyasarSecretKey}:`)}`,
          Accept: "application/json",
        },
      }
    );

    if (!moyasarResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "تعذر التحقق من عملية الدفع",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const payment = await moyasarResponse.json();

    if (payment.status !== "paid") {
      await supabase
        .from("orders")
        .update({
          status: "failed",
          payment_id: payment.id,
        })
        .eq("id", order_id);

      return new Response(
        JSON.stringify({
          success: false,
          status: payment.status,
          message: "عملية الدفع لم تصبح مدفوعة",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, total, currency, status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "الطلب غير موجود",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const expectedAmount = Math.round(Number(order.total) * 100);
    const paidAmount = Number(payment.amount);

    if (
      paidAmount !== expectedAmount ||
      payment.currency !== order.currency
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "بيانات الدفع لا تطابق قيمة الطلب",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_id: payment.id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id,
        payment_id: payment.id,
        status: "paid",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "حدث خطأ أثناء التحقق من الدفع",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
