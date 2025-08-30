"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertCircle, ChevronDown } from "lucide-react";
import type { EnclesoType } from "@/hooks/useScannerIntegration";

interface ScannerStatusProps {
  isReady: boolean;
  scanners: string[];
  selectedScanner: string | null;
  onSelectScanner: (name: string) => void;
  error: string | null;
}

export const ScannerStatus: React.FC<ScannerStatusProps> = ({
  isReady,
  scanners,
  selectedScanner,
  onSelectScanner,
  error,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [resolutions, setResolutions] = useState<string[]>([]);
  const [colorModes, setColorModes] = useState<string[]>([]);
  const [selectedResolution, setSelectedResolution] = useState<string>("");
  const [selectedColorMode, setSelectedColorMode] = useState<string>("");

  // Fetch capabilities whenever selectedScanner changes
  useEffect(() => {
    const Encleso: EnclesoType | undefined = window.Encleso;
    if (!selectedScanner || !Encleso) return;

    const fetchCapabilities = async () => {
      try {
        const caps = await Encleso.GetCapabilities?.(selectedScanner);
        if (!caps) return;

        // Resolution
        if (caps.Resolution?.Values?.length) {
          const resValues = caps.Resolution.Values.map(String);
          setResolutions(resValues);
          setSelectedResolution(
            resValues[caps.Resolution.CurrentIndex] || resValues[0]
          );
        } else {
          setResolutions(["Unsupported"]);
          setSelectedResolution("Unsupported");
        }

        // Color modes
        if (caps.PixelType?.Values?.length) {
          const colorValues = Encleso.PixelTypeToString
            ? caps.PixelType.Values.map(Encleso.PixelTypeToString)
            : caps.PixelType.Values.map(String);
          setColorModes(colorValues);
          setSelectedColorMode(colorValues[0]);
        } else {
          setColorModes(["Unsupported"]);
          setSelectedColorMode("Unsupported");
        }
      } catch (err) {
        console.error("Failed to fetch capabilities for", selectedScanner, err);
        setResolutions(["Error"]);
        setColorModes(["Error"]);
        setSelectedResolution("Error");
        setSelectedColorMode("Error");
      }
    };

    fetchCapabilities();
  }, [selectedScanner]);

  // Update scanner capabilities
  const updateCapabilities = async (resolution: string, colorMode: string) => {
    const Encleso: EnclesoType | undefined = window.Encleso;
    if (!Encleso || !selectedScanner) return;

    try {
      await Encleso.SetCapabilities({
        Resolution: Number(resolution),
        PixelType: colorModes.indexOf(colorMode),
      });
    } catch (err) {
      console.error("Failed to set capabilities:", err);
    }
  };

  const handleResolutionChange = (value: string) => {
    setSelectedResolution(value);
    updateCapabilities(value, selectedColorMode);
  };

  const handleColorModeChange = (value: string) => {
    setSelectedColorMode(value);
    updateCapabilities(selectedResolution, value);
  };

  const getStatusDisplay = () => {
    if (error) {
      return (
        <div className="flex items-center space-x-2 text-red-600 transition-all duration-300 ease-in-out">
          <AlertCircle className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Error</span>
        </div>
      );
    }

    if (!isReady) {
      return (
        <div className="flex items-center space-x-2 text-gray-500 transition-all duration-300 ease-in-out">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Initializing...</span>
        </div>
      );
    }

    if (scanners.length > 0) {
      return (
        <div className="flex items-center space-x-2 text-green-600 transition-all duration-300 ease-in-out">
          <Wifi className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Connected ({scanners.length})</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-gray-500 transition-all duration-300 ease-in-out">
        <WifiOff className="w-4 h-4" />
        <span className="text-xs">No Scanner</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-y-2">
      <div className="text-sm text-gray-700">Scan Mode:</div>
      {getStatusDisplay()}

      {scanners.length > 0 && (
        <div className="relative max-w-xs">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full border rounded p-2 text-xs text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 ease-in-out hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
          >
            <span className="truncate">{selectedScanner || scanners[0]}</span>
            <ChevronDown
              className={`w-3 h-3 ml-2 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          <div
            className={`absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10 transition-all duration-200 ease-in-out origin-top ${
              isDropdownOpen
                ? "opacity-100 scale-y-100 translate-y-0"
                : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="py-1 max-h-40 overflow-y-auto">
              {scanners.map((scanner, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelectScanner(scanner);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 transition-colors duration-150 ${
                    selectedScanner === scanner
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {scanner}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resolutions Dropdown */}
      <div className="flex flex-col text-xs text-gray-600">
        <span className="font-semibold">Resolutions:</span>
        <select
          className="border rounded p-1 mt-1 text-xs"
          value={selectedResolution}
          onChange={(e) => handleResolutionChange(e.target.value)}
        >
          {resolutions.map((res, i) => (
            <option key={i} value={res}>
              {res} x {res}
            </option>
          ))}
        </select>
      </div>

      {/* Color Modes Dropdown */}
      <div className="flex flex-col text-xs text-gray-600">
        <span className="font-semibold">Color Modes:</span>
        <select
          className="border rounded p-1 mt-1 text-xs"
          value={selectedColorMode}
          onChange={(e) => handleColorModeChange(e.target.value)}
        >
          {colorModes.map((mode, i) => (
            <option key={i} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div
          className="text-xs text-red-500 max-w-full lg:max-w-40 truncate animate-in slide-in-from-top-2 duration-300"
          title={error}
        >
          {error}
        </div>
      )}
    </div>
  );
};
