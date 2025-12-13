// app/api/stripe-webhook/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { client } from "@/sanity/lib/client";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
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
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new NextResponse("Webhook verification failed", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;

    // 1️⃣ Get user email
    let userEmail = session.customer_details?.email || session.customer_email || null;

    if (!userEmail && session.customer) {
      const customer = await stripe.customers.retrieve(session.customer as string);
      if (!("deleted" in customer)) userEmail = customer.email ?? null;
    }

    if (!userEmail) {
      console.error("❌ No email in session");
      return NextResponse.json({ received: true, warning: "No email" });
    }

    // 2️⃣ Retrieve PaymentIntent
    let paymentIntent: Stripe.PaymentIntent | null = null;
    let charge: Stripe.Charge | null = null;

    if (session.payment_intent) {
      paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);

      // 3️⃣ Retrieve Charge directly using latest_charge ID
      if (paymentIntent.latest_charge) {
        charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
      }
    }

    // 4️⃣ Card details from Charge
    const cardDetails = charge?.payment_method_details?.card
      ? {
          brand: charge.payment_method_details.card.brand,
          last4: charge.payment_method_details.card.last4,
          exp_month: charge.payment_method_details.card.exp_month,
          exp_year: charge.payment_method_details.card.exp_year,
          country: charge.payment_method_details.card.country,
          funding: charge.payment_method_details.card.funding,
        }
      : undefined;

    // 5️⃣ Billing info
    const billingAddress = charge?.billing_details || session.customer_details;

    // 6️⃣ Line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    // 7️⃣ Premium duration calculation
    const euros = session.amount_total ? session.amount_total / 100 : 0;
    const fullMonths = Math.floor(euros);
    const extraDays = (euros - fullMonths) * 30;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + fullMonths);
    endDate.setDate(endDate.getDate() + extraDays);

    // 8️⃣ Metadata
    const metadata =
      session.metadata && Object.keys(session.metadata).length > 0
        ? Object.entries(session.metadata).map(([k, v]) => ({ key: k, value: String(v) }))
        : [];

    // 9️⃣ Payment object for Sanity
    const newPayment = {
      _key: session.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntent?.id,
      stripeChargeId: charge?.id,
      amount_total: session.amount_total,
      currency: session.currency,
      status: session.payment_status,
      payment_method_type: charge?.payment_method_details?.type || "unknown",
      card: cardDetails,
      billing_address: billingAddress
        ? {
            name: billingAddress.name,
            email: billingAddress.email,
            line1: billingAddress.address?.line1,
            line2: billingAddress.address?.line2,
            city: billingAddress.address?.city,
            state: billingAddress.address?.state,
            postal_code: billingAddress.address?.postal_code,
            country: billingAddress.address?.country,
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

    // 10️⃣ Update or create premiumUser
    const existingUser = await client.fetch(
      `*[_type == "premiumUser" && email == $email][0]`,
      { email: userEmail }
    );

    if (existingUser) {
      const now = new Date();
      let newPremiumStart = now;
      let newPremiumEnd = endDate;

      if (existingUser.premiumEnd) {
        const currentEnd = new Date(existingUser.premiumEnd);
        if (currentEnd > now) {
          newPremiumStart = new Date(existingUser.premiumStart);
          newPremiumEnd = new Date(currentEnd);
          newPremiumEnd.setMonth(newPremiumEnd.getMonth() + fullMonths);
          newPremiumEnd.setDate(newPremiumEnd.getDate() + extraDays);
        }
      }

      await client
        .patch(existingUser._id)
        .setIfMissing({ payments: [] })
        .append("payments", [newPayment])
        .set({
          premiumStart: newPremiumStart.toISOString(),
          premiumEnd: newPremiumEnd.toISOString(),
        })
        .commit();
    } else {
      await client.create({
        _type: "premiumUser",
        email: userEmail,
        name: billingAddress?.name || session.customer_details?.name || undefined,
        payments: [newPayment],
        premiumStart: startDate.toISOString(),
        premiumEnd: endDate.toISOString(),
        receipt_url: charge?.receipt_url,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("❌ Error handling session:", err);
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
