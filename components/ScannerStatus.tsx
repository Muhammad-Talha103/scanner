// "use client";

// import type React from "react";
// import { useState, useEffect } from "react";
// import { Wifi, WifiOff, AlertCircle, ChevronDown } from "lucide-react";
// import type { EnclesoType } from "@/hooks/useScannerIntegration";

// interface ScannerStatusProps {
//   isReady: boolean;
//   scanners: string[];
//   selectedScanner: string | null;
//   onSelectScanner: (name: string) => void;
//   error: string | null;
// }

// export const ScannerStatus: React.FC<ScannerStatusProps> = ({
//   isReady,
//   scanners,
//   selectedScanner,
//   onSelectScanner,
//   error,
// }) => {
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [resolutions, setResolutions] = useState<string[]>([]);
//   const [colorModes, setColorModes] = useState<string[]>([]);
//   const [selectedResolution, setSelectedResolution] = useState<string>("");
//   const [selectedColorMode, setSelectedColorMode] = useState<string>("");

//   // Fetch capabilities whenever selectedScanner changes
//   useEffect(() => {
//     const Encleso: EnclesoType | undefined = window.Encleso;
//     if (!selectedScanner || !Encleso) return;

//     const fetchCapabilities = async () => {
//       try {
//         const caps = await Encleso.GetCapabilities?.(selectedScanner);
//         if (!caps) return;

//         // Resolution
//         if (caps.Resolution?.Values?.length) {
//           const resValues = caps.Resolution.Values.map(String);
//           setResolutions(resValues);
//           setSelectedResolution(
//             resValues[caps.Resolution.CurrentIndex] || resValues[0]
//           );
//         } else {
//           setResolutions(["Unsupported"]);
//           setSelectedResolution("Unsupported");
//         }

//         // Color modes
//         if (caps.PixelType?.Values?.length) {
//           const colorValues = Encleso.PixelTypeToString
//             ? caps.PixelType.Values.map(Encleso.PixelTypeToString)
//             : caps.PixelType.Values.map(String);
//           setColorModes(colorValues);
//           setSelectedColorMode(colorValues[0]);
//         } else {
//           setColorModes(["Unsupported"]);
//           setSelectedColorMode("Unsupported");
//         }
//       } catch (err) {
//         console.error("Failed to fetch capabilities for", selectedScanner, err);
//         setResolutions(["Error"]);
//         setColorModes(["Error"]);
//         setSelectedResolution("Error");
//         setSelectedColorMode("Error");
//       }
//     };

//     fetchCapabilities();
//   }, [selectedScanner]);

//   // Update scanner capabilities
//   const updateCapabilities = async (resolution: string, colorMode: string) => {
//     const Encleso: EnclesoType | undefined = window.Encleso;
//     if (!Encleso || !selectedScanner) return;

//     try {
//       await Encleso.SetCapabilities({
//         Resolution: Number(resolution),
//         PixelType: colorModes.indexOf(colorMode),
//       });
//     } catch (err) {
//       console.error("Failed to set capabilities:", err);
//     }
//   };

//   const handleResolutionChange = (value: string) => {
//     setSelectedResolution(value);
//     updateCapabilities(value, selectedColorMode);
//   };

//   const handleColorModeChange = (value: string) => {
//     setSelectedColorMode(value);
//     updateCapabilities(selectedResolution, value);
//   };


"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Wifi, WifiOff, AlertCircle, ChevronDown } from "lucide-react"
import type { EnclesoType } from "@/hooks/useScannerIntegration"

interface ScannerStatusProps {
  isReady: boolean
  scanners: string[]
  selectedScanner: string | null
  onSelectScanner: (name: string) => void
  error: string | null
  onCapabilitiesChange?: (resolution?: number, pixelType?: number) => void
}

export const ScannerStatus: React.FC<ScannerStatusProps> = ({
  isReady,
  scanners,
  selectedScanner,
  onSelectScanner,
  error,
  onCapabilitiesChange,
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isResolutionOpen, setIsResolutionOpen] = useState(false)
  const [isColorModeOpen, setIsColorModeOpen] = useState(false)

  const [resolutions, setResolutions] = useState<string[]>([])
  const [colorModes, setColorModes] = useState<string[]>([])
  const [resolutionValues, setResolutionValues] = useState<number[]>([])
  const [pixelTypeValues, setPixelTypeValues] = useState<number[]>([])
  const [selectedResolution, setSelectedResolution] = useState<string>("")
  const [selectedColorMode, setSelectedColorMode] = useState<string>("")

  const closeAllDropdowns = () => {
    setIsScannerOpen(false)
    setIsResolutionOpen(false)
    setIsColorModeOpen(false)
  }

  // ✅ whenever scanner changes → reset old selections
  useEffect(() => {
    if (!selectedScanner) {
      setResolutions([])
      setColorModes([])
      setResolutionValues([])
      setPixelTypeValues([])
      setSelectedResolution("")
      setSelectedColorMode("")
    } else {
      // // reset so we fetch fresh caps for new scanner
      setSelectedResolution("")
      setSelectedColorMode("")
    }
  }, [selectedScanner])

// === fetch scanner capabilities ===
 // inside fetchCapabilities effect
useEffect(() => {
  const Encleso: EnclesoType | undefined = window.Encleso
  if (!selectedScanner || !Encleso) return

  const fetchCapabilities = async () => {
    try {
      const caps = await Encleso.GetCapabilities?.(selectedScanner)
      
      if (!caps) return

      // === Resolution ===
      if (caps.Resolution?.Values?.length) {
        const resValues = caps.Resolution.Values.map(Number)
        const labels = resValues.map((r) => `${r} DPI`)

        setResolutionValues(resValues)
        setResolutions(labels)

        // ✅ only set first if nothing already selected
        if (!selectedResolution) {
          setSelectedResolution(labels[0])
          onCapabilitiesChange?.(resValues[0], undefined)
        }
      }

      // === Color Modes ===
      if (caps.PixelType?.Values?.length) {
        const pixelValues = caps.PixelType.Values.map(Number)
        const labels = pixelValues.map((val: number) =>
          Encleso.PixelTypeToString ? Encleso.PixelTypeToString(val) : String(val),
        )

        setPixelTypeValues(pixelValues)
        setColorModes(labels)

        // ✅ only set first if nothing already selected
        if (!selectedColorMode) {
          setSelectedColorMode(labels[0])
          onCapabilitiesChange?.(undefined, pixelValues[0])
        }
      }
    } catch (err) {
      console.error("Failed to fetch capabilities for", selectedScanner, err)
    }
  }

  fetchCapabilities()
}, [selectedScanner, onCapabilitiesChange]) // ✅ removed selectedResolution, selectedColorMode from deps

  // === Capability Update ===
  const updateCapabilities = async (resolutionLabel: string, colorModeLabel: string) => {
    const Encleso: EnclesoType | undefined = window.Encleso
    if (!Encleso || !selectedScanner) return

    try {
      const resIndex = resolutions.indexOf(resolutionLabel)
      const pixIndex = colorModes.indexOf(colorModeLabel)

      const resolutionNumber = resolutionValues[resIndex] ?? undefined
      const pixelNumber = pixelTypeValues[pixIndex] ?? undefined

      const caps: { Resolution?: number; PixelType?: number } = {}
      if (resolutionNumber !== undefined) caps.Resolution = resolutionNumber
      if (pixelNumber !== undefined) caps.PixelType = pixelNumber

      if (Object.keys(caps).length > 0) {
        await Encleso.SetCapabilities(caps)

        // ✅ preserve UI + update hook state
        if (caps.Resolution !== undefined) {
          setSelectedResolution(resolutionLabel)
          onCapabilitiesChange?.(caps.Resolution, undefined)
        }
        if (caps.PixelType !== undefined) {
          setSelectedColorMode(colorModeLabel)
          onCapabilitiesChange?.(undefined, caps.PixelType)
        }
      }
    } catch (err) {
      console.error("Failed to set capabilities:", err)
    }
  }

 const handleResolutionChange = (value: string) => {
  setSelectedResolution(value) // ✅ update immediately
  updateCapabilities(value, selectedColorMode)
  setIsResolutionOpen(false)
}

const handleColorModeChange = (value: string) => {
  setSelectedColorMode(value) // ✅ update immediately
  updateCapabilities(selectedResolution, value)
  setIsColorModeOpen(false)
}


  const getStatusDisplay = () => {
    if (error) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Error</span>
        </div>
      )
    }

    if (!isReady) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Initializing...</span>
        </div>
      )
    }

    if (scanners.length > 0) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <Wifi className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Connected ({scanners.length})</span>
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <WifiOff className="w-4 h-4" />
        <span className="text-xs">No Scanner</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="text-sm text-gray-700">Scan Mode:</div>
      {getStatusDisplay()}

      {/* Scanner Dropdown */}
      {scanners.length > 0 && (
        <div className="relative">
          <button
            onClick={() => {
              closeAllDropdowns()
              setIsScannerOpen(!isScannerOpen)
            }}
            className="w-full border rounded p-2 text-xs text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-between"
          >
            <span className="truncate">{selectedScanner || scanners[0]}</span>
            <ChevronDown className={`w-3 h-3 ml-2 ${isScannerOpen ? "rotate-180" : "rotate-0"}`} />
          </button>

          {isScannerOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10">
              <div className="py-1 max-h-40 overflow-y-auto custom-scroll">
                {scanners.map((scanner, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onSelectScanner(scanner)
                      setIsScannerOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-[11px] hover:bg-gray-100 ${
                      selectedScanner === scanner ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                    title={scanner}
                  >
                    {scanner}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resolutions Dropdown */}
      {isReady && selectedScanner && (
        <div className="flex flex-col text-xs text-gray-600 relative">
          <span className="font-semibold">Resolutions:</span>
          <button
            onClick={() => {
              closeAllDropdowns()
              setIsResolutionOpen(!isResolutionOpen)
            }}
            className="border rounded p-2 mt-1 text-xs text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-between"
          >
            <span className="text-xs">{selectedResolution || "Select resolution"}</span>
            <ChevronDown className={`w-3 h-3 ml-2 ${isResolutionOpen ? "rotate-180" : "rotate-0"}`} />
          </button>

          {isResolutionOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10">
              <div className="py-1 max-h-40 overflow-y-auto custom-scroll">
                {resolutions.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      handleResolutionChange(res)
                      setIsResolutionOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                      selectedResolution === res ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Color Modes Dropdown */}
      {isReady && selectedScanner && (
        <div className="flex flex-col text-xs text-gray-600 relative">
          <span className="font-semibold">Color Modes:</span>
          <button
            onClick={() => {
              closeAllDropdowns()
              setIsColorModeOpen(!isColorModeOpen)
            }}
            className="border rounded p-2 mt-1 text-xs text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-between"
          >
            <span className="text-[11px]">{selectedColorMode || "Select color mode"}</span>
            <ChevronDown className={`w-3 h-3 ml-2 ${isColorModeOpen ? "rotate-180" : "rotate-0"}`} />
          </button>

          {isColorModeOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10">
              <div className="py-1 max-h-40 overflow-y-auto custom-scroll">
                {colorModes.map((mode, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      handleColorModeChange(mode)
                      setIsColorModeOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                      selectedColorMode === mode ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 max-w-full lg:max-w-40 truncate" title={error}>
          {error}
        </div>
      )}

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 9999px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  )
}
