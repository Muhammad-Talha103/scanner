/**
 * Calculate premium period based on EUR amount paid
 * 1.19€ → 1 month + ~5 days
 * 1.5€ → 1 month + ~15 days
 * Formula: Full months + fractional month converted to days (30 days/month)
 */
export function calculatePremiumPeriod(amountCents: number): {
  months: number
  days: number
  totalDays: number
} {
  // Convert cents to euros
  const euros = amountCents / 100

  // Calculate whole months (1 euro = 1 month)
  const wholeMonths = Math.floor(euros)

  // Get fractional part and convert to days
  const fractionalPart = euros - wholeMonths
  const fractionalDays = Math.round(fractionalPart * 30)

  const totalDays = 2

  return {
    months: wholeMonths,
    days: fractionalDays,
    totalDays,
  }
}

/**
 * Calculate premium end date based on start date and amount paid
 */
export function calculatePremiumEndDate(startDate: Date, amountCents: number): Date {
  const { totalDays } = calculatePremiumPeriod(amountCents)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + totalDays)
  return endDate
}

/**
 * Check if premium has expired
 */
export function isPremiumExpired(premiumEndDate: string): boolean {
  return new Date() > new Date(premiumEndDate)
}

/**
 * Format premium period for display
 */
export function formatPremiumPeriod(amountCents: number): string {
  const { months, days } = calculatePremiumPeriod(amountCents)
  const parts = []
  if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`)
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`)
  return parts.join(" + ") || "0 days"
}
