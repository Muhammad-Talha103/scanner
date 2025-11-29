import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) return NextResponse.json({ error: "Email required" });

    // Check active premium user
    const user = await client.fetch(
      `*[_type == "premiumUser" && email == $email][0]`,
      { email }
    );

    if (!user) {
      return NextResponse.json({ moved: false, reason: "Not premium" });
    }

    const now = new Date().getTime();
    const end = new Date(user.premiumEnd).getTime();

    // Already expired?
    if (now < end) {
      return NextResponse.json({ moved: false, reason: "Still active" });
    }

    // Check if already moved to premium_ends
    const already = await client.fetch(
      `*[_type == "premium_ends" && email == $email && premiumEnd == $end][0]`,
      { email, end: user.premiumEnd }
    );

    if (already) {
      // Delete premiumUser if still exists but already moved
      await client.delete(user._id);
      return NextResponse.json({ moved: false, reason: "Already moved" });
    }

    // Create new expired record
    await client.create({
      _type: "premium_ends",
      name: user.name,
      email: user.email,
      payments: user.payments,
      premiumStart: user.premiumStart,
      premiumEnd: user.premiumEnd,
      movedAt: new Date().toISOString(),
    });

    // Delete from premiumUser
    await client.delete(user._id);

    return NextResponse.json({ moved: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
