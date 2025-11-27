import { type NextRequest, NextResponse } from "next/server"
import { moveExpiredPremiumUsers } from "@/lib/sanity-admin"

/**
 * Cron endpoint to periodically move expired premium users
 * Can be called by Vercel Cron, external scheduler, or manually
 *
 * Example Vercel cron configuration in vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/move-expired-users",
 *       "schedule": "0 * * * *"
 *     }
 *   ]
 * }
 */

export async function GET(req: NextRequest) {
  // Optional: Verify cron secret if you want additional security
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[Cron] Unauthorized cron request")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[Cron] Starting premium user expiry check...")
    const { moved, errors } = await moveExpiredPremiumUsers()

    return NextResponse.json({
      success: true,
      moved,
      errors,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[Cron] Error in expiry check:", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  // Allow POST requests as well for manual triggering
  return GET(req)
}
