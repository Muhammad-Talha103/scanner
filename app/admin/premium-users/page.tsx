"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@sanity/client";
import {
  RefreshCw,
  Search,
  ChevronDown,
  CreditCard,
  Calendar,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { client } from "@/sanity/lib/client";

// ============================================================================
// TYPES
// ============================================================================

interface BillingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface Card {
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
}

interface Metadata {
  key?: string;
  value?: string;
}

interface LineItem {
  id?: string;
  description?: string;
  price?: string;
  product?: string;
  quantity?: number;
  amount_total?: number;
  currency?: string;
}

interface Payment {
  _key: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  amount_total?: number;
  currency?: string;
  status?: string;
  payment_method_type?: string;
  card?: Card;
  billing_address?: BillingAddress;
  metadata?: Metadata;
  lineItems?: LineItem[];
  createdAt?: string;
}

interface PremiumUser {
  _id: string;
  name?: string;
  email: string;
  payments?: Payment[];
  premiumStart?: string;
  premiumEnd?: string;
  createdAt?: string;
}

// ============================================================================
// SANITY CLIENT SETUP
// ============================================================================


const PREMIUM_USERS_QUERY = `*[_type == "premiumUser"]{
  _id,
  name,
  email,
  payments[]{
    _key,
    stripeSessionId,
    stripePaymentIntentId,
    stripeChargeId,
    amount_total,
    currency,
    status,
    payment_method_type,
    card{
      brand,
      last4,
      exp_month,
      exp_year
    },
    billing_address{
      line1,
      line2,
      city,
      state,
      postal_code,
      country
    },
    metadata{
      key,
      value
    },
    lineItems[]{
      id,
      description,
      price,
      product,
      quantity,
      amount_total,
      currency
    },
    createdAt
  },
  premiumStart,
  premiumEnd,
  createdAt
} | order(premiumStart desc)`;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (amount?: number, currency?: string): string => {
  if (amount === undefined || amount === null) return "N/A";
  const amountInDollars = amount / 100; // Stripe amounts are in cents
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency?.toUpperCase() || "USD",
  }).format(amountInDollars);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const getInitials = (name?: string, email?: string): string => {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.slice(0, 2).toUpperCase() || "??";
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PremiumUsersPage() {
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "premiumStart-desc" | "premiumStart-asc" | "createdAt-desc"
  >("premiumStart-desc");

  const debouncedSearch = useDebounce(searchQuery, 250);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.fetch<PremiumUser[]>(PREMIUM_USERS_QUERY);
      setUsers(data);
    } catch (err) {
      console.error("Error fetching premium users:", err);
      setError("Failed to load premium users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUser = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, userId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleUser(userId);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "premiumStart-desc") {
        return (b.premiumStart || "").localeCompare(a.premiumStart || "");
      } else if (sortBy === "premiumStart-asc") {
        return (a.premiumStart || "").localeCompare(b.premiumStart || "");
      } else {
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      }
    });

    return sorted;
  }, [users, debouncedSearch, sortBy]);

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className="bg-yellow-200 text-gray-900 rounded px-0.5"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Premium Users
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {loading ? (
                  "Loading..."
                ) : (
                  <>
                    Total: <span className="font-semibold">{users.length}</span>{" "}
                    premium {users.length === 1 ? "user" : "users"}
                  </>
                )}
              </p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              aria-label="Reload premium users"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              <span className="font-medium">Reload</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loading && !error && users.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="search" className="sr-only">
                Search by name or email
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>

            <div className="sm:w-64">
              <label htmlFor="sort" className="sr-only">
                Sort by
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "premiumStart-desc" | "premiumStart-asc" | "createdAt-desc")}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="premiumStart-desc">
                  Premium Start (Newest)
                </option>
                <option value="premiumStart-asc">Premium Start (Oldest)</option>
                <option value="createdAt-desc">Created Date (Newest)</option>
              </select>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={fetchUsers}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              No Premium Users Yet
            </h2>
            <p className="text-slate-600">
              Premium users will appear here once they subscribe.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          users.length > 0 &&
          filteredAndSortedUsers.length === 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                No Results Found
              </h2>
              <p className="text-slate-600">Try adjusting your search query.</p>
            </div>
          )}

        {!loading && !error && filteredAndSortedUsers.length > 0 && (
          <ul className="space-y-4" role="list">
            {filteredAndSortedUsers.map((user) => {
              const isExpanded = expandedUsers.has(user._id);
              return (
                <li
                  key={user._id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleUser(user._id)}
                    onKeyDown={(e) => handleKeyDown(e, user._id)}
                    aria-expanded={isExpanded}
                    aria-controls={`user-details-${user._id}`}
                    className="flex items-center gap-4 p-4 sm:p-6 cursor-pointer hover:bg-slate-50 rounded-2xl transition-colors min-h-[72px]"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {getInitials(user.name, user.email)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {highlightText(user.email, debouncedSearch)}
                      </p>
                      {user.name && (
                        <p className="text-sm text-slate-600 truncate">
                          {highlightText(user.name, debouncedSearch)}
                        </p>
                      )}
                    </div>

                    {user.payments && user.payments.length > 0 && (
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full">
                        <CreditCard
                          className="w-4 h-4 text-slate-600"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          {user.payments.length}
                        </span>
                      </div>
                    )}

                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </div>

                  <div
                    id={`user-details-${user._id}`}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded
                        ? "max-h-[5000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-4 sm:px-6 pb-6 pt-2 space-y-6 border-t border-slate-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        {user.name && (
                          <div className="flex items-start gap-3">
                            <User
                              className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0"
                              aria-hidden="true"
                            />
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Name
                              </p>
                              <p className="text-sm text-slate-900 mt-1">
                                {user.name}
                              </p>
                            </div>
                          </div>
                        )}

                        {user.premiumStart && (
                          <div className="flex items-start gap-3">
                            <Calendar
                              className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0"
                              aria-hidden="true"
                            />
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Premium Period
                              </p>
                              <p className="text-sm text-slate-900 mt-1">
                                {formatDate(user.premiumStart)}
                                {user.premiumEnd && (
                                  <>
                                    <br />
                                    <span className="text-slate-600">
                                      to {formatDate(user.premiumEnd)}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {user.createdAt && (
                          <div className="flex items-start gap-3">
                            <Calendar
                              className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0"
                              aria-hidden="true"
                            />
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Account Created
                              </p>
                              <p className="text-sm text-slate-900 mt-1">
                                {formatDate(user.createdAt)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {user.payments && user.payments.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <CreditCard
                              className="w-5 h-5"
                              aria-hidden="true"
                            />
                            Payment History ({user.payments.length})
                          </h3>

                          <div className="space-y-4">
                            {user.payments.map((payment) => (
                              <div
                                key={payment._key}
                                className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                  <div>
                                    <p className="text-2xl font-bold text-slate-900">
                                      {formatCurrency(
                                        payment.amount_total,
                                        payment.currency
                                      )}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      {payment.status && (
                                        <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            payment.status === "succeeded" ||
                                            payment.status === "paid"
                                              ? "bg-green-100 text-green-800"
                                              : payment.status === "pending"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {payment.status}
                                        </span>
                                      )}
                                      {payment.payment_method_type && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                                          {payment.payment_method_type}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {payment.createdAt && (
                                    <p className="text-sm text-slate-600">
                                      {formatDate(payment.createdAt)}
                                    </p>
                                  )}
                                </div>

                                {(payment.stripeSessionId ||
                                  payment.stripePaymentIntentId ||
                                  payment.stripeChargeId) && (
                                  <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                      Stripe IDs
                                    </p>
                                    <div className="space-y-1.5 text-xs">
                                      {payment.stripeSessionId && (
                                        <div className="flex items-start gap-2">
                                          <span className="text-slate-600 font-medium min-w-[80px]">
                                            Session:
                                          </span>
                                          <code className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded font-mono break-all">
                                            {payment.stripeSessionId}
                                          </code>
                                        </div>
                                      )}
                                      {payment.stripePaymentIntentId && (
                                        <div className="flex items-start gap-2">
                                          <span className="text-slate-600 font-medium min-w-[80px]">
                                            Intent:
                                          </span>
                                          <code className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded font-mono break-all">
                                            {payment.stripePaymentIntentId}
                                          </code>
                                        </div>
                                      )}
                                      {payment.stripeChargeId && (
                                        <div className="flex items-start gap-2">
                                          <span className="text-slate-600 font-medium min-w-[80px]">
                                            Charge:
                                          </span>
                                          <code className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded font-mono break-all">
                                            {payment.stripeChargeId}
                                          </code>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {payment.card && (
                                  <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-3">
                                      <CreditCard
                                        className="w-5 h-5 text-slate-600"
                                        aria-hidden="true"
                                      />
                                      <div>
                                        <p className="text-sm font-medium text-slate-900">
                                          {payment.card.brand?.toUpperCase() ||
                                            "Card"}{" "}
                                          •••• {payment.card.last4}
                                        </p>
                                        {payment.card.exp_month &&
                                          payment.card.exp_year && (
                                            <p className="text-xs text-slate-600">
                                              Expires {payment.card.exp_month}/
                                              {payment.card.exp_year}
                                            </p>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {payment.billing_address && (
                                  <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
                                    <div className="flex items-start gap-3">
                                      <MapPin
                                        className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0"
                                        aria-hidden="true"
                                      />
                                      <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                          Billing Address
                                        </p>
                                        <div className="text-sm text-slate-900 space-y-0.5">
                                          {payment.billing_address.line1 && (
                                            <p>
                                              {payment.billing_address.line1}
                                            </p>
                                          )}
                                          {payment.billing_address.line2 && (
                                            <p>
                                              {payment.billing_address.line2}
                                            </p>
                                          )}
                                          <p>
                                            {[
                                              payment.billing_address.city,
                                              payment.billing_address.state,
                                              payment.billing_address
                                                .postal_code,
                                            ]
                                              .filter(Boolean)
                                              .join(", ")}
                                          </p>
                                          {payment.billing_address.country && (
                                            <p className="font-medium">
                                              {payment.billing_address.country}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                
                                {payment.lineItems &&
                                  payment.lineItems.length > 0 && (
                                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Package
                                          className="w-5 h-5 text-slate-600"
                                          aria-hidden="true"
                                        />
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                          Items ({payment.lineItems.length})
                                        </p>
                                      </div>
                                      <div className="space-y-3">
                                        {payment.lineItems.map((item, idx) => (
                                          <div
                                            key={item.id || idx}
                                            className="pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                                          >
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                              <div className="flex-1 min-w-0">
                                                <p className="text-slate-900 font-medium text-sm">
                                                  {item.description || "Item"}
                                                </p>
                                                {item.quantity && (
                                                  <p className="text-slate-600 text-xs mt-0.5">
                                                    Qty: {item.quantity}
                                                  </p>
                                                )}
                                              </div>
                                              <p className="text-slate-900 font-semibold text-sm whitespace-nowrap">
                                                {formatCurrency(
                                                  item.amount_total,
                                                  item.currency
                                                )}
                                              </p>
                                            </div>

                                            
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!user.payments || user.payments.length === 0) && (
                        <div className="text-center py-8">
                          <CreditCard
                            className="w-12 h-12 text-slate-300 mx-auto mb-3"
                            aria-hidden="true"
                          />
                          <p className="text-sm text-slate-600">
                            No payment history available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
