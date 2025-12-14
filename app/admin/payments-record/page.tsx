"use client"

import { useEffect, useState, useMemo } from "react"
import { FiFilter, FiDownload, FiX, FiExternalLink, FiCreditCard, FiDollarSign } from "react-icons/fi"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { client } from "@/sanity/lib/client"
import AdminAuthGuard from "../AdminAuthGuard"
import { useTranslation } from "react-i18next"

// Payment Record Type
interface PaymentRecord {
  _id: string
  createdAt: string
  email: string
  cardHolderName: string
  last4: string
  cardType: string
  amount: number
  currency: string
  receiptUrl?: string
}

// Filter State Type
interface FilterState {
  dateFrom: string
  dateTo: string
  cardType: string
  minAmount: string
  maxAmount: string
  emailSearch: string
  nameSearch: string
}

function AdminPaymentRecords() {
  const { t } = useTranslation()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: "",
    dateTo: "",
    cardType: "",
    minAmount: "",
    maxAmount: "",
    emailSearch: "",
    nameSearch: "",
  })

  // Fetch payment records from Sanity CMS
  useEffect(() => {
  const fetchPayments = async () => {
    try {
      const query = `
        *[_type == "paymentRecord"] | order(createdAt desc) {
          _id,
          createdAt,
          email,
          cardHolderName,
          last4,
          cardType,
          amount,
          currency,
          receiptUrl
        }
      `

      const result = await client.fetch(query)

      setPayments(Array.isArray(result) ? result : [])
    } catch (error) {
      console.error("Error fetching payments:", error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  fetchPayments()
}, [])


  // Filtered payments with memoization
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Date range filter
      if (filters.dateFrom) {
        const paymentDate = new Date(payment.createdAt)
        const fromDate = new Date(filters.dateFrom)
        if (paymentDate < fromDate) return false
      }
      if (filters.dateTo) {
        const paymentDate = new Date(payment.createdAt)
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999)
        if (paymentDate > toDate) return false
      }

      // Card type filter
      if (filters.cardType && payment.cardType !== filters.cardType) return false

      // Amount filters
      const amountInDollars = payment.amount / 100
      if (filters.minAmount && amountInDollars < Number.parseFloat(filters.minAmount)) return false
      if (filters.maxAmount && amountInDollars > Number.parseFloat(filters.maxAmount)) return false

      // Email search
      if (filters.emailSearch && !payment.email.toLowerCase().includes(filters.emailSearch.toLowerCase())) return false

      // Name search
      if (filters.nameSearch && !payment.cardHolderName.toLowerCase().includes(filters.nameSearch.toLowerCase()))
        return false

      return true
    })
  }, [payments, filters])

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, payment) => sum + payment.amount / 100, 0)
  }, [filteredPayments])

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      cardType: "",
      minAmount: "",
      maxAmount: "",
      emailSearch: "",
      nameSearch: "",
    })
  }

  interface AutoTableResult {
  finalY: number;
}

  // Download PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.text(t("adminPaymentRecords.pdf.title"), 14, 20)

    // Date
    const today = new Date().toISOString().split("T")[0]
    doc.setFontSize(10)
    doc.text(`${t("adminPaymentRecords.pdf.generatedLabel")} ${today}`, 14, 28)

    // Table data
    const tableData = filteredPayments.map((payment) => [
      new Date(payment.createdAt).toLocaleDateString(),
      payment.email,
      payment.cardHolderName,
      payment.cardType,
      `****${payment.last4}`,
      `$${(payment.amount / 100).toFixed(2)}`,
    ])

    // Generate table
    autoTable(doc, {
      startY: 35,
      head: [[
        t("adminPaymentRecords.pdf.paymentDate"), 
        t("adminPaymentRecords.pdf.email"), 
        t("adminPaymentRecords.pdf.cardHolderName"), 
         t("adminPaymentRecords.pdf.cardType"), 
        t("adminPaymentRecords.pdf.last4Digits"), 
        t("adminPaymentRecords.pdf.amount")
        ]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
    })

    // Total at bottom
const finalY =
  (doc as jsPDF & { lastAutoTable?: AutoTableResult }).lastAutoTable?.finalY
    ? (doc as jsPDF & { lastAutoTable: AutoTableResult }).lastAutoTable.finalY + 10
    : 45;
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`${t("adminPaymentRecords.pdf.totalAmountLabel")} $${totalAmount.toFixed(2)}`, 14, finalY)

    // Save
    doc.save(`admin-record-${today}.pdf`)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">{t("adminPaymentRecords.loadingMessage")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-balance text-3xl font-bold text-gray-900">{t("adminPaymentRecords.pageTitle")}</h1>
              <p className="mt-2 text-gray-600">{t("adminPaymentRecords.pageDescription")}</p>
              <p className="mt-1 text-sm text-gray-500">{t("adminPaymentRecords.totalPaymentsLabel")} {filteredPayments.length}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
              >
                <FiFilter />
                <span className="hidden sm:inline">{t("adminPaymentRecords.filterButtonShort")}</span>
                <span className="sm:hidden">{t("adminPaymentRecords.filterButtonShort")}</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md active:scale-95"
              >
                <FiDownload />
                <span className="hidden sm:inline">{t("adminPaymentRecords.downloadPDFButton")}</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Desktop Table View */}
        <div className="hidden overflow-hidden rounded-lg bg-white shadow-sm lg:block">
          <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("adminPaymentRecords.tableHeaders.paymentDate")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                     {t("adminPaymentRecords.tableHeaders.email")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                     {t("adminPaymentRecords.tableHeaders.cardHolderName")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                     {t("adminPaymentRecords.tableHeaders.cardType")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                         {t("adminPaymentRecords.tableHeaders.last4Digits")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("adminPaymentRecords.tableHeaders.amountUSD")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("adminPaymentRecords.tableHeaders.receipt")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredPayments.map((payment, index) => (
                  <tr
                    key={payment._id}
                    className="transition-colors hover:bg-blue-50"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{payment.email}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{payment.cardHolderName}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        <FiCreditCard className="h-3 w-3" />
                        {payment.cardType}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-900">****{payment.last4}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      ${(payment.amount / 100).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {payment.receiptUrl ? (
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 transition-colors hover:text-blue-800"
                        >
                          {t("adminPaymentRecords.view")} <FiExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">{t("adminPaymentRecords.noReceiptText")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="space-y-4 lg:hidden">
          {filteredPayments.map((payment, index) => (
            <div
              key={payment._id}
              className="animate-fade-in rounded-lg bg-white p-4 shadow-sm"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{payment.cardHolderName}</p>
                  <p className="text-xs text-gray-500">{payment.email}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  <FiCreditCard className="h-3 w-3" />
                  {payment.cardType}
                </span>
              </div>
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("adminPaymentRecords.mobileCardView.dateLabel")}</span>
                  <span className="text-gray-900">{formatDate(payment.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("adminPaymentRecords.mobileCardView.cardLabel")}</span>
                  <span className="font-mono text-gray-900">****{payment.last4}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("adminPaymentRecords.mobileCardView.amountLabel")}</span>
                  <span className="font-semibold text-gray-900">${(payment.amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("adminPaymentRecords.mobileCardView.receiptLabel")}</span>
                  {payment.receiptUrl ? (
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600"
                    >
                      {t("adminPaymentRecords.view")} <FiExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-gray-400">{t("adminPaymentRecords.noReceiptText")}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3">
                <FiDollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t("adminPaymentRecords.totalSummary.label")}</p>
                <p className="text-3xl font-bold text-blue-600">${totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{t("adminPaymentRecords.filterModal.title")}</h2>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Date Range */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700"> {t("adminPaymentRecords.filterModal.dateFrom")}</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t("adminPaymentRecords.filterModal.dateTo")}</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Card Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t("adminPaymentRecords.filterModal.cardType")}</label>
                  <select
                    value={filters.cardType}
                    onChange={(e) => setFilters({ ...filters, cardType: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t("adminPaymentRecords.filterModal.allTypesOption")}</option>
                    <option value="Visa">{t("adminPaymentRecords.filterModal.visaOption")}</option>
                    <option value="Mastercard">
                      {t("adminPaymentRecords.filterModal.mastercardOption")}
                    </option>
                    <option value="Amex">{t("adminPaymentRecords.filterModal.amexOption")}</option>
                    <option value="Other">{t("adminPaymentRecords.filterModal.otherOption")}</option>
                  </select>
                </div>

                {/* Email Search */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t("adminPaymentRecords.filterModal.emailSearch")}</label>
                  <input
                    type="text"
                    value={filters.emailSearch}
                    onChange={(e) => setFilters({ ...filters, emailSearch: e.target.value })}
                    placeholder="Search by email..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Amount Range */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t("adminPaymentRecords.filterModal.minAmount")}</label>
                  <input
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">{t("adminPaymentRecords.filterModal.maxAmount")}</label>
                  <input
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                    placeholder="10000.00"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Name Search */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700"> {t("adminPaymentRecords.filterModal.nameSearch")}</label>
                  <input
                    type="text"
                    value={filters.nameSearch}
                    onChange={(e) => setFilters({ ...filters, nameSearch: e.target.value })}
                    placeholder="Search by card holder name..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={handleResetFilters}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {t("adminPaymentRecords.filterModal.resetFiltersButton")}
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {t("adminPaymentRecords.filterModal.applyFiltersButton")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}



export default function Home() {
  return (
    <AdminAuthGuard>
      <AdminPaymentRecords />
    </AdminAuthGuard>
  );
}