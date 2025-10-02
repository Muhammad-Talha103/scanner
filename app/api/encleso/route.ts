import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client"; // apna sanity client import karo

// Sanity query for premium user by email
const getPremiumUserByEmail = async (email: string) => {
  return await client.fetch(
    `*[_type == "premiumUser" && email == $email][0]{
      name, email
    }`,
    { email }
  );
};

export async function GET(req: NextRequest) {
  try {
    // Client se email lo (Redux se client pe bhejna hoga)
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Sanity se user dhoondo
    const premiumUser = await getPremiumUserByEmail(email);

    // Agar premium user mila to license key set karo
    const LICENSE_KEY = premiumUser
      ? "Jn6SlEQtMRRbewL5mxlJWkTVj4k0X94pKEu"
      : "";

    if (!LICENSE_KEY) {
      return NextResponse.json(
        { error: "No valid license for this user" },
        { status: 403 }
      );
    }

    // Apna allowed origin jo aapne Encleso ko diya tha
    const origin: string = "https://www.grewescan.de";

    const body = new URLSearchParams();
    body.append("Key", LICENSE_KEY);

    const resp = await fetch("https://encleso.com/API/SetLicenseKey", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: origin,
      },
      body: body.toString(),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: "Encleso API error", detail: text },
        { status: resp.status }
      );
    }

    const json = await resp.json();
    return NextResponse.json(json);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
