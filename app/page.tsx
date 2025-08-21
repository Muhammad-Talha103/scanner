"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Mail,
  Plus,
  Grid3X3,
  Maximize,
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
import { Header } from "@/components/scanner/Header";

import { useScannerIntegration } from "@/hooks/useScannerIntegration";

interface DropdownItem {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function ScannerApp() {
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

  // Scanner integration hooks
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
  } = useScannerIntegration();

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

  const handleUndo = () => {
    undo();
    setActiveDropdown(null);
  };

  const handleRedo = () => {
    redo();
    setActiveDropdown(null);
  };

  // Menu items config
  const menuItems: Record<string, DropdownItem[]> = {
    action: [
      {
        label: "New Document",
        icon: <Plus className="w-4 h-4" />,
        shortcut: "Ctrl+N",
        onClick: handleNewDocument,
        disabled: true,
      },
      {
        label: "Open",
        icon: <FolderOpen className="w-4 h-4" />,
        shortcut: "Ctrl+O",
        disabled: true,
      },
      {
        label: "Import",
        icon: <Download className="w-4 h-4" />,
        shortcut: "Ctrl+I",
        onClick: () => {},
        disabled: false,
      },
      {
        label: "Export",
        icon: <Send className="w-4 h-4" />,
        shortcut: "Ctrl+E",
        disabled: true,
      },
      {
        label: "Send",
        icon: <Mail className="w-4 h-4" />,
        shortcut: "Ctrl+S",
        disabled: true,
      },
      {
        label: "Exit",
        icon: <LogOut className="w-4 h-4" />,
        shortcut: "Alt+F4",
        disabled: true,
      },
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
      {
        label: "Cut",
        icon: <Scissors className="w-4 h-4" />,
        shortcut: "Ctrl+X",
        disabled: true,
      },
      {
        label: "Copy",
        icon: <Copy className="w-4 h-4" />,
        shortcut: "Ctrl+C",
        disabled: true,
      },
      {
        label: "Paste",
        icon: <Paste className="w-4 h-4" />,
        shortcut: "Ctrl+V",
        disabled: true,
      },
      {
        label: "Select All",
        icon: <Grid3X3 className="w-4 h-4" />,
        shortcut: "Ctrl+A",
        disabled: true,
      },
    ],
    view: [
      {
        label: "Zoom In",
        icon: <ZoomIn className="w-4 h-4" />,
        shortcut: "Ctrl++",
        disabled: true,
      },
      {
        label: "Zoom Out",
        icon: <ZoomOut className="w-4 h-4" />,
        shortcut: "Ctrl+-",
        disabled: true,
      },
      {
        label: "Fit to Window",
        icon: <Monitor className="w-4 h-4" />,
        shortcut: "Ctrl+0",
        disabled: true,
      },
      {
        label: "Full Screen",
        icon: <Maximize className="w-4 h-4" />,
        shortcut: "F11",
        disabled: true,
      },
      {
        label: "Thumbnails",
        icon: <Paste className="w-4 h-4" />,
        shortcut: "Ctrl+T",
        disabled: true,
      },
      {
        label: "Properties",
        icon: <Info className="w-4 h-4" />,
        shortcut: "Alt+Enter",
        disabled: true,
      },
    ],
    extras: [
      {
        label: "Preferences",
        icon: <Settings className="w-4 h-4" />,
        shortcut: "Ctrl+,",
        disabled: true,
      },
      {
        label: "Scanner Settings",
        icon: <FileText className="w-4 h-4" />,
        disabled: true,
      },
      {
        label: "OCR Settings",
        icon: <Eye className="w-4 h-4" />,
        disabled: true,
      },
      {
        label: "Plugins",
        icon: <Grid3X3 className="w-4 h-4" />,
        disabled: true,
      },
      {
        label: "Help",
        icon: <HelpCircle className="w-4 h-4" />,
        shortcut: "F1",
        disabled: true,
      },
      { label: "About", icon: <Info className="w-4 h-4" />, disabled: true },
    ],
  };

  // Loading state UI
  if (isLoadingImages) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading saved images...</p>
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

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-40 bg-gray-100 border-b lg:border-b-0 lg:border-r border-gray-300 p-3">
          <ScannerStatus
            isReady={isReady}
            scannerName={scannerName}
            error={error}
          />

          {selectedImage && (
            <section className="mt-4 pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-700 mb-2">Selected:</div>
              <div className="text-xs text-gray-600">
                {selectedImage.id.startsWith("import-")
                  ? "Imported"
                  : "Scanned"}{" "}
                Image
              </div>
            </section>
          )}

          {getSelectedImages().length > 0 && (
            <section className="mt-4 pt-4 border-t border-gray-300">
              <div className="text-sm text-gray-700 mb-2">For Operations:</div>
              <div className="text-xs text-gray-600">
                {getSelectedImages().length} image
                {getSelectedImages().length !== 1 ? "s" : ""} selected
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
