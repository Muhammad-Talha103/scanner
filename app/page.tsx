// app/page.tsx

"use client";

import type React from "react";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { signOut as firebaseSignOut } from "firebase/auth";
import { jsPDF } from "jspdf";

import { client } from "@/sanity/lib/client";
import { auth } from "@/firebase/firebase";
import { signOut } from "@/redux/slice";
import type { RootState } from "@/redux/store";

import { ScannerStatus } from "@/components/ScannerStatus";
import { ScannedImages } from "@/components/ScannedImages";
import { MailModal } from "@/components/MailModal";
import { ImageEditor } from "@/components/ImageEditor";
import { MenuBar } from "@/components/scanner/MenuBar";
import { Toolbar } from "@/components/scanner/Toolbar";
import Header from "@/components/scanner/Header";
import SuccessModal from "@/components/scanner/SuccessModal";

import { useScannerIntegration } from "@/hooks/useScannerIntegration";
import Marquee from "@/components/scanner/Advertise";
import { useTranslation } from "react-i18next";
import type { SaveOptions } from "@/components/scanner/SaveModal";
import QrCodeImage from "@/public/greweqr.png";
import { usePremiumSSE } from "@/hooks/usePremiumSSE";

interface DropdownItem {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
}

type SaveFormat =
  | "pdf-multi"
  | "pdf-single"
  | "tiff-multi"
  | "tiff-single"
  | "png"
  | "jpeg"
  | "jpg"
  | "bmp"
  | "webp";

interface ScannedImage {
  id: string;
  dataUrl: string;
  name?: string;
  timestamp?: number;
}

const WATERMARK_TEXT =
  "--This document is created with the demo version of Grewe Web Scan. Visit grewescan.de to purchase a license.";
const QR_CODE_URL = QrCodeImage;
const QR_SIZE_MM = 12.17;
const WATERMARK_FONT_SIZE = 10;
const PADDING_MM = 2;
const WATERMARK_START_PERCENT = 0.2; // 70% down from top

const applyWatermarkAndQr = async (dataUrl: string): Promise<string> => {
  // Watermarking is now handled in PDF generation, so we just return the original image data
  return dataUrl;
};

const processImageForSave = async (
  image: ScannedImage,
  isPremium: boolean
): Promise<string> => {
  if (isPremium) {
    return image.dataUrl;
  }
  // This will now return the original image dataUrl, as PDF watermarking is done separately.
  return await applyWatermarkAndQr(image.dataUrl);
};

// --- HELPER FUNCTION FOR PDF WATERMARKING ---
const addWatermarkToPdf = async (pdf: jsPDF, isPremium: boolean) => {
  if (isPremium) return;

  try {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const qrSize = QR_SIZE_MM;
    const padding = PADDING_MM;

    // Use WATERMARK_START_PERCENT to calculate startY from bottom
    const startY = pageHeight * (1 - WATERMARK_START_PERCENT); // e.g., 0.7 → 30% from bottom
    const startX = padding;

    // Add QR code at startY position
    const qrImgDataUrl = QR_CODE_URL.src;
    pdf.addImage(qrImgDataUrl, "PNG", startX, startY - qrSize, qrSize, qrSize);

    // Vertical text: directly below QR code (bottom-to-top)
    const textX = startX + qrSize / 2; // align with center of QR
    const textY = startY - qrSize; // start right above QR

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(WATERMARK_FONT_SIZE);
    pdf.setTextColor(128, 128, 128); // light gray

    pdf.saveGraphicsState();
    // Rotate -90 degrees around top-left of QR to flow upward in the same vertical line
    pdf.text(WATERMARK_TEXT, textX, textY, { angle: 90, align: "left" });
    pdf.restoreGraphicsState();
  } catch (err) {
    console.error("Error adding vertical watermark:", err);
  }
};


export default function ScannerApp() {
   usePremiumSSE();
  const { t } = useTranslation();
  const dispatch = useDispatch();
 
  const userInfo = useSelector((state: RootState) => state.user.userInfo);

  // Local states
  const [userName, setUserName] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showScannerUI, setShowScannerUI] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState({
    fileName: "",
    folderPath: "",
  });
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isPremiumCheckLoading, setIsPremiumCheckLoading] = useState(true);

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
  } = useScannerIntegration(showScannerUI);



  useEffect(() => {
    if (userInfo?.email) {
      window.__USER_EMAIL__ = userInfo.email;
    }
  }, [userInfo?.email]);


  

  useEffect(() => {
    if (!userInfo?.email) {
      setUserName(null);
      setIsPremiumUser(false);
      setIsPremiumCheckLoading(false);
      return;
    }

    async function fetchUserData() {
      setIsPremiumCheckLoading(true);
      try {
        const email = userInfo?.email?.toLowerCase();

        // 1. Fetch Username
        const userQuery = `*[_type == "user" && lower(email) == $email]{username}`;
        const userResults = await client.fetch(userQuery, { email });
        setUserName(
          userResults.length > 0 ? (userResults[0].username ?? null) : null
        );

        // 2. Check Premium Status
        const premiumQuery = `*[_type == "premiumUser" && lower(email) == $email]`;
        const premiumResults = await client.fetch(premiumQuery, { email });
        setIsPremiumUser(premiumResults.length > 0);
      } catch (err) {
        console.error("Sanity data fetch error:", err);
        setUserName(null);
        setIsPremiumUser(false);
      } finally {
        setIsPremiumCheckLoading(false);
      }
    }

    fetchUserData();
  }, [userInfo?.email]);


  const selectedImage = getSelectedImage();

  const handleDropdownToggle = (menu: string) => {
    setActiveDropdown((current) => (current === menu ? null : menu));
    if (menu !== "user") setShowUserDropdown(false);
  };

  const handleUserDropdownToggle = () => {
    setShowUserDropdown((prev) => !prev);
    if (!showUserDropdown) setActiveDropdown(null);
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      dispatch(signOut());
      setShowUserDropdown(false);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleScanClick = () => scannerName && !isScanning && startScan();

  const handleSaveClick = async (options: SaveOptions) => {
    if (scannedImages.length === 0 || isProcessing || isPremiumCheckLoading)
      return;

    try {
      
      const imagesToSave = options.saveAll
        ? scannedImages
        : getSelectedImages();

      if (imagesToSave.length === 0) {
        throw new Error("No images selected to save");
      }

      console.log("Save operation started:", {
        format: options.format,
        imageCount: imagesToSave.length,
        isPremium: isPremiumUser,
      });

      let fileName = "";
      let folderPath = "";

      // Process based on format and save type
      if (options.saveType === "folder" && options.directoryHandle) {
        // Save multiple files to a folder
        // Pass isPremiumUser to enable conditional watermarking inside the utility
        await saveImagesToFolder(
          imagesToSave,
          options.format,
          options.directoryHandle,
          isPremiumUser
        );
        folderPath = options.fullPath || options.directoryHandle.name;
        if (options.format === "pdf-multi") {
          fileName = "scanned-document.pdf";
        } else if (options.format === "pdf-single") {
          fileName = `${imagesToSave.length} PDF file(s)`;
        } else {
          fileName = `${imagesToSave.length} image file(s)`;
        }
      } else if (options.saveType === "file" && options.fileHandle) {
        // Save to a specific file
        // Pass isPremiumUser to enable conditional watermarking inside the utility
        await saveToFile(
          imagesToSave,
          options.format,
          options.fileHandle,
          isPremiumUser
        );
        fileName = options.fileHandle.name;
        folderPath = options.fullPath || options.fileHandle.name;
      } else {
        throw new Error("Invalid save configuration. Please try again.");
      }


      setSuccessInfo({ fileName, folderPath });
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Save operation failed:", error);
      throw error;
    }
  };

  const handlePrintClick = async () =>
    scannedImages.length && !isProcessing && printDocument();
  const handleMailClick = () => setShowMailModal(true);
  const handleEditClick = () => selectedImage && setShowImageEditor(true);

  const handleImageSave = (editedImage: typeof selectedImage) => {
    if (editedImage) {
      updateImage(editedImage);
    }
  };

  const handleNewDocument = () => {
    createNewDocument();
    setActiveDropdown(null);
  };

  const handleImportImages = (importedImages: typeof scannedImages) => {
    addImportedImages(importedImages);
    setActiveDropdown(null);
  };

  const handleDeleteImage = async (imageId: string) => {
    await deleteImage(imageId);
  };

  const handleDeleteAllImages = () => {
    deleteAllImages();
  };

  const handleUndo = () => {
    undo();
    setActiveDropdown(null);
  };

  const handleRedo = () => {
    redo();
    setActiveDropdown(null);
  };

  const handleCapabilitiesChange = (
    resolution?: number,
    pixelType?: number,
    duplex?: boolean,
    showUI?: boolean,
    discardBlankPages?: boolean
  ) => {
    updateScannerCapabilities(resolution, pixelType, duplex, discardBlankPages);
  };

  const action = t("app_page.action");
  const edit = t("app_page.edit");
  const view = t("app_page.view");

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
  };

  if (isLoadingImages) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t("app_page.loading")}</p>
        </div>
      </div>
    );
  }

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
        userEmail={userInfo?.email || ""}
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
              <div className="text-sm text-gray-700 mb-2">
                {t("app_page.selected.label")}
              </div>
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
              <div className="text-sm text-gray-700 mb-2">
                {t("app_page.operations.label")}
              </div>
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
      <MailModal
        isOpen={showMailModal}
        onClose={() => setShowMailModal(false)}
        scannedImages={getImagesForEmail()}
      />
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
            setActiveDropdown(null);
            setShowUserDropdown(false);
          }}
        />
      )}
    </div>
  );
}

const saveImagesToFolder = async (
  images: ScannedImage[],
  format: SaveFormat,
  directoryHandle: FileSystemDirectoryHandle,
  isPremium: boolean
) => {
  let writable: FileSystemWritableFileStream | null = null;

  try {
    if (format === "pdf-multi") {
      const pdf = new jsPDF();
      let isFirstPage = true;

      for (const image of images) {
        if (!isFirstPage) {
          pdf.addPage();
        }

        const dataUrl = await processImageForSave(image, isPremium);
        const img = await loadImage(dataUrl);

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgAspectRatio = img.width / img.height;
        const pageAspectRatio = pageWidth / pageHeight;

        let imgWidth = pageWidth;
        let imgHeight = pageHeight;

        if (imgAspectRatio > pageAspectRatio) {
          imgHeight = pageWidth / imgAspectRatio;
        } else {
          imgWidth = pageHeight * imgAspectRatio;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(dataUrl, "JPEG", x, y, imgWidth, imgHeight);
        await addWatermarkToPdf(pdf, isPremium);

        isFirstPage = false;
      }

      const pdfBlob = pdf.output("blob");
      const fileName = "scanned-document.pdf";
      const fileHandle = await directoryHandle.getFileHandle(fileName, {
        create: true,
      });
      writable = await fileHandle.createWritable();
      await writable.write(pdfBlob);
      await writable.close();
      writable = null;

    } else if (format === "pdf-single") {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const dataUrl = await processImageForSave(image, isPremium);
        const pdf = new jsPDF();

        const img = await loadImage(dataUrl);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgAspectRatio = img.width / img.height;
        const pageAspectRatio = pageWidth / pageHeight;

        let imgWidth = pageWidth;
        let imgHeight = pageHeight;

        if (imgAspectRatio > pageAspectRatio) {
          imgHeight = pageWidth / imgAspectRatio;
        } else {
          imgWidth = pageHeight * imgAspectRatio;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(dataUrl, "JPEG", x, y, imgWidth, imgHeight);
        await addWatermarkToPdf(pdf, isPremium);

        const pdfBlob = pdf.output("blob");
        const fileName = `scanned-image-${i + 1}.pdf`;
        const fileHandle = await directoryHandle.getFileHandle(fileName, {
          create: true,
        });
        writable = await fileHandle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();
        writable = null;

      }
    } else {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const dataUrl = await processImageForSave(image, isPremium);

        const extension = getFileExtension(format);
        const fileName = `scanned-image-${i + 1}${extension}`;

        const fileHandle = await directoryHandle.getFileHandle(fileName, {
          create: true,
        });
        writable = await fileHandle.createWritable();

        const blob = await convertImageFormat(dataUrl, format);

        await writable.write(blob);
        await writable.close();
        writable = null;

        
      }
    }
  } catch (error) {
    if (writable) {
      try {
        await writable.close();
      } catch (closeErr) {
        console.error("[v1] Error closing writable stream:", closeErr);
      }
    }
    throw new Error(
      `Failed to save files to folder: ${error instanceof Error ? error.message : "Unknown error"}. Please check permissions and try again.`
    );
  }
};

const saveToFile = async (
  images: ScannedImage[],
  format: SaveFormat,
  fileHandle: FileSystemFileHandle,
  isPremium: boolean
) => {
  let writable: FileSystemWritableFileStream | null = null;

  try {
    writable = await fileHandle.createWritable();

    const image = images[0];
    const dataUrl = await processImageForSave(image, isPremium);

    if (format === "pdf-multi" || format === "pdf-single") {
      const pdf = new jsPDF();
      let isFirstPage = true;

      for (const currentImage of images) {
        if (!isFirstPage) {
          pdf.addPage();
        }

        const currentDataUrl = await processImageForSave(
          currentImage,
          isPremium
        );
        const img = await loadImage(currentDataUrl);

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgAspectRatio = img.width / img.height;
        const pageAspectRatio = pageWidth / pageHeight;

        let imgWidth = pageWidth;
        let imgHeight = pageHeight;

        if (imgAspectRatio > pageAspectRatio) {
          imgHeight = pageWidth / imgAspectRatio;
        } else {
          imgWidth = pageHeight * imgAspectRatio;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(currentDataUrl, "JPEG", x, y, imgWidth, imgHeight);
        await addWatermarkToPdf(pdf, isPremium);

        isFirstPage = false;
      }

      const pdfBlob = pdf.output("blob");
      await writable.write(pdfBlob);
    } else if (format === "tiff-multi" || format === "tiff-single") {
      const blob = await convertImageFormat(dataUrl, "png");
      await writable.write(blob);
    } else {
      const blob = await convertImageFormat(dataUrl, format);
      await writable.write(blob);
    }

    await writable.close();
    writable = null;
    
  } catch (error) {
    if (writable) {
      try {
        await writable.close();
      } catch (closeErr) {
        console.error("[v1] Error closing writable stream:", closeErr);
      }
    }
    
    throw new Error(
      `Failed to save file: ${error instanceof Error ? error.message : "Unknown error"}. Please check permissions and try again.`
    );
  }
};

const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Failed to load image - possible CORS issue"));
    img.src = dataUrl;
  });
};

const convertImageFormat = async (
  dataUrl: string,
  format: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      let mimeType = "image/jpeg";
      switch (format) {
        case "jpeg":
          mimeType = "image/jpeg";
          break;
        case "png":
          mimeType = "image/png";
          break;
        case "bmp":
          mimeType = "image/bmp";
          break;
        case "webp":
          mimeType = "image/webp";
          break;
        default:
          mimeType = "image/jpeg";
          break;
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert image"));
          }
        },
        mimeType,
        0.95
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
};

const getFileExtension = (format: string): string => {
  switch (format) {
    case "jpeg":
      return ".jpg";
    case "png":
      return ".png";
    case "bmp":
      return ".bmp";
    case "pdf-single":
    case "pdf-multi":
      return ".pdf";
    case "tiff-single":
    case "tiff-multi":
      return ".tiff";
    case "webp":
      return ".webp";
    default:
      return ".jpg";
  }
};
