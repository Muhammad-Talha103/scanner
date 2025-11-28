import { NextResponse } from "next/server"
import { processExpiredUsers } from "@/utils/premium-expiry"

/**
 * Manual trigger endpoint for testing premium expiry
 * Call this during testing to manually process expired users
 *
 * In production, the cron job handles this automatically every minute
 */
export async function GET() {
  try {
    console.log("[v0] 🧪 Manual trigger: Running premium expiry check...")
    const result = await processExpiredUsers()

    return NextResponse.json(
      {
        success: true,
        message: "Manual expiry check completed",
        result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (err) {
    console.error("[v0] Manual trigger failed:", err)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process expired users",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
