
//app/api/expire-premium/route.ts
import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

interface Payment {
  _key: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  amount_total?: number;
  currency?: string;
  status?: string;
  payment_method_type?: string;
  card?: {
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
  };
  billing_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  lineItems?: {
    id?: string;
    description?: string | null;
    price?: string;
    product?: string;
    quantity?: number;
    amount_total?: number;
    currency?: string;
  }[];
  createdAt?: string;
}

interface PremiumUserPayload {
  _id: string;
  email: string;
  name?: string;
  payments?: Payment[];
  premiumStart?: string;
  premiumEnd?: string;
}

export async function POST(req: Request) {
  try {
    const data: PremiumUserPayload = await req.json();

    if (!data._id) {
      return NextResponse.json(
        { error: "Missing _id" },
        { status: 400 }
      );
    }

    // 1️⃣ Move expired user
    await client.create({
      _type: "premium_user_ends",
      name: data.name || "",
      email: data.email,
      payments: data.payments || [],
      premiumStart: data.premiumStart,
      premiumEnd: data.premiumEnd,
      movedAt: new Date().toISOString(),
    });

    // 2️⃣ Delete from premiumUser
    await client.delete(data._id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Expire Premium Error:", error);
    return NextResponse.json(
      { error: "Failed to expire premium user" },
      { status: 500 }
    );
  }
}
