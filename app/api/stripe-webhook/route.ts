
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { client } from "@/sanity/lib/client"; // tumhara existing sanity client

export const config = {
  api: {
    bodyParser: false, // ✅ disable default body parsing
  },
};


export async function POST(req: Request) {
  console.log("🚀 Incoming TEST Stripe webhook...");

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  const webhookSecret = "whsec_hfe19MQJHuLliciBC2oxvRu0NQacpw7H";
  const stripeSecret = "sk_test_51SBZO0KAT5m6jW9YcNxvHnHTSPxCid0o6iS5InuaDqL374GzzYQEnTMDevPm0NnkrDmthcpGoURRn0fasgyu6ez000xpZLwiNK";

  if (!webhookSecret || !stripeSecret) {
    console.error("❌ Missing STRIPE_WEBHOOK_SECRET_TEST or STRIPE_TEST_SECRET_KEY env vars");
    return new NextResponse("Missing test env vars", { status: 500 });
  }

  const stripe = new Stripe(stripeSecret);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    console.log("✅ TEST Webhook verified:", event.type);
  } catch (err) {
    console.error("❌ TEST Webhook verification failed:", err);
    return new NextResponse("Webhook verification failed", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    console.log("⚠️ TEST Ignoring event:", event.type);
    return NextResponse.json({ received: true });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("💡 TEST Checkout session:", session.id);

    // get email
    let userEmail =
      session.customer_details?.email || session.customer_email || null;

    if (!userEmail && session.customer) {
      const customer = await stripe.customers.retrieve(session.customer as string);
      if (!("deleted" in customer)) userEmail = (customer).email ?? null;
    }

    if (!userEmail) {
      console.error("❌ TEST No email in session");
      return NextResponse.json({ received: true, warning: "No email" });
    }

    // optional: retrieve paymentIntent to get charges/payment method
    let paymentIntent: (Stripe.PaymentIntent & { charges?: Stripe.ApiList<Stripe.Charge> }) | null = null;
    if (session.payment_intent) {
      paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string,
        { expand: ["charges"] }
      ) as Stripe.PaymentIntent & { charges?: Stripe.ApiList<Stripe.Charge> };
    }

    const charge = paymentIntent?.charges?.data?.[0];
    const paymentMethod = charge?.payment_method_details;
    const billingAddress = charge?.billing_details?.address || session.customer_details?.address;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    const euros = session.amount_total ? session.amount_total / 100 : 0;
    const months = euros;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    const metadata =
      session.metadata && Object.keys(session.metadata).length > 0
        ? Object.entries(session.metadata).map(([k, v]) => ({ key: k, value: String(v) }))
        : [];

    const newPayment = {
      _key: session.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntent?.id,
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
      metadata,
      lineItems: lineItems.data.map((item) => ({
        id: item.id,
        description: item.description,
        price: item.price?.id,
        product: item.price?.product,
        quantity: item.quantity,
        amount_total: item.amount_total,
        currency: item.currency,
      })),
      createdAt: session.created ? new Date(session.created * 1000).toISOString() : new Date().toISOString(),
    };

    console.log("💳 TEST Prepared payment for:", userEmail);

    // Update or create premiumUser (same logic as your production route)
    const existingUser = await client.fetch(
      `*[_type == "premiumUser" && email == $email][0]`,
      { email: userEmail }
    );

    if (existingUser) {
      console.log("🧾 TEST Updating existing user:", existingUser._id);
      await client
        .patch(existingUser._id)
        .setIfMissing({ payments: [] })
        .append("payments", [newPayment])
        .set({
          premiumStart: startDate.toISOString(),
          premiumEnd: endDate.toISOString(),
        })
        .commit();
      console.log("✅ TEST Updated user:", userEmail);
    } else {
      console.log("🆕 TEST Creating new premium user:", userEmail);
      await client.create({
        _type: "premiumUser",
        email: userEmail,
        name: charge?.billing_details?.name || session.customer_details?.name || undefined,
        payments: [newPayment],
        premiumStart: startDate.toISOString(),
        premiumEnd: endDate.toISOString(),
        createdAt: new Date().toISOString(),
      });
      console.log("✅ TEST Created new premium user:", userEmail);
    }
  } catch (err) {
    console.error("❌ TEST Error handling session:", err);
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
