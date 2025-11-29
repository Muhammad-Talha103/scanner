"use server"

import { client } from "@/sanity/lib/client"

interface PremiumUser {
  _id: string
  email: string
  name?: string
  payments?: unknown[]
  premiumStart?: string
  premiumEnd?: string
}

export async function movePremiumToEnds(email: string) {
  try {
    // Fetch the premium user immediately
    const user: PremiumUser = await client.fetch(`*[_type == "premiumUser" && email == $email][0]`, { email })

    if (!user) return { moved: false, reason: "User not found" }

    // Verify premium has actually expired
    const now = Date.now()
    const end = new Date(user.premiumEnd!).getTime()

    if (now < end) {
      return { moved: false, reason: "Premium still active" }
    }

    // Create unique ID for premium_ends record
    const docId = `${user.email}-${new Date(user.premiumEnd!).getTime()}`

    // Check if already moved to prevent duplicates
    const alreadyMoved = await client.fetch(`*[_type == "premium_ends" && _id == $id][0]`, { id: docId })

    if (!alreadyMoved) {
      // Create premium_ends record with all data
      await client.create({
        _id: docId,
        _type: "premium_ends",
        name: user.name,
        email: user.email,
        payments: user.payments || [],
        premiumStart: user.premiumStart,
        premiumEnd: user.premiumEnd,
        movedAt: new Date().toISOString(),
      })
    }

    // Delete from premiumUser immediately
    await client.delete(user._id)

    return { moved: true, email: user.email }
  } catch (error) {
    console.error("[v0] Error moving premium user to ends:", error)
    return { moved: false, error: "Failed to move user" }
  }
}
