"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePDFGenerator } from "./usePDFGenerator";
import { usePrintHandler } from "./usePrintHandler";
import { useDocumentHistory } from "./useDocumentHistory";
import type { ScannedImage } from "@/components/scanner/Dropdown";

interface ScannerResult {
  ScannersList: string[];
  DefaultIndex: number;
  ScannedImagesCount: number;
  ScannedImagesStartingIndex: number;
  TotalImagesCount: number;
}

interface ScanReturn {
  ScannedImagesCount: number;
  ScannedImagesStartingIndex: number;
  TotalImagesCount: number;
}

interface ScanError {
  Message: string;
}

interface ScannerCapabilities {
  Resolution?: {
    Values: number[];
    CurrentIndex: number;
  };
  PixelType?: {
    Values: number[];
    CurrentIndex?: number;
  };
  Duplex?: {
    Supported: boolean;
    Enabled: boolean;
    ChangeAllowed: boolean;
  };
}

export interface EnclesoType {
  OnReady?: (ret: ScannerResult) => void;
  OnError?: (err: ScanError) => void;
  SetCapabilities: (cap: {
    Resolution?: number;
    PixelType?: number;
    Duplex?: boolean;
  }) => Promise<void>;
  StartScan: (scannerName: string, showUI: boolean) => Promise<ScanReturn>;
  GetImagePreview: (index: number) => Promise<Blob | string>;
  GetCapabilities?: (scannerName: string) => Promise<ScannerCapabilities>;
  PixelTypeToString?: (v: number) => string;
  ImageLibGetCount?: () => Promise<number>;
  ImageLibRemove?: (
    idxList: number[]
  ) => Promise<{ RemovedImageCount: number; NewCount: number }>; // ✅ fixed
}

declare global {
  interface Window {
    Encleso?: EnclesoType;
    ExportedScannerNames?: string[];
    getResolutionCaps?: () => Promise<number[]>;
    getColorModeCaps?: () => Promise<string[]>;
    showSaveFilePicker?: (options: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: { [key: string]: string[] };
      }>;
    }) => Promise<FileSystemFileHandle>;
  }
}

// Extend ScannedImage to remember Encleso index
interface ExtendedScannedImage extends ScannedImage {
  sourceIndex?: number;
  timestamp: number;
}

export const useScannerIntegration = () => {
  const [isReady, setIsReady] = useState(false);
  const [scanners, setScanners] = useState<string[]>([]);
  const [scannerName, setScannerName] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingImages] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [resolutionCapsFn, setResolutionCapsFn] = useState<
    (() => Promise<number[]>) | null
  >(null);
  const [colorModeCapsFn, setColorModeCapsFn] = useState<
    (() => Promise<string[]>) | null
  >(null);

  const [currentResolution, setCurrentResolution] = useState<number | null>(
    null
  );
  const [currentPixelType, setCurrentPixelType] = useState<number | null>(null);
  const [currentDuplex, setCurrentDuplex] = useState<boolean | null>(null);

  const { generatePDF } = usePDFGenerator();
  const { printImages } = usePrintHandler();
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
  } = useDocumentHistory();

  const restoredRef = useRef(false);

  // Poll Encleso SDK availability
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.Encleso || window.ExportedScannerNames) {
        setScriptLoaded(true);

        if (typeof window.getResolutionCaps === "function")
          setResolutionCapsFn(() => window.getResolutionCaps!);
        if (typeof window.getColorModeCaps === "function")
          setColorModeCapsFn(() => window.getColorModeCaps!);

        clearInterval(interval);
      }
    }, 500);

    if (window.Encleso || window.ExportedScannerNames) {
      setScriptLoaded(true);
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, []);

  const initializeEncleso = useCallback(() => {
    const Encleso = window.Encleso;

    if (!scriptLoaded || (!Encleso && !window.ExportedScannerNames)) {
      setError("Encleso SDK not available.");
      return;
    }

    if (window.ExportedScannerNames) {
      setTimeout(() => {
        setIsReady(true);
        setScanners(window.ExportedScannerNames || []);
        if (!scannerName && window.ExportedScannerNames?.length) {
          setScannerName(window.ExportedScannerNames[0]);
        }
        setError(null);
      }, 1000);
      return;
    }

    if (Encleso) {
      Encleso.OnError = (err) => {
        console.error("Scanner Error:", err?.Message || err);
        setIsReady(false);
        setError(`Scanner Error: ${err?.Message || "Unknown error"}`);
        setIsScanning(false);
      };

      Encleso.OnReady = (ret) => {
        if (ret?.ScannersList?.length > 0) {
          const list = ret.ScannersList;
          setIsReady(true);
          setScanners(list);
          if (!scannerName) setScannerName(list[ret.DefaultIndex] || list[0]);
          setError(null);
        } else {
          setIsReady(false);
          setScanners([]);
          if (!scannerName) setScannerName(null);
          setError("No scanners found.");
        }
      };
    }
  }, [scriptLoaded, scannerName]);

  useEffect(() => {
    if (!scriptLoaded) return;
    const interval = setInterval(() => {
      const Encleso = window.Encleso;
      if (Encleso || window.ExportedScannerNames) {
        initializeEncleso();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [initializeEncleso, scriptLoaded]);

  // ✅ Restore persisted images
  useEffect(() => {
    const restoreImages = async () => {
      try {
        const Encleso = window.Encleso;
        if (!Encleso || restoredRef.current) return;

        const total = await Encleso.ImageLibGetCount?.();
        if (!total || total <= 0) return;

        const restored: ExtendedScannedImage[] = [];

        for (let i = 0; i < total; i++) {
          try {
            const result = await Encleso.GetImagePreview(i);
            let imageUrl: string;

            if (result instanceof Blob) {
              imageUrl = URL.createObjectURL(result);
            } else if (typeof result === "string") {
              if (
                result.startsWith("blob:") ||
                result.startsWith("data:image")
              ) {
                imageUrl = result;
              } else {
                const blob = base64ToBlob(
                  `data:image/png;base64,${result.trim()}`
                );
                imageUrl = URL.createObjectURL(blob);
              }
            } else {
              continue;
            }

            restored.push({
              id: `restored-${i}-${Date.now()}`,
              dataUrl: imageUrl,
              sourceIndex: i, // ✅ track Encleso index
              timestamp: Date.now(),
            });
          } catch (err) {
            console.error(`Failed to restore image at index ${i}`, err);
          }
        }

        if (restored.length > 0) {
          addImages(restored, "Restored from Encleso");
        }

        restoredRef.current = true;
      } catch (err) {
        console.error("Error restoring persisted images:", err);
      }
    };

    if (isReady && !restoredRef.current) {
      restoreImages();
    }
  }, [isReady, addImages]);

  const base64ToBlob = (base64String: string, mimeType = "image/png"): Blob => {
    let base64 = base64String;
    const dataUrlMatch = base64String.match(/^data:(.*);base64,(.*)$/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
      base64 = dataUrlMatch[2];
    }
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // ✅ Scan images
  const startScan = useCallback(async () => {
    if (!isReady || !scannerName || isScanning) return;

    setError(null);
    setIsScanning(true);

    try {
      const Encleso = window.Encleso;
      if (!Encleso) throw new Error("Encleso SDK not available.");

      // console.log("Starting scan with scanner:", scannerName);
      const capabilities: {
        Resolution?: number;
        PixelType?: number;
        Duplex?: boolean;
      } = {};
      if (currentResolution !== null)
        capabilities.Resolution = currentResolution;
      if (currentPixelType !== null) capabilities.PixelType = currentPixelType;
      if (currentDuplex !== null) capabilities.Duplex = currentDuplex;

      if (Object.keys(capabilities).length > 0) {
        await Encleso.SetCapabilities(capabilities);
        // console.log("Capabilities set:", capabilities);
      } else {
        await Encleso.SetCapabilities({ Resolution: 300, PixelType: 1 });
      }

      const ret = await Encleso.StartScan(scannerName, false);
      const newImages: ExtendedScannedImage[] = [];

      for (
        let i = ret.ScannedImagesStartingIndex;
        i < ret.ScannedImagesStartingIndex + ret.ScannedImagesCount;
        i++
      ) {
        try {
          const result = await Encleso.GetImagePreview(i);
          let imageUrl: string;

          if (result instanceof Blob) {
            imageUrl = URL.createObjectURL(result);
          } else if (typeof result === "string") {
            if (result.startsWith("blob:") || result.startsWith("data:image")) {
              imageUrl = result;
            } else {
              const blob = base64ToBlob(
                `data:image/png;base64,${result.trim()}`
              );
              imageUrl = URL.createObjectURL(blob);
            }
          } else {
            throw new Error("Invalid image data");
          }

          newImages.push({
            id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dataUrl: imageUrl,
            sourceIndex: i, // ✅ track Encleso index
            timestamp: Date.now(),
          });
        } catch (e) {
          console.error(`❌ Failed to load image at index ${i}`, e);
          setError(`Error loading scanned image preview (Page ${i + 1})`);
        }
      }

      if (newImages.length > 0) {
        addImages(newImages, "Image Scanned");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("🚨 Scan error:", err);
      setError(errorMessage);
    } finally {
      setIsScanning(false);
    }
  }, [
    isReady,
    scannerName,
    isScanning,
    addImages,
    currentResolution,
    currentPixelType,
    currentDuplex,
  ]);

  // ✅ Persistent Delete
  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      const Encleso = window.Encleso;
      const img = scannedImages.find((img) => img.id === imageId) as
        | ExtendedScannedImage
        | undefined;

      if (Encleso && img?.sourceIndex !== undefined && Encleso.ImageLibRemove) {
        try {
          const result = await Encleso.ImageLibRemove([img.sourceIndex]); // ✅ correct API
          // console.log("Delete result:", result);

          if (result.RemovedImageCount > 0) {
            deleteImage(imageId); // remove from UI history
          }
        } catch (err) {
          console.error("Failed to delete image from Encleso storage:", err);
        }
      } else {
        deleteImage(imageId); // fallback UI-only delete
      }
    },
    [deleteImage, scannedImages]
  );

  const handleDeleteAll = useCallback(async () => {
    const Encleso = window.Encleso;
    if (!Encleso?.ImageLibGetCount || !Encleso.ImageLibRemove) return;

    try {
      const total = await Encleso.ImageLibGetCount();
      if (total > 0) {
        const indices = Array.from({ length: total }, (_, i) => i);
        const result = await Encleso.ImageLibRemove(indices);
        // console.log("Delete all result:", result);
        if (result.RemovedImageCount > 0) {
          createNewDocument(); // clear UI history
        }
      }
    } catch (err) {
      console.error("Failed to delete all images:", err);
    }
  }, [createNewDocument]);

  // ✅ Save PDF
  const saveToPDF = useCallback(async () => {
    const imagesToSave =
      getSelectedImages().length > 0 ? getSelectedImages() : scannedImages;
    const defaultFileName = `scanned_document_${Date.now()}`;
    if (imagesToSave.length === 0 || isProcessing) return;
    try {
      setIsProcessing(true);
      setError(null);
      let fileHandle: FileSystemFileHandle | undefined;
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
          });
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            setIsProcessing(false);
            return;
          }
          throw err;
        }
      }
      await generatePDF(imagesToSave, defaultFileName, fileHandle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save PDF");
    } finally {
      setIsProcessing(false);
    }
  }, [scannedImages, getSelectedImages, generatePDF, isProcessing]);

  // ✅ Print
  const printDocument = useCallback(async () => {
    const imagesToPrint =
      getSelectedImages().length > 0 ? getSelectedImages() : scannedImages;
    if (imagesToPrint.length === 0 || isProcessing) return;
    try {
      setIsProcessing(true);
      setError(null);
      await printImages(imagesToPrint);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to print document");
    } finally {
      setIsProcessing(false);
    }
  }, [scannedImages, getSelectedImages, printImages, isProcessing]);

  // ✅ Other helpers
  const addImportedImages = useCallback(
    (importedImages: ScannedImage[]) =>
      addImages(importedImages, "Images Imported"),
    [addImages]
  );
  const handleImageClick = useCallback(
    (image: ScannedImage) => setSelectedImage(image.id),
    [setSelectedImage]
  );
  const getSelectedImage = useCallback(
    () =>
      selectedImageId
        ? scannedImages.find((img) => img.id === selectedImageId) || null
        : null,
    [selectedImageId, scannedImages]
  );
  const getImagesForEmail = useCallback(
    () =>
      getSelectedImages().length > 0 ? getSelectedImages() : scannedImages,
    [scannedImages, getSelectedImages]
  );
  const updateScannerCapabilities = useCallback(
    (resolution?: number, pixelType?: number, duplex?: boolean) => {
      if (resolution !== undefined) setCurrentResolution(resolution);
      if (pixelType !== undefined) setCurrentPixelType(pixelType);
      if (duplex !== undefined) setCurrentDuplex(duplex);
    },
    []
  );

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
  };
};
