// app/api/encleso/route.ts
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Apni client wali license key
    const licenseKey: string = "Jn6SlEQtMRRbewL5mxlJWkTVj4k0X94pKEu"

    // Encleso endpoint call
    const res = await fetch("https://encleso.com/API/SetLicenseKey", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://grew-scanner.vercel.app", 
      },
      body: new URLSearchParams({
        Key: licenseKey,
      }),
    })

    // Try parsing response as JSON
    const enclesoResponse: unknown = await res.json()

    return Response.json({ enclesoResponse })
  } catch (err: unknown) {
    console.error("Encleso API error:", err)
    return Response.json(
      { error: "Failed to get license" },
      { status: 500 }
    )
  }
}
