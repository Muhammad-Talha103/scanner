"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"


interface DeleteAllImagesProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}


export default function DeleteAllImages({isOpen , onConfirm,onClose}: DeleteAllImagesProps) {
  const { t } = useTranslation();

    if (!isOpen) return null

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

  return (
    <div className=" bg-gray-50 flex items-center justify-center p-4">
     
     
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Semi-transparent dark overlay */}
          <div className="absolute inset-0 bg-black/80 bg-opacity-50 transition-opacity"  />

          {/* Modal box */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            <div className="p-6">
              {/* Warning icon and title */}
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{t("deleteAllTitle")}</h3>
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t("deleteAllMessage")}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 sm:justify-end">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                {t("cancel")}
                </button>
                <button
                  onClick={handleConfirm}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                 {t("deleteAll")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
