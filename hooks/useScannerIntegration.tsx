"use client"

import { useState, useEffect, useCallback } from "react"
import { usePDFGenerator } from "./usePDFGenerator"
import { usePrintHandler } from "./usePrintHandler"
import { useDocumentHistory } from "./useDocumentHistory"
import type { ScannedImage } from "@/components/scanner/Dropdown"

interface ScannerResult {
  ScannersList: string[]
  DefaultIndex: number
  ScannedImagesCount: number
  ScannedImagesStartingIndex: number
  TotalImagesCount: number
}

interface ScanReturn {
  ScannedImagesCount: number
  ScannedImagesStartingIndex: number
  TotalImagesCount: number
}

interface ScanError {
  Message: string
}

interface ScannerCapabilities {
  Resolution?: {
    Values: number[]
    CurrentIndex: number
  }
  PixelType?: {
    Values: number[]
    CurrentIndex?: number
  }
}

export interface EnclesoType {
  OnReady?: (ret: ScannerResult) => void
  OnError?: (err: ScanError) => void
  SetCapabilities: (cap: {
    Resolution?: number
    PixelType?: number
  }) => Promise<void>
  StartScan: (scannerName: string, showUI: boolean) => Promise<ScanReturn>
  GetImagePreview: (index: number) => Promise<Blob | string>
  GetCapabilities?: (scannerName: string) => Promise<ScannerCapabilities>
  PixelTypeToString?: (v: number) => string
}

declare global {
  interface Window {
    Encleso?: EnclesoType
    ExportedScannerNames?: string[]
    getResolutionCaps?: () => Promise<number[]> // ✅ from encleso.js
    getColorModeCaps?: () => Promise<string[]> // ✅ from encleso.js
    showSaveFilePicker?: (options: {
      suggestedName?: string
      types?: Array<{
        description: string
        accept: { [key: string]: string[] }
      }>
    }) => Promise<FileSystemFileHandle>
  }
}

export const useScannerIntegration = () => {
  const [isReady, setIsReady] = useState(false)
  const [scanners, setScanners] = useState<string[]>([])
  const [scannerName, setScannerName] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingImages] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [resolutionCapsFn, setResolutionCapsFn] = useState<(() => Promise<number[]>) | null>(null)
  const [colorModeCapsFn, setColorModeCapsFn] = useState<(() => Promise<string[]>) | null>(null)

  const [currentResolution, setCurrentResolution] = useState<number | null>(null)
  const [currentPixelType, setCurrentPixelType] = useState<number | null>(null)

  const { generatePDF } = usePDFGenerator()
  const { printImages } = usePrintHandler()
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.Encleso || window.ExportedScannerNames) {
        setScriptLoaded(true)

        if (typeof window.getResolutionCaps === "function") setResolutionCapsFn(() => window.getResolutionCaps!)

        if (typeof window.getColorModeCaps === "function") setColorModeCapsFn(() => window.getColorModeCaps!)

        clearInterval(interval) // stop polling once script is found
      }
    }, 500)

    // immediate check
    if (window.Encleso || window.ExportedScannerNames) {
      setScriptLoaded(true)
      clearInterval(interval)
    }

    return () => clearInterval(interval)
  }, [])

  // ✅ Load SDK script
  // useEffect(() => {
  //   if (window.ExportedScannerNames) {
  //     setScriptLoaded(true);
  //     return;
  //   }

  //   const script = document.createElement("script");
  //   script.src = "https://encleso.com/Assets/scripts/encleso.min.js";
  //   script.async = true;
  //   script.onload = () => setScriptLoaded(true);
  //   script.onerror = () => setError("Failed to load Encleso SDK script.");
  //   document.head.appendChild(script);

  //   return () => {
  //     if (document.head.contains(script)) {
  //       document.head.removeChild(script);
  //     }
  //   };
  // }, []);

  const initializeEncleso = useCallback(() => {
    const Encleso = window.Encleso

    if (!scriptLoaded || (!Encleso && !window.ExportedScannerNames)) {
      setError("Encleso SDK not available.")
      return
    }

    if (window.ExportedScannerNames) {
      setTimeout(() => {
        setIsReady(true)
        setScanners(window.ExportedScannerNames || [])

        if (!scannerName && window.ExportedScannerNames?.length) {
  setScannerName(window.ExportedScannerNames[0]);
}

        setError(null)
      }, 1000)
      return
    }

    if (Encleso) {
      Encleso.OnError = (err) => {
        console.error("Scanner Error:", err?.Message || err)
        setIsReady(false)
        setError(`Scanner Error: ${err?.Message || "Unknown error"}`)
        setIsScanning(false)
      }

      Encleso.OnReady = (ret) => {
        if (ret?.ScannersList?.length > 0) {
          const list = ret.ScannersList
          setIsReady(true)
          setScanners(list)

          if (!scannerName) {
            setScannerName(list[ret.DefaultIndex] || list[0])
          }

          setError(null)
        } else {
          setIsReady(false)
          setScanners([])
          if (!scannerName) setScannerName(null)
          setError("No scanners found.")
        }
      }
    }
  }, [scriptLoaded, scannerName])

  // Polling
  useEffect(() => {
    if (!scriptLoaded) return

    const interval = setInterval(() => {
      const Encleso = window.Encleso
      if (Encleso || window.ExportedScannerNames) {
        initializeEncleso()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [initializeEncleso, scriptLoaded])

  // ✅ convert base64 to Blob
  const base64ToBlob = (base64String: string, mimeType = "image/png"): Blob => {
    let base64 = base64String

    const dataUrlMatch = base64String.match(/^data:(.*);base64,(.*)$/)
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1]
      base64 = dataUrlMatch[2]
    }

    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  // ✅ start scan
  const startScan = useCallback(async () => {
  if (!isReady || !scannerName || isScanning) {
    console.warn("⏳ Scan blocked:", {
      isReady,
      scannerName,
      isScanning,
    });
    return;
  }

  setError(null);
  setIsScanning(true);

  try {
    const Encleso = window.Encleso;
    if (!Encleso) throw new Error("Encleso SDK is not available.");

    // 🔍 Debug logs before scan starts
    // console.log("🖨️ Scanner Selected:", scannerName);
    // console.log("📐 Resolution Selected:", currentResolution ?? "Default (300)");
    // console.log("🎨 Color Mode Selected:", currentPixelType ?? "Default (1)");

    const capabilities: { Resolution?: number; PixelType?: number } = {};
    if (currentResolution !== null) capabilities.Resolution = currentResolution;
    if (currentPixelType !== null) capabilities.PixelType = currentPixelType;

    // Apply capabilities if any are set, otherwise use defaults
    if (Object.keys(capabilities).length > 0) {
      // console.log("⚙️ Applying Capabilities:", capabilities);
      await Encleso.SetCapabilities(capabilities);
    } else {
      // console.log("⚙️ Applying Default Capabilities:", { Resolution: 300, PixelType: 1 });
      await Encleso.SetCapabilities({
        Resolution: 300,
        PixelType: 1,
      });
    }

    // console.log("▶️ Starting Scan...");
    const ret = await Encleso.StartScan(scannerName, false);
    // console.log("✅ Scan started:", ret);

    const newImages: ScannedImage[] = [];

    for (let i = ret.ScannedImagesStartingIndex; i < ret.ScannedImagesStartingIndex + ret.ScannedImagesCount; i++) {
      try {
        // console.log(`🔄 Fetching preview for image index ${i}...`);
        const result = await Encleso.GetImagePreview(i);
        let imageUrl: string;

        if (result instanceof Blob) {
          imageUrl = URL.createObjectURL(result);
        } else if (typeof result === "string") {
          if (result.startsWith("blob:") || result.startsWith("data:image")) {
            imageUrl = result;
          } else if (/^[A-Za-z0-9+/=\r\n]+$/.test(result.trim())) {
            const blob = base64ToBlob(`data:image/png;base64,${result.trim()}`);
            imageUrl = URL.createObjectURL(blob);
          } else if (result.startsWith("http") || /\.(png|jpg|jpeg|bmp|gif|tif)$/i.test(result)) {
            const response = await fetch(result);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const blob = await response.blob();
            imageUrl = URL.createObjectURL(blob);
          } else {
            throw new Error(`Unrecognized image format at index ${i}`);
          }
        } else {
          throw new Error(`Invalid image data at index ${i}`);
        }

        // console.log(`🖼️ Image ready at index ${i}:`, imageUrl);

        newImages.push({
          id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          dataUrl: imageUrl,
          timestamp: Date.now(),
          
        });
      } catch (e) {
        console.error(`❌ Failed to load image at index ${i}:`, e);
        setError(`Error loading scanned image preview (Page ${i + 1})`);
      }
    }

    if (newImages.length > 0) {
      // console.log("📥 Adding scanned images:", newImages);
      addImages(newImages, "Image Scanned");
    } else {
      console.warn("⚠️ Scan completed, but no images could be previewed.");
      setError("Scan completed, but no images could be previewed.");
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("🚨 Scan error:", err);
    setError(errorMessage);
  } finally {
    // console.log("⏹️ Scan process finished");
    setIsScanning(false);
  }
}, [isReady, scannerName, isScanning, addImages, currentResolution, currentPixelType]);

  // ✅ save to PDF
  const saveToPDF = useCallback(async () => {
    const imagesToSave = getSelectedImages().length > 0 ? getSelectedImages() : scannedImages
    const defaultFileName = `scanned_document_${Date.now()}`

    if (imagesToSave.length === 0 || isProcessing) return

    try {
      setIsProcessing(true)
      setError(null)

      let fileHandle: FileSystemFileHandle | undefined
      if (window.showSaveFilePicker) {
        try {
          fileHandle = await window.showSaveFilePicker({
            suggestedName: `${defaultFileName}.pdf`,
            types: [
              {
                description: "PDF Files",
                accept: { "application/pdf": [".pdf"] },
              },
            ],
          })
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            setIsProcessing(false)
            return
          }
          throw err
        }
      }

      await generatePDF(imagesToSave, defaultFileName, fileHandle)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save PDF")
    } finally {
      setIsProcessing(false)
    }
  }, [scannedImages, getSelectedImages, generatePDF, isProcessing])

  // ✅ print
  const printDocument = useCallback(async () => {
    const imagesToPrint = getSelectedImages().length > 0 ? getSelectedImages() : scannedImages
    if (imagesToPrint.length === 0 || isProcessing) return

    try {
      setIsProcessing(true)
      setError(null)
      await printImages(imagesToPrint)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to print document")
    } finally {
      setIsProcessing(false)
    }
  }, [scannedImages, getSelectedImages, printImages, isProcessing])

  // ✅ other helpers
  const addImportedImages = useCallback(
    (importedImages: ScannedImage[]) => addImages(importedImages, "Images Imported"),
    [addImages],
  )

  const handleDeleteImage = useCallback((imageId: string) => deleteImage(imageId), [deleteImage])

  const handleImageClick = useCallback((image: ScannedImage) => setSelectedImage(image.id), [setSelectedImage])

  const getSelectedImage = useCallback(() => {
    if (!selectedImageId) return null
    return scannedImages.find((img) => img.id === selectedImageId) || null
  }, [selectedImageId, scannedImages])

  const getImagesForEmail = useCallback(
    () => (getSelectedImages().length > 0 ? getSelectedImages() : scannedImages),
    [scannedImages, getSelectedImages],
  )

  const updateScannerCapabilities = useCallback((resolution?: number, pixelType?: number) => {
    if (resolution !== undefined) setCurrentResolution(resolution)
    if (pixelType !== undefined) setCurrentPixelType(pixelType)
  }, [])

  return {
    isReady,
    scanners,
    scannerName,
    setScannerName,
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
    undo,
    redo,
    canUndo,
    canRedo,
    getResolutionCaps: resolutionCapsFn, // will be null until SDK ready
    getColorModeCaps: colorModeCapsFn, // will be null until SDK ready
    updateScannerCapabilities,
  }
}
