"use client"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { client } from "@/sanity/lib/client"

export default function UpgradePage() {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const userInfo = useSelector((state: RootState) => state.user.userInfo)
  const userEmail = userInfo?.email || ""

  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [loading, setLoading] = useState(true)


  // ✅ Fetch premium users from Sanity
  useEffect(() => {
    const fetchPremiumUsers = async () => {
      try {
        if (!userEmail) return

        // 🧠 Query to get all premium users
        const query = `*[_type == "premiumUser"]{email}`
        const data = await client.fetch(query)
        
        const found = data.some(
          (user: { email: string; type: string }) =>
            user.email === userEmail 
        )

        setIsPremiumUser(found)
      } catch (error) {
        console.error("Error fetching premium users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPremiumUsers()
  }, [userEmail])
  const stripeUrl =
    "https://buy.stripe.com/cNicN50Yq5DCfZB7oJ5ZC0u?locale=de&__embed_source=buy_btn"

  const features = t("upgrade.features.items", { returnObjects: true }) as {
    title: string
    description: string
    icon: string
  }[]

  const faqs = t("upgrade.faq.items", { returnObjects: true }) as {
    q: string
    a: string
  }[]

  const handleUpgradeClick = () => {
    setIsModalOpen(true)
  }

  const handleConfirmUpgrade = () => {
    setIsModalOpen(false)
    window.location.href =
      stripeUrl + `&prefilled_email=${encodeURIComponent(userEmail)}`
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }


   if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="text-center text-gray-600 text-lg animate-pulse">
          {t("upgrade.hero.loading")}
        </div>
      </main>
    )
  }

    // 🎉 Already Premium
  if (isPremiumUser) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-md">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">
            🎉 {t("upgrade.hero.premium_user") }
          </h1>
          <p className="text-gray-600 mb-6">
            {t("upgrade.hero.alreadyPremiumMessage")}
          </p>
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
          >
            {t("upgrade.hero.back")}
          </Link>
        </div>
      </main>
    )
  }


  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-blue-50 relative">
      {/* Back to Home */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("helpCenter.backToHome")}
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up">
            <div className="mb-6 inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
              <span className="mr-2">🎯</span>
              {t("upgrade.hero.offerBadge")}
            </div>

            <h1 className="mb-6 text-4xl font-bold sm:text-5xl lg:text-6xl">
              {t("upgrade.hero.title", { product: "GreweScanner" })}
            </h1>

            <p className="mb-8 text-xl text-gray-600 sm:text-2xl">
              {t("upgrade.hero.subtitle")}
            </p>

            <div className="mb-8 flex justify-center">
              <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {t("upgrade.hero.price")}
                  </div>
                  <div className="text-gray-500">{t("upgrade.hero.perMonth")}</div>
                </div>
              </div>
            </div>

            {/* Upgrade Button */}
            <button
              onClick={handleUpgradeClick}
              className="inline-flex items-center rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-blue-700"
            >
              {t("upgrade.hero.button")}
              <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{t("upgrade.features.title")}</h2>
            <p className="mt-4 text-lg text-gray-600">{t("upgrade.features.subtitle")}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-lg"
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-3xl font-bold sm:text-4xl text-center">
            {t("upgrade.faq.title")}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-lg font-semibold">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              {t("upgrade.cta.title")}
            </h2>
            <p className="mb-8 text-xl opacity-90">
              {t("upgrade.cta.subtitle", { product: "GreweScanner" })}
            </p>

            <button
              onClick={handleUpgradeClick}
              className="inline-flex items-center rounded-full bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg hover:bg-gray-50"
            >
              {t("upgrade.cta.button")}
              <span className="ml-2">→</span>
            </button>

            <p className="mt-4 text-sm opacity-75">{t("upgrade.cta.note")}</p>
          </div>
        </div>
      </section>

      {/* ⚠️ Warning Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 mx-4">
            <h2 className="text-xl font-bold mb-4 text-red-600">{t("upgrade.hero.important_notice")}</h2>
            <p className="text-gray-700 mb-6">
              {t("upgrade.hero.do")} <strong>{t("upgrade.hero.not_change_your_email")}</strong> {t("upgrade.hero.message")}
              <span className="block font-semibold text-blue-600 mt-1">{userEmail}</span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                {t("upgrade.hero.cancel")}
              </button>
              <button
                onClick={handleConfirmUpgrade}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
               {t("upgrade.hero.understand")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
