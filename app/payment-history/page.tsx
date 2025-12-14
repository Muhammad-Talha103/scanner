"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Filter,
  DollarSign,
  X,
  Search,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { client } from "@/sanity/lib/client";
import Link from "next/link";
import { useTranslation } from "react-i18next";

type Payment = {
  _id: string;
  createdAt: string;
  cardHolderName: string;
  cardType: string;
  last4: string;
  amount: number;
  currency: string;
  receiptUrl: string;
};

export default function PaymentHistoryPage() {
  const userInfo = useSelector((state: RootState) => state.user.userInfo);
  const userEmail = userInfo?.email;
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cardType, setCardType] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-md text-center border">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {t("payment_history.loginPrompt.title")}
          </h2>
          <p className="text-slate-500 text-sm">
            {t("payment_history.loginPrompt.subtitle")}
          </p>
        </div>
      </div>
    );
  }

  // ---------------- FETCH SANITY DATA ----------------
  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      const query = `
        *[_type == "paymentRecord" && email == $email] | order(createdAt desc) {
          _id,
          createdAt,
          cardHolderName,
          cardType,
          last4,
          amount,
          currency,
          receiptUrl
        }
      `;
      const data = await client.fetch(query, { email: userEmail });
      setPayments(data);
      setIsLoading(false);
    };
    fetchPayments();
  }, [userEmail]);

  // Filter payments based on all criteria
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const paymentDate = new Date(payment.createdAt);

      // Date range filter
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (paymentDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (paymentDate > end) return false;
      }

      // Card type filter
      if (
        cardType &&
        payment.cardType.toLowerCase() !== cardType.toLowerCase()
      ) {
        return false;
      }

      const amountInDollars = payment.amount / 100;
      if (minAmount && amountInDollars < parseFloat(minAmount)) {
        return false;
      }
      if (maxAmount && amountInDollars > parseFloat(maxAmount)) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = payment.cardHolderName
          .toLowerCase()
          .includes(query);
        const matchesLast4 = payment.last4.includes(query);
        if (!matchesName && !matchesLast4) return false;
      }

      return true;
    });
  }, [
    payments,
    startDate,
    endDate,
    cardType,
    minAmount,
    maxAmount,
    searchQuery,
  ]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return filteredPayments.reduce(
      (sum, payment) => sum + payment.amount / 100,
      0
    );
  }, [filteredPayments]);

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setCardType("");
    setMinAmount("");
    setMaxAmount("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    startDate || endDate || cardType || minAmount || maxAmount || searchQuery;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCardIcon = (type: string) => {
    return <CreditCard className="w-4 h-4" />;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(t("payment_history.pdf.title"), 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`${t("payment_history.pdf.userEmail")}: ${userEmail}`, 14, 28);

    const generatedDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`${t("payment_history.pdf.generated")}: ${generatedDate}`, 14, 34);

    const tableData = filteredPayments.map((payment) => [
      formatDate(payment.createdAt),
      payment.cardHolderName,
      payment.cardType,
      `•••• ${payment.last4}`,
      `$ ${(payment.amount / 100).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 42,
      head: [
        [
          t("payment_history.paymentTable.dateTime"),
          t("payment_history.paymentTable.cardHolder"),
          t("payment_history.paymentTable.cardType"),
          t("payment_history.paymentTable.last4Digits"),
          t("payment_history.paymentTable.amount"),
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25, fontStyle: "bold", textColor: [37, 99, 235] },
      },
      margin: { left: 14, right: 14 },
    });

    interface AutoTable {
      finalY: number;
    }

    const finalY =
      (doc as jsPDF & { lastAutoTable?: AutoTable }).lastAutoTable?.finalY ??
      42;

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 14, finalY + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Payments: ${filteredPayments.length}`, 14, finalY + 16);

    doc.save(`payment-history-${new Date().toISOString().split("T")[0]}.pdf`);
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">
              {t("payment_history.backButton")}
            </span>
          </button>

          <div className="flex flex-col gap-2">
            <div className="text-sm text-slate-600">
              <span className="font-medium">
                {t("payment_history.userEmailLabel")}
              </span>{" "}
              <span className="text-blue-600 font-medium">{userEmail}</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 text-balance">
              {t("payment_history.paymentHistoryTitle")}
            </h1>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilterModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-400 text-slate-700 rounded-lg transition-all shadow-sm"
            >
              <Filter className="w-5 h-5 text-blue-600" />
              <span className="font-medium">
                {t("payment_history.filters.button")}
              </span>
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                  {
                    [
                      startDate,
                      endDate,
                      cardType,
                      minAmount,
                      maxAmount,
                      searchQuery,
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </button>

            <button
              onClick={generatePDF}
              disabled={filteredPayments.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-sm font-medium"
            >
              <Download className="w-5 h-5" />
              <span>{t("payment_history.pdfDownloadButton")}</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="font-medium">
                {t("payment_history.clearAllButton")}
              </span>
            </button>
          )}
        </div>

        {showFilterModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Filter className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Filter Payments
                  </h2>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Date Range Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                      {t("payment_history.filters.sections.dateRange")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {t("payment_history.filters.sections.fromDate")}
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          max={endDate || undefined}
                          className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {t("payment_history.filters.sections.toDate")}
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate || undefined}
                          className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Type Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                      {t("payment_history.filters.sections.cardType")}
                    </h3>
                    <select
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="">
                        {" "}
                        {t("payment_history.filters.cardTypeAll")}
                      </option>
                      <option value="Visa">
                        {t("payment_history.filters.cardTypeVisa")}
                      </option>
                      <option value="Mastercard">
                        {t("payment_history.filters.cardTypeMastercard")}
                      </option>
                      <option value="Amex">
                        {t("payment_history.filters.cardTypeAmex")}
                      </option>
                      <option value="Other">
                        {t("payment_history.filters.cardTypeOther")}
                      </option>
                    </select>
                  </div>

                  {/* Amount Range Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                      {t("payment_history.filters.sections.amountRange")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {t("payment_history.filters.sections.minAmount")}
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                            className="w-full pl-8 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {t("payment_history.filters.sections.maxAmount")}
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="999.99"
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                            className="w-full pl-8 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                      {t("payment_history.filters.sections.search")}
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={t(
                          "payment_history.filters.sections.searchPlaceholder"
                        )}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                >
                  {t("payment_history.filters.resetButton")}
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                >
                  {t("payment_history.filters.applyButton")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment History Table - Desktop */}
        <div className="hidden md:block bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t("payment_history.paymentCards.dateTime")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t("payment_history.paymentCards.cardHolder")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t("payment_history.paymentCards.cardType")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t("payment_history.paymentCards.last4Digits")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t("payment_history.paymentCards.amount")}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    {t("payment_history.paymentTable.receipt")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  // Loading state
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-8 bg-slate-200 rounded w-24"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredPayments.length === 0 ? (
                  // Empty state
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-500 font-medium">
                          {t("payment_history.paymentCards.noData")}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                          {t("payment_history.paymentCards.tryAdjustFilters")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data rows
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-[16px] text-slate-900 font-bold">
                        {payment.cardHolderName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getCardIcon(payment.cardType)}
                          <span className="text-sm text-slate-700 uppercase font-semibold">
                            {payment.cardType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                        •••• {payment.last4}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                        {" "}
                        ${(payment.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {payment.receiptUrl ? (
                          <Link
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors group border border-blue-200"
                          >
                            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            {t("payment_history.paymentCards.view")}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic text-sm">
                            {t("payment_history.paymentCards.noReceipt")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History Cards - Mobile */}
        <div className="md:hidden space-y-4 animate-fade-in">
          {isLoading ? (
            // Loading state
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border-2 border-slate-200 rounded-xl p-4 animate-pulse"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-32"></div>
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-4 bg-slate-200 rounded w-28"></div>
                </div>
              </div>
            ))
          ) : filteredPayments.length === 0 ? (
            // Empty state
            <div className="bg-white border-2 border-slate-200 rounded-xl p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                {t("payment_history.paymentCards.noData")}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {t("payment_history.paymentCards.tryAdjustFilters")}
              </p>
            </div>
          ) : (
            // Data cards
            filteredPayments.map((payment) => (
              <div
                key={payment._id}
                className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">
                        {t("payment_history.paymentCards.dateTime")}
                      </div>
                      <div className="text-sm text-slate-700">
                        {formatDate(payment.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium mb-1">
                        {t("payment_history.paymentCards.amount")}
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {" "}
                        ${(payment.amount / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">
                        {t("payment_history.paymentCards.cardHolder")}
                      </div>
                      <div className="text-[16px] text-slate-900 font-semibold">
                        {payment.cardHolderName}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">
                        {t("payment_history.paymentCards.cardType")}
                      </div>
                      <div className="flex items-center gap-2">
                        {getCardIcon(payment.cardType)}
                        <span className="text-sm text-slate-700 font-semibold uppercase">
                          {payment.cardType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-1">
                        {t("payment_history.paymentCards.last4Digits")}
                      </div>
                      <div className="text-sm text-slate-700 font-mono">
                        •••• {payment.last4}
                      </div>
                    </div>
                    {payment.receiptUrl ? (
                      <Link
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors group border border-blue-200"
                      >
                        <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        {t("payment_history.paymentCards.view")}
                      </Link>
                    ) : (
                      <span className="text-slate-400 italic text-sm">
                        {t("payment_history.paymentCards.noReceipt")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Section */}
        <div className="mt-8 bg-linear-to-br from-blue-50 to-slate-50 border-2 border-blue-200 rounded-xl p-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-slate-600 font-medium">
                  {t("payment_history.summary.totalAmountPaid")}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t("payment_history.summary.transactions")}{" "}
                  <span className="text-sm font-semibold">
                    ({filteredPayments.length})
                  </span>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 transition-all duration-300">
              ${totalAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
