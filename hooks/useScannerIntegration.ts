"use client"

import { useState, useEffect, useCallback } from "react"
import { usePDFGenerator } from "./usePDFGenerator"
import { usePrintHandler } from "./usePrintHandler"
import { useDocumentHistory } from "./useDocumentHistory"

interface ScannedImage {
  id: string
  dataUrl: string
  timestamp: number
}

interface ScannerCapabilities {
  resolution: number
  colorMode: "color" | "grayscale" | "blackwhite"
  paperSize: "auto" | "A4" | "Letter" | string
  duplex: boolean
}

declare global {
  interface Window {
    Encleso: {
      OnReady: (callback: () => void) => void
      SetLicense: (token: string) => Promise<void>
      SetCapabilities: (capabilities: ScannerCapabilities) => void
      StartScan: (scannerName: string, showUI: boolean) => void
      SaveImageToFilesystem: (format: string, indexes: number[]) => void
      GetScannerNames: () => string[]
      OnScanComplete: (callback: (imageData: string) => void) => void
      OnError: (callback: (error: string) => void) => void
    }
  }
}

export const useScannerIntegration = () => {
  const [isReady, setIsReady] = useState(false)
  const [scannerName, setScannerName] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingImages, setIsLoadingImages] = useState(false)

  const { generatePDF } = usePDFGenerator()
  const { printImages } = usePrintHandler()

  // Use document history hook instead of persistent images
  const {
    images: scannedImages,
    selectedImageIds,
    selectedImageId,
    createNewDocument,
    addImages,
    deleteImage,
    updateImage,
    toggleImageSelection,
    setSelectedImage,
    undo,
    redo,
    canUndo,
    canRedo,
    getSelectedImages,
    isImageSelected,
  } = useDocumentHistory()

  const initializeEncleso = useCallback(async () => {
    try {
      // Wait for Encleso to be ready
      if (window.Encleso) {
        window.Encleso.OnReady(async () => {
          try {
            // Get license token from backend
            const response = await fetch("/api/encleso-license", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            })

            if (!response.ok) {
              throw new Error("Failed to get license token")
            }

            const { token } = await response.json()

            // Set license
            await window.Encleso.SetLicense(token)

            // Get available scanners
            const scanners = window.Encleso.GetScannerNames()
            if (scanners && scanners.length > 0) {
              setScannerName(scanners[0])
            }

            // Set up event handlers
            window.Encleso.OnScanComplete((imageData: string) => {
              const newImage: ScannedImage = {
                id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                dataUrl: imageData,
                timestamp: Date.now(),
              }
              addImages([newImage], "Image Scanned")
              setIsScanning(false)
            })

            window.Encleso.OnError((errorMessage: string) => {
              setError(errorMessage)
              setIsScanning(false)
            })

            setIsReady(true)
            setError(null)
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to initialize scanner")
            setIsReady(false)
          }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize Encleso")
    }
  }, [addImages])

  useEffect(() => {
    // Load Encleso script
    const script = document.createElement("script")
    script.src = "https://encleso.com/Assets/scripts/encleso.min.js"
    script.async = true
    script.onload = () => {
      initializeEncleso()
    }
    script.onerror = () => {
      setError("Failed to load Encleso library")
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [initializeEncleso])

  const startScan = useCallback(() => {
    if (!isReady || !scannerName || isScanning) return

    try {
      setIsScanning(true)
      setError(null)

      // Set scanning capabilities
      window.Encleso.SetCapabilities({
        resolution: 300,
        colorMode: "color",
        paperSize: "auto",
        duplex: false,
      })

      // Start scanning
      window.Encleso.StartScan(scannerName, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start scan")
      setIsScanning(false)
    }
  }, [isReady, scannerName, isScanning])

  const saveToPDF = useCallback(
    async (fileName?: string) => {
      const imagesToSave = getSelectedImages().length > 0 ? getSelectedImages() : scannedImages

      if (imagesToSave.length === 0 || isProcessing) return

      try {
        setIsProcessing(true)
        setError(null)
        await generatePDF(imagesToSave, fileName)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save PDF")
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [scannedImages, getSelectedImages, generatePDF, isProcessing],
  )

  const printDocument = useCallback(async () => {
    const imagesToPrint = getSelectedImages().length > 0 ? getSelectedImages() : scannedImages

    if (imagesToPrint.length === 0 || isProcessing) return

    try {
      setIsProcessing(true)
      setError(null)
      await printImages(imagesToPrint)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to print document")
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [scannedImages, getSelectedImages, printImages, isProcessing])

  const addImportedImages = useCallback(
    (importedImages: ScannedImage[]) => {
      addImages(importedImages, "Images Imported")
    },
    [addImages],
  )

  // Enhanced delete function with proper error handling
  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      try {
        deleteImage(imageId)
      } catch (error) {
        console.error("Failed to delete image:", error)
        throw new Error("Failed to delete image. Please try again.")
      }
    },
    [deleteImage],
  )

  // Handle image selection for editing
  const handleImageClick = useCallback(
    (image: ScannedImage) => {
      setSelectedImage(image.id)
    },
    [setSelectedImage],
  )

  // Get the currently selected image object
  const getSelectedImage = useCallback(() => {
    if (!selectedImageId) return null
    return scannedImages.find((img) => img.id === selectedImageId) || null
  }, [selectedImageId, scannedImages])

  // Get images for email (selected or all)
  const getImagesForEmail = useCallback(() => {
    return getSelectedImages().length > 0 ? getSelectedImages() : scannedImages
  }, [scannedImages, getSelectedImages])

  return {
    isReady,
    scannerName,
    isScanning,
    scannedImages,
    error,
    isProcessing,
    isLoadingImages,
    selectedImageIds,
    selectedImageId,
    startScan,
    saveToPDF,
    printDocument,
    addImportedImages,
    updateImage,
    createNewDocument,
    toggleImageSelection,
    deleteImage: handleDeleteImage,
    getSelectedImages,
    isImageSelected,
    getImagesForEmail,
    handleImageClick,
    getSelectedImage,
    // History controls
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
