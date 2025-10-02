
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { client } from "@/sanity/lib/client";
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ✅ important

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil", // or omit if default
});


export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const errorMessage = typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : String(err);
    console.error("❌ Webhook verification error:", errorMessage);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
       let customerEmail = session.customer_details?.email || session.customer_email || null;

      // Agar phir bhi email null hai to Stripe se customer fetch karo
      if (!customerEmail && session.customer) {
        const customer = await stripe.customers.retrieve(session.customer as string);
        if (!("deleted" in customer)) {
          customerEmail = customer.email ?? null;
        }
      }

      if (!customerEmail) {
        console.error("❌ Email not found in session or customer object.");
        return NextResponse.json({ received: true, warning: "Email missing" });
      }



      const paymentIntent = (await stripe.paymentIntents.retrieve(
        session.payment_intent as string,
        { expand: ["charges.payment_method"] }
      )) as Stripe.PaymentIntent & { charges?: Stripe.ApiList<Stripe.Charge> };

      const charge = paymentIntent.charges?.data?.[0];
      const paymentMethod = charge?.payment_method_details;

      const billingAddress =
        charge?.billing_details?.address || session.customer_details?.address;

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const userEmail =
        charge?.billing_details?.email || session.customer_details?.email;

      if (!userEmail) {
        console.error("❌ No user email found in payment session");
        return NextResponse.json({ received: true });
      }

      // 🔹 Calculate expiry (amount_total is in cents)
      const euros = session.amount_total ? session.amount_total / 100 : 0
      const months = euros; // €1 = 1 month, €10 = 10 months etc.
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);

      const newPayment = {
        _key: session.id,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: charge?.id,
        amount_total: session.amount_total,
        currency: session.currency,
        status: session.payment_status,
        payment_method_type: paymentMethod?.type,
        card: paymentMethod?.card
          ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              exp_month: paymentMethod.card.exp_month,
              exp_year: paymentMethod.card.exp_year,
            }
          : undefined,
        billing_address: billingAddress
          ? {
              line1: billingAddress.line1,
              line2: billingAddress.line2,
              city: billingAddress.city,
              state: billingAddress.state,
              postal_code: billingAddress.postal_code,
              country: billingAddress.country,
            }
          : undefined,
        metadata: session.metadata || {},
        lineItems: lineItems.data.map((item) => ({
          id: item.id,
          description: item.description,
          price: item.price?.id,
          product: item.price?.product,
          quantity: item.quantity,
          amount_total: item.amount_total,
          currency: item.currency,
        })),
        createdAt: new Date(session.created * 1000).toISOString(),
      };

      // 🔎 Check if user already expired
      const expiredUser = await client.fetch(
        `*[_type == "premium_user_ends" && email == $email][0]`,
        { email: userEmail }
      );
      if (expiredUser) {
        await client.delete(expiredUser._id);
        console.log("♻️ Removed from expired users:", expiredUser._id);
      }

      // 🔎 Check if user already exists in active
      const existingUser = await client.fetch(
        `*[_type == "premiumUser" && email == $email][0]`,
        { email: userEmail }
      );

      if (existingUser) {
        await client
          .patch(existingUser._id)
          .setIfMissing({ payments: [] })
          .append("payments", [newPayment])
          .set({
            premiumStart: startDate.toISOString(),
            premiumEnd: endDate.toISOString(),
          })
          .commit();

        console.log("🔄 Updated premium user:", existingUser._id);
      } else {
        await client.create({
          _type: "premiumUser",
          email: userEmail,
          name: charge?.billing_details?.name || session.customer_details?.name,
          payments: [newPayment],
          premiumStart: startDate.toISOString(),
          premiumEnd: endDate.toISOString(),
          createdAt: new Date().toISOString(),
        });

        console.log("✅ Created new premium user:", userEmail);
      }
    } catch (err) {
      console.error("❌ Error handling session:", err);
    }
  }

  return NextResponse.json({ received: true });
}