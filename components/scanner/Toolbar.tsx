"use client"
import React from "react"
import {
  FileText,
  Save,
  Printer,
  Mail,
  Plus,
  Scissors,
  Grid3X3,
  User,
} from "lucide-react"
import { UserDropdown } from "@/components/scanner/UserDropdown"
import { ScannedImage } from "./Dropdown"

interface ToolbarProps {
  scannerName: string | null
  isScanning: boolean
  scannedImages: ScannedImage[]
  isProcessing: boolean
  selectedImage: ScannedImage | null
  onScanClick: () => void
  onSaveClick: () => void
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
}: ToolbarProps) => {
  return (
    <div className="border-b border-gray-300 px-2 py-2 flex justify-between items-center">
      {/* Left side buttons */}
      <div className="flex items-center space-x-1 min-w-max">
        {/* Scan */}
        <button
          className={`flex flex-col items-center px-3 py-2 ${
            scannerName && !isScanning
              ? "hover:bg-gray-100 cursor-pointer"
              : "cursor-not-allowed opacity-50"
          }`}
          onClick={onScanClick}
        >
          <FileText className="w-6 h-6 text-blue-600 mb-1" />
          <span className="text-xs">Scan</span>
        </button>
        {/* Save */}
        <button
          className={`flex flex-col items-center px-3 py-2 ${
            scannedImages.length > 0 && !isProcessing
              ? "hover:bg-gray-100"
              : "cursor-not-allowed opacity-50"
          }`}
          onClick={onSaveClick}
        >
          <Save className="w-6 h-6 text-gray-600 mb-1" />
          <span className="text-xs">Save</span>
        </button>
        {/* Print */}
        <button
          className={`flex flex-col items-center px-3 py-2 ${
            scannedImages.length > 0 && !isProcessing
              ? "hover:bg-gray-100"
              : "cursor-not-allowed opacity-50"
          }`}
          onClick={onPrintClick}
        >
          <Printer className="w-6 h-6 text-gray-600 mb-1" />
          <span className="text-xs">Print</span>
        </button>
        {/* Mail */}
        <button
          className="flex flex-col items-center px-3 py-2 hover:bg-gray-100"
          onClick={onMailClick}
        >
          <Mail className="w-6 h-6 text-gray-600 mb-1" />
          <span className="text-xs">Mail</span>
        </button>
        {/* New */}
        <button
          className="flex flex-col items-center px-3 py-2 hover:bg-gray-100"
          onClick={onNewDocument}
        >
          <Plus className="w-6 h-6 text-gray-600 mb-1" />
          <span className="text-xs">New</span>
        </button>
        {/* Edit */}
        <button
          className={`flex flex-col items-center px-3 py-2 ${
            selectedImage ? "hover:bg-gray-100" : "cursor-not-allowed opacity-50"
          }`}
          onClick={onEditClick}
          disabled={!selectedImage}
        >
          <Scissors className="w-6 h-6 text-gray-600 mb-1" />
          <span className="text-xs">Edit</span>
        </button>
        {/* Symbols */}
        <button className="flex flex-col items-center px-3 py-2 hover:bg-gray-100">
          <Grid3X3 className="w-6 h-6 text-gray-600 mb-1" />
          <span className="text-xs">Symbols</span>
        </button>
      </div>

      {/* Right side: User dropdown */}
      <div className="relative">
        <button
          className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-400"
          onClick={onUserDropdownToggle}
          aria-label="User menu"
        >
          <User className="w-6 h-6 text-gray-600" />
        </button>

        <UserDropdown
          isOpen={showUserDropdown}
          userName={userName}
          userEmail={userEmail}
          onLogout={onLogout}
        />
      </div>
    </div>
  )
}
