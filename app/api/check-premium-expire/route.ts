//app/api/check-premium-expire/route.ts

import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" });

    const user = await client.fetch(
      `*[_type == "premiumUser" && email == $email][0]`,
      { email }
    );

    if (!user) return NextResponse.json({ moved: false, reason: "Not premium" });

    const now = Date.now();
    const end = new Date(user.premiumEnd).getTime();
    if (now < end) return NextResponse.json({ moved: false, reason: "Still active" });

    const docId = `${user.email}-${new Date(user.premiumEnd).getTime()}`;

    const already = await client.fetch(
      `*[_type == "premium_ends" && _id == $id][0]`,
      { id: docId }
    );

    if (!already) {
      await client.create({
        _type: "premium_ends",
        name: user.name,
        _id: docId,
        email: user.email,
        payments: user.payments || [],
        premiumStart: user.premiumStart,
        premiumEnd: user.premiumEnd,
        movedAt: new Date().toISOString(),
      });
    }

    // Remove original premiumUser record
    await client.delete(user._id);

    return NextResponse.json({ moved: true });
  } catch (error) {
    console.error("Error moving premium user:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
