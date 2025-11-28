import { NextResponse } from "next/server"
import { processExpiredUsers } from "@/utils/premium-expiry"

/**
 * Cron endpoint for checking and moving expired premium users
 * Should be called every minute by an external cron service (Vercel Cron, EasyCron, etc.)
 *
 * Example with Vercel Cron (in vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/premium-expiry",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn("⚠️ Unauthorized cron request")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("⏱️ Running premium expiry cron job...")
    const result = await processExpiredUsers()

    return NextResponse.json(
      {
        success: true,
        message: "Premium expiry check completed",
        result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (err) {
    console.error("❌ Cron job failed:", err)
    return NextResponse.json({ success: false, error: "Cron job failed" }, { status: 500 })
  }
}

/**
 * POST support for external cron services that require POST
 */
export async function POST(req: Request) {
  return GET(req)
}
