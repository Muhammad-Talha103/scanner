"use client"

import { ScannedImage } from "@/components/scanner/Dropdown"
import { useState, useEffect, useCallback } from "react"



// Define the StoredImage interface for storage
interface StoredImage {
  id: string
  dataUrl: string
  timestamp: number
  isSelected: boolean
}

// Define the imageStorage utility interface
interface ImageStorage {
  loadWithFallback: () => Promise<StoredImage[]>
  saveWithFallback: (images: StoredImage[]) => Promise<void>
  deleteImage: (imageId: string) => Promise<void>
}

// Mock imageStorage object (replace with actual import in real implementation)
const imageStorage: ImageStorage = {
  loadWithFallback: async () => [],
  saveWithFallback: async () => {},
  deleteImage: async () => {},
}

export const usePersistentImages = () => {
  const [images, setImages] = useState<ScannedImage[]>([])
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Load images from storage on mount
  useEffect(() => {
    const loadStoredImages = async () => {
      try {
        setIsLoading(true)
        const storedImages: StoredImage[] = await imageStorage.loadWithFallback()

        const loadedImages: ScannedImage[] = storedImages.map((stored) => ({
          id: stored.id,
          dataUrl: stored.dataUrl,
          timestamp: stored.timestamp,
        }))

        const selectedIds = new Set<string>(
          storedImages.filter((img) => img.isSelected).map((img) => img.id)
        )

        setImages(loadedImages)
        setSelectedImageIds(selectedIds)
      } catch (error: unknown) {
        console.error("Failed to load images from storage:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStoredImages()
  }, [])

  // Save images to storage whenever they change
  const saveToStorage = useCallback(
    async (imagesToSave: ScannedImage[], selectedIds: Set<string>) => {
      try {
        const storedImages: StoredImage[] = imagesToSave.map((img) => ({
          id: img.id,
          dataUrl: img.dataUrl,
          timestamp: img.timestamp,
          isSelected: selectedIds.has(img.id),
        }))

        await imageStorage.saveWithFallback(storedImages)
      } catch (error: unknown) {
        console.error("Failed to save images to storage:", error)
      }
    },
    []
  )

  // Add new images
  const addImages = useCallback(
    (newImages: ScannedImage[]) => {
      setImages((prev) => {
        const updated = [...prev, ...newImages]
        saveToStorage(updated, selectedImageIds)
        return updated
      })
    },
    [selectedImageIds, saveToStorage]
  )

  // Update existing image
  const updateImage = useCallback(
    (updatedImage: ScannedImage) => {
      setImages((prev) => {
        const updated = prev.map((img) => (img.id === updatedImage.id ? updatedImage : img))
        saveToStorage(updated, selectedImageIds)
        return updated
      })
    },
    [selectedImageIds, saveToStorage]
  )

  // Toggle image selection
  const toggleImageSelection = useCallback(
    (imageId: string) => {
      setSelectedImageIds((prev) => {
        const newSelected = new Set(prev)
        if (newSelected.has(imageId)) {
          newSelected.delete(imageId)
        } else {
          newSelected.add(imageId)
        }

        // Save to storage with updated selection
        saveToStorage(images, newSelected)
        return newSelected
      })
    },
    [images, saveToStorage]
  )

  // Delete image
  const deleteImage = useCallback(
    async (imageId: string) => {
      try {
        // Remove from IndexedDB/localStorage
        await imageStorage.deleteImage(imageId)

        // Update local state
        setImages((prev) => {
          const updated = prev.filter((img) => img.id !== imageId)
          return updated
        })

        setSelectedImageIds((prev) => {
          const newSelected = new Set(prev)
          newSelected.delete(imageId)
          return newSelected
        })
      } catch (error: unknown) {
        console.error("Failed to delete image:", error)
        throw error
      }
    },
    []
  )

  // Clear all images
  const clearAllImages = useCallback(() => {
    setImages([])
    setSelectedImageIds(new Set())
    saveToStorage([], new Set())
  }, [saveToStorage])

  // Get selected images
  const getSelectedImages = useCallback(() => {
    return images.filter((img) => selectedImageIds.has(img.id))
  }, [images, selectedImageIds])

  // Check if image is selected
  const isImageSelected = useCallback(
    (imageId: string) => {
      return selectedImageIds.has(imageId)
    },
    [selectedImageIds]
  )

  return {
    images,
    selectedImageIds,
    isLoading,
    addImages,
    updateImage,
    toggleImageSelection,
    deleteImage,
    clearAllImages,
    getSelectedImages,
    isImageSelected,
  }
}