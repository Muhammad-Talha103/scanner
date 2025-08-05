"use client"

import type React from "react"
import { useRef } from "react"

interface ScannedImage {
  id: string
  dataUrl: string
  timestamp: number
}

interface ImportHandlerProps {
  onImagesImported: (images: ScannedImage[]) => void
  children: React.ReactNode
}

export const ImportHandler: React.FC<ImportHandlerProps> = ({ onImagesImported, children }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const validImageTypes = ["image/png", "image/jpg", "image/jpeg"]
    const validFiles = Array.from(files).filter((file) => validImageTypes.includes(file.type))

    if (validFiles.length === 0) {
      alert("Please select valid image files (PNG, JPG, JPEG)")
      return
    }

    try {
      const importedImages: ScannedImage[] = []

      for (const file of validFiles) {
        try {
          const dataUrl = await fileToDataUrl(file)
          const importedImage: ScannedImage = {
            id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dataUrl,
            timestamp: Date.now(),
          }
          importedImages.push(importedImage)
        } catch (error) {
          console.error("Error processing file:", file.name, error)
          // Continue with other files
        }
      }

      if (importedImages.length > 0) {
        onImagesImported(importedImages)
      }
    } catch (error) {
      console.error("Error importing images:", error)
      alert("Error importing images. Please try again.")
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error("Failed to read file"))
        }
      }
      reader.onerror = () => reject(new Error("File reading error"))
      reader.readAsDataURL(file)
    })
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/jpg"
        multiple
        onChange={handleFileChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />
      <div onClick={handleImportClick}>{children}</div>
    </>
  )
}
