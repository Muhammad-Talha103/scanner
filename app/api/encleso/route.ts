import { client } from "@/sanity/lib/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {

     const userEmail = req.nextUrl.searchParams.get("email"); 
     console.log("User email from request:", userEmail);

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email missing" },
        { status: 400 }
      );
    }

     const query = `*[_type == "premiumUser"]{ email }`;
    const premiumUsers: { email: string }[] = await client.fetch(query);

    // Check if the user is premium
    const isPremium = premiumUsers.some(
      (user) => user.email.toLowerCase() === userEmail.toLowerCase()
    );

    // License key ko string ke andar rakho
    const LICENSE_KEY: string = isPremium
      ? "Jn6SlEQtMRRbewL5mxlJWkTVj4k0X94pKEu"
      : "";

    if (!LICENSE_KEY) {
      return NextResponse.json(
        { error: "Not a premium user, license denied" },
        { status: 403 }
      );
    }

    // Apna allowed origin jo aapne Encleso ko diya tha
    const origin: string = "https://www.grewescan.de" ;

    const body = new URLSearchParams();
    body.append("Key", LICENSE_KEY);

    const resp = await fetch("https://encleso.com/API/SetLicenseKey", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": origin,
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

    const json: unknown = await resp.json();
    return NextResponse.json(json);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
