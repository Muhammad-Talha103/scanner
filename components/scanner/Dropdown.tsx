"use client"

import type React from "react"
import { ImportHandler } from "@/components/ImportHandler"

interface DropdownItem {
  label: string
  icon: React.ReactNode
  shortcut?: string
  onClick?: () => void
  disabled?: boolean
  href?: string
}

export interface ScannedImage {
  id: string
  dataUrl: string
  timestamp: number
}

interface DropdownProps {
  items: DropdownItem[]
  isOpen: boolean
  onImagesImported?: (images: ScannedImage[]) => void
  onClose?: () => void
}

export const Dropdown = ({ items, isOpen, onImagesImported, onClose }: DropdownProps) => {
  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-300 rounded-md shadow-lg z-50">
      {items.map((item, index) => {
        const baseClasses = `w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md ${
          item.disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
        }`

        const content = (
          <>
            <div className="flex items-center space-x-3">
              {item.icon}
              <span className="text-[13px] whitespace-nowrap">{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-xs text-gray-500">{item.shortcut}</span>
            )}
          </>
        )

        // Special case: "Import" button wrapped with ImportHandler
        if (item.label === "Import" && onImagesImported) {
          return (
            <ImportHandler key={index} onImagesImported={onImagesImported}>
              <button
                className={baseClasses}
                disabled={item.disabled}
              >
                {content}
              </button>
            </ImportHandler>
          )
        }

        // If href is provided, render as link
        if (item.href) {
          return (
            <a
              key={index}
              href={item.href}
            
              className={baseClasses}
            >
              {content}
            </a>
          )
        }

        // Otherwise, render as button
        return (
          <button
            key={index}
            className={baseClasses}
            onClick={() => {
              if (!item.disabled) {
                item.onClick?.()
                onClose?.()
              }
            }}
            disabled={item.disabled}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}
