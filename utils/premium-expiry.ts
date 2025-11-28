import { client } from "@/sanity/lib/client"

export interface ExpiredUser {
  id: string
  email: string
  name?: string
  premiumStart: string
  premiumEnd: string
  payments: any[]
  createdAt: string
}

/**
 * Fetch all users whose premium has expired
 */
export async function fetchExpiredUsers(): Promise<ExpiredUser[]> {
  const now = new Date().toISOString()

  const expiredUsers = await client.fetch(
    `*[_type == "premiumUser" && premiumEnd < $now] {
      _id,
      email,
      name,
      premiumStart,
      premiumEnd,
      payments,
      createdAt
    }`,
    { now },
  )

  return expiredUsers.map((user: any) => ({
    id: user._id,
    ...user,
  }))
}

/**
 * Move expired user from premiumUser to premium_user_ends
 * This happens in real-time as soon as expiry is detected
 */
export async function moveExpiredUser(user: ExpiredUser): Promise<void> {
  const movedAt = new Date().toISOString()

  try {
    // Create document in premium_user_ends
    const archivedUser = await client.create({
      _type: "premium_user_ends",
      email: user.email,
      name: user.name,
      payments: user.payments,
      premiumStart: user.premiumStart,
      premiumEnd: user.premiumEnd,
      movedAt,
      createdAt: user.createdAt,
    })

    console.log("📦 Archived expired user to premium_user_ends:", user.email)

    // Delete from premiumUser
    await client.delete(user.id)

    console.log("🗑️ Deleted user from premiumUser:", user.email)
  } catch (err) {
    console.error("❌ Error moving expired user:", user.email, err)
    throw err
  }
}

/**
 * Process all expired users and move them to premium_user_ends
 * Called by cron job
 */
export async function processExpiredUsers(): Promise<{
  processed: number
  failed: number
}> {
  try {
    const expiredUsers = await fetchExpiredUsers()
    console.log(`⏰ Found ${expiredUsers.length} expired users to process`)

    let processed = 0
    let failed = 0

    for (const user of expiredUsers) {
      try {
        await moveExpiredUser(user)
        processed++
      } catch (err) {
        console.error("❌ Failed to process user:", user.email, err)
        failed++
      }
    }

    console.log(`✅ Expiry processing complete: ${processed} moved, ${failed} failed`)

    return { processed, failed }
  } catch (err) {
    console.error("❌ Critical error in processExpiredUsers:", err)
    throw err
  }
}
