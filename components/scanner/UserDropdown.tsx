"use client"
import { User, LogOut } from "lucide-react"

interface UserDropdownProps {
  isOpen: boolean
  userName: string | null
  userEmail: string
  onLogout: () => void
}

export const UserDropdown = ({ isOpen, userName, userEmail, onLogout }: UserDropdownProps) => {
  return (
    <div
      className={`absolute top-full right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 transform transition-all duration-200 ease-in-out ${
        isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
      }`}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-[13px] text-gray-500 truncate">{userEmail}</p>
          </div>
        </div>
      </div>
      <div className="py-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
        >
          <LogOut className="w-4 h-4 mr-3 text-gray-500" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
