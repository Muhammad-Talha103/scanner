"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { FileText, Save, Printer, Mail, Plus, Scissors, User } from "lucide-react"
import { UserDropdown } from "@/components/scanner/UserDropdown"
import type { ScannedImage } from "./Dropdown"
import VERSION from "@/version"
import i18n from "@/app/i18n/config"
import { useTranslation } from "react-i18next"
import { MdInstallDesktop } from "react-icons/md"
import Link from "next/link"
import { SaveModal, type SaveOptions } from "@/components/scanner/SaveModal"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import toast, { Toaster } from "react-hot-toast"

interface ToolbarProps {
  scannerName: string | null
  isScanning: boolean
  scannedImages: ScannedImage[]
  isProcessing: boolean
  selectedImage: ScannedImage | null
  onScanClick: () => void
  onSaveClick: (options: SaveOptions) => Promise<void>
  onPrintClick: () => void
  onMailClick: () => void
  onNewDocument: () => void
  onEditClick: () => void

  // New props for user dropdown
  userName: string | null
  userEmail: string
  showUserDropdown: boolean
  onUserDropdownToggle: () => void
  onLogout: () => void
  selectedImagesCount: number
  selectedImages?: ScannedImage[]
}

export const Toolbar = ({
  scannerName,
  isScanning,
  scannedImages,
  isProcessing,
  selectedImage,
  onScanClick,
  onSaveClick,
  onPrintClick,
  onMailClick,
  onNewDocument,
  onEditClick,
  userName,
  userEmail,
  showUserDropdown,
  onUserDropdownToggle,
  onLogout,
  selectedImagesCount,
  selectedImages = [],
}: ToolbarProps) => {
  const { t } = useTranslation()
  const userInfo = useSelector((state: RootState) => state.user.userInfo);
  const [language, setLanguage] = useState<string>(i18n.language || "en")
  const [isMounted, setIsMounted] = useState(false) // check if client-side
  const [showSaveModal, setShowSaveModal] = useState(false)

  useEffect(() => {
    setIsMounted(true) // component is now mounted
    const savedLanguage = localStorage.getItem("app-language")
    if (savedLanguage) {
      setLanguage(savedLanguage)
      i18n.changeLanguage(savedLanguage)
    }
  }, [])

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value
    setLanguage(newLang)
    i18n.changeLanguage(newLang)
    localStorage.setItem("app-language", newLang)
  }

  const handleSaveButtonClick = () => {
    if (scannedImages.length > 0 && !isProcessing) {
      setShowSaveModal(true)
    }
  }

  const handleSaveConfirm = async (options: SaveOptions) => {
    await onSaveClick(options)
    setShowSaveModal(false)
  }


    const requireLogin = (callback: () => void) => {
    if (userInfo?.email) {
      callback()
    } else {
      toast(
      (toastObj) => (
        <div className="flex flex-col">
          <span className="font-semibold">⚠ {t("not_logged_in_message")}</span>
          <Link
            href="/signin"
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm text-center"
            onClick={() => toast.dismiss(toastObj.id)} 
          >
           {t("login_admin.signIn")}
          </Link>
        </div>
      ),
      { duration: 2000 }
    );
    }
  }

  return (
    <>
    <Toaster position="top-center" reverseOrder={false} />
      <div className="border-b border-gray-300 px-2 py-2 relative">
        {/* Scrollable content */}
        <div className="flex justify-between items-center overflow-x-auto min-w-0">
          {/* Left buttons */}
          <div className="flex items-center space-x-1 min-w-max">
            {/* Scan */}
            <button
              className={`flex flex-col items-center px-3 py-2 ${
                scannerName && !isScanning ? "hover:bg-gray-100 cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
              onClick={() => requireLogin(onScanClick)}
            >
              <FileText className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-xs">{t("scan")}</span>
            </button>

            {/* Save */}
            <button
              className={`flex flex-col items-center px-3 py-2 ${
                scannedImages.length > 0 && !isProcessing
                  ? "hover:bg-gray-100 cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              }`}
              onClick={() => requireLogin(handleSaveButtonClick)}
            >
              <Save className="w-6 h-6 text-gray-600 mb-1" />
              <span className="text-xs">{t("save")}</span>
            </button>

            {/* Print */}
            <button
              className={`flex flex-col items-center px-3 py-2 ${
                scannedImages.length > 0 && !isProcessing
                  ? "hover:bg-gray-100 cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              }`}
             onClick={() => requireLogin(onPrintClick)}
            >
              <Printer className="w-6 h-6 text-gray-600 mb-1" />
              <span className="text-xs">{t("print")}</span>
            </button>

            {/* Mail */}
            <button
              className="flex flex-col items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
           onClick={() => requireLogin(onMailClick)}
            >
              <Mail className="w-6 h-6 text-gray-600 mb-1" />
              <span className="text-xs">{t("mail")}</span>
            </button>

            {/* New */}
            <button
              className="flex flex-col items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => requireLogin(onNewDocument)}
            >
              <Plus className="w-6 h-6 text-gray-600 mb-1" />
              <span className="text-xs">{t("new")}</span>
            </button>

            {/* Edit */}
            <button
              className={`flex flex-col items-center px-3 py-2 ${
                selectedImage ? "hover:bg-gray-100 cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
           onClick={() => requireLogin(onEditClick)}
              disabled={!selectedImage}
            >
              <Scissors className="w-6 h-6 text-gray-600 mb-1" />
              <span className="text-xs">{t("edit")}</span>
            </button>

            {/* Symbols */}
            <Link href="/easy-installation" className="flex flex-col items-center px-3 py-2 hover:bg-gray-100">
              <MdInstallDesktop className="w-6 h-6 text-gray-600 mb-1" />
              <span className="text-xs">{t("installation_button")}</span>
            </Link>
          </div>

          {/* Right controls */}
          <div className="flex items-center space-x-4 min-w-max relative">
            {isMounted && (
              <select
                onChange={handleLanguageChange}
                value={language}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm 
               bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 
               focus:border-blue-500 transition"
              >
                <option value="en">🇬🇧 English</option>
                <option value="de">🇩🇪 Deutsch</option>
              </select>
            )}

            <span className="text-sm text-gray-600 font-medium">
              {t("version")} <b>{VERSION}</b>
            </span>
      

            <button
              className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-400"
              onClick={onUserDropdownToggle}
              aria-label="User menu"
            >
              <User className="w-6 h-6 text-gray-600" />
            </button>
  
          </div>
        </div>

            
        {showUserDropdown && (
          <div className="absolute right-2 top-full -mt-6 z-50">
            <UserDropdown isOpen={showUserDropdown} userName={userName} userEmail={userEmail} onLogout={onLogout} />
          </div>
        )}
             
      </div>

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleSaveConfirm}
        totalImages={scannedImages.length}
        selectedImagesCount={selectedImagesCount}
        selectedImages={selectedImages}
      />
    </>
  )
}
