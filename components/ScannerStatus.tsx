
"use client"

import type React from "react"
import { Wifi, WifiOff, AlertCircle } from "lucide-react"


interface ScannerStatusProps {
  isReady: boolean
  scannerName: string | null
  error: string | null
}

export const ScannerStatus: React.FC<ScannerStatusProps> = ({ isReady, scannerName, error }) => {
  const getStatusDisplay = () => {
    if (error) {
      return (
        <div className="flex items-center space-x-2 text-red-600" >
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs">Error</span>
        </div>
      )
    }

    if (!isReady) {
      return (
        <div className="flex items-center space-x-2 text-gray-500" >
          <WifiOff className="w-4 h-4" />
          <span className="text-xs">Initializing...</span>
        </div>
      )
    }

    if (scannerName) {
      return (
        <div className="flex items-center space-x-2 text-green-600" >
          <Wifi className="w-4 h-4" />
          <span className="text-xs">Connected</span>
           
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-2 text-gray-500 " >
        <WifiOff className="w-4 h-4" />
        <span className="text-xs">No Scanner</span>
      </div>
    )
  }

  return (
    <>
     <div className="flex lg:flex-col items-center lg:items-start space-x-4 lg:space-x-0 lg:space-y-2">
      <div className="text-sm text-gray-700">Scan Mode:</div>
      <div className="flex flex-col space-y-1">
        {getStatusDisplay()}
        {scannerName && (
          <div className="text-xs text-gray-600 max-w-full lg:max-w-32 truncate " title={scannerName}>
            {scannerName}
          </div>
        )}
        {error && (
          <div className="text-xs text-red-500 max-w-full lg:max-w-32 truncate " title={error}>
            {error}
          </div>
        )}
      </div>
    </div>
     
    </>
   
    
  )
}
