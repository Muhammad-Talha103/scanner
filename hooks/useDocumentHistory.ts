"use client"

import { ScannedImage } from "@/components/scanner/Dropdown"
import { useReducer, useCallback, useEffect } from "react"



interface DocumentState {
  images: ScannedImage[]
  selectedImageIds: Set<string>
  selectedImageId: string | null
  timestamp: number
}

type HistoryActionPayload =
  | { type: "NEW_DOCUMENT"; payload?: undefined }
  | { type: "ADD_IMAGES"; payload: { images: ScannedImage[] } }
  | { type: "DELETE_IMAGE"; payload: { imageId: string; deletedImage: ScannedImage } }
  | { type: "UPDATE_IMAGE"; payload: { oldImage: ScannedImage; updatedImage: ScannedImage } }
  | { type: "TOGGLE_SELECTION"; payload: { imageId: string; selected: boolean } }
  | { type: "SET_SELECTED_IMAGE"; payload: { imageId: string | null } }


interface HistoryAction {
  type: HistoryActionPayload["type"]
  payload?: HistoryActionPayload["payload"]
  description: string
}

interface HistoryState {
  past: DocumentState[]
  present: DocumentState
  future: DocumentState[]
}

type HistoryReducerAction =
  | { type: "EXECUTE_ACTION"; action: HistoryAction; newState: DocumentState }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR_HISTORY" }

const createInitialState = (): DocumentState => ({
  images: [],
  selectedImageIds: new Set<string>(),
  selectedImageId: null,
  timestamp: Date.now(),
})

const historyReducer = (state: HistoryState, action: HistoryReducerAction): HistoryState => {
  switch (action.type) {
    case "EXECUTE_ACTION": {
      const { newState } = action
      return {
        past: [...state.past, state.present],
        present: newState,
        future: [], // Clear future when new action is executed
      }
    }

    case "UNDO": {
      if (state.past.length === 0) return state

      const previous = state.past[state.past.length - 1]
      const newPast = state.past.slice(0, state.past.length - 1)

      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      }
    }

    case "REDO": {
      if (state.future.length === 0) return state

      const next = state.future[0]
      const newFuture = state.future.slice(1)

      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      }
    }

    case "CLEAR_HISTORY": {
      return {
        past: [],
        present: createInitialState(),
        future: [],
      }
    }

    default:
      return state
  }
}

export const useDocumentHistory = () => {
  const [historyState, dispatch] = useReducer(historyReducer, {
    past: [],
    present: createInitialState(),
    future: [],
  })

  const { past, present, future } = historyState

  // Execute an action and add it to history
  const executeAction = useCallback((action: HistoryAction, newState: DocumentState) => {
    dispatch({ type: "EXECUTE_ACTION", action, newState })
  }, [])

  // Undo the last action
  const undo = useCallback(() => {
    if (past.length > 0) {
      dispatch({ type: "UNDO" })
    }
  }, [past.length])

  // Redo the last undone action
  const redo = useCallback(() => {
    if (future.length > 0) {
      dispatch({ type: "REDO" })
    }
  }, [future.length])

  // Clear all history and reset to initial state
  const clearHistory = useCallback(() => {
    dispatch({ type: "CLEAR_HISTORY" })
  }, [])

  // Create a new document (clear everything)
  const createNewDocument = useCallback(() => {
    const newState = createInitialState()
    executeAction(
      {
        type: "NEW_DOCUMENT",
        description: "New Document Created",
      },
      newState,
    )
  }, [executeAction])

  // Add images (import or scan)
  const addImages = useCallback(
    (newImages: ScannedImage[], description = "Images Added") => {
      const newState: DocumentState = {
        ...present,
        images: [...present.images, ...newImages],
        timestamp: Date.now(),
      }
      executeAction(
        {
          type: "ADD_IMAGES",
          payload: { images: newImages },
          description,
        },
        newState,
      )
    },
    [present, executeAction],
  )

  // Delete an image
  const deleteImage = useCallback(
    (imageId: string) => {
      const imageToDelete = present.images.find((img) => img.id === imageId)
      if (!imageToDelete) return

      const newImages = present.images.filter((img) => img.id !== imageId)
      const newSelectedImageIds = new Set(present.selectedImageIds)
      newSelectedImageIds.delete(imageId)

      const newSelectedImageId = present.selectedImageId === imageId ? null : present.selectedImageId

      const newState: DocumentState = {
        ...present,
        images: newImages,
        selectedImageIds: newSelectedImageIds,
        selectedImageId: newSelectedImageId,
        timestamp: Date.now(),
      }

      executeAction(
        {
          type: "DELETE_IMAGE",
          payload: { imageId, deletedImage: imageToDelete },
          description: "Image Deleted",
        },
        newState,
      )
    },
    [present, executeAction],
  )

  // Update an image (edit)
  const updateImage = useCallback(
    (updatedImage: ScannedImage) => {
      const imageIndex = present.images.findIndex((img) => img.id === updatedImage.id)
      if (imageIndex === -1) return

      const oldImage = present.images[imageIndex]
      const newImages = [...present.images]
      newImages[imageIndex] = updatedImage

      const newState: DocumentState = {
        ...present,
        images: newImages,
        timestamp: Date.now(),
      }

      executeAction(
        {
          type: "UPDATE_IMAGE",
          payload: { oldImage, updatedImage },
          description: "Image Edited",
        },
        newState,
      )
    },
    [present, executeAction],
  )

  // Toggle image selection for operations
  const toggleImageSelection = useCallback(
    (imageId: string) => {
      const newSelectedImageIds = new Set(present.selectedImageIds)
      if (newSelectedImageIds.has(imageId)) {
        newSelectedImageIds.delete(imageId)
      } else {
        newSelectedImageIds.add(imageId)
      }

      const newState: DocumentState = {
        ...present,
        selectedImageIds: newSelectedImageIds,
        timestamp: Date.now(),
      }

      executeAction(
        {
          type: "TOGGLE_SELECTION",
          payload: { imageId, selected: newSelectedImageIds.has(imageId) },
          description: "Selection Changed",
        },
        newState,
      )
    },
    [present, executeAction],
  )

  // Set selected image for editing (with toggle behavior)
  const setSelectedImage = useCallback(
    (imageId: string | null) => {
      // If clicking on the same image that's already selected, deselect it
      const newSelectedImageId = present.selectedImageId === imageId ? null : imageId

      const newState: DocumentState = {
        ...present,
        selectedImageId: newSelectedImageId,
        timestamp: Date.now(),
      }

      executeAction(
        {
          type: "SET_SELECTED_IMAGE",
          payload: { imageId: newSelectedImageId },
          description: newSelectedImageId ? "Image Selected for Editing" : "Image Deselected",
        },
        newState,
      )
    },
    [present, executeAction],
  )

  // Clear selected image (for clicking outside)
  const clearSelectedImage = useCallback(() => {
    if (present.selectedImageId === null) return

    const newState: DocumentState = {
      ...present,
      selectedImageId: null,
      timestamp: Date.now(),
    }

    executeAction(
      {
        type: "SET_SELECTED_IMAGE",
        payload: { imageId: null },
        description: "Image Deselected",
      },
      newState,
    )
  }, [present, executeAction])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case "z":
            if (event.shiftKey || (event.ctrlKey && event.key === "Y")) {
              // Ctrl+Shift+Z or Ctrl+Y for redo
              event.preventDefault()
              redo()
            } else {
              // Ctrl+Z for undo
              event.preventDefault()
              undo()
            }
            break
          case "y":
            // Ctrl+Y for redo
            event.preventDefault()
            redo()
            break
          case "n":
            // Ctrl+N for new document
            event.preventDefault()
            createNewDocument()
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo, createNewDocument])

  // Helper functions
  const canUndo = past.length > 0
  const canRedo = future.length > 0
  const getSelectedImages = useCallback(() => {
    return present.images.filter((img) => present.selectedImageIds.has(img.id))
  }, [present.images, present.selectedImageIds])

  const isImageSelected = useCallback(
    (imageId: string) => {
      return present.selectedImageIds.has(imageId)
    },
    [present.selectedImageIds],
  )

  return {
    // Current state
    images: present.images,
    selectedImageIds: present.selectedImageIds,
    selectedImageId: present.selectedImageId,

    // Actions
    createNewDocument,
    addImages,
    deleteImage,
    updateImage,
    toggleImageSelection,
    setSelectedImage,
    clearSelectedImage,

    // History controls
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,

    // Helper functions
    getSelectedImages,
    isImageSelected,

    // State info
    historyLength: past.length,
    futureLength: future.length,
  }
}
