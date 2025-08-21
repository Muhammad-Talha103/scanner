"use client";

import { useState, useEffect, useCallback } from "react";
import { usePDFGenerator } from "./usePDFGenerator";
import { usePrintHandler } from "./usePrintHandler";
import { useDocumentHistory } from "./useDocumentHistory";
import { ScannedImage } from "@/components/scanner/Dropdown";

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

interface EnclesoType {
  OnReady?: (ret: ScannerResult) => void;
  OnError?: (err: ScanError) => void;
  SetCapabilities: (cap: {
    Resolution: number;
    PixelType: number;
  }) => Promise<void>;
  StartScan: (scannerName: string, showUI: boolean) => Promise<ScanReturn>;
  GetImagePreview: (index: number) => Promise<Blob | string>;
}

declare global {
  interface Window {
    Encleso?: EnclesoType;
    ExportedScannerNames?: string[]; // ✅ Add this line
    showSaveFilePicker?: (options: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: { [key: string]: string[] };
      }>;
    }) => Promise<FileSystemFileHandle>;
  }
}

export const useScannerIntegration = () => {
  const [isReady, setIsReady] = useState(false);
  const [scannerName, setScannerName] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

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

  useEffect(() => {
    if (window.ExportedScannerNames) {
      setScriptLoaded(true); // ✅ Skip script loading
      return;
    }

    const script = document.createElement("script");
    script.src = "https://encleso.com/Assets/scripts/encleso.min.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError("Failed to load Encleso SDK script.");
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
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
        setScannerName(window.ExportedScannerNames?.[0] || null);
        setError(null);
      }, 1000);
      return;
    }

    if (Encleso) {
      Encleso.OnError = (err) => {
        console.error("Scanner Error:", err?.Message || err);
        setIsReady(false);
        setScannerName(null);
        setError(`Scanner Error: ${err?.Message || "Unknown error"}`);
        setIsScanning(false);
      };

      Encleso.OnReady = (ret) => {
        if (ret?.ScannersList?.length > 0) {
          const defaultScanner = ret.ScannersList[ret.DefaultIndex];
          setIsReady(true);
          setScannerName(defaultScanner);
          setError(null);
        } else {
          setIsReady(false);
          setScannerName(null);
          setError("No scanners found.");
        }
      };
    }
  }, [scriptLoaded]);
  useEffect(() => {
    if (!scriptLoaded) return;

    const interval = setInterval(() => {
      const Encleso = window.Encleso;
      if (Encleso || window.ExportedScannerNames) {
        initializeEncleso();
      }
    }, 500);

    const pollingInterval = setInterval(() => {
      const Encleso = window.Encleso;
      if (Encleso || window.ExportedScannerNames) {
        initializeEncleso();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(pollingInterval);
    };
  }, [initializeEncleso, scriptLoaded]);

  //  const startScan = useCallback(async () => {
  //     if (!isReady || !scannerName || isScanning) return;

  //     setError(null);
  //     setIsScanning(true);

  //     try {

  //       const Encleso = window.Encleso;
  //       if (!Encleso) throw new Error("Encleso SDK is not available.");
  //       if (!window.StartScanning) throw new Error("Encleso scan function not available.");

  //       // Run the actual scan
  //       const ret = await window.StartScanning();

  //       if (!ret || ret.ScannedImagesCount < 1) {
  //         setError("No images scanned.");
  //         return;
  //       }

  //       const newImages: ScannedImage[] = [];

  //       for (
  //         let i = ret.ScannedImagesStartingIndex;
  //         i < ret.ScannedImagesStartingIndex + ret.ScannedImagesCount;
  //         i++
  //       ) {
  //         try {
  //           const blob = await Encleso.GetImagePreview(i);
  //           const url = URL.createObjectURL(blob);
  //           console.log("Preview blob for index", i, blob);
  //           console.log("Url of image",url)
  //           const newImage: ScannedImage = {
  //             id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  //             dataUrl: url,
  //             timestamp: Date.now(),
  //           };
  //           newImages.push(newImage);
  //           console.log(`Scanned image preview loaded at index ${i}:`, newImage);
  //         } catch (e) {
  //           console.error(`Failed to load scanned image preview at index ${i}:`, e);
  //           setError(`Error loading scanned image preview (Page ${i + 1}).`);
  //         }
  //       }

  //       if (newImages.length > 0) {
  //         addImages(newImages, "Image Scanned");
  //       } else {
  //         setError("Scan completed, but no images could be previewed.");
  //       }
  //     } catch (err) {
  //       const errorMessage = err instanceof Error ? err.message : String(err);
  //       console.error("Scan error:", err);
  //       setError(errorMessage);
  //     } finally {
  //       setIsScanning(false);
  //     }
  //   }, [isReady, scannerName, isScanning, addImages]);

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

  const startScan = useCallback(async () => {
    if (!isReady || !scannerName || isScanning) return;

    setError(null);
    setIsScanning(true);

    try {
      const Encleso = window.Encleso;
      if (!Encleso) throw new Error("Encleso SDK is not available.");

      // Set capabilities
      await Encleso.SetCapabilities({
        Resolution: 300,
        PixelType: 1, // 0 = B/W, 1 = Grayscale, 2 = Color
      });

      // Start scanning
      const ret = await Encleso.StartScan(scannerName, false);

      if (!ret || ret.ScannedImagesCount < 1) {
        setError("No images were scanned.");
        return;
      }

      const newImages: ScannedImage[] = [];

      for (
        let i = ret.ScannedImagesStartingIndex;
        i < ret.ScannedImagesStartingIndex + ret.ScannedImagesCount;
        i++
      ) {
        try {
          const result = await Encleso.GetImagePreview(i);
          console.log(`🟡 Image preview result at index ${i}:`, result);

          let imageUrl: string;

          if (result instanceof Blob) {
            imageUrl = URL.createObjectURL(result);
          } else if (typeof result === "string") {
            if (result.startsWith("blob:")) {
              imageUrl = result; // ✅ Use directly
            } else if (result.startsWith("data:image")) {
              imageUrl = result; // ✅ Already a data URL
            } else if (/^[A-Za-z0-9+/=\r\n]+$/.test(result.trim())) {
              // raw base64
              const blob = base64ToBlob(
                `data:image/png;base64,${result.trim()}`
              );
              imageUrl = URL.createObjectURL(blob);
            } else if (
              result.startsWith("file://") ||
              result.startsWith("http") ||
              /\.(png|jpg|jpeg|bmp|gif|tif)$/i.test(result)
            ) {
              const response = await fetch(result);
              if (!response.ok)
                throw new Error(`HTTP error ${response.status}`);
              const blob = await response.blob();
              imageUrl = URL.createObjectURL(blob);
            } else {
              throw new Error(
                `Unrecognized string format returned from GetImagePreview(${i})`
              );
            }
          } else {
            throw new Error(`Invalid image data at index ${i}`);
          }

          const newImage: ScannedImage = {
            id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dataUrl: imageUrl,
            timestamp: Date.now(),
          };

          newImages.push(newImage);
        } catch (e) {
          console.error(`❌ Failed to load image at index ${i}:`, e);
          setError(`Error loading scanned image preview (Page ${i + 1})`);
          continue;
        }
      }

      if (newImages.length > 0) {
        addImages(newImages, "Image Scanned");
      } else {
        setError("Scan completed, but no images could be previewed.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Scan error:", err);
      setError(errorMessage);
    } finally {
      setIsScanning(false);
    }
  }, [isReady, scannerName, isScanning, addImages]);

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
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [scannedImages, getSelectedImages, generatePDF, isProcessing]);

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
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [scannedImages, getSelectedImages, printImages, isProcessing]);

  const addImportedImages = useCallback(
    (importedImages: ScannedImage[]) => {
      addImages(importedImages, "Images Imported");
    },
    [addImages]
  );

  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      try {
        deleteImage(imageId);
      } catch (error) {
        console.error("Failed to delete image:", error);
        throw new Error("Failed to delete image. Please try again.");
      }
    },
    [deleteImage]
  );

  const handleImageClick = useCallback(
    (image: ScannedImage) => {
      setSelectedImage(image.id);
    },
    [setSelectedImage]
  );

  const getSelectedImage = useCallback(() => {
    if (!selectedImageId) return null;
    return scannedImages.find((img) => img.id === selectedImageId) || null;
  }, [selectedImageId, scannedImages]);

  const getImagesForEmail = useCallback(() => {
    return getSelectedImages().length > 0 ? getSelectedImages() : scannedImages;
  }, [scannedImages, getSelectedImages]);

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
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
