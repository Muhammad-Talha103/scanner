import { NextResponse } from "next/server";

export async function GET() {
  try {
    // License key ko string ke andar rakho
    const LICENSE_KEY: string = "Jn6SlEQtMRRbewL5mxlJWkTVj4k0X94pKEu";

    if (!LICENSE_KEY) {
      return NextResponse.json(
        { error: "License key missing" },
        { status: 500 }
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
