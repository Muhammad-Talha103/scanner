"use client";
import { Metadata } from "next";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export const metadata:Metadata= {
  title: "Impressum | GreweScan",
  description:
    "Official legal information for GreweScan, including company details, contact information, and responsible authorities.",

  keywords: [
    "GreweScan Impressum",
    "legal notice",
    "company information",
    "provider identification",
    "GreweScan legal",
  ],

  openGraph: {
    title: "Impressum | GreweScan",
    description:
      "View the official legal notice and company details for GreweScan.",
    url: "https://grewescan.de/impressum",
    type: "website",
    images: [
      { url: "https://grewescan.de/images/og-impressum.jpg" },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Impressum | GreweScan",
    description:
      "Legal information and provider identification for GreweScan.",
  },
};

export default function ImpressumPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t("impressum.backToHome")}
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            {t("impressum.title")}
          </h1>

          <div className="space-y-6 text-gray-800">
            {/* Comp
            +
             Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {t("impressum.companyInformation.title")}
              </h2>
              <div className="space-y-2 leading-relaxed">
                <p className="font-medium">
                  {t("impressum.companyInformation.name")}
                </p>
                <p>{t("impressum.companyInformation.managingDirector")}</p>
                <p>{t("impressum.companyInformation.street")}</p>
                <p>{t("impressum.companyInformation.zipCity")}</p>
                <p>{t("impressum.companyInformation.country")}</p>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {t("impressum.contact.title")}
              </h2>
              <div className="space-y-2 leading-relaxed">
                <p>{t("impressum.contact.phone")}</p>
                <p>
                  {t("impressum.contact.email").replace(
                    "sales@jse.de",
                    ""
                  )}
                  <a
                    href="mailto:sales@jse.de"
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    sales@jse.de
                  </a>
                </p>
              </div>
            </div>

            {/* Legal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {t("impressum.legalInformation.title")}
              </h2>
              <div className="space-y-2 leading-relaxed">
                <p>{t("impressum.legalInformation.register")}</p>
                <p>{t("impressum.legalInformation.vatId")}</p>
              </div>
            </div>

            {/* Editorial Responsibility */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {t("impressum.editorialResponsibility.title")}
              </h2>
              <p className="leading-relaxed">
                {t("impressum.editorialResponsibility.text")}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">{t("impressum.footer")}</p>
        </div>
      </div>
    </div>
  );
}
