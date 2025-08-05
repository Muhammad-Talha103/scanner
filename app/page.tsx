"use client"

import type React from "react"
import { useState } from "react"
import {
  FileText,
  Save,
  Printer,
  Mail,
  Plus,
  Grid3X3,
  User,
  ChevronDown,
  Maximize,
  Calculator,
  Scissors,
  ZoomIn,
  ZoomOut,
  Settings,
  HelpCircle,
  Copy,
  ClipboardPasteIcon as Paste,
  Undo,
  Redo,
  FolderOpen,
  Download,
  Send,
  LogOut,
  Eye,
  Monitor,
  Info,
  Loader2,
} from "lucide-react"
import { ScannerStatus } from "@/components/ScannerStatus"
import { ScannedImages } from "@/components/ScannedImages"
import { ImportHandler } from "@/components/ImportHandler"
import { SaveModal } from "@/components/SaveModal"
import { MailModal } from "@/components/MailModal"
import { ImageEditor } from "@/components/ImageEditor"
import { useScannerIntegration } from "@/hooks/useScannerIntegration"

interface DropdownItem {
  label: string
  icon: React.ReactNode
  shortcut?: string
  onClick?: () => void
  disabled?: boolean
}

 interface ScannedImage {
  id: string
  dataUrl: string
  timestamp: number
}
  
export default function ScannerApp() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showMailModal, setShowMailModal] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)

  const {
    isReady,
    scannerName,
    isScanning,
    scannedImages,
    startScan,
    saveToPDF,
    printDocument,
    isProcessing,
    isLoadingImages,
    error,
    addImportedImages,
    createNewDocument,
    updateImage,
    toggleImageSelection,
    deleteImage,
    getSelectedImages,
    isImageSelected,
    getImagesForEmail,
    handleImageClick,
    getSelectedImage,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useScannerIntegration()

  const selectedImage = getSelectedImage()

  const handleDropdownToggle = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu)
  }

  const handleScanClick = () => {
    if (scannerName && !isScanning) {
      startScan()
    }
  }

  const handleSaveClick = async () => {
    if (scannedImages.length > 0 && !isProcessing) {
      setShowSaveModal(true)
    }
  }

  const handleSaveConfirm = async (fileName: string) => {
    await saveToPDF(fileName)
  }

  const handlePrintClick = async () => {
    if (scannedImages.length > 0 && !isProcessing) {
      await printDocument()
    }
  }

  const handleMailClick = () => {
    setShowMailModal(true)
  }

  const handleEditClick = () => {
    if (selectedImage) {
      setShowImageEditor(true)
    }
  }

  const handleImageSave = (editedImage: ScannedImage) => {
    updateImage(editedImage)
  }

  const handleNewDocument = () => {
    createNewDocument()
    setActiveDropdown(null)
  }
 

  const handleImportImages = (importedImages:ScannedImage[]) => {
    addImportedImages(importedImages)
    setActiveDropdown(null)
  }

  const handleDeleteImage = async (imageId: string) => {
    await deleteImage(imageId)
  }

  const handleUndo = () => {
    undo()
    setActiveDropdown(null)
  }

  const handleRedo = () => {
    redo()
    setActiveDropdown(null)
  }

  const menuItems: Record<string, DropdownItem[]> = {
    action: [
      { label: "New Document", icon: <Plus className="w-4 h-4" />, shortcut: "Ctrl+N", onClick: handleNewDocument },
      { label: "Open", icon: <FolderOpen className="w-4 h-4" />, shortcut: "Ctrl+O" },
      {
        label: "Import",
        icon: <Download className="w-4 h-4" />,
        shortcut: "Ctrl+I",
        onClick: () => {
        
        },
      },
      { label: "Export", icon: <Send className="w-4 h-4" />, shortcut: "Ctrl+E" },
      { label: "Send", icon: <Mail className="w-4 h-4" />, shortcut: "Ctrl+S" },
      { label: "Exit", icon: <LogOut className="w-4 h-4" />, shortcut: "Alt+F4" },
    ],
    edit: [
      {
        label: "Undo",
        icon: <Undo className="w-4 h-4" />,
        shortcut: "Ctrl+Z",
        onClick: handleUndo,
        disabled: !canUndo,
      },
      {
        label: "Redo",
        icon: <Redo className="w-4 h-4" />,
        shortcut: "Ctrl+Y",
        onClick: handleRedo,
        disabled: !canRedo,
      },
      { label: "Cut", icon: <Scissors className="w-4 h-4" />, shortcut: "Ctrl+X" },
      { label: "Copy", icon: <Copy className="w-4 h-4" />, shortcut: "Ctrl+C" },
      { label: "Paste", icon: <Paste className="w-4 h-4" />, shortcut: "Ctrl+V" },
      { label: "Select All", icon: <Grid3X3 className="w-4 h-4" />, shortcut: "Ctrl+A" },
    ],
    view: [
      { label: "Zoom In", icon: <ZoomIn className="w-4 h-4" />, shortcut: "Ctrl++" },
      { label: "Zoom Out", icon: <ZoomOut className="w-4 h-4" />, shortcut: "Ctrl+-" },
      { label: "Fit to Window", icon: <Monitor className="w-4 h-4" />, shortcut: "Ctrl+0" },
      { label: "Full Screen", icon: <Maximize className="w-4 h-4" />, shortcut: "F11" },
      { label: "Thumbnails", icon: <Paste className="w-4 h-4" />, shortcut: "Ctrl+T" },
      { label: "Properties", icon: <Info className="w-4 h-4" />, shortcut: "Alt+Enter" },
    ],
    extras: [
      { label: "Preferences", icon: <Settings className="w-4 h-4" />, shortcut: "Ctrl+," },
      { label: "Scanner Settings", icon: <FileText className="w-4 h-4" /> },
      { label: "OCR Settings", icon: <Eye className="w-4 h-4" /> },
      { label: "Plugins", icon: <Grid3X3 className="w-4 h-4" /> },
      { label: "Help", icon: <HelpCircle className="w-4 h-4" />, shortcut: "F1" },
      { label: "About", icon: <Info className="w-4 h-4" /> },
    ],
  }

  const Dropdown = ({ items, isOpen }: { items: DropdownItem[]; isOpen: boolean }) => {
    if (!isOpen) return null

    return (
      <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-300 rounded-md shadow-lg z-50">
        {items.map((item, index) => {
          const buttonContent = (
            <button
              key={index}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md ${item.disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick?.()
                  if (item.label !== "Import") {
                    setActiveDropdown(null)
                  }
                }
              }}
              disabled={item.disabled}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.shortcut && <span className="text-xs text-gray-500">{item.shortcut}</span>}
            </button>
          )

          // Wrap Import button with ImportHandler
          if (item.label === "Import") {
            return (
              <ImportHandler key={index} onImagesImported={handleImportImages}>
                {buttonContent}
              </ImportHandler>
            )
          }

          return buttonContent
        })}
      </div>
    )
  }

  // Show loading state while images are being loaded from storage
  if (isLoadingImages) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading saved images...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
  <div className="flex items-center justify-start px-3 py-6 ">
  <div className="flex items-center space-x-3">
    {/* Icon - Cloud Scanner */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-10 text-blue-500 animate-bounce"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 15a4 4 0 004 4h9a5 5 0 100-10 7 7 0 00-13 6z"
      />
    </svg>

    {/* Heading Text */}
    <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-transparent bg-clip-text text-center drop-shadow-md">
      GREWE Scanner Interface Cloud Version<br className="hidden sm:block" /> 
    </h2>
  </div>
</div>

      {/* Menu Bar */}
      <div className="bg-gray-200 border-b border-gray-300 px-2 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center">

            <div className="flex items-center space-x-1">
              {Object.entries(menuItems).map(([key, items]) => (
                <div key={key} className="relative">
                  <button
                    className="px-3 py-1 text-sm hover:bg-gray-300 rounded capitalize"
                    onClick={() => handleDropdownToggle(key)}
                  >
                    {key === "extras" ? "Extras" : key}
                  </button>
                  <Dropdown items={items} isOpen={activeDropdown === key} />
                </div>
              ))}
              <button className="px-3 py-1 text-sm hover:bg-gray-300 rounded">?</button>
            </div>
          </div>
          <div className="text-sm text-gray-700 hidden lg:block">Full Screen</div>
        </div>


      </div>

      {/* Toolbar */}
      <div className="bg-gray-200 border-b border-gray-300 px-2 py-2 overflow-x-auto">
        <div className="flex items-center justify-between min-w-max">
          <div className="flex items-center space-x-1">
            {/* Scan Button with Dropdown */}
            <div className="flex items-center bg-white border border-gray-400 rounded shadow-sm">
              <button
                className={`flex flex-col items-center px-2 sm:px-3 py-2 transition-colors ${scannerName && !isScanning ? "hover:bg-gray-100 cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                onClick={handleScanClick}
                disabled={!scannerName || isScanning}
              >
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mb-1" />
                <span className="text-xs text-gray-700 hidden sm:block">{isScanning ? "Scanning..." : "Scan"}</span>
              </button>
              <button className="px-1 py-2 border-l border-gray-400 hover:bg-gray-100 transition-colors">
                <ChevronDown className="w-3 h-3 text-gray-600" />
              </button>
            </div>

            {/* Save */}
            <button
              className={`flex flex-col items-center px-2 sm:px-3 py-2 rounded transition-colors ${scannedImages.length > 0 && !isProcessing
                  ? "hover:bg-gray-100 cursor-pointer"
                  : "cursor-not-allowed opacity-50"
                }`}
              onClick={handleSaveClick}
              disabled={scannedImages.length === 0 || isProcessing}
              title={isProcessing ? "Processing..." : "Save as PDF"}
            >
              <Save className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-1" />
              <span className="text-xs text-gray-700 hidden sm:block">{isProcessing ? "Saving..." : "Save"}</span>
            </button>

            {/* Print */}
            <button
              className={`flex flex-col items-center px-2 sm:px-3 py-2 rounded transition-colors ${scannedImages.length > 0 && !isProcessing
                  ? "hover:bg-gray-100 cursor-pointer"
                  : "cursor-not-allowed opacity-50"
                }`}
              onClick={handlePrintClick}
              disabled={scannedImages.length === 0 || isProcessing}
              title={isProcessing ? "Processing..." : "Print document"}
            >
              <Printer className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-1" />
              <span className="text-xs text-gray-700 hidden sm:block">{isProcessing ? "Printing..." : "Print"}</span>
            </button>

            {/* Fax */}
            <button className="flex flex-col items-center px-2 sm:px-3 py-2 hover:bg-gray-100 rounded transition-colors">
              <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-1" />
              <span className="text-xs text-gray-700 hidden sm:block">Fax</span>
            </button>

            {/* Mail */}
            <button
              className="flex flex-col items-center px-2 sm:px-3 py-2 hover:bg-gray-100 rounded transition-colors"
              onClick={handleMailClick}
            >
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-1" />
              <span className="text-xs text-gray-700 hidden sm:block">Mail</span>
            </button>

            {/* New */}
            <button
              className="flex flex-col items-center px-2 sm:px-3 py-2 hover:bg-gray-100 rounded transition-colors"
              onClick={handleNewDocument}
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-1" />
              <span className="text-xs text-gray-700 hidden sm:block">New</span>
            </button>

            {/* Edit with Dropdown */}
            <div className="flex items-center">
              <button
                className={`flex flex-col items-center px-2 sm:px-3 py-2 rounded transition-colors ${selectedImage ? "hover:bg-gray-100 cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                onClick={handleEditClick}
                disabled={!selectedImage}
                title={selectedImage ? "Edit selected image" : "Select an image to edit"}
              >
                <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-1" />
                <span className="text-xs text-gray-700 hidden sm:block">Edit</span>
              </button>

            </div>

            {/* Symbols with Dropdown */}
            <div className="flex items-center">
              <button className="flex flex-col items-center px-2 sm:px-3 py-2 hover:bg-gray-100 rounded transition-colors">
                <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-1" />
                <span className="text-xs text-gray-700 hidden sm:block">Symbols</span>
              </button>

            </div>

          </div>

          {/* Right side options */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="flex flex-col items-center px-2 sm:px-3 py-2 hover:bg-gray-100 rounded transition-colors">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mb-1" />

            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left Sidebar */}
        <div className="w-full lg:w-40 bg-gray-100 border-b lg:border-b-0 lg:border-r border-gray-300 p-3">
          <ScannerStatus isReady={isReady} scannerName={scannerName} error={error} />
          {selectedImage && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-700 mb-2">Selected:</div>
              <div className="text-xs text-gray-600">
                {selectedImage.id.startsWith("import-") ? "Imported" : "Scanned"} Image
              </div>
            </div>
          )}
          {getSelectedImages().length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-700 mb-2">For Operations:</div>
              <div className="text-xs text-gray-600">
                {getSelectedImages().length} image{getSelectedImages().length !== 1 ? "s" : ""} selected
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-200 min-h-96 lg:min-h-0">
          <ScannedImages
            images={scannedImages}
            isScanning={isScanning}
            onImageClick={handleImageClick}
            selectedImageId={selectedImage?.id}
            isImageSelected={isImageSelected}
            onToggleSelection={toggleImageSelection}
            onDeleteImage={handleDeleteImage}
          />
        </div>
      </div>

      {/* Save Modal */}
      <SaveModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} onSave={handleSaveConfirm} />

      {/* Mail Modal */}
      <MailModal isOpen={showMailModal} onClose={() => setShowMailModal(false)} scannedImages={getImagesForEmail()} />

      {/* Image Editor */}
      <ImageEditor
        isOpen={showImageEditor}
        onClose={() => setShowImageEditor(false)}
        image={selectedImage}
        onSave={handleImageSave}
      />

      {/* Click outside to close dropdown */}
      {activeDropdown && <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />}
    </div>
  )
}
