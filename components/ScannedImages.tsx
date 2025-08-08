"use client"

import type React from "react"
import { useState } from "react"
import { FileText, Loader2, Trash2 } from "lucide-react"
import { DeleteConfirmationModal } from "./DeleteConfirmationModal"

interface ScannedImage {
  id: string
  dataUrl: string
  timestamp: number
}

interface ScannedImagesProps {
  images: ScannedImage[]
  isScanning: boolean
  onImageClick?: (image: ScannedImage) => void
  selectedImageId?: string | null
  isImageSelected?: (imageId: string) => boolean
  onToggleSelection?: (imageId: string) => void
  onDeleteImage?: (imageId: string) => void
}

export const ScannedImages: React.FC<ScannedImagesProps> = ({
  images,
  isScanning,
  onImageClick,
  selectedImageId,
  isImageSelected,
  onToggleSelection,
  onDeleteImage,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<{ id: string; index: number } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleImageClick = (image: ScannedImage, e: React.MouseEvent) => {
    // Check if clicking on delete button
    if ((e.target as HTMLElement).closest(".delete-button")) {
      return
    }

    // Handle selection toggle if function provided
    if (onToggleSelection) {
      onToggleSelection(image.id)
    }

    // Handle regular image click
    if (onImageClick) {
      onImageClick(image)
    }
  }

  const handleDeleteClick = (imageId: string, imageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation()

    if (onDeleteImage) {
      setImageToDelete({ id: imageId, index: imageIndex + 1 }) // 1-based index
      setShowDeleteModal(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!imageToDelete || !onDeleteImage) return

    try {
      setIsDeleting(true)
      await onDeleteImage(imageToDelete.id)
      setShowDeleteModal(false)
      setImageToDelete(null)
    } catch (error) {
      console.error("Failed to delete image:", error)
      // Keep modal open on error
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    if (isDeleting) return
    setShowDeleteModal(false)
    setImageToDelete(null)
  }

  if (images.length === 0 && !isScanning) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-gray-500 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">No Document Loaded</p>
          <p className="text-sm">Click Scan to start scanning or Import to load images</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-4 h-full overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image, index) => {
            const isCurrentlySelected = selectedImageId === image.id
            const isToggleSelected = isImageSelected ? isImageSelected(image.id) : false

            return (
              <div
                key={image.id}
                className={`bg-white border rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all relative group ${
                  isCurrentlySelected
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : isToggleSelected
                      ? "border-green-500 ring-2 ring-green-200"
                      : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={(e) => handleImageClick(image, e)}
              >
                <div className="aspect-[3/4] relative">
                  <img
                    src={image.dataUrl || "/placeholder.svg"}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-contain bg-gray-50"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    Page {index + 1}
                  </div>
                  <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {image.id.startsWith("import-") ? "Imported" : "Scanned"}
                  </div>

                  {/* Delete button - only visible on hover */}
                  {onDeleteImage && (
                    <button
                      className="delete-button absolute bottom-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => handleDeleteClick(image.id, index, e)}
                      title="Delete image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  {/* Selection indicators */}
                  {isCurrentlySelected && (
                    <div className="absolute inset-0 bg-opacity-10 flex items-center justify-center">
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Selected</div>
                    </div>
                  )}

                  {isToggleSelected && !isCurrentlySelected && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-10 flex items-center justify-center">
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">✓</div>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-500">{new Date(image.timestamp).toLocaleTimeString()}</p>
                  {isToggleSelected && <p className="text-xs text-green-600 font-medium">Selected for operations</p>}
                </div>
              </div>
            )
          })}

          {isScanning && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-[3/4] flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Scanning...</p>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-500">In progress</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        imageIndex={imageToDelete?.index || 1}
        isDeleting={isDeleting}
      />
    </>
  )
}
