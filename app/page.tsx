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
import { useRouter } from "next/navigation";
import { signOut as firebaseSignOut } from "firebase/auth";

import { client } from "@/sanity/lib/client";
import { auth } from "@/firebase/firebase";
import { signOut } from "@/redux/slice";
import type { RootState } from "@/redux/store";

import { ScannerStatus } from "@/components/ScannerStatus";
import { ScannedImages } from "@/components/ScannedImages";
import { MailModal } from "@/components/MailModal";
import { ImageEditor } from "@/components/ImageEditor";
import { LoginRequired } from "@/components/scanner/LoginRequired";
import { MenuBar } from "@/components/scanner/MenuBar";
import { Toolbar } from "@/components/scanner/Toolbar";
import Header from "@/components/scanner/Header";

import { useScannerIntegration } from "@/hooks/useScannerIntegration";
import Marquee from "@/components/scanner/Advertise";
import { useTranslation } from "react-i18next";

interface DropdownItem {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
}

export default function ScannerApp() {
  const { t } = useTranslation();
  // Redux & Router
  const dispatch = useDispatch();
  const router = useRouter();
  const userInfo = useSelector((state: RootState) => state.user.userInfo);

  // Local states
  const [userName, setUserName] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showScannerUI, setShowScannerUI] = useState(true);

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
  } = useScannerIntegration(showScannerUI);

  useEffect(() => {
    if (userInfo?.email) {
      window.__USER_EMAIL__ = userInfo.email;
    }
  }, [userInfo?.email]);

  // Fetch username from Sanity on email change
  useEffect(() => {
    if (!userInfo?.email) return;

    async function fetchUsername() {
      try {
        const query = `*[_type == "user" && email == $email]{username}`;
        const results = await client.fetch(query, { email: userInfo?.email });
        setUserName(results?.[0]?.username ?? null);
      } catch (err) {
        console.error("Sanity fetch error:", err);
      }
    }
    fetchUsername();
  }, [userInfo?.email]);

  // Redirect if not logged in
  if (!userInfo?.email) return <LoginRequired />;

  // Selected image from scanned images
  const selectedImage = getSelectedImage();

  // Handlers
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
      router.push("/signin");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Toolbar action handlers
  const handleScanClick = () => scannerName && !isScanning && startScan();
  const handleSaveClick = async () =>
    scannedImages.length && !isProcessing && saveToPDF();
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
    duplex?: boolean
  ) => {
    updateScannerCapabilities(resolution, pixelType, duplex);
  };
  const action = t("app_page.action");
  const edit = t("app_page.edit");
  const view = t("app_page.view");


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
};
  // Loading state UI
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
