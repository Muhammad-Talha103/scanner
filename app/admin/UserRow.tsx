"use client"

import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  password: string
}

interface UserRowProps {
  user: User
  serialNumber: number
  onDelete: (userId: string, userName: string) => void
  isDesktop: boolean
}

export default function UserRow({ user, serialNumber, onDelete, isDesktop }: UserRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const maskPassword = (password: string) => {
    return '•'.repeat(password.length)
  }

  // Handlers to show password only while pressing the eye button
  const handleShowPasswordStart = () => setShowPassword(true)
  const handleShowPasswordEnd = () => setShowPassword(false)

  if (isDesktop) {
    return (
      <tr className="hover:bg-gray-50 transition-colors duration-200 animate-fade-in">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {serialNumber}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">{user.name}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{user.email}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap flex flex-col space-y-1 font-mono text-sm text-gray-900">
  {/* Label above the password */}
  {/* <span className="uppercase font-semibold text-xs text-gray-500 select-none bg-blue-400 w-fit p-1 rounded-2xl">
    UPDATED
  </span> */}

  {/* Password and button side by side */}
  <div className="flex items-center space-x-2">
    <span>{(showPassword ? user.password : maskPassword(user.password)).toUpperCase()}</span>
    <button
      onMouseDown={handleShowPasswordStart}
      onMouseUp={handleShowPasswordEnd}
      onMouseLeave={handleShowPasswordEnd}
      onTouchStart={handleShowPasswordStart}
      onTouchEnd={handleShowPasswordEnd}
      className="focus:outline-none"
      aria-label={showPassword ? "Hide password" : "Show password"}
      type="button"
    >
      {showPassword ? (
        <EyeOff className="w-5 h-5 text-gray-500" />
      ) : (
        <Eye className="w-5 h-5 text-gray-500" />
      )}
    </button>
  </div>
</td>

        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={() => onDelete(user.id, user.name)}
            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>

        </td>
        
      </tr>
    )
  }

  return (
    <div className="border-b border-gray-200 animate-fade-in">
      <div
        className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-500">#{serialNumber}</span>
          <span className="text-sm font-medium text-gray-900">{user.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400 transition-transform duration-200" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
          )}
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 bg-gray-50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Email
            </label>
            <div className="text-sm text-gray-900">{user.email}</div>
          </div>

          <div className="flex items-center space-x-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Password
            </label>
            <span className="text-sm text-gray-900 font-mono flex items-center space-x-2">
              <span>{showPassword ? user.password : maskPassword(user.password)}</span>
              <button
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleShowPasswordStart()
                }}
                onMouseUp={(e) => {
                  e.stopPropagation()
                  handleShowPasswordEnd()
                }}
                onMouseLeave={(e) => {
                  e.stopPropagation()
                  handleShowPasswordEnd()
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                  handleShowPasswordStart()
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  handleShowPasswordEnd()
                }}
                className="focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
                type="button"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(user.id, user.name)
              }}
              className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
