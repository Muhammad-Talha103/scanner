"use client"

import { useEffect } from "react"
import { CheckCircle2, X } from "lucide-react"
import { useTranslation } from "react-i18next"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
}

export default function SuccessModal({ isOpen, onClose, fileName }: SuccessModalProps) {
  
  const { t } = useTranslation()
  // Auto-close after 5 seconds

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Content */}
          <div className="p-8 text-center">
            {/* Animated Success Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                {/* Outer ring animation */}
                <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-75" />

                {/* Icon container */}
                <div className="relative bg-green-100 rounded-full p-4 animate-in zoom-in duration-500">
                  <CheckCircle2 className="w-16 h-16 text-green-600 animate-in zoom-in duration-700 delay-100" />
                </div>
              </div>
            </div>

            {/* Success Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("success_modal.modalTitle")}</h2>

            <div className="space-y-2 mb-6">
              <p className="text-gray-600 text-balance">{t("success_modal.modalText")}</p>

              {/* File name with highlight */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="font-semibold text-gray-900 break-all">{fileName}</p>
              </div>
            </div>

            {/* OK Button */}
            <button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {t("success_modal.ok")}
            </button>

            {/* Auto-close indicator */}
            <p className="text-xs text-gray-400 mt-4">{t("success_modal.close_message")}</p>
          </div>

          {/* Bottom accent bar */}
          <div className="h-1 bg-[#18B681]" />
        </div>
      </div>
    </div>
  )
}
