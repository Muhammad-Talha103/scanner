import { client } from "@/sanity/lib/client"
import { isPremiumExpired } from "./premium-calculation"

interface PremiumUser {
  _id: string
  email: string
  name?: string
  payments: any[]
  premiumStart: string
  premiumEnd: string
  createdAt: string
}

/**
 * Move expired premium users to the premium_user_ends schema
 */
export async function moveExpiredPremiumUsers(): Promise<{
  moved: number
  errors: string[]
}> {
  const errors: string[] = []
  let movedCount = 0

  try {
    console.log("[Sanity Admin] Starting expired user migration...")

    // Fetch all premium users
    const premiumUsers: PremiumUser[] = await client.fetch(`*[_type == "premiumUser"] | order(_createdAt desc)`)

    console.log(`[Sanity Admin] Found ${premiumUsers.length} premium users`)

    for (const user of premiumUsers) {
      try {
        if (isPremiumExpired(user.premiumEnd)) {
          console.log(`[Sanity Admin] Moving expired user: ${user.email}`)

          // Create expired user document
          const expiredUserDoc = {
            _type: "premium_user_ends",
            email: user.email,
            name: user.name,
            payments: user.payments,
            premiumStart: user.premiumStart,
            premiumEnd: user.premiumEnd,
            movedAt: new Date().toISOString(),
          }

          const created = await client.create(expiredUserDoc)
          console.log(`[Sanity Admin] Created expired user doc: ${created._id}`)

          // Delete original premium user
          await client.delete(user._id)
          console.log(`[Sanity Admin] Deleted premium user: ${user._id}`)

          movedCount++
        }
      } catch (err) {
        const errorMsg = `Error processing user ${user.email}: ${err instanceof Error ? err.message : String(err)}`
        console.error(`[Sanity Admin] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    console.log(`[Sanity Admin] Migration complete. Moved: ${movedCount}, Errors: ${errors.length}`)
    return { moved: movedCount, errors }
  } catch (err) {
    const errorMsg = `Critical error in migration: ${err instanceof Error ? err.message : String(err)}`
    console.error(`[Sanity Admin] ${errorMsg}`)
    errors.push(errorMsg)
    return { moved: movedCount, errors }
  }
}

/**
 * Get user by email from premium users
 */
export async function getPremiumUserByEmail(email: string): Promise<PremiumUser | null> {
  try {
    const user = await client.fetch(`*[_type == "premiumUser" && email == $email][0]`, { email })
    return user || null
  } catch (err) {
    console.error(`[Sanity Admin] Error fetching user ${email}:`, err)
    return null
  }
}

/**
 * Update premium user with new payment and dates
 */
export async function updatePremiumUser(
  userId: string,
  premiumStart: string,
  premiumEnd: string,
  newPayment: any,
): Promise<boolean> {
  try {
    await client
      .patch(userId)
      .setIfMissing({ payments: [] })
      .append("payments", [newPayment])
      .set({
        premiumStart,
        premiumEnd,
      })
      .commit()
    return true
  } catch (err) {
    console.error(`[Sanity Admin] Error updating user ${userId}:`, err)
    return false
  }
}

/**
 * Create new premium user
 */
export async function createPremiumUser(
  email: string,
  name: string | undefined,
  payments: any[],
  premiumStart: string,
  premiumEnd: string,
): Promise<string | null> {
  try {
    const doc = await client.create({
      _type: "premiumUser",
      email,
      name,
      payments,
      premiumStart,
      premiumEnd,
      createdAt: new Date().toISOString(),
    })
    return doc._id
  } catch (err) {
    console.error(`[Sanity Admin] Error creating user ${email}:`, err)
    return null
  }
}
