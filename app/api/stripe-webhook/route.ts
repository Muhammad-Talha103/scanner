//app/api/stripe-webhook/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { client } from "@/sanity/lib/client"; 

export const config = {
  api: {
    bodyParser: false, 
  },
};

export async function POST(req: Request) {
  console.log("🚀 Incoming Stripe webhook...");

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY; 

  if (!webhookSecret || !stripeSecret) {
    console.error("❌ Missing Stripe webhook secret or live secret key");
    return new NextResponse("Missing env vars", { status: 500 });
  }

  const stripe = new Stripe(stripeSecret);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    console.log("✅ Webhook verified:", event.type);
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new NextResponse("Webhook verification failed", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    console.log("⚠️ Ignoring event:", event.type);
    return NextResponse.json({ received: true });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("💡 Checkout session:", session.id);

    // get email
    let userEmail =
      session.customer_details?.email || session.customer_email || null;

    if (!userEmail && session.customer) {
      const customer = await stripe.customers.retrieve(session.customer as string);
      if (!("deleted" in customer)) userEmail = (customer).email ?? null;
    }

    if (!userEmail) {
      console.error("❌ No email in session");
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

    
    // const months = euros;
    // const startDate = new Date();
    // const endDate = new Date(startDate);
    // endDate.setMonth(endDate.getMonth() + months);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 3 * 60 * 1000);

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

    console.log("💳 Prepared payment for:", userEmail);

    // Update or create premiumUser
    const existingUser = await client.fetch(
      `*[_type == "premiumUser" && email == $email][0]`,
      { email: userEmail }
    );

    if (existingUser) {
      console.log("🧾 Updating existing user:", existingUser._id);
      await client
        .patch(existingUser._id)
        .setIfMissing({ payments: [] })
        .append("payments", [newPayment])
        .set({
          premiumStart: startDate.toISOString(),
          premiumEnd: endDate.toISOString(),
        })
        .commit();
      console.log("✅ Updated user:", userEmail);
    } else {
      console.log("🆕 Creating new premium user:", userEmail);
      await client.create({
        _type: "premiumUser",
        email: userEmail,
        name: charge?.billing_details?.name || session.customer_details?.name || undefined,
        payments: [newPayment],
        premiumStart: startDate.toISOString(),
        premiumEnd: endDate.toISOString(),
        createdAt: new Date().toISOString(),
      });
      console.log("✅ Created new premium user:", userEmail);
    }
  } catch (err) {
    console.error("❌ Error handling session:", err);
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
