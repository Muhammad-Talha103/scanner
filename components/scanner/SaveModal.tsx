"use client"

import { useState } from "react"
import { X, Save, FileText, Folder, File } from "lucide-react"

interface SaveModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    format: string,
    savePath: string,
    saveMode: "folder" | "file",
    directoryHandle?: FileSystemDirectoryHandle,
    fileHandle?: FileSystemFileHandle,
  ) => void
}

export const SaveModal = ({ isOpen, onClose, onSave }: SaveModalProps) => {
  const [selectedFormat, setSelectedFormat] = useState<string>("PDF")
  const [savePath, setSavePath] = useState<string>("")
  const [saveMode, setSaveMode] = useState<"folder" | "file">("folder")
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)

  const formats = ["PDF", "JPEG", "PNG", "Multi-page TIFF", "TIFF", "BMP"]

  // Check if File System Access API is supported
  const isFileSystemAccessSupported = typeof window !== "undefined" && "showDirectoryPicker" in window

  const handleFolderSelect = async () => {
    if (!isFileSystemAccessSupported) {
      alert("Your browser doesn't support folder selection. Files will be downloaded to your default download folder.")
      return
    }

    try {
      // @ts-ignore - File System Access API
      const dirHandle = await window.showDirectoryPicker()
      setDirectoryHandle(dirHandle)
      setSavePath(dirHandle.name)
      setSaveMode("folder")
    } catch (err) {
      console.log("Folder selection cancelled or failed:", err)
    }
  }

  const handleFileSelect = async () => {
    if (!isFileSystemAccessSupported) {
      alert("Your browser doesn't support file selection. Files will be downloaded to your default download folder.")
      return
    }

    try {
      const ext = selectedFormat === "Multi-page TIFF" ? "tiff" : selectedFormat.toLowerCase()
      const suggestedName = `scan.${ext}`

      // @ts-ignore - File System Access API
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: `${selectedFormat} File`,
            accept: {
              [`image/${ext === "jpg" ? "jpeg" : ext}`]: [`.${ext}`],
            },
          },
        ],
      })
      setFileHandle(handle)
      setSavePath(handle.name)
      setSaveMode("file")
    } catch (err) {
      console.log("File selection cancelled or failed:", err)
    }
  }

  const handleSave = () => {
    if (!savePath.trim()) {
      alert("Please select a save location")
      return
    }
    onSave(selectedFormat, savePath, saveMode, directoryHandle || undefined, fileHandle || undefined)
    onClose()
    // Reset form
    setSelectedFormat("PDF")
    setSavePath("")
    setDirectoryHandle(null)
    setFileHandle(null)
    setSaveMode("folder")
  }

  const handleCancel = () => {
    onClose()
    // Reset form
    setSelectedFormat("PDF")
    setSavePath("")
    setDirectoryHandle(null)
    setFileHandle(null)
    setSaveMode("folder")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Save Workflow</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">In which format do you want to save?</label>
            <div className="space-y-2">
              {formats.map((format) => (
                <label key={format} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="format"
                    value={format}
                    checked={selectedFormat === format}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">{format}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Where do you want to save on your computer?
            </label>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="text"
                value={savePath}
                readOnly
                placeholder="No location selected"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleFolderSelect}
                className="flex-1 px-3 py-2 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 flex items-center justify-center space-x-2 text-sm transition-colors"
              >
                <Folder className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">Browse Folder</span>
              </button>

              {selectedFormat === "PDF" && (
                <button
                  onClick={handleFileSelect}
                  className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 flex items-center justify-center space-x-2 text-sm transition-colors"
                >
                  <File className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700 font-medium">Save As File</span>
                </button>
              )}
            </div>

            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-600">
                <strong>Browse Folder:</strong> Save files with naming pattern (grewescanner_1, grewescanner_2, etc.)
              </p>
              {selectedFormat === "PDF" && (
                <p className="text-xs text-gray-600">
                  <strong>Save As File:</strong> Combine all images into a single PDF file
                </p>
              )}
              {!isFileSystemAccessSupported && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Your browser doesn't support advanced file selection. Files will be downloaded to your default
                  folder.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!savePath}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors flex items-center space-x-2 ${
              savePath ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  )
}
