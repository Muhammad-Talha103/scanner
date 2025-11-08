"use client"
import { Download, FolderOpen, Smile, MapPin, CheckCircle, Loader, PartyPopper } from "lucide-react"
import Image from "next/image"
import Step1Image from "@/public/easy_installation_images/step1.png"
import Step2Image from "@/public/easy_installation_images/step2.png"
import Step3Image from "@/public/easy_installation_images/step3.png"
import Step4Image from "@/public/easy_installation_images/step4.png"
import Step5Image from "@/public/easy_installation_images/step5.png"
import Step6Image from "@/public/easy_installation_images/step6.png"
import Step7Image from "@/public/easy_installation_images/step7.png"
import { useTranslation } from "react-i18next"
import Link from "next/link"



export default function InstallationGuide() {
  const { t } = useTranslation();
  const steps = [
  {
    number: 1,
    icon: Download,
    image: Step1Image,
    title: t("installation.steps.1.title"),
    description: t("installation.steps.1.description"),
  },
  {
    number: 2,
    icon: FolderOpen,
    image: Step2Image,
    title: t("installation.steps.2.title"),
    description: t("installation.steps.2.description"),
  },
  {
    number: 3,
    icon: Smile,
    image: Step3Image,
    title: t("installation.steps.3.title"),
    description: t("installation.steps.3.description"),
  },
  {
    number: 4,
    icon: MapPin,
    image: Step4Image,
    title: t("installation.steps.4.title"),
    description: t("installation.steps.4.description"),
  },
  {
    number: 5,
    icon: CheckCircle,
    image: Step5Image,
    title: t("installation.steps.5.title"),
    description: t("installation.steps.5.description"),
  },
  {
    number: 6,
    icon: Loader,
    image: Step6Image,
    title: t("installation.steps.6.title"),
    description: t("installation.steps.6.description"),
  },
  {
    number: 7,
    icon: PartyPopper,
    image: Step7Image,
    title: t("installation.steps.7.title"),
    description: t("installation.steps.7.description"),
  },
]


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
      {/* Header Section */}
      <div className="bg-[#3073F1] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{t("installation.headerTitle")}</h1>
          <p className="text-lg md:text-xl text-blue-50 leading-relaxed">
           {t("installation.headerDescription")}
          </p>
        </div>
      </div>

      {/* Download Button Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t("installation.downloadSectionTitle")}</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
           {t("installation.downloadSectionDescription")}
          </p>
          <a
  href="https://encleso.com/Home/Download"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-3 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
>
  <Download className="w-6 h-6" />
  {t("installation.downloadButton")}
</a>

        </div>

        {/* Steps Section */}
        <div className="space-y-8">
          {steps.map((step) => {
            const IconComponent = step.icon
            return (
              <div
                key={step.number}
                className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-6 md:p-8 w-full">
                  {/* Step Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#2563EB] text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                        <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{step.description}</p>
                    </div>
                  </div>

                  {/* Image Placeholder */}
                  <div className="mt-6 bg-gray-100 w-full border-2 border-dashed border-gray-300 rounded-3xl flex items-center justify-center">
                    <div className="text-center ">
                     
                      {step.image && (
                        <Image src={step.image} alt={step.title} className="rounded-3xl " />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <h3 className="text-[24px] uppercase font-bold text-green-900 flex items-center justify-center gap-2"> 
            <span>
              <PartyPopper className="text-3xl"/>
            </span>
               {t("installation.footerMessage")}
              <span>
              <PartyPopper className="text-3xl"/>
            </span>
             </h3>
         
        </div>
      </div>
    </div>
  )
}
