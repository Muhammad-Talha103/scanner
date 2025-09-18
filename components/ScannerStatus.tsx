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

"use client";

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, AlertCircle, ChevronDown } from "lucide-react";
import type { EnclesoType } from "@/hooks/useScannerIntegration";
import DeleteAllImages from "./DeleteAllImages";
import { ScannedImage } from "./scanner/Dropdown";

interface ScannerStatusProps {
  isReady: boolean;
  scanners: string[];
  selectedScanner: string | null;
  onSelectScanner: (name: string) => void;
  error: string | null;
  onCapabilitiesChange?: (
    resolution?: number,
    pixelType?: number,
    duplex?: boolean,
    showUI?: boolean
  ) => void;
  onToggleUI: (value: boolean) => void;
}

export const ScannerStatus: React.FC<ScannerStatusProps> = ({
  isReady,
  scanners,
  selectedScanner,
  onSelectScanner,
  error,
  onCapabilitiesChange,
  onToggleUI,
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isResolutionOpen, setIsResolutionOpen] = useState(false);
  const [isColorModeOpen, setIsColorModeOpen] = useState(false);
  const [isDuplexOpen, setIsDuplexOpen] = useState(false);

  const [resolutions, setResolutions] = useState<string[]>([]);
  const [resolutionValues, setResolutionValues] = useState<number[]>([]);
  const [colorModes, setColorModes] = useState<string[]>([]);
  const [pixelTypeValues, setPixelTypeValues] = useState<number[]>([]);
  const [duplexOptions, setDuplexOptions] = useState<string[]>([]);

  const [selectedResolution, setSelectedResolution] = useState<string>("");
  const [selectedColorMode, setSelectedColorMode] = useState<string>("");
  const [selectedDuplexLabel, setSelectedDuplexLabel] = useState<string>("");

  const [duplexValue, setDuplexValue] = useState<boolean | null>(false);
  const [duplexChangeAllowed, setDuplexChangeAllowed] = useState(false);
  const [showScannerUI, setShowScannerUI] = useState(true);

  const closeAllDropdowns = () => {
    setIsScannerOpen(false);
    setIsResolutionOpen(false);
    setIsColorModeOpen(false);
    setIsDuplexOpen(false);
  };

  useEffect(() => {
    if (!selectedScanner) {
      setResolutions([]);
      setResolutionValues([]);
      setColorModes([]);
      setPixelTypeValues([]);
      setSelectedResolution("");
      setSelectedColorMode("");
      setDuplexOptions([]);
      setSelectedDuplexLabel("");
      setDuplexValue(null);
      setDuplexChangeAllowed(false);
      return;
    }

    const Encleso: EnclesoType | undefined = window.Encleso;
    if (!Encleso) return;

    const fetchCapabilities = async () => {
      try {
        setResolutions([]);
        setResolutionValues([]);
        setColorModes([]);
        setPixelTypeValues([]);
        setSelectedResolution("");
        setSelectedColorMode("");
        setDuplexOptions([]);
        setSelectedDuplexLabel("");
        setDuplexValue(null);
        setDuplexChangeAllowed(false);

        const caps = await Encleso.GetCapabilities?.(selectedScanner);
        if (!caps) return;

        if (caps.Resolution?.Values?.length) {
          const resVals = caps.Resolution.Values.map(Number);
          const resLabels = resVals.map((v) => `${v} x ${v}`);
          setResolutionValues(resVals);
          setResolutions(resLabels);

          if (!selectedResolution) {
            setSelectedResolution(resLabels[0]);
            onCapabilitiesChange?.(resVals[0]);
          }
        }

        if (caps.PixelType?.Values?.length) {
          const pixVals = caps.PixelType.Values.map(Number);
          const pixLabels = pixVals.map(
            (val) => Encleso.PixelTypeToString?.(val) ?? val.toString()
          );
          setPixelTypeValues(pixVals);
          setColorModes(pixLabels);

          if (!selectedColorMode) {
            setSelectedColorMode(pixLabels[0]);
            onCapabilitiesChange?.(undefined, pixVals[0]);
          }
        }

        if (caps.Duplex?.Supported) {
          const enabled = !!caps.Duplex.Enabled;
          setDuplexValue(enabled);
          setDuplexChangeAllowed(!!caps.Duplex.ChangeAllowed);

          const options = ["Off", "On"];
          setDuplexOptions(options);
          setSelectedDuplexLabel(enabled ? "On" : "Off");

          // onCapabilitiesChange?.(undefined, undefined, enabled);
        }
      } catch (err) {
        console.error("Error fetching capabilities:", err);
      }
    };

    fetchCapabilities();
  }, [selectedScanner]);

  const updateCapabilities = async (
    resolutionLabel: string,
    colorLabel: string,
    duplexLabel?: string
  ) => {
    const Encleso: EnclesoType | undefined = window.Encleso;
    if (!Encleso || !selectedScanner) return;

    try {
      const resIdx = resolutions.indexOf(resolutionLabel);
      const pixIdx = colorModes.indexOf(colorLabel);

      const caps: {
        Resolution?: number;
        PixelType?: number;
        Duplex?: boolean;
      } = {};

      if (resIdx >= 0) caps.Resolution = resolutionValues[resIdx];
      if (pixIdx >= 0) caps.PixelType = pixelTypeValues[pixIdx];
      if (duplexLabel) caps.Duplex = duplexLabel === "On";

      await Encleso.SetCapabilities(caps);

      if (caps.Resolution !== undefined) {
        setSelectedResolution(resolutionLabel);
        onCapabilitiesChange?.(caps.Resolution);
      }
      if (caps.PixelType !== undefined) {
        setSelectedColorMode(colorLabel);
        onCapabilitiesChange?.(undefined, caps.PixelType);
      }
      if (caps.Duplex !== undefined) {
        setSelectedDuplexLabel(caps.Duplex ? "On" : "Off");
        setDuplexValue(caps.Duplex);
        onCapabilitiesChange?.(undefined, undefined, caps.Duplex);
      }
    } catch (err) {
      console.error("Failed to update capabilities:", err);
    }
  };

  const handleResolutionChange = (value: string) => {
    updateCapabilities(value, selectedColorMode, selectedDuplexLabel);
    setIsResolutionOpen(false);
  };

  const handleColorModeChange = (value: string) => {
    updateCapabilities(selectedResolution, value, selectedDuplexLabel);
    setIsColorModeOpen(false);
  };

  const handleDuplexChange = (value: string) => {
    const isOn = value === "On";
    updateCapabilities(selectedResolution, selectedColorMode, value);
    onCapabilitiesChange?.(undefined, undefined, isOn);
    setIsDuplexOpen(false);
  };

  const getStatusDisplay = () => {
    if (error) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Error</span>
        </div>
      );
    }

    if (!isReady) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Initializing...</span>
        </div>
      );
    }

    if (scanners.length > 0) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <Wifi className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Connected ({scanners.length})</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <WifiOff className="w-4 h-4" />
        <span className="text-xs">No Scanner</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-y-2">
      <div className="text-sm text-gray-700">Scan Mode:</div>
      {getStatusDisplay()}

      {isReady && scanners.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Show Scanner Driver UI:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showScannerUI}
              onChange={(e) => {
                const checked = e.target.checked;
                setShowScannerUI(checked);
                onToggleUI?.(checked); // ✅ propagate upwards
              }}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-all duration-300"></div>
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 peer-checked:translate-x-4"></div>
          </label>
        </div>
      )}

      {/* Scanner Dropdown */}
      {scanners.length > 0 && (
        <div className="relative">
          <button
            onClick={() => {
              closeAllDropdowns();
              setIsScannerOpen(!isScannerOpen);
            }}
            className="w-full border rounded p-2 text-xs text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-between"
          >
            <span className="truncate">{selectedScanner || scanners[0]}</span>
            <ChevronDown
              className={`w-3 h-3 ml-2 ${isScannerOpen ? "rotate-180" : "rotate-0"}`}
            />
          </button>

          {isScannerOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10">
              <div className="py-1 max-h-40 overflow-y-auto custom-scroll">
                {scanners.map((scanner, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onSelectScanner(scanner);
                      setIsScannerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[11px] hover:bg-gray-100 ${
                      selectedScanner === scanner
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
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
              closeAllDropdowns();
              setIsResolutionOpen(!isResolutionOpen);
            }}
            className="border rounded p-2 mt-1 text-xs text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-between"
          >
            <span className="text-xs">
              {selectedResolution || "Select resolution"}
            </span>
            <ChevronDown
              className={`w-3 h-3 ml-2 ${isResolutionOpen ? "rotate-180" : "rotate-0"}`}
            />
          </button>

          {isResolutionOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10">
              <div className="py-1 max-h-40 overflow-y-auto custom-scroll">
                {resolutions.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      handleResolutionChange(res);
                      setIsResolutionOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                      selectedResolution === res
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
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
              closeAllDropdowns();
              setIsColorModeOpen(!isColorModeOpen);
            }}
            className="border rounded p-2 mt-1 text-xs text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-between"
          >
            <span className="text-[11px]">
              {selectedColorMode || "Select color mode"}
            </span>
            <ChevronDown
              className={`w-3 h-3 ml-2 ${isColorModeOpen ? "rotate-180" : "rotate-0"}`}
            />
          </button>

          {isColorModeOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10">
              <div className="py-1 max-h-40 overflow-y-auto custom-scroll">
                {colorModes.map((mode, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      handleColorModeChange(mode);
                      setIsColorModeOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 ${
                      selectedColorMode === mode
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
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

      {/* Duplex Toggle */}
      {isReady && selectedScanner && (
        <div className="flex flex-col text-xs text-gray-600">
          <span className="font-semibold mb-1">Duplex:</span>

          <button
            onClick={() => {
              const newValue = !duplexValue;
              setDuplexValue(newValue);
              setSelectedDuplexLabel(newValue ? "On" : "Off");
              updateCapabilities(
                selectedResolution,
                selectedColorMode,
                newValue ? "On" : "Off"
              );
              onCapabilitiesChange?.(undefined, undefined, newValue);
            }}
            className={`relative w-[50px] h-7 flex items-center rounded-full transition-colors duration-300 ${
              duplexValue ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {/* Labels */}
            <span className="absolute left-1 text-[11px] font-semibold text-white">
              Off
            </span>
            <span className="absolute right-1 text-[11px] font-semibold text-white">
              On
            </span>

            {/* Knob */}
            <span
              className={`absolute w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300 ${
                duplexValue ? "translate-x-[24px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      )}

      {error && (
        <div
          className="text-xs text-red-500 max-w-full lg:max-w-40 truncate"
          title={error}
        >
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
  );
};
