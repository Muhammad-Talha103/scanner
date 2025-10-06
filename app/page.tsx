"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Mail,
  Plus,
  Grid3X3,
  Maximize,
  Scissors,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Copy,
  Castle as Paste,
  Undo,
  Redo,
  FolderOpen,
  Download,
  Send,
  LogOut,
  Monitor,
  Info,
  Loader2,
  BookOpenCheck,
} from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { signOut as firebaseSignOut } from "firebase/auth"
import { jsPDF } from "jspdf"

import { client } from "@/sanity/lib/client"
import { auth } from "@/firebase/firebase"
import { signOut } from "@/redux/slice"
import type { RootState } from "@/redux/store"

import { ScannerStatus } from "@/components/ScannerStatus"
import { ScannedImages } from "@/components/ScannedImages"
import { MailModal } from "@/components/MailModal"
import { ImageEditor } from "@/components/ImageEditor"
import { LoginRequired } from "@/components/scanner/LoginRequired"
import { MenuBar } from "@/components/scanner/MenuBar"
import { Toolbar } from "@/components/scanner/Toolbar"
import Header from "@/components/scanner/Header"
import SuccessModal from "@/components/scanner/SuccessModal"

import { useScannerIntegration } from "@/hooks/useScannerIntegration"
import Marquee from "@/components/scanner/Advertise"
import { useTranslation } from "react-i18next"
import type { SaveOptions } from "@/components/scanner/SaveModal"

interface DropdownItem {
  label: string
  icon: React.ReactNode
  shortcut?: string
  onClick?: () => void
  disabled?: boolean
  href?: string
}

export default function ScannerApp() {
  const { t } = useTranslation()
  // Redux & Router
  const dispatch = useDispatch()
  const router = useRouter()
  const userInfo = useSelector((state: RootState) => state.user.userInfo)

  // Local states
  const [userName, setUserName] = useState<string | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showMailModal, setShowMailModal] = useState(false)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [showScannerUI, setShowScannerUI] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successInfo, setSuccessInfo] = useState({ fileName: "", folderPath: "" })

  // Scanner integration hooks
  const {
    isReady,
    scanners,
    scannerName,
    setScannerName,
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
    deleteAllImages,
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
    updateScannerCapabilities,
  } = useScannerIntegration(showScannerUI)

  useEffect(() => {
    if (userInfo?.email) {
      window.__USER_EMAIL__ = userInfo.email
    }
  }, [userInfo?.email])

  // Fetch username from Sanity on email change
  useEffect(() => {
    if (!userInfo?.email) return

    async function fetchUsername() {
      try {
        const query = `*[_type == "user" && lower(email) == $email]{username}`
        const results = await client.fetch(query, {
          email: userInfo?.email?.toLowerCase(),
        })

        if (results.length > 0) {
          setUserName(results[0].username ?? null)
        } else {
          setUserName(null)
        }
      } catch (err) {
        console.error("Sanity fetch error:", err)
        setUserName(null)
      }
    }

    fetchUsername()
  }, [userInfo?.email])

  // Redirect if not logged in
  if (!userInfo?.email) return <LoginRequired />

  // Selected image from scanned images
  const selectedImage = getSelectedImage()

  // Handlers
  const handleDropdownToggle = (menu: string) => {
    setActiveDropdown((current) => (current === menu ? null : menu))
    if (menu !== "user") setShowUserDropdown(false)
  }

  const handleUserDropdownToggle = () => {
    setShowUserDropdown((prev) => !prev)
    if (!showUserDropdown) setActiveDropdown(null)
  }

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth)
      dispatch(signOut())
      setShowUserDropdown(false)
      router.push("/signin")
    } catch (err) {
      console.error("Error signing out:", err)
    }
  }

  // Toolbar action handlers
  const handleScanClick = () => scannerName && !isScanning && startScan()

  const handleSaveClick = async (options: SaveOptions) => {
    if (scannedImages.length === 0 || isProcessing) return

    try {
      // Get the images to save based on user selection
      const imagesToSave = options.saveAll ? scannedImages : getSelectedImages()

      if (imagesToSave.length === 0) {
        throw new Error("No images selected to save")
      }

      console.log("[v0] Save operation started:", {
        format: options.format,
        imageCount: imagesToSave.length,
        savePath: options.savePath,
        saveType: options.saveType,
      })

      let fileName = ""
      let folderPath = ""

      // Process based on format and save type
      if (options.saveType === "folder" && options.directoryHandle) {
        // Save multiple files to a folder
        await saveImagesToFolder(imagesToSave, options.format, options.directoryHandle)
        folderPath = options.fullPath || options.directoryHandle.name
        if (options.format === "pdf-multi") {
          fileName = "scanned-document.pdf"
        } else if (options.format === "pdf-single") {
          fileName = `${imagesToSave.length} PDF file(s)`
        } else {
          fileName = `${imagesToSave.length} image file(s)`
        }
      } else if (options.saveType === "file" && options.fileHandle) {
        // Save to a specific file
        await saveToFile(imagesToSave, options.format, options.fileHandle)
        fileName = options.fileHandle.name
        folderPath = options.fullPath || options.fileHandle.name
      } else {
        throw new Error("Invalid save configuration. Please try again.")
      }

      console.log("[v0] Save operation completed successfully")
      setSuccessInfo({ fileName, folderPath })
      setShowSuccessModal(true)
    } catch (error) {
      console.error("[v0] Save operation failed:", error)
      throw error
    }
  }

  const handlePrintClick = async () => scannedImages.length && !isProcessing && printDocument()
  const handleMailClick = () => setShowMailModal(true)
  const handleEditClick = () => selectedImage && setShowImageEditor(true)

  const handleImageSave = (editedImage: typeof selectedImage) => {
    if (editedImage) {
      updateImage(editedImage)
    }
  }

  const handleNewDocument = () => {
    createNewDocument()
    setActiveDropdown(null)
  }

  const handleImportImages = (importedImages: typeof scannedImages) => {
    addImportedImages(importedImages)
    setActiveDropdown(null)
  }

  const handleDeleteImage = async (imageId: string) => {
    await deleteImage(imageId)
  }

  const handleDeleteAllImages = () => {
    deleteAllImages()
  }

  const handleUndo = () => {
    undo()
    setActiveDropdown(null)
  }

  const handleRedo = () => {
    redo()
    setActiveDropdown(null)
  }

  const handleCapabilitiesChange = (resolution?: number, pixelType?: number, duplex?: boolean) => {
    updateScannerCapabilities(resolution, pixelType, duplex)
  }
  const action = t("app_page.action")
  const edit = t("app_page.edit")
  const view = t("app_page.view")

  // Menu items config
  const menuItems: Record<string, DropdownItem[]> = {
    [action]: [
      {
        label: t("app_page.menu.action.new"),
        icon: <Plus className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.new"),
        onClick: handleNewDocument,
        disabled: true,
      },
      {
        label: t("app_page.menu.action.open"),
        icon: <FolderOpen className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.open"),
        disabled: true,
      },
      {
        label: t("app_page.menu.action.import"),
        icon: <Download className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.import"),
        onClick: () => {},
        disabled: false,
      },
      {
        label: t("app_page.menu.action.export"),
        icon: <Send className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.export"),
        disabled: true,
      },
      {
        label: t("app_page.menu.action.send"),
        icon: <Mail className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.send"),
        disabled: true,
      },
      {
        label: t("app_page.menu.action.exit"),
        icon: <LogOut className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.exit"),
        disabled: true,
      },
    ],
    [edit]: [
      {
        label: t("app_page.menu.edit.undo"),
        icon: <Undo className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.undo"),
        onClick: handleUndo,
        disabled: !canUndo,
      },
      {
        label: t("app_page.menu.edit.redo"),
        icon: <Redo className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.redo"),
        onClick: handleRedo,
        disabled: !canRedo,
      },
      {
        label: t("app_page.menu.edit.cut"),
        icon: <Scissors className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.cut"),
        disabled: true,
      },
      {
        label: t("app_page.menu.edit.copy"),
        icon: <Copy className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.copy"),
        disabled: true,
      },
      {
        label: t("app_page.menu.edit.paste"),
        icon: <Paste className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.paste"),
        disabled: true,
      },
      {
        label: t("app_page.menu.edit.selectAll"),
        icon: <Grid3X3 className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.selectAll"),
        disabled: true,
      },
    ],
    [view]: [
      {
        label: t("app_page.menu.view.zoomIn"),
        icon: <ZoomIn className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.zoomIn"),
        disabled: true,
      },
      {
        label: t("app_page.menu.view.zoomOut"),
        icon: <ZoomOut className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.zoomOut"),
        disabled: true,
      },
      {
        label: t("app_page.menu.view.fit"),
        icon: <Monitor className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.fit"),
        disabled: true,
      },
      {
        label: t("app_page.menu.view.fullScreen"),
        icon: <Maximize className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.fullScreen"),
        disabled: true,
      },
      {
        label: t("app_page.menu.view.thumbnails"),
        icon: <Paste className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.thumbnails"),
        disabled: true,
      },
      {
        label: t("app_page.menu.view.properties"),
        icon: <Info className="w-4 h-4" />,
        shortcut: t("app_page.shortcuts.properties"),
        disabled: true,
      },
    ],
    "?": [
      {
        label: t("app_page.menu.help.help"),
        icon: <HelpCircle className="w-4 h-4" />,
        href: "/help",
        disabled: false,
      },
      {
        label: t("app_page.menu.help.about"),
        icon: <Info className="w-4 h-4" />,
        href: "/about",
        disabled: false,
      },
      {
        label: t("app_page.menu.help.impressum"),
        icon: <BookOpenCheck className="w-4 h-4" />,
        href: "/impressum",
        disabled: false,
      },
    ],
  }
  // Loading state UI
  if (isLoadingImages) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t("app_page.loading")}</p>
        </div>
      </div>
    )
  }

  // Main UI render
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      <MenuBar
        menuItems={menuItems}
        activeDropdown={activeDropdown}
        onDropdownToggle={handleDropdownToggle}
        onImagesImported={handleImportImages}
      />

      <Toolbar
        scannerName={scannerName}
        isScanning={isScanning}
        scannedImages={scannedImages}
        isProcessing={isProcessing}
        selectedImage={selectedImage}
        onScanClick={handleScanClick}
        onSaveClick={handleSaveClick}
        onPrintClick={handlePrintClick}
        onMailClick={handleMailClick}
        onNewDocument={handleNewDocument}
        onEditClick={handleEditClick}
        userName={userName}
        userEmail={userInfo.email || ""}
        showUserDropdown={showUserDropdown}
        onUserDropdownToggle={handleUserDropdownToggle}
        onLogout={handleLogout}
        selectedImagesCount={getSelectedImages().length}
        selectedImages={getSelectedImages()}
      />

      <Marquee />
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-40 bg-gray-100 border-b lg:border-b-0 lg:border-r border-gray-300 p-3">
          <ScannerStatus
            isReady={isReady}
            scanners={scanners}
            selectedScanner={scannerName}
            onSelectScanner={setScannerName}
            error={error}
            onCapabilitiesChange={handleCapabilitiesChange}
            onToggleUI={setShowScannerUI}
          />

          {selectedImage && (
            <section className="mt-4 pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-700 mb-2">{t("app_page.selected.label")}</div>
              <div className="text-xs text-gray-600">
                {selectedImage.id.startsWith("import-")
                  ? t("app_page.selected.imported")
                  : t("app_page.selected.scanned")}{" "}
                {t("app_page.image")}
              </div>
            </section>
          )}

          {getSelectedImages().length > 0 && (
            <section className="mt-4 pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-700 mb-2">{t("app_page.operations.label")}</div>
              <div className="text-xs text-gray-600">
                {t("app_page.operations.count", {
                  count: getSelectedImages().length,
                })}
              </div>
            </section>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-96 lg:min-h-0">
          <ScannedImages
            images={scannedImages}
            isScanning={isScanning}
            onImageClick={handleImageClick}
            selectedImageId={selectedImage?.id}
            isImageSelected={isImageSelected}
            onToggleSelection={toggleImageSelection}
            onDeleteImage={handleDeleteImage}
            deleteAllImages={handleDeleteAllImages}
          />
        </main>
      </div>

      {/* Modals */}
      <MailModal isOpen={showMailModal} onClose={() => setShowMailModal(false)} scannedImages={getImagesForEmail()} />
      <ImageEditor
        isOpen={showImageEditor}
        onClose={() => setShowImageEditor(false)}
        image={selectedImage}
        onSave={handleImageSave}
      />
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        fileName={successInfo.fileName}
    
      />

      {/* Overlay for dropdowns */}
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

const saveImagesToFolder = async (images: any[], format: string, directoryHandle: FileSystemDirectoryHandle) => {
  try {
    if (format === "pdf-multi") {
      const pdf = new jsPDF()
      let isFirstPage = true

      for (const image of images) {
        if (!isFirstPage) {
          pdf.addPage()
        }

        const img = await loadImage(image.dataUrl)
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        const imgAspectRatio = img.width / img.height
        const pageAspectRatio = pageWidth / pageHeight

        let imgWidth = pageWidth
        let imgHeight = pageHeight

        if (imgAspectRatio > pageAspectRatio) {
          imgHeight = pageWidth / imgAspectRatio
        } else {
          imgWidth = pageHeight * imgAspectRatio
        }

        const x = (pageWidth - imgWidth) / 2
        const y = (pageHeight - imgHeight) / 2

        pdf.addImage(image.dataUrl, "JPEG", x, y, imgWidth, imgHeight)
        isFirstPage = false
      }

      const pdfBlob = pdf.output("blob")
      const fileName = "scanned-document.pdf"
      const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(pdfBlob)
      await writable.close()

      console.log(`[v0] Saved multi-page PDF: ${fileName}`)
    } else if (format === "pdf-single") {
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const pdf = new jsPDF()

        const img = await loadImage(image.dataUrl)
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        const imgAspectRatio = img.width / img.height
        const pageAspectRatio = pageWidth / pageHeight

        let imgWidth = pageWidth
        let imgHeight = pageHeight

        if (imgAspectRatio > pageAspectRatio) {
          imgHeight = pageWidth / imgAspectRatio
        } else {
          imgWidth = pageHeight * imgAspectRatio
        }

        const x = (pageWidth - imgWidth) / 2
        const y = (pageHeight - imgHeight) / 2

        pdf.addImage(image.dataUrl, "JPEG", x, y, imgWidth, imgHeight)

        const pdfBlob = pdf.output("blob")
        const fileName = `scanned-image-${i + 1}.pdf`
        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(pdfBlob)
        await writable.close()

        console.log(`[v0] Saved single-page PDF: ${fileName}`)
      }
    } else {
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const extension = getFileExtension(format)
        const fileName = `scanned-image-${i + 1}${extension}`

        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true })
        const writable = await fileHandle.createWritable()

        const blob = await convertImageFormat(image.dataUrl, format)

        await writable.write(blob)
        await writable.close()

        console.log(`[v0] Saved file: ${fileName}`)
      }
    }
  } catch (error) {
    console.error("[v0] Error saving to folder:", error)
    throw new Error("Failed to save files to folder. Please check permissions and try again.")
  }
}

const saveToFile = async (images: any[], format: string, fileHandle: FileSystemFileHandle) => {
  try {
    const writable = await fileHandle.createWritable()

    if (format === "pdf-multi") {
      const pdf = new jsPDF()
      let isFirstPage = true

      for (const image of images) {
        if (!isFirstPage) {
          pdf.addPage()
        }

        const img = await loadImage(image.dataUrl)
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        const imgAspectRatio = img.width / img.height
        const pageAspectRatio = pageWidth / pageHeight

        let imgWidth = pageWidth
        let imgHeight = pageHeight

        if (imgAspectRatio > pageAspectRatio) {
          imgHeight = pageWidth / imgAspectRatio
        } else {
          imgWidth = pageHeight * imgAspectRatio
        }

        const x = (pageWidth - imgWidth) / 2
        const y = (pageHeight - imgHeight) / 2

        pdf.addImage(image.dataUrl, "JPEG", x, y, imgWidth, imgHeight)
        isFirstPage = false
      }

      const pdfBlob = pdf.output("blob")
      await writable.write(pdfBlob)
    } else if (format === "pdf-single") {
      const pdf = new jsPDF()
      const image = images[0]

      const img = await loadImage(image.dataUrl)
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imgAspectRatio = img.width / img.height
      const pageAspectRatio = pageWidth / pageHeight

      let imgWidth = pageWidth
      let imgHeight = pageHeight

      if (imgAspectRatio > pageAspectRatio) {
        imgHeight = pageWidth / imgAspectRatio
      } else {
        imgWidth = pageHeight * imgAspectRatio
      }

      const x = (pageWidth - imgWidth) / 2
      const y = (pageHeight - imgHeight) / 2

      pdf.addImage(image.dataUrl, "JPEG", x, y, imgWidth, imgHeight)

      const pdfBlob = pdf.output("blob")
      await writable.write(pdfBlob)
    } else if (format === "tiff-multi" || format === "tiff-single") {
      const blob = await convertImageFormat(images[0].dataUrl, "png")
      await writable.write(blob)
    } else {
      const blob = await convertImageFormat(images[0].dataUrl, format)
      await writable.write(blob)
    }

    await writable.close()
    console.log("[v0] File saved successfully")
  } catch (error) {
    console.error("[v0] Error saving file:", error)
    throw new Error("Failed to save file. Please check permissions and try again.")
  }
}

const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

const convertImageFormat = async (dataUrl: string, format: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Failed to get canvas context"))
        return
      }

      ctx.drawImage(img, 0, 0)

      let mimeType = "image/jpeg"
      switch (format) {
        case "png":
          mimeType = "image/png"
          break
        case "bmp":
          mimeType = "image/bmp"
          break
        case "jpeg":
        default:
          mimeType = "image/jpeg"
          break
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to convert image"))
          }
        },
        mimeType,
        0.95,
      )
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

const getFileExtension = (format: string): string => {
  switch (format) {
    case "jpeg":
      return ".jpg"
    case "png":
      return ".png"
    case "bmp":
      return ".bmp"
    case "pdf-single":
    case "pdf-multi":
      return ".pdf"
    case "tiff-single":
    case "tiff-multi":
      return ".tiff"
    default:
      return ".jpg"
  }
}
