import { NextRequest, NextResponse } from "next/server"
import { getPremiumUserByEmail, moveExpiredPremiumUsers } from "@/lib/sanity-admin"
import { isPremiumExpired } from "@/lib/premium-calculation"

/**
 * API endpoint to check premium status for a user
 * Used by frontend to verify if user is still premium
 */

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await getPremiumUserByEmail(email)

    if (!user) {
      return NextResponse.json({
        isPremium: false,
        user: null,
      })
    }

    const isExpired = isPremiumExpired(user.premiumEnd)

    if (isExpired) {
      // Immediately move to expired users
      await moveExpiredPremiumUsers()
      return NextResponse.json({
        isPremium: false,
        message: "Premium period has expired",
      })
    }

    const totalPayment = user.payments.reduce((sum: number, p) => sum + (p.amount_total || 0), 0)

    return NextResponse.json({
      isPremium: true,
      user: {
        email: user.email,
        name: user.name,
        premiumStart: user.premiumStart,
        premiumEnd: user.premiumEnd,
        daysRemaining: Math.ceil((new Date(user.premiumEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        totalSpent: totalPayment / 100,
        paymentsCount: user.payments.length,
      },
    })
  } catch (err) {
    console.error("[Premium Check] Error:", err)
    return NextResponse.json({ error: "Failed to check premium status" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")

  if (!email) {
    return NextResponse.json({ error: "Email query parameter is required" }, { status: 400 })
  }

  // Reuse POST logic
  return POST(
    new NextRequest(req, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  )
}
