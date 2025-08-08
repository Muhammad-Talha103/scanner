'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePDFGenerator } from './usePDFGenerator';
import { usePrintHandler } from './usePrintHandler';
import { useDocumentHistory } from './useDocumentHistory';

interface ScannedImage {
  id: string;
  dataUrl: string;
  timestamp: number;
}

interface ScannerCapabilities {
  resolution: number;
  colorMode: 'color' | 'grayscale' | 'blackwhite';
  paperSize: 'auto' | 'A4' | 'Letter' | string;
  duplex: boolean;
}

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
  SetCapabilities: (cap: { Resolution: number; PixelType: number }) => Promise<void>;
  StartScan: (scannerName: string, showUI: boolean) => Promise<ScanReturn>;
  GetImagePreview: (index: number) => Promise<Blob>;
}

declare global {
  interface Window {
    Encleso?: EnclesoType;
    showSaveFilePicker?: (options: {
      suggestedName?: string;
      types?: Array<{ description: string; accept: { [key: string]: string[] } }>;
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
    const script = document.createElement('script');
    script.src = 'https://encleso.com/Assets/scripts/encleso.min.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError('Failed to load Encleso SDK script.');
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const initializeEncleso = useCallback(() => {
    if (!scriptLoaded) return;

    const Encleso = window.Encleso;
    if (!Encleso) {
      setError('Encleso SDK failed to initialize.');
      return;
    }

    try {
      Encleso.OnError = (err: ScanError) => {
        console.error('Scanner Error:', err?.Message || err);
        setIsReady(false);
        setScannerName(null);
        setError(`Scanner Error: ${err?.Message || 'Unknown error'}`);
        setIsScanning(false);
      };

      Encleso.OnReady = (ret: ScannerResult) => {
        try {
          if (ret?.ScannersList?.length > 0) {
            const defaultScanner = ret.ScannersList[ret.DefaultIndex];
            setIsReady(true);
            setScannerName(defaultScanner);
            setError(null);
          } else {
            setIsReady(false);
            setScannerName(null);
            setError('No scanners found. Please check your device connection.');
          }
        } catch (e) {
          console.error('OnReady processing error:', e);
          setError('Failed to process scanner list.');
        }
      };
    } catch (err) {
      console.error('Initialization error:', err);
      setError('Failed to initialize Encleso.');
    }
  }, [scriptLoaded]);

  useEffect(() => {
    if (!scriptLoaded) return;

    const interval = setInterval(() => {
      const Encleso = window.Encleso;
      if (Encleso) {
        initializeEncleso();
      }
    }, 500);

    // Periodic polling for scanner status (every 5 seconds)
    const pollingInterval = setInterval(() => {
       const Encleso = window.Encleso;
      if (Encleso) {
        initializeEncleso(); // Reinvoke to check scanner status
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(pollingInterval);
    };
  }, [initializeEncleso, scriptLoaded]);

  const startScan = useCallback(async () => {
    if (!isReady || !scannerName || isScanning) return;

    setError(null);
    setIsScanning(true);

    try {
      const Encleso = window.Encleso;
      if (!Encleso) {
        throw new Error('Encleso SDK is not available.');
      }

      await Encleso.SetCapabilities({
        Resolution: 200,
        PixelType: 2, // RGB
      });

      const ret = await Encleso.StartScan(scannerName, true);

      if (ret.ScannedImagesCount > 0) {
        const newImages: ScannedImage[] = [];
        for (
          let i = ret.ScannedImagesStartingIndex;
          i < ret.TotalImagesCount;
          i++
        ) {
          try {
            const blob = await Encleso.GetImagePreview(i);
            const url = URL.createObjectURL(blob);
            const newImage: ScannedImage = {
              id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              dataUrl: url,
              timestamp: Date.now(),
            };
            newImages.push(newImage);
          } catch (e) {
            console.error(`Failed to preview image at index ${i}:`, e);
            setError(`Error loading scanned image preview (Page ${i + 1}).`);
          }
        }

        if (newImages.length > 0) {
          addImages(newImages, 'Image Scanned');
        } else {
          setError('Scan completed, but no images were successfully previewed.');
        }
      } else {
        setError('No pages were scanned.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Scan error:', err);
      setError(errorMessage);
    } finally {
      setIsScanning(false);
    }
  }, [isReady, scannerName, isScanning, addImages]);

  const saveToPDF = useCallback(async () => {
    const imagesToSave = getSelectedImages().length > 0 ? getSelectedImages() : scannedImages;
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
                description: 'PDF Files',
                accept: { 'application/pdf': ['.pdf'] },
              },
            ],
          });
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            setIsProcessing(false);
            return;
          }
          throw err;
        }
      }

      await generatePDF(imagesToSave, defaultFileName, fileHandle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save PDF');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [scannedImages, getSelectedImages, generatePDF, isProcessing]);

  const printDocument = useCallback(async () => {
    const imagesToPrint = getSelectedImages().length > 0 ? getSelectedImages() : scannedImages;

    if (imagesToPrint.length === 0 || isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);
      await printImages(imagesToPrint);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to print document');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [scannedImages, getSelectedImages, printImages, isProcessing]);

  const addImportedImages = useCallback(
    (importedImages: ScannedImage[]) => {
      addImages(importedImages, 'Images Imported');
    },
    [addImages],
  );

  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      try {
        deleteImage(imageId);
      } catch (error) {
        console.error('Failed to delete image:', error);
        throw new Error('Failed to delete image. Please try again.');
      }
    },
    [deleteImage],
  );

  const handleImageClick = useCallback(
    (image: ScannedImage) => {
      setSelectedImage(image.id);
    },
    [setSelectedImage],
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






// import { useState, useEffect, useCallback } from "react"
// import { usePDFGenerator } from "./usePDFGenerator"
// import { usePrintHandler } from "./usePrintHandler"
// import { useDocumentHistory } from "./useDocumentHistory"

// interface ScannedImage {
//   id: string
//   dataUrl: string
//   timestamp: number
// }

// interface ScannerCapabilities {
//   resolution: number
//   colorMode: "color" | "grayscale" | "blackwhite"
//   paperSize: "auto" | "A4" | "Letter" | string
//   duplex: boolean
// }

// declare global {
//   interface Window {
//     Encleso: {
//       OnReady: (callback: () => void) => void
//       SetLicense: (token: string) => Promise<void>
//       SetCapabilities: (capabilities: ScannerCapabilities) => void
//       StartScan: (scannerName: string, showUI: boolean) => void
//       SaveImageToFilesystem: (format: string, indexes: number[]) => void
//       GetScannerNames: () => string[]
//       OnScanComplete: (callback: (imageData: string) => void) => void
//       OnError: (callback: (error: string) => void) => void
//     }
//     showSaveFilePicker?: (options: {
//       suggestedName?: string
//       types?: Array<{ description: string; accept: { [key: string]: string[] } }>
//     }) => Promise<FileSystemFileHandle>
//   }
// }

// export const useScannerIntegration = () => {
//   const [isReady, setIsReady] = useState(false)
//   const [scannerName, setScannerName] = useState<string | null>(null)
//   const [isScanning, setIsScanning] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [isProcessing, setIsProcessing] = useState(false)
//   const [isLoadingImages, setIsLoadingImages] = useState(false)

//   const { generatePDF } = usePDFGenerator()
//   const { printImages } = usePrintHandler()
//   const {
//     images: scannedImages,
//     selectedImageIds,
//     selectedImageId,
//     createNewDocument,
//     addImages,
//     deleteImage,
//     updateImage,
//     toggleImageSelection,
//     setSelectedImage,
//     undo,
//     redo,
//     canUndo,
//     canRedo,
//     getSelectedImages,
//     isImageSelected,
//   } = useDocumentHistory()

//   const initializeEncleso = useCallback(async () => {
//     try {
//       if (window.Encleso) {
//         window.Encleso.OnReady(async () => {
//           try {
//             const response = await fetch("/api/encleso-license", {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//             })

//             if (!response.ok) {
//               throw new Error("Failed to get license token")
//             }

//             const { token } = await response.json()
//             await window.Encleso.SetLicense(token)

//             const scanners = window.Encleso.GetScannerNames()
//             if (scanners && scanners.length > 0) {
//               setScannerName(scanners[0])
//             }

//             window.Encleso.OnScanComplete((imageData: string) => {
//               const newImage: ScannedImage = {
//                 id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//                 dataUrl: imageData,
//                 timestamp: Date.now(),
//               }
//               addImages([newImage], "Image Scanned")
//               setIsScanning(false)
//             })

//             window.Encleso.OnError((errorMessage: string) => {
//               setError(errorMessage)
//               setIsScanning(false)
//             })

//             setIsReady(true)
//             setError(null)
//           } catch (err) {
//             setError(err instanceof Error ? err.message : "Failed to initialize scanner")
//             setIsReady(false)
//           }
//         })
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to initialize Encleso")
//     }
//   }, [addImages])

//   useEffect(() => {
//     const script = document.createElement("script")
//     script.src = "https://encleso.com/Assets/scripts/encleso.min.js"
//     script.async = true
//     script.onload = () => {
//       initializeEncleso()
//     }
//     script.onerror = () => {
//       setError("Failed to load Encleso library")
//     }

//     document.head.appendChild(script)

//     return () => {
//       if (document.head.contains(script)) {
//         document.head.removeChild(script)
//       }
//     }
//   }, [initializeEncleso])

//   const startScan = useCallback(() => {
//     if (!isReady || !scannerName || isScanning) return

//     try {
//       setIsScanning(true)
//       setError(null)

//       window.Encleso.SetCapabilities({
//         resolution: 300,
//         colorMode: "color",
//         paperSize: "auto",
//         duplex: false,
//       })

//       window.Encleso.StartScan(scannerName, false)
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to start scan")
//       setIsScanning(false)
//     }
//   }, [isReady, scannerName, isScanning])

//   const saveToPDF = useCallback(async () => {
//     const imagesToSave = getSelectedImages().length > 0 ? getSelectedImages() : scannedImages
//     const defaultFileName = `scanned_document_${Date.now()}`

//     if (imagesToSave.length === 0 || isProcessing) return

//     try {
//       setIsProcessing(true)
//       setError(null)

//       let fileHandle: FileSystemFileHandle | undefined
//       if (window.showSaveFilePicker) {
//         try {
//           fileHandle = await window.showSaveFilePicker({
//             suggestedName: `${defaultFileName}.pdf`,
//             types: [
//               {
//                 description: "PDF Files",
//                 accept: { "application/pdf": [".pdf"] },
//               },
//             ],
//           })
//         } catch (err) {
//           if (err instanceof DOMException && err.name === "AbortError") {
//             setIsProcessing(false)
//             return // User cancelled the file picker
//           }
//           throw err
//         }
//       }

//       await generatePDF(imagesToSave, defaultFileName, fileHandle)
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to save PDF")
//       throw err
//     } finally {
//       setIsProcessing(false)
//     }
//   }, [scannedImages, getSelectedImages, generatePDF, isProcessing])

//   const printDocument = useCallback(async () => {
//     const imagesToPrint = getSelectedImages().length > 0 ? getSelectedImages() : scannedImages

//     if (imagesToPrint.length === 0 || isProcessing) return

//     try {
//       setIsProcessing(true)
//       setError(null)
//       await printImages(imagesToPrint)
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to print document")
//       throw err
//     } finally {
//       setIsProcessing(false)
//     }
//   }, [scannedImages, getSelectedImages, printImages, isProcessing])

//   const addImportedImages = useCallback(
//     (importedImages: ScannedImage[]) => {
//       addImages(importedImages, "Images Imported")
//     },
//     [addImages],
//   )

//   const handleDeleteImage = useCallback(
//     async (imageId: string) => {
//       try {
//         deleteImage(imageId)
//       } catch (error) {
//         console.error("Failed to delete image:", error)
//         throw new Error("Failed to delete image. Please try again.")
//       }
//     },
//     [deleteImage],
//   )

//   const handleImageClick = useCallback(
//     (image: ScannedImage) => {
//       setSelectedImage(image.id)
//     },
//     [setSelectedImage],
//   )

//   const getSelectedImage = useCallback(() => {
//     if (!selectedImageId) return null
//     return scannedImages.find((img) => img.id === selectedImageId) || null
//   }, [selectedImageId, scannedImages])

//   const getImagesForEmail = useCallback(() => {
//     return getSelectedImages().length > 0 ? getSelectedImages() : scannedImages
//   }, [scannedImages, getSelectedImages])

//   return {
//     isReady,
//     scannerName,
//     isScanning,
//     scannedImages,
//     error,
//     isProcessing,
//     isLoadingImages,
//     selectedImageIds,
//     selectedImageId,
//     startScan,
//     saveToPDF,
//     printDocument,
//     addImportedImages,
//     updateImage,
//     createNewDocument,
//     toggleImageSelection,
//     deleteImage: handleDeleteImage,
//     getSelectedImages,
//     isImageSelected,
//     getImagesForEmail,
//     handleImageClick,
//     getSelectedImage,
//     undo,
//     redo,
//     canUndo,
//     canRedo,
//   }
// }


