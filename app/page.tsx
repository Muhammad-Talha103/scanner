"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { FileText, Save, Printer, Mail, Plus, Grid3X3, User, ChevronDown, Maximize, Scissors, ZoomIn, ZoomOut, Settings, HelpCircle, Copy, ClipboardPasteIcon as Paste, Undo, Redo, FolderOpen, Download, Send, LogOut, Eye, Monitor, Info, Loader2, Lock, ArrowRight } from 'lucide-react'
import { ScannerStatus } from "@/components/ScannerStatus"
import { ScannedImages } from "@/components/ScannedImages"
import { ImportHandler } from "@/components/ImportHandler"
import { MailModal } from "@/components/MailModal"
import { ImageEditor } from "@/components/ImageEditor"
import { useScannerIntegration } from "@/hooks/useScannerIntegration"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { client } from "@/sanity/lib/client"
import { auth } from "@/firebase/firebase"
import { signOut as firebaseSignOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { signOut } from "@/redux/slice"

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

// Login Required Component
const LoginRequired = () => {
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/signin")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md w-full">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 text-center transform animate-fade-in-up">
          {/* Lock Icon with Animation */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto animate-pulse-slow">
              <Lock className="w-10 h-10 text-white animate-bounce-slow" />
            </div>
            {/* Floating particles */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-400 rounded-full animate-ping animation-delay-1000"></div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text mb-4 animate-gradient">
            Authentication Required
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Please log in to access the GREWE Scanner Interface. You'll be redirected to the login page shortly.
          </p>

          {/* Countdown Circle */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-blue-500 transition-all duration-1000 ease-linear"
                style={{
                  strokeDasharray: `${2 * Math.PI * 45}`,
                  strokeDashoffset: `${2 * Math.PI * 45 * (1 - (5 - countdown) / 5)}`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-700 animate-pulse">
                {countdown}
              </span>
            </div>
          </div>

          {/* Redirect Message */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <span>Redirecting to login</span>
            <ArrowRight className="w-4 h-4 animate-bounce-horizontal" />
          </div>

          {/* Manual Login Button */}
          <button
            onClick={() => router.push("/signin")}
            className="mt-6 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Login Now
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Secure access to your scanning workspace</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes bounce-horizontal {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(5px);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
        
        .animate-bounce-horizontal {
          animation: bounce-horizontal 1s infinite;
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default function ScannerApp() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showMailModal, setShowMailModal] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const userInfo = useSelector((state: RootState) => state.user.userInfo);
  const [userName, setUserName] = useState<string | null>(null);
  const dispatch = useDispatch();
  const router = useRouter();

  // Check if user is logged in
  if (!userInfo?.email) {
    return <LoginRequired />
  }

  useEffect(() => {
    if (!userInfo?.email) return;
    const fetchUser = async () => {
      try {
        const query = `*[_type == "user" && email == $email]{username}`;
        const params = { email: userInfo.email };
        const result = await client.fetch(query, params);
        if (result?.length > 0) {
          setUserName(result[0].username);
        } else {
          setUserName(null);
         }
      } catch (error) {
        console.error("Sanity fetch error:", error);
      }
    };
    fetchUser();
  }, [userInfo?.email]);

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
    // Close user dropdown when other dropdowns open
    if (menu !== 'user') {
      setShowUserDropdown(false)
    }
  }

  const handleUserDropdownToggle = () => {
    setShowUserDropdown(!showUserDropdown)
    // Close other dropdowns when user dropdown opens
    if (!showUserDropdown) {
      setActiveDropdown(null)
    }
  }

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth); // Firebase sign out
      dispatch(signOut());         // Redux sign out
      setShowUserDropdown(false);
      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleScanClick = () => {
    if (scannerName && !isScanning) {
      startScan()
    }
  }

  const handleSaveClick = async () => {
    if (scannedImages.length > 0 && !isProcessing) {
      await saveToPDF()
    }
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

  const handleImportImages = (importedImages: ScannedImage[]) => {
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
      {
        label: "New Document",
        icon: <Plus className="w-4 h-4" />,
        shortcut: "Ctrl+N",
        onClick: handleNewDocument,
        disabled: true,
      },
      { label: "Open", icon: <FolderOpen className="w-4 h-4" />, shortcut: "Ctrl+O", disabled: true },
      {
        label: "Import",
        icon: <Download className="w-4 h-4" />,
        shortcut: "Ctrl+I",
        onClick: () => { },
      },
      { label: "Export", icon: <Send className="w-4 h-4" />, shortcut: "Ctrl+E", disabled: true },
      { label: "Send", icon: <Mail className="w-4 h-4" />, shortcut: "Ctrl+S", disabled: true },
      { label: "Exit", icon: <LogOut className="w-4 h-4" />, shortcut: "Alt+F4", disabled: true },
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
      { label: "Cut", icon: <Scissors className="w-4 h-4" />, shortcut: "Ctrl+X", disabled: true },
      { label: "Copy", icon: <Copy className="w-4 h-4" />, shortcut: "Ctrl+C", disabled: true },
      { label: "Paste", icon: <Paste className="w-4 h-4" />, shortcut: "Ctrl+V", disabled: true },
      { label: "Select All", icon: <Grid3X3 className="w-4 h-4" />, shortcut: "Ctrl+A", disabled: true },
    ],
    view: [
      { label: "Zoom In", icon: <ZoomIn className="w-4 h-4" />, shortcut: "Ctrl++", disabled: true },
      { label: "Zoom Out", icon: <ZoomOut className="w-4 h-4" />, shortcut: "Ctrl+-", disabled: true },
      { label: "Fit to Window", icon: <Monitor className="w-4 h-4" />, shortcut: "Ctrl+0", disabled: true },
      { label: "Full Screen", icon: <Maximize className="w-4 h-4" />, shortcut: "F11", disabled: true },
      { label: "Thumbnails", icon: <Paste className="w-4 h-4" />, shortcut: "Ctrl+T", disabled: true },
      { label: "Properties", icon: <Info className="w-4 h-4" />, shortcut: "Alt+Enter", disabled: true },
    ],
    extras: [
      { label: "Preferences", icon: <Settings className="w-4 h-4" />, shortcut: "Ctrl+,", disabled: true },
      { label: "Scanner Settings", icon: <FileText className="w-4 h-4" />, disabled: true },
      { label: "OCR Settings", icon: <Eye className="w-4 h-4" />, disabled: true },
      { label: "Plugins", icon: <Grid3X3 className="w-4 h-4" />, disabled: true },
      { label: "Help", icon: <HelpCircle className="w-4 h-4" />, shortcut: "F1", disabled: true },
      { label: "About", icon: <Info className="w-4 h-4" />, disabled: true },
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

  const UserDropdown = () => {
    return (
      <div
        className={`absolute top-full right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 transform transition-all duration-200 ease-in-out ${showUserDropdown
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
              <p className="text-[13px] text-gray-500 truncate">
                {userInfo?.email}
              </p>
            </div>
          </div>
        </div>
        <div className="py-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
          >
            <LogOut className="w-4 h-4 mr-3 text-gray-500" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    )
  }

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
      <div className="flex items-center justify-center px-3 pt-6 lg:-mb-8">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl sm:text-[18px] font-extrabold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-transparent bg-clip-text text-center drop-shadow-md">
            GREWE Scanner Interface Cloud Version<br className="hidden sm:block" />
          </h2>
        </div>
      </div>
      <div className="border-b border-gray-300 px-2 py-1">
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
      <div className="border-b border-gray-300 px-2 py-2 ">
        <div className="flex items-center justify-between min-w-max">
          <div className="flex items-center space-x-1">
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
            <button
              className="flex flex-col items-center px-2 sm:px-3 py-2 hover:bg-gray-100 rounded transition-colors"
              onClick={handleMailClick}
            >
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-1" />
              <span className="text-xs text-gray-700 hidden sm:block">Mail</span>
            </button>
            <button
              className="flex flex-col items-center px-2 sm:px-3 py-2 hover:bg-gray-100 rounded transition-colors"
              onClick={handleNewDocument}
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-1" />
              <span className="text-xs text-gray-700 hidden sm:block">New</span>
            </button>
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
            <div className="flex items-center">
              <button className="flex flex-col items-center px-2 sm:px-3 py-2 hover:bg-gray-100 rounded transition-colors">
                <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-1" />
                <span className="text-xs text-gray-700 hidden sm:block">Symbols</span>
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative">
              <button
                className="flex flex-col items-center px-2 sm:px-3 py-2 hover:bg-gray-100 rounded transition-colors"
                onClick={handleUserDropdownToggle}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mb-1" />
              </button>
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col lg:flex-row">
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
        <div className="flex-1 min-h-96 lg:min-h-0">
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
      <MailModal isOpen={showMailModal} onClose={() => setShowMailModal(false)} scannedImages={getImagesForEmail()} />
      <ImageEditor
        isOpen={showImageEditor}
        onClose={() => setShowImageEditor(false)}
        image={selectedImage}
        onSave={handleImageSave}
      />
      {(activeDropdown || showUserDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setActiveDropdown(null)
            setShowUserDropdown(false)
          }}
        />
      )}
    </div>
  )
}
