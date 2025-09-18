"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  Duplex?: {
    Supported: boolean
    Enabled: boolean
    ChangeAllowed: boolean
  }
}

export interface EnclesoType {
  OnReady?: (ret: ScannerResult) => void
  OnError?: (err: ScanError) => void
  SetCapabilities: (cap: {
    Resolution?: number
    PixelType?: number
    Duplex?: boolean
  }) => Promise<void>
  StartScan: (scannerName: string, showUI: boolean) => Promise<ScanReturn>
  GetImagePreview: (index: number) => Promise<Blob | string>
  GetCapabilities?: (scannerName: string) => Promise<ScannerCapabilities>
  PixelTypeToString?: (v: number) => string
  ImageLibGetCount?: () => Promise<number>
  ImageLibRemove?: (idxList: number[]) => Promise<{ RemovedImageCount: number; NewCount: number }> // ✅ fixed
}

declare global {
  interface Window {
    Encleso?: EnclesoType
    ExportedScannerNames?: string[]
    getResolutionCaps?: () => Promise<number[]>
    getColorModeCaps?: () => Promise<string[]>
    showSaveFilePicker?: (options: {
      suggestedName?: string
      types?: Array<{
        description: string
        accept: { [key: string]: string[] }
      }>
    }) => Promise<FileSystemFileHandle>
  }
}

// Extend ScannedImage to remember Encleso index and add source type
interface ExtendedScannedImage extends ScannedImage {
  sourceIndex?: number
  timestamp: number
  sourceType: "scanned" | "imported" // Added source type to distinguish between scanned and imported images
}

interface StoredImportedImage {
  id: string
  dataUrl: string
  timestamp: number
  sourceType: "imported"
}

interface StoredScannedImageMetadata {
  sourceIndex: number
  timestamp: number
  id: string
}

const DB_NAME = "ScannerImagesDB"
const DB_VERSION = 2 // Incremented version to handle schema update
const STORE_NAME = "importedImages"
const SCANNED_METADATA_STORE = "scannedMetadata" // New store for scanned image metadata

class ImageStorageDB {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create imported images store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
          store.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains(SCANNED_METADATA_STORE)) {
          const metadataStore = db.createObjectStore(SCANNED_METADATA_STORE, { keyPath: "sourceIndex" })
          metadataStore.createIndex("timestamp", "timestamp", { unique: false })
        }
      }
    })
  }

  async saveImages(images: StoredImportedImage[]): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      // Clear existing images first
      const clearRequest = store.clear()
      clearRequest.onsuccess = () => {
        // Add all images
        let completed = 0
        const total = images.length

        if (total === 0) {
          resolve()
          return
        }

        images.forEach((image) => {
          const addRequest = store.add(image)
          addRequest.onsuccess = () => {
            completed++
            if (completed === total) resolve()
          }
          addRequest.onerror = () => reject(addRequest.error)
        })
      }
      clearRequest.onerror = () => reject(clearRequest.error)
    })
  }

  async loadImages(): Promise<StoredImportedImage[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async saveScannedMetadata(metadata: StoredScannedImageMetadata[]): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SCANNED_METADATA_STORE], "readwrite")
      const store = transaction.objectStore(SCANNED_METADATA_STORE)

      // Clear existing metadata first
      const clearRequest = store.clear()
      clearRequest.onsuccess = () => {
        let completed = 0
        const total = metadata.length

        if (total === 0) {
          resolve()
          return
        }

        metadata.forEach((meta) => {
          const addRequest = store.add(meta)
          addRequest.onsuccess = () => {
            completed++
            if (completed === total) resolve()
          }
          addRequest.onerror = () => reject(addRequest.error)
        })
      }
      clearRequest.onerror = () => reject(clearRequest.error)
    })
  }

  async loadScannedMetadata(): Promise<StoredScannedImageMetadata[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SCANNED_METADATA_STORE], "readonly")
      const store = transaction.objectStore(SCANNED_METADATA_STORE)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async removeScannedMetadata(sourceIndex: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SCANNED_METADATA_STORE], "readwrite")
      const store = transaction.objectStore(SCANNED_METADATA_STORE)
      const request = store.delete(sourceIndex)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async removeImage(imageId: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(imageId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME, SCANNED_METADATA_STORE], "readwrite")
      const importedStore = transaction.objectStore(STORE_NAME)
      const metadataStore = transaction.objectStore(SCANNED_METADATA_STORE)

      let completed = 0
      const total = 2

      const checkComplete = () => {
        completed++
        if (completed === total) resolve()
      }

      const clearImported = importedStore.clear()
      clearImported.onsuccess = checkComplete
      clearImported.onerror = () => reject(clearImported.error)

      const clearMetadata = metadataStore.clear()
      clearMetadata.onsuccess = checkComplete
      clearMetadata.onerror = () => reject(clearMetadata.error)
    })
  }
}

export const useScannerIntegration = (showScannerUI: boolean) => {
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
  const [currentDuplex, setCurrentDuplex] = useState<boolean | null>(null)

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

  const restoredRef = useRef(false)
  const imageStorageDB = useRef(new ImageStorageDB())

  const saveImportedImagesToStorage = useCallback(async (images: ExtendedScannedImage[]) => {
    try {
      const importedImages = images.filter((img) => img.sourceType === "imported")
      const storageData: StoredImportedImage[] = importedImages.map((img) => ({
        id: img.id,
        dataUrl: img.dataUrl,
        timestamp: img.timestamp,
        sourceType: "imported",
      }))
      await imageStorageDB.current.saveImages(storageData)
    } catch (err) {
      console.error("Failed to save imported images to IndexedDB:", err)
    }
  }, [])

  const saveScannedMetadataToStorage = useCallback(async (images: ExtendedScannedImage[]) => {
    try {
      const scannedImages = images.filter((img) => img.sourceType === "scanned" && img.sourceIndex !== undefined)
      const metadataArray: StoredScannedImageMetadata[] = scannedImages.map((img) => ({
        sourceIndex: img.sourceIndex!,
        timestamp: img.timestamp,
        id: img.id,
      }))
      await imageStorageDB.current.saveScannedMetadata(metadataArray)
    } catch (err) {
      console.error("Failed to save scanned metadata to IndexedDB:", err)
    }
  }, [])

  const loadImportedImagesFromStorage = useCallback(async (): Promise<StoredImportedImage[]> => {
    try {
      return await imageStorageDB.current.loadImages()
    } catch (err) {
      console.error("Failed to load imported images from IndexedDB:", err)
      return []
    }
  }, [])

  const loadScannedMetadataFromStorage = useCallback(async (): Promise<StoredScannedImageMetadata[]> => {
    try {
      return await imageStorageDB.current.loadScannedMetadata()
    } catch (err) {
      console.error("Failed to load scanned metadata from IndexedDB:", err)
      return []
    }
  }, [])

  const removeImportedImageFromStorage = useCallback(async (imageId: string) => {
    try {
      await imageStorageDB.current.removeImage(imageId)
    } catch (err) {
      console.error("Failed to remove imported image from IndexedDB:", err)
    }
  }, [])

  const removeScannedMetadataFromStorage = useCallback(async (sourceIndex: number) => {
    try {
      await imageStorageDB.current.removeScannedMetadata(sourceIndex)
    } catch (err) {
      console.error("Failed to remove scanned metadata from IndexedDB:", err)
    }
  }, [])

  const clearImportedImagesFromStorage = useCallback(async () => {
    try {
      await imageStorageDB.current.clearAll()
    } catch (err) {
      console.error("Failed to clear imported images from IndexedDB:", err)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.Encleso || window.ExportedScannerNames) {
        setScriptLoaded(true)

        if (typeof window.getResolutionCaps === "function") setResolutionCapsFn(() => window.getResolutionCaps!)
        if (typeof window.getColorModeCaps === "function") setColorModeCapsFn(() => window.getColorModeCaps!)

        clearInterval(interval)
      }
    }, 500)

    if (window.Encleso || window.ExportedScannerNames) {
      setScriptLoaded(true)
      clearInterval(interval)
    }

    return () => clearInterval(interval)
  }, [])

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
        if (!scannerName && window.ExportedScannerNames && window.ExportedScannerNames.length > 0) setScannerName(window.ExportedScannerNames[0])
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
          if (!scannerName) setScannerName(list[ret.DefaultIndex] || list[0])
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

  const restoreImages = async () => {
    try {
      const Encleso = window.Encleso
      if (restoredRef.current) return

      const allRestoredImages: ExtendedScannedImage[] = []

      // Load stored data
      const storedImportedImages = await loadImportedImagesFromStorage()
      const storedScannedMetadata = await loadScannedMetadataFromStorage()

      // Create a map of scanned metadata by sourceIndex for quick lookup
      const scannedMetadataMap = new Map<number, StoredScannedImageMetadata>()
      storedScannedMetadata.forEach((meta) => {
        scannedMetadataMap.set(meta.sourceIndex, meta)
      })

      // Restore scanned images from Encleso with their original timestamps
      if (Encleso) {
        const total = await Encleso.ImageLibGetCount?.()
        if (total && total > 0) {
          for (let i = 0; i < total; i++) {
            try {
              const result = await Encleso.GetImagePreview(i)
              let imageUrl: string

              if (result instanceof Blob) {
                imageUrl = URL.createObjectURL(result)
              } else if (typeof result === "string") {
                if (result.startsWith("blob:") || result.startsWith("data:image")) {
                  imageUrl = result
                } else {
                  const blob = base64ToBlob(`data:image/png;base64,${result.trim()}`)
                  imageUrl = URL.createObjectURL(blob)
                }
              } else {
                continue
              }

              // Use stored timestamp if available, otherwise use current time as fallback
              const metadata = scannedMetadataMap.get(i)
              const timestamp = metadata ? metadata.timestamp : Date.now() - (total - i) * 1000
              const imageId = metadata ? metadata.id : `restored-${i}-${Date.now()}`

              allRestoredImages.push({
                id: imageId,
                dataUrl: imageUrl,
                sourceIndex: i,
                timestamp: timestamp,
                sourceType: "scanned",
              })
            } catch (err) {
              console.error(`Failed to restore scanned image at index ${i}`, err)
            }
          }
        }
      }

      // Add imported images with their stored timestamps
      for (const storedImg of storedImportedImages) {
        allRestoredImages.push({
          id: storedImg.id,
          dataUrl: storedImg.dataUrl,
          timestamp: storedImg.timestamp,
          sourceType: "imported",
        })
      }

      // Sort all images by timestamp to maintain exact chronological order
      allRestoredImages.sort((a, b) => a.timestamp - b.timestamp)

      if (allRestoredImages.length > 0) {
        addImages(allRestoredImages, "Restored images")
      }

      restoredRef.current = true
    } catch (err) {
      console.error("Error restoring persisted images:", err)
    }
  }

  useEffect(() => {
    if (isReady && !restoredRef.current) {
      restoreImages()
    }
  }, [isReady, addImages])

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

  // Scan images
  const startScan = useCallback(async () => {
    if (!isReady || !scannerName || isScanning) return

    setError(null)
    setIsScanning(true)

    try {
      const Encleso = window.Encleso
      if (!Encleso) throw new Error("Encleso SDK not available.")

      // console.log("Starting scan with scanner:", scannerName);
      const capabilities: {
        Resolution?: number
        PixelType?: number
        Duplex?: boolean
      } = {}
      if (currentResolution !== null) capabilities.Resolution = currentResolution
      if (currentPixelType !== null) capabilities.PixelType = currentPixelType
      if (currentDuplex !== null) capabilities.Duplex = currentDuplex

      if (Object.keys(capabilities).length > 0) {
        await Encleso.SetCapabilities(capabilities)
        // console.log("Capabilities set:", capabilities);
      } else {
        await Encleso.SetCapabilities({ Resolution: 300, PixelType: 1 })
      }

      const ret = await Encleso.StartScan(scannerName, showScannerUI)

      const newImages: ExtendedScannedImage[] = []
      const currentTimestamp = Date.now()

      for (let i = ret.ScannedImagesStartingIndex; i < ret.ScannedImagesStartingIndex + ret.ScannedImagesCount; i++) {
        try {
          const result = await Encleso.GetImagePreview(i)
          let imageUrl: string

          if (result instanceof Blob) {
            imageUrl = URL.createObjectURL(result)
          } else if (typeof result === "string") {
            if (result.startsWith("blob:") || result.startsWith("data:image")) {
              imageUrl = result
            } else {
              const blob = base64ToBlob(`data:image/png;base64,${result.trim()}`)
              imageUrl = URL.createObjectURL(blob)
            }
          } else {
            throw new Error("Invalid image data")
          }

          const imageTimestamp = currentTimestamp + (i - ret.ScannedImagesStartingIndex)

          newImages.push({
            id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dataUrl: imageUrl,
            sourceIndex: i, // ✅ track Encleso index
            timestamp: imageTimestamp,
            sourceType: "scanned", // Mark as scanned image
          })
        } catch (e) {
          console.error(`❌ Failed to load image at index ${i}`, e)
          setError(`Error loading scanned image preview (Page ${i + 1})`)
        }
      }

      if (newImages.length > 0) {
        addImages(newImages, "Image Scanned")
        await saveScannedMetadataToStorage(newImages)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("🚨 Scan error:", err)
      setError(errorMessage)
    } finally {
      setIsScanning(false)
    }
  }, [
    isReady,
    scannerName,
    isScanning,
    addImages,
    currentResolution,
    currentPixelType,
    currentDuplex,
    showScannerUI,
    saveScannedMetadataToStorage,
  ])

  // Persistent Delete
  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      const Encleso = window.Encleso
      const img = scannedImages.find((img) => img.id === imageId) as ExtendedScannedImage | undefined

      if (!img) return

      if (img.sourceType === "scanned" && Encleso && img?.sourceIndex !== undefined && Encleso.ImageLibRemove) {
        try {
          const result = await Encleso.ImageLibRemove([img.sourceIndex]) // ✅ correct API
          // console.log("Delete result:", result);

          if (result.RemovedImageCount > 0) {
            await removeScannedMetadataFromStorage(img.sourceIndex)
            deleteImage(imageId) // remove from UI history
          }
        } catch (err) {
          console.error("Failed to delete scanned image from Encleso storage:", err)
        }
      } else if (img.sourceType === "imported") {
        // Remove imported image from IndexedDB
        await removeImportedImageFromStorage(imageId)
        deleteImage(imageId) // remove from UI history
      } else {
        deleteImage(imageId) // fallback UI-only delete
      }
    },
    [deleteImage, scannedImages, removeImportedImageFromStorage, removeScannedMetadataFromStorage],
  )

  const handleDeleteAll = useCallback(async () => {
    const Encleso = window.Encleso

    try {
      // Clear scanned images from Encleso
      if (Encleso?.ImageLibGetCount && Encleso.ImageLibRemove) {
        const total = await Encleso.ImageLibGetCount()
        if (total > 0) {
          const indices = Array.from({ length: total }, (_, i) => i)
          const result = await Encleso.ImageLibRemove(indices)
          // console.log("Delete all scanned result:", result);
        }
      }

      // Clear imported images from IndexedDB
      await clearImportedImagesFromStorage()

      // Clear UI history
      createNewDocument()
    } catch (err) {
      console.error("Failed to delete all images:", err)
    }
  }, [createNewDocument, clearImportedImagesFromStorage])

  // Save PDF
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

  // Print
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

  const addImportedImages = useCallback(
    async (importedImages: ScannedImage[]) => {
      const timestamp = Date.now()
      const extendedImportedImages: ExtendedScannedImage[] = importedImages.map((img, index) => ({
        ...img,
        timestamp: timestamp + index, // Ensure unique timestamps for proper ordering
        sourceType: "imported" as const,
      }))

      // Add to UI state
      addImages(extendedImportedImages, "Images Imported")

      const currentImages: ExtendedScannedImage[] = [
        ...(scannedImages as ExtendedScannedImage[]),
        ...extendedImportedImages,
      ]
      await saveImportedImagesToStorage(currentImages)
    },
    [addImages, scannedImages, saveImportedImagesToStorage],
  )

  useEffect(() => {
    if (scannedImages.length > 0) {
      const extendedImages = scannedImages as ExtendedScannedImage[]
      saveImportedImagesToStorage(extendedImages)
      saveScannedMetadataToStorage(extendedImages)
    }
  }, [scannedImages, saveImportedImagesToStorage, saveScannedMetadataToStorage])

  const handleImageClick = useCallback((image: ScannedImage) => setSelectedImage(image.id), [setSelectedImage])
  const getSelectedImage = useCallback(
    () => (selectedImageId ? scannedImages.find((img) => img.id === selectedImageId) || null : null),
    [selectedImageId, scannedImages],
  )
  const getImagesForEmail = useCallback(
    () => (getSelectedImages().length > 0 ? getSelectedImages() : scannedImages),
    [scannedImages, getSelectedImages],
  )
  const updateScannerCapabilities = useCallback((resolution?: number, pixelType?: number, duplex?: boolean) => {
    if (resolution !== undefined) setCurrentResolution(resolution)
    if (pixelType !== undefined) setCurrentPixelType(pixelType)
    if (duplex !== undefined) setCurrentDuplex(duplex)
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
    deleteAllImages: handleDeleteAll,
    getSelectedImages,
    isImageSelected,
    getImagesForEmail,
    handleImageClick,
    getSelectedImage,
    undo,
    redo,
    canUndo,
    canRedo,
    getResolutionCaps: resolutionCapsFn,
    getColorModeCaps: colorModeCapsFn,
    updateScannerCapabilities,
  }
}
