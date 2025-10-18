"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"

export default function CheckoutSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<"loading" | "success" | "missing">("loading")
  const {t} = useTranslation()

  useEffect(() => {
    if (sessionId) {
      setTimeout(() => {
        setStatus("success")
      }, 1500)
    } else {
      setStatus("missing")
    }
  }, [sessionId])

  return (
    <AnimatePresence mode="wait">
      {status === "loading" && (
        <motion.main
          key="loading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100"
        >
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="inline-block mb-4"
            >
              <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("payment_success.loading.title")}</h1>
            <p className="text-gray-500">{t("payment_success.loading.message")}</p>
          </div>
        </motion.main>
      )}

      {status === "missing" && (
        <motion.main
          key="missing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100"
        >
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mb-4"
            >
              <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("payment_success.missing.title")}</h1>
            <p className="text-gray-500 mb-6">{t("payment_success.missing.message")}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.replace("/")}
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-full hover:bg-blue-700 transition-colors duration-200"
            >
             {t("payment_success.missing.button")}
            </motion.button>
          </div>
        </motion.main>
      )}

      {status === "success" && (
        <motion.main
          key="success"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100"
        >
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mb-4"
            >
              <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("payment_success.success.title")}</h1>
            <p className="text-gray-500 mb-6">
              {t("payment_success.success.message")}<strong>{t("payment_success.success.grew_scan_premium")}</strong>
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.replace("/")}
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-full hover:bg-blue-700 transition-colors duration-200"
            >
              {t("payment_success.success.button")}
            </motion.button>
          </div>
        </motion.main>
      )}
    </AnimatePresence>
  )
}