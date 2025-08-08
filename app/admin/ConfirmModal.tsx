"use client"
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  userName: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  isSuccess?: boolean
}

export default function ConfirmModal({ 
  isOpen, 
  userName, 
  onConfirm, 
  onCancel, 
  isLoading = false,
  isSuccess = false 
}: ConfirmModalProps) {
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true)
      // Auto close after showing success for 2 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false)
        onCancel() // Close the modal
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isSuccess, onCancel])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading && !showSuccess) {
        onCancel()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onCancel, isLoading, showSuccess])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-white/80 bg-opacity-50 transition-opacity duration-300 animate-fade-in"
        onClick={!isLoading && !showSuccess ? onCancel : undefined}
      />
            
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all duration-300 animate-slide-up">
          <div className="px-6 py-4">
            {showSuccess ? (
              // Success State
              <div className="text-center py-4">
                <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 animate-scale-in">
                  <Check className="w-8 h-8 text-green-600 animate-check-draw" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 animate-fade-in-up">
                  Successfully Deleted
                </h3>
                <p className="text-sm text-gray-600 animate-fade-in-up animation-delay-200">
                  User <span className="font-medium text-gray-900">{userName}</span> successfully deleted
                </p>
              </div>
            ) : (
              // Confirmation State
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirm Delete
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete <span className="font-medium text-gray-900">{userName}</span>?               
                  This action cannot be undone.
                </p>
                            
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium outline-none text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 hover:border-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        @keyframes slide-up {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes check-draw {
          0% {
            opacity: 0;
            transform: scale(0) rotate(45deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(45deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-check-draw {
          animation: check-draw 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  )
}
