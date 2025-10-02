"use client"

import type React from "react"
import { Dropdown, ScannedImage } from "./Dropdown"
import { useTranslation } from "react-i18next"

interface DropdownItem {
  label: string
  icon: React.ReactNode
  shortcut?: string
  onClick?: () => void
  disabled?: boolean
  href?: string
}



interface MenuBarProps {
  menuItems: Record<string, DropdownItem[]>
  activeDropdown: string | null
  onDropdownToggle: (menu: string) => void
  onImagesImported: (images: ScannedImage[]) => void
}

export const MenuBar = ({ menuItems, activeDropdown, onDropdownToggle, onImagesImported }: MenuBarProps) => {
   const { t } = useTranslation();
  return (
    <div className="border-b border-gray-300 px-2 py-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center space-x-1">
            {Object.entries(menuItems).map(([key, items]) => (
              <div key={key} className="relative">
                <button
                  className="px-3 py-1 text-sm hover:bg-gray-300 rounded capitalize"
                  onClick={() => onDropdownToggle(key)}
                >
                  {key === "extras" ? "Extras" : key}
                </button>
                <Dropdown
                  items={items}
                  isOpen={activeDropdown === key}
                  onImagesImported={onImagesImported}
                  onClose={() => onDropdownToggle(key)}
                />
              </div>
            ))}
          
          </div>
        </div>
        <div className="text-sm text-gray-700 hidden lg:block"> {t("fullscreen")}</div>
      </div>
    </div>
  )
}

