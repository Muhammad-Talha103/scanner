"use client"
import VERSION from "@/version"
import Link from "next/link"
import { useTranslation } from "react-i18next";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | GreweScan",
  description:
    "Learn more about GreweScan, our mission, values, and our commitment to delivering advanced scanning solutions for businesses and professionals.",

  keywords: [
    "About GreweScan",
    "company information",
    "document scanning solutions",
    "GreweScan mission",
    "scanning software",
  ],

  openGraph: {
    title: "About Us | GreweScan",
    description:
      "Discover who we are, what we do, and how GreweScan delivers powerful scanning technology tailored to your needs.",
    url: "https://grewescan.de/about",
    type: "website",
    images: [
      {
        url: "https://grewescan.de/images/og-about.jpg",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "About Us | GreweScan",
    description:
      "Learn more about GreweScan and our mission to deliver advanced scanning solutions.",
  },
};
export default function AboutPage() {
  
  const { t } = useTranslation();
  return (
    
    <div className="min-h-screen bg-white">
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
      <section className="bg-blue-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center fade-in-up">
          <h1 className="text-5xl font-bold text-blue-900 mb-6 text-balance"> {t("heroTitle")}</h1>
          <p className="text-xl text-blue-700 mb-8 text-pretty max-w-2xl mx-auto">
            {t("heroDescription")}
          </p>
          <span className="inline-block bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-full font-medium">
              {t("heroBadge")}
          </span>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        {/* What is GreweScan Section */}
        <section className="fade-in-up-delay-1">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4"> {t("whatIsGreweScanTitle")}</h2>
            <div className="w-20 h-1 bg-[#2563EB] mx-auto mb-6"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-800 leading-relaxed mb-6">
               {t("whatIsGreweScanDescription1")}
              </p>
              <p className="text-gray-800 leading-relaxed mb-6">
              {t("whatIsGreweScanDescription2")}
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  Cloud-Based
                </span>
                <span className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Cross-Platform
                </span>
                <span className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Instant Access
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-blue-900 mb-4"> {t("keyBenefitsTitle")}</h3>
              <ul className="space-y-3 text-gray-800">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#2563EB] rounded-full mt-2 flex-shrink-0"></div>
                 <span>{t("keyBenefitsList.0")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#2563EB] rounded-full mt-2 flex-shrink-0"></div>
                  <span>{t("keyBenefitsList.1")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#2563EB] rounded-full mt-2 flex-shrink-0"></div>
                   <span>{t("keyBenefitsList.2")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#2563EB] rounded-full mt-2 flex-shrink-0"></div>
                   <span>{t("keyBenefitsList.3")}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* Our Technology Section */}
        <section className="fade-in-up-delay-2">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">{t("howItWorksTitle")}</h2>
            <div className="w-20 h-1 bg-[#2563EB] mx-auto mb-6"></div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-blue-900 mb-4">{t("architectureTitle")}</h3>
              <p className="text-gray-800 leading-relaxed max-w-3xl mx-auto">
                {t("architectureDescription")}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">{t("webInterfaceTitle")}</h3>
                <p className="text-sm text-gray-600">
                  {t("webInterfaceDesc")}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">{t("enclesoClientTitle")}</h3>
                <p className="text-sm text-gray-600">
                {t("enclesoClientDesc")}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">{t("twainScannerTitle")}</h3>
                <p className="text-sm text-gray-600">
                 {t("twainScannerDesc")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">{t("supportedFormatsTitle")}</h3>
              <div className="flex flex-wrap gap-2">
                {["PDF", "JPEG", "TIFF", "Multi-page TIFF", "PNG", "BMP"].map((format) => (
                  <span key={format} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {format}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">{t("systemRequirementsTitle")}</h3>
              <ul className="space-y-2 text-sm text-gray-800">
                <li>• {t("systemRequirementsList.0")}</li>
                <li>• {t("systemRequirementsList.1")}</li>
                <li>• {t("systemRequirementsList.2")}</li>
                <li>• {t("systemRequirementsList.3")}</li>
              </ul>
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* About JSE Imaging Solutions Section */}
        <section className="fade-in-up-delay-3">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">{t("aboutJSETitle")}</h2>
            <div className="w-20 h-1 bg-[#2563EB] mx-auto mb-6"></div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-blue-900 mb-4">{t("30YearsOfInnovation")}</h3>
                <p className="text-gray-800 leading-relaxed mb-4">
                {t("aboutJSEDesc1")}
                </p>
                <p className="text-gray-800 leading-relaxed mb-6">
                 {t("aboutJSEDesc2")}
                </p>
                <a
                  href="https://www.jse.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#2563EB] hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {t("visitJSE")}
                </a>
              </div>
              <div className="space-y-4">
                {[
                  {
                    name: "SnapTwain",
                    desc:   t("products.SnapTwain"),
                  },
                  {
                    name: "TWAINCommander",
                    desc:  t("products.TWAINCommander"),
                  },
                  { name: "Encleso SDK", desc:   t("products.EnclesoSDK"),},
                ].map((product) => (
                  <div key={product.name} className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* Powered by Encleso SDK Section */}
        <section className="fade-in-up-delay-1">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4"> {t("poweredByEnclesoTitle")}</h2>
            <div className="w-20 h-1 bg-[#2563EB] mx-auto mb-6"></div>
          </div>

          <div className="bg-[#F7FBFF] border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="text-center mb-8">
              <p className="text-lg text-gray-800 leading-relaxed max-w-3xl mx-auto">
               {t("poweredByEnclesoDesc")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9",
                  title:  t("poweredByEnclesoFeatures.0.title"),
                  desc: t("poweredByEnclesoFeatures.0.desc"),
                },
                {
                  icon: "M13 10V3L4 14h7v7l9-11h-7z",
                 title:  t("poweredByEnclesoFeatures.1.title"),
                  desc: t("poweredByEnclesoFeatures.2.desc"),
                },
                {
                  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                  title:  t("poweredByEnclesoFeatures.2.title"),
                  desc: t("poweredByEnclesoFeatures.2.desc"),
                },
                {
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zm-6 3a2 2 0 11-4 0 2 2 0 014 0z",
                  title:  t("poweredByEnclesoFeatures.3.title"),
                  desc: t("poweredByEnclesoFeatures.3.desc"),
                },
              ].map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-blue-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <a
                href="https://encleso.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border border-blue-600 text-blue-600 hover:bg-[#2563EB] hover:text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
               {t("learnMoreEncleso")}
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12 px-4 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-2 text-sm leading-relaxed">
            <p className="font-semibold">{t("footerVersion")} {VERSION}</p>
            <p>{t("footerDescription")}</p>
            <p> {t("footerCopyright")}.</p>
            <p>
              <a href="https://www.jse.de" className="hover:text-blue-200 underline">
                www.jse.de
              </a>
            </p>
            <p>
             {t("footerEncleso")}{" "}
              <a href="https://encleso.com" className="hover:text-blue-200 underline">
                encleso.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
