"use client"
import { Metadata } from "next";
import Link from "next/link"
import { useTranslation } from "react-i18next";

export const metadata:Metadata = {
  title: "Help & Support | GreweScan",
  description:
    "Need assistance? Find answers, troubleshooting tips, and support resources for using GreweScan effectively.",

  keywords: [
    "GreweScan help",
    "GreweScan support",
    "scanner troubleshooting",
    "GreweScan guide",
    "customer support",
  ],

  openGraph: {
    title: "Help & Support | GreweScan",
    description:
      "Explore help articles, troubleshooting guides, and support resources to get the best out of GreweScan.",
    url: "https://grewescan.de/help",
    type: "website",
    images: [
      { url: "https://grewescan.de/images/og-help.jpg" },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Help & Support | GreweScan",
    description:
      "Find assistance, FAQs, and troubleshooting steps for GreweScan.",
  },
};



export default function HelpPage() {
  const { t } = useTranslation();



  const sections = [
    {
      emoji: "✅",
      title: t("helpCenter.systemRequirements.title"),
      content: [
        { label: t("helpCenter.systemRequirements.os"), text: t("helpCenter.systemRequirements.osText") },
        { label: t("helpCenter.systemRequirements.scanner"), text: t("helpCenter.systemRequirements.scannerText") },
        {
          label: t("helpCenter.systemRequirements.client"),
          text: (
            <>
              {t("helpCenter.systemRequirements.clientText")}{" "}
              <Link
                href="https://encleso.com"
                className="text-blue-600 underline hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                encleso.com
              </Link>
            </>
          ),
        },
      ],
    },
    {
      emoji: "🚀",
      title: t("helpCenter.gettingStarted.title"),
      steps: [
        {
          title: t("helpCenter.gettingStarted.steps.installClient.title"),
          text: (
            <>
              {t("helpCenter.gettingStarted.steps.installClient.text").replace("encleso.com", "")}{" "}
              <Link
                href="https://encleso.com"
                className="text-blue-600 underline hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                encleso.com
              </Link>
            </>
          ),
        },
        {
          title: t("helpCenter.gettingStarted.steps.connectScanner.title"),
          text: t("helpCenter.gettingStarted.steps.connectScanner.text"),
        },
        {
          title: t("helpCenter.gettingStarted.steps.openApp.title"),
          text: t("helpCenter.gettingStarted.steps.openApp.text"),
        },
        {
          title: t("helpCenter.gettingStarted.steps.checkVersion.title"),
          text: t("helpCenter.gettingStarted.steps.checkVersion.text"),
        },
      ],
    },
    {
      emoji: "🛠️",
      title: t("helpCenter.troubleshooting.title"),
      content: [
        {
          label: t("helpCenter.troubleshooting.scannerNotDetected.title"),
          text: t("helpCenter.troubleshooting.scannerNotDetected.text"),
        },
        {
          label: t("helpCenter.troubleshooting.stillNotWorking.title"),
          text: t("helpCenter.troubleshooting.stillNotWorking.text"),
        },
        {
          label: t("helpCenter.troubleshooting.clientNotStart.title"),
          text: t("helpCenter.troubleshooting.clientNotStart.text"),
        },
        {
          label: t("helpCenter.troubleshooting.reinstallScanner.title"),
          text: t("helpCenter.troubleshooting.reinstallScanner.text"),
        },
        {
          label: t("helpCenter.troubleshooting.twainLimit.title"),
          text: t("helpCenter.troubleshooting.twainLimit.text"),
        },
      ],
    },
    {
      emoji: "📬",
      title: t("helpCenter.contact.title"),
      content: (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
          <div>
            <h3 className="text-xl font-semibold mb-3">{t("helpCenter.contact.questions")}</h3>
            <p className="text-blue-100 mb-2">
              {t("helpCenter.contact.visit")}{" "}
              <Link
                href="https://encleso.com"
                className="text-white underline hover:text-blue-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                encleso.com
              </Link>
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">{t("helpCenter.contact.emailSupport")}</h3>
            <p className="text-blue-100">
              <Link href="mailto:sales@jse.de" className="text-white underline hover:text-blue-200">
                sales@jse.de
              </Link>
            </p>
          </div>
        </div>
      ),
      bgBlue: true,
    },
  ]


  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#2563EB] text-white py-8 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">{t("helpCenter.title")}</h1>
          <p className="text-blue-100 mt-2 text-lg">{t("helpCenter.subtitle")}</p>
        </div>
        <div className="fixed top-4 left-4 z-50">
          <Link
            href="/"
            className="flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
           {t("helpCenter.backToHome")}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {sections.map(({ emoji, title, content, steps, bgBlue }, i) => (
          <section key={i}>
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">{emoji}</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-600">{title}</h2>
            </div>

            {steps ? (
              <div className="space-y-6">
                {steps.map(({ title: stepTitle, text }, idx) => (
                  <div key={idx} className="bg-white border-l-4 border-blue-500 p-6 shadow-sm rounded-r-lg">
                    <h3 className="text-xl font-semibold text-blue-800 mb-3">{`${idx + 1}. ${stepTitle}`}</h3>
                    <p className="text-gray-700 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            ) : content instanceof Array ? (
              <div className={`bg-blue-50 rounded-lg p-6 grid gap-4 sm:grid-cols-1 md:grid-cols-${content.length}`}>
                {content.map(({ label, text }, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold text-blue-800 mb-2">{label}</h3>
                    <p className="text-gray-700">{text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${bgBlue ? "bg-[#2563EB] text-white" : "bg-blue-50"} rounded-lg p-6`}>{content}</div>
            )}
          </section>
        ))}
      </main>

      <footer className="bg-gray-50 border-t py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">{t("helpCenter.footer")}</p>
        </div>
      </footer>
    </div>
  )
}
