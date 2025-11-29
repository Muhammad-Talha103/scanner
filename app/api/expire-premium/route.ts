
//app/api/expire-premium/route.ts
import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

interface PremiumUserPayload {
  _id: string;
  email: string;
  name?: string;
  payments?: any[];
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
