"use client"

import type React from "react"

import { client } from "@/sanity/lib/client"
import { useState, useEffect, useMemo } from "react"
import { RefreshCw, Search, ChevronDown, Calendar, CreditCard, AlertCircle, Users } from "lucide-react"


// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

interface Payment {
  createdAt?: string
  amount?: number
  currency?: string
  status?: string
  [key: string]: any // Allow other unstructured fields
}

interface ExpiredUser {
  _id: string
  name?: string
  email: string
  payments?: Payment[]
  premiumStart?: string
  premiumEnd?: string
  movedAt?: string
}

// ============================================================================
// GROQ QUERY
// ============================================================================

const EXPIRED_USERS_QUERY = `
  *[_type == "premium_user_ends"]{
    _id,
    name,
    email,
    payments[]{
      ...,
      createdAt,
      amount,
      currency,
      status
    },
    premiumStart,
    premiumEnd,
    movedAt
  } | order(movedAt desc)
`

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A"
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}

const formatCurrency = (amount?: number, currency?: string): string => {
  if (amount === undefined || amount === null) return "N/A"
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase() || "USD",
    }).format(amount / 100) // Assuming amount is in cents
  } catch {
    return `${amount} ${currency || "USD"}`
  }
}

const highlightText = (text: string, query: string) => {
  if (!query.trim()) return <>{text}</>

  const parts = text.split(new RegExp(`(${query})`, "gi"))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

// ============================================================================
// USER CARD COMPONENT (Mobile Collapsible / Desktop Always Expanded)
// ============================================================================

interface UserCardProps {
  user: ExpiredUser
  searchQuery: string
  isDesktop: boolean
}

const UserCard = ({ user, searchQuery, isDesktop }: UserCardProps) => {
  const [isExpanded, setIsExpanded] = useState(isDesktop) // Desktop always expanded

  // On desktop, always keep expanded
  useEffect(() => {
    if (isDesktop) {
      setIsExpanded(true)
    }
  }, [isDesktop])

  const toggleExpand = () => {
    if (!isDesktop) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDesktop && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault()
      toggleExpand()
    }
  }

  return (
    <li className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header Row - Clickable on mobile, static on desktop */}
      <div
        className={`
          flex items-center justify-between p-4 md:p-6
          ${!isDesktop ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100" : ""}
          transition-colors duration-150
        `}
        onClick={!isDesktop ? toggleExpand : undefined}
        onKeyDown={!isDesktop ? handleKeyDown : undefined}
        tabIndex={!isDesktop ? 0 : undefined}
        role={!isDesktop ? "button" : undefined}
        aria-expanded={!isDesktop ? isExpanded : undefined}
        aria-controls={!isDesktop ? `user-details-${user._id}` : undefined}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user.email?.[0]?.toUpperCase() || "?"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate">{highlightText(user.email, searchQuery)}</p>
            {/* Show name on desktop or when expanded on mobile */}
            {(isDesktop || isExpanded) && user.name && (
              <p className="text-sm text-gray-600 truncate">{highlightText(user.name, searchQuery)}</p>
            )}
          </div>
        </div>

        {/* Chevron - only show on mobile */}
        {!isDesktop && (
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {/* Expanded Details */}
      <div
        id={`user-details-${user._id}`}
        className={`
          ${isDesktop ? "block" : ""}
          ${!isDesktop && !isExpanded ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"}
          transition-all duration-300 ease-in-out overflow-hidden
        `}
      >
        <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-4 border-t border-gray-100">
          {/* User Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {/* Name */}
            {user.name && (
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                  <p className="text-sm font-medium text-gray-900 break-words">{user.name}</p>
                </div>
              </div>
            )}

            {/* Premium Start */}
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Premium Start</p>
                <p className="text-sm text-gray-700 break-words">{formatDate(user.premiumStart)}</p>
              </div>
            </div>

            {/* Premium End */}
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Premium End</p>
                <p className="text-sm text-gray-700 break-words">{formatDate(user.premiumEnd)}</p>
              </div>
            </div>

            {/* Moved At */}
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Moved to Expired</p>
                <p className="text-sm font-medium text-red-600 break-words">{formatDate(user.movedAt)}</p>
              </div>
            </div>
          </div>

          {/* Payments Section */}
          {user.payments && user.payments.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-900">Payment History ({user.payments.length})</h4>
              </div>

              <div className="space-y-3">
                {user.payments.map((payment, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      {payment.amount !== undefined && (
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </p>
                        </div>
                      )}

                      {payment.status && (
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <span
                            className={`
                              inline-block px-2 py-0.5 rounded-full text-xs font-medium
                              ${
                                payment.status === "succeeded" || payment.status === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : payment.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }
                            `}
                          >
                            {payment.status}
                          </span>
                        </div>
                      )}

                      {payment.createdAt && (
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="text-sm text-gray-700">{formatDate(payment.createdAt)}</p>
                        </div>
                      )}
                    </div>

                    
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ExpiredPremiumUsersPage() {
  const [users, setUsers] = useState<ExpiredUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortBy, setSortBy] = useState<"movedAt-desc" | "movedAt-asc" | "premiumEnd-desc" | "premiumEnd-asc">(
    "movedAt-desc",
  )
  const [isDesktop, setIsDesktop] = useState(false)

  // Detect desktop viewport
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768) // md breakpoint
    }

    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch users from Sanity
  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const data = await client.fetch<ExpiredUser[]>(EXPIRED_USERS_QUERY)
      setUsers(data || [])
    } catch (err) {
      console.error("Error fetching expired users:", err)
      setError("Failed to load expired premium users. Please try again.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users

    // Apply search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (user) => user.email?.toLowerCase().includes(query) || user.name?.toLowerCase().includes(query),
      )
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "movedAt-desc") {
        return new Date(b.movedAt || 0).getTime() - new Date(a.movedAt || 0).getTime()
      } else if (sortBy === "movedAt-asc") {
        return new Date(a.movedAt || 0).getTime() - new Date(b.movedAt || 0).getTime()
      } else if (sortBy === "premiumEnd-desc") {
        return new Date(b.premiumEnd || 0).getTime() - new Date(a.premiumEnd || 0).getTime()
      } else {
        return new Date(a.premiumEnd || 0).getTime() - new Date(b.premiumEnd || 0).getTime()
      }
    })

    return sorted
  }, [users, debouncedSearch, sortBy])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-xl w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded-xl w-full"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Expired Premium Users</h1>
              <p className="text-gray-600">
                Total: <span className="font-semibold text-gray-900">{users.length}</span> expired user
                {users.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Reload Button */}
            <button
              onClick={() => fetchUsers(true)}
              disabled={isRefreshing}
              className="
                flex items-center gap-2 px-4 py-2 bg-white rounded-xl
                shadow-sm hover:shadow-md transition-all duration-200
                text-gray-700 font-medium disabled:opacity-50
                disabled:cursor-not-allowed hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              "
              aria-label="Reload expired users"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Reload</span>
            </button>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2.5 bg-white rounded-xl
                  border border-gray-200 focus:border-red-400 focus:ring-2
                  focus:ring-red-200 outline-none transition-all duration-200
                  text-gray-900 placeholder-gray-400
                "
                aria-label="Search expired users"
              />
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="
                px-4 py-2.5 bg-white rounded-xl border border-gray-200
                focus:border-red-400 focus:ring-2 focus:ring-red-200
                outline-none transition-all duration-200 text-gray-700
                font-medium cursor-pointer hover:bg-gray-50
              "
              aria-label="Sort expired users"
            >
              <option value="movedAt-desc">Moved: Newest First</option>
              <option value="movedAt-asc">Moved: Oldest First</option>
              <option value="premiumEnd-desc">Premium End: Latest First</option>
              <option value="premiumEnd-asc">Premium End: Earliest First</option>
            </select>

            {/* Clear Filter Button */}
            {(searchQuery || sortBy !== "movedAt-desc") && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSortBy("movedAt-desc")
                }}
                className="
                  px-4 py-2.5 bg-white rounded-xl border border-gray-200
                  hover:bg-gray-50 transition-all duration-200 text-gray-700
                  font-medium focus:outline-none focus:ring-2 focus:ring-red-500
                  focus:ring-offset-2 whitespace-nowrap
                "
              >
                Clear Filters
              </button>
            )}
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={() => fetchUsers()}
                className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && filteredAndSortedUsers.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No expired premium users found</h3>
            <p className="text-gray-600">
              {debouncedSearch
                ? "Try adjusting your search query."
                : "There are no expired premium users at the moment."}
            </p>
          </div>
        )}

        {/* Users List */}
        {!error && filteredAndSortedUsers.length > 0 && (
          <ul className="space-y-4" role="list">
            {filteredAndSortedUsers.map((user) => (
              <UserCard key={user._id} user={user} searchQuery={debouncedSearch} isDesktop={isDesktop} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
