"use client"

// Polyfill types for File System Access API if not present
type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
  startIn?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos" | FileSystemHandle;
};

type FileSystemGetDirectoryOptions = {
  id?: string;
  mode?: "read" | "readwrite";
  startIn?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos" | FileSystemHandle;
};

declare global {
  interface Window {
    __selectedDirHandle?: FileSystemDirectoryHandle;
    __selectedFileHandle?: FileSystemFileHandle;
    __selectedFullPath?: string;
  }
}

import React, { useState } from "react"
import {
  X,
  FileImage,
  FileText,
  FolderOpen,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Folder,
} from "lucide-react"
import { useTranslation } from "react-i18next"

interface SaveModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (options: SaveOptions) => Promise<void>
  totalImages: number
  selectedImagesCount: number
  selectedImages?: Array<{ id: string; dataUrl: string }>
}

export interface SaveOptions {
  format: FileFormat
  saveAll: boolean
  savePath: string
  saveType: "folder" | "file"
  directoryHandle?: FileSystemDirectoryHandle
  fileHandle?: FileSystemFileHandle
  fullPath?: string
}

export type FileFormat = "jpeg" | "png" | "pdf-single" | "pdf-multi" | "tiff-single" | "bmp"

interface FormatOption {
  value: FileFormat
  label: string
  extension: string
  isMultiPage: boolean
}

const FORMAT_OPTIONS: FormatOption[] = [
  { value: "jpeg", label: "JPEG", extension: ".jpg", isMultiPage: false },
  { value: "png", label: "PNG", extension: ".png", isMultiPage: false },
  { value: "pdf-single", label: "PDF (Single Page)", extension: ".pdf", isMultiPage: false },
  { value: "pdf-multi", label: "PDF (Multi Page)", extension: ".pdf", isMultiPage: true },
  { value: "tiff-single", label: "TIFF (Single Page)", extension: ".tiff", isMultiPage: false },

  { value: "bmp", label: "BMP", extension: ".bmp", isMultiPage: false },
]

type SaveStep = "format" | "images" | "location" | "saving" | "success" | "error"

export const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalImages,
  selectedImagesCount,
  selectedImages = [],
}) => {
  const {t} = useTranslation();
  const [step, setStep] = useState<SaveStep>("format")
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>("pdf-multi")
  const [saveAll, setSaveAll] = useState(true)
  const [savePath, setSavePath] = useState("")
  const [fullPath, setFullPath] = useState("")
  const [saveType, setSaveType] = useState<"folder" | "file">("folder")
  const [errorMessage, setErrorMessage] = useState("")
  const [showFormatDropdown, setShowFormatDropdown] = useState(false)
  const [fileSystemSupported, setFileSystemSupported] = useState(true)

  React.useEffect(() => {
    const isSupported = "showDirectoryPicker" in window || "showSaveFilePicker" in window
    setFileSystemSupported(isSupported)
  }, [])

  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("format")
        setSelectedFormat("pdf-multi")
        setSaveAll(true)
        setSavePath("")
        setFullPath("")
        setSaveType("folder")
        setErrorMessage("")
        setShowFormatDropdown(false)
        delete (window).__selectedDirHandle
        delete (window).__selectedFileHandle
        delete (window).__selectedFullPath
      }, 300)
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedFormatOption = FORMAT_OPTIONS.find((f) => f.value === selectedFormat)
  const imagesToSave = saveAll ? totalImages : selectedImagesCount

  const handleFormatSelect = (format: FileFormat) => {
    setSelectedFormat(format)
    setShowFormatDropdown(false)
  }

  const handleNext = () => {
    if (step === "format") {
      setStep("images")
    } else if (step === "images") {
      if (imagesToSave === 0) {
        setErrorMessage(t("save_modal.noImagesError"))
        setStep("error")
        return
      }
      setStep("location")
    }
  }

  const handleBack = () => {
    if (step === "images") {
      setStep("format")
    } else if (step === "location") {
      setStep("images")
    }
  }

  const handleBrowse = async () => {
    try {
      const needsFolder = selectedFormatOption?.isMultiPage === false && imagesToSave > 1

      if (!fileSystemSupported) {
        setErrorMessage(t("save_modal.unsupportedBrowserWarning"))
        return
      }

      setErrorMessage("")

      if (needsFolder) {
       if ("showDirectoryPicker" in window) {
  try {
    const dirHandle = await (
      window as Window & typeof globalThis & {
        showDirectoryPicker: (options?: FileSystemGetDirectoryOptions) => Promise<FileSystemDirectoryHandle>;
      }
    ).showDirectoryPicker();

    const folderName: string = dirHandle.name || "Selected Folder";

    setSavePath(folderName);
    setFullPath(folderName);
    setSaveType("folder");

    // Extend window with your custom properties safely
    (window as unknown as {
      __selectedDirHandle?: FileSystemDirectoryHandle;
      __selectedFullPath?: string;
    }).__selectedDirHandle = dirHandle;

    (window as unknown as {
      __selectedDirHandle?: FileSystemDirectoryHandle;
      __selectedFullPath?: string;
    }).__selectedFullPath = folderName;
  } catch (err) {
    if (err instanceof DOMException) {
      if (err.name === "AbortError") {
        setErrorMessage(t("save_modal.abortError"));
      } else if (err.name === "NotAllowedError") {
        setErrorMessage(t("save_modal.deniedError"));
      } else {
        console.error("Directory picker error:", err);
        setErrorMessage(t("save_modal.error_select_folder"));
      }
    } else {
      console.error("Directory picker error:", err);
      setErrorMessage(t("save_modal.error_select_folder"));
    }
  }
}
 else {
          setErrorMessage(t("save_modal.unsupportedBrowserWarning"))
        }
      } else {
        if ("showSaveFilePicker" in window) {
          try {
            const fileExtension = selectedFormatOption?.extension || ".pdf"
            const mimeType = getMimeType(selectedFormat)

            const fileHandle = await (window as Window & typeof globalThis & {
              showSaveFilePicker: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
            }).showSaveFilePicker({
              suggestedName: `scanned-document${fileExtension}`,
              types: [
                {
                  description: `${selectedFormatOption?.label} File`,
                  accept: {
                    [mimeType]: [fileExtension],
                  },
                },
              ],
            })
            const fileName = fileHandle.name || `output${fileExtension}`
            setSavePath(fileName)
            setFullPath(fileName)
            setSaveType("file")
            ;(window ).__selectedFileHandle = fileHandle
            ;(window ).__selectedFullPath = fileName
          } catch (err) {
            if (err && typeof err === "object" && "name" in err) {
              const errorName = (err as { name: string }).name;
              if (errorName === "AbortError") {
                setErrorMessage(t("save_modal.abortError"))
              } else if (errorName === "NotAllowedError") {
                setErrorMessage(t("save_modal.deniedError"))
              } else {
                console.error("File picker error:", err)
                setErrorMessage(t("save_modal.error_select_folder"))
              }
            } else {
              console.error("File picker error:", err)
              setErrorMessage(t("save_modal.error_select_folder"))
            }
          }
        } else {
          setErrorMessage(t("save_modal.unsupportedBrowserWarning"))
        }
      }
    } catch (error) {
      console.error("Error in browse handler:", error)
      setErrorMessage(t("save_modal.unexpectedError"))
    }
  }

  const handleSelectLocation = async () => {
    await handleBrowse()
  }

  const handleSave = async () => {
    if (!savePath.trim()) {
      setErrorMessage(t("save_modal.noLocationError"))
      setStep("error")
      return
    }

    if (imagesToSave === 0) {
      setErrorMessage(t("save_modal.noImagesError"))
      setStep("error")
      return
    }

    setStep("saving")

    try {
      await onConfirm({
        format: selectedFormat,
        saveAll,
        savePath,
        saveType,
        directoryHandle: (window ).__selectedDirHandle,
        fileHandle: (window ).__selectedFileHandle,
        fullPath: (window ).__selectedFullPath || savePath,
      })

      delete (window ).__selectedDirHandle
      delete (window ).__selectedFileHandle
      delete (window ).__selectedFullPath

      setStep("success")
    } catch (error) {
      console.error("Save error:", error)
      setErrorMessage(error instanceof Error ? error.message : t("save_modal.unexpectedError"))
      setStep("error")
    }
  }

  const handleClose = () => {
    if (step === "saving") return
    onClose()
  }

  const renderStepContent = () => {
    switch (step) {
      case "format":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("save_modal.selectFormatTitle")}</h3>
              <p className="text-sm text-gray-600 mb-4">{t("save_modal.selectFormatDescription")}</p>

              <div className="relative">
                <button
                  onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{selectedFormatOption?.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${showFormatDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showFormatDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {FORMAT_OPTIONS.map((format) => (
                      <button
                        key={format.value}
                        onClick={() => handleFormatSelect(format.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                          selectedFormat === format.value ? "bg-blue-50 border-l-4 border-blue-600" : ""
                        }`}
                      >
                        <FileText className="w-5 h-5 text-gray-600" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{format.label}</div>
                          <div className="text-xs text-gray-500">
                            {format.isMultiPage ? t("save_modal.combine") : t("save_modal.onefile")}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <FileImage className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    {selectedFormatOption?.isMultiPage ? (
                      <p>
                        <strong>{t("save_modal.multiPageInfoTitle")}</strong> {t("save_modal.multiPageInfo")}{" "}
                        {selectedFormatOption.label}  {t("save_modal.file")}
                      </p>
                    ) : (
                      <p>
                        <strong>{t("save_modal.singlePageInfoTitle")}</strong>{t("save_modal.singlePageInfo")} {" "}
                        {selectedFormatOption?.label}  {t("save_modal.file")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t("save_modal.cancel")}
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {t("save_modal.next")}
              </button>
            </div>
          </div>
        )

      case "images":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("save_modal.selectImagesTitle")}</h3>
              <p className="text-sm text-gray-600 mb-4">{t("save_modal.selectImagesDescription")}</p>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">{t("save_modal.totalImages")}</span>
                  <span className="text-lg font-bold text-gray-900">{totalImages}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{t("save_modal.selectedImages")}</span>
                  <span className="text-lg font-bold text-blue-600">{selectedImagesCount}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setSaveAll(true)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    saveAll ? "border-blue-600 bg-blue-50" : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      saveAll ? "border-blue-600 bg-blue-600" : "border-gray-400"
                    }`}
                  >
                    {saveAll && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900">{t("save_modal.saveAllImages")}</div>
                    <div className="text-sm text-gray-600">{t("save_modal.saveAllImagesDesc")} {totalImages} {t("save_modal.scanned_images")}</div>
                  </div>
                </button>

                <button
                  onClick={() => setSaveAll(false)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    !saveAll ? "border-blue-600 bg-blue-50" : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      !saveAll ? "border-blue-600 bg-blue-600" : "border-gray-400"
                    }`}
                  >
                    {!saveAll && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900">{t("save_modal.saveSelectedOnly")}</div>
                    <div className="text-sm text-gray-600">
                     {t("save_modal.saveSelectedOnlyDesc")} {selectedImagesCount} {t("save_modal.selected_images")}
                      {selectedImagesCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </button>
              </div>

              {!saveAll && selectedImages.length > 0 && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-3">{t("save_modal.selected_image_preview")}</div>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {selectedImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-500 bg-gray-100"
                      >
                        <img
                          src={image.dataUrl || "/placeholder.svg"}
                          alt={`Selected ${image.id}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!saveAll && selectedImagesCount === 0 && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-900">
                   {t("save_modal.noImagesSelectedWarning")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t("save_modal.back")}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t("save_modal.cancel")}
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t("save_modal.next")}
                </button>
              </div>
            </div>
          </div>
        )

      case "location":
        const needsFolder = selectedFormatOption?.isMultiPage === false && imagesToSave > 1

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("save_modal.chooseLocationTitle")}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {needsFolder ? "Select a folder to save your files." : "Select where to save your file."}
              </p>

              {!fileSystemSupported && (
                <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-900">
                    {t("save_modal.unsupportedBrowserWarning")}
                  </p>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t("save_modal.formatLabel")}</span>
                  <span className="font-medium text-gray-900">{selectedFormatOption?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t("save_modal.imagesToSaveLabel")}</span>
                  <span className="font-medium text-gray-900">{imagesToSave}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600"> {t("save_modal.outputLabel")} </span>
                  <span className="font-medium text-gray-900">
                    {selectedFormatOption?.isMultiPage
                      ? "1 file"
                      : `${imagesToSave} file${imagesToSave !== 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBrowse}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Folder className="w-5 h-5" />
                  {t("save_modal.browse")}
                </button>

                {savePath && (
                  <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
                    <div className="flex items-start gap-3">
                      {needsFolder ? (
                        <FolderOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                      ) : (
                        <File className="w-5 h-5 text-blue-600 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          {needsFolder ? "Selected Folder:" : "Selected File:"}
                        </div>
                        <div className="text-sm text-gray-900 break-all">{savePath}</div>
                      </div>
                    </div>
                  </div>
                )}

                {!savePath && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
                    <p className="text-sm text-gray-500">{t("save_modal.noLocationSelected")}</p>
                  </div>
                )}
              </div>

              {savePath && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-900">
                    <p className="font-medium">{t("save_modal.locationSuccessTitle")}</p>
                    <p className="text-green-700">{t("save_modal.locationSuccessText")}</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-900">{errorMessage}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t("save_modal.back")}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t("save_modal.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!savePath}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("save_modal.save")}
                </button>
              </div>
            </div>
          </div>
        )

      case "saving":
        return (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("save_modal.savingTitle")}</h3>
              <p className="text-sm text-gray-600">
                {t("save_modal.savingText")} {imagesToSave} {t("save_modal.savingImages")}
                {imagesToSave !== 1 ? "s" : ""} {t("save_modal.as")} {selectedFormatOption?.label}.
              </p>
            </div>
          </div>
        )

      case "success":
        return (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("save_modal.successTitle")}</h3>
              <p className="text-sm text-gray-600">
                {t("save_modal.successText")} <strong>{selectedFormatOption?.label}</strong> {t("save_modal.in")} {" "}
                {saveType === "folder" ? t("save_modal.the_selected_folder") : "the selected location"}.
              </p>
              <p className="text-xs text-gray-500 mt-2 break-all">{savePath}</p>
            </div>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t("save_modal.done")}
            </button>
          </div>
        )

      case "error":
        return (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("save_modal.Save Failed")}</h3>
              <p className="text-sm text-gray-600">{errorMessage}</p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t("save_modal.cancel")}
              </button>
              <button
                onClick={() => setStep("format")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
               {t("save_modal.tryAgain")}
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getMimeType = (format: FileFormat): string => {
    switch (format) {
      case "jpeg":
        return "image/jpeg"
      case "png":
        return "image/png"
      case "bmp":
        return "image/bmp"
      case "pdf-single":
      case "pdf-multi":
        return "application/pdf"
      case "tiff-single":
      default:
        return "application/octet-stream"
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity" onClick={handleClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg pointer-events-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{t("save_modal.modalTitle")}</h2>
            {step !== "saving" && (
              <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          <div className="p-6">{renderStepContent()}</div>

          {step !== "saving" && step !== "success" && step !== "error" && (
            <div className="px-6 pb-6">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${step === "format" ? "bg-blue-600" : "bg-gray-300"}`} />
                <div className={`w-2 h-2 rounded-full ${step === "images" ? "bg-blue-600" : "bg-gray-300"}`} />
                <div className={`w-2 h-2 rounded-full ${step === "location" ? "bg-blue-600" : "bg-gray-300"}`} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
