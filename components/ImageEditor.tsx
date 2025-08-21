"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { X, RotateCw, ZoomIn, ZoomOut, Crop, Move, Undo, Redo, Save, Loader2, RotateCcw, Maximize } from "lucide-react"
import { ScannedImage } from "./scanner/Dropdown"


interface ImageEditorProps {
  isOpen: boolean
  onClose: () => void
  image: ScannedImage | null
  onSave: (editedImage: ScannedImage) => void
}

interface EditState {
  rotation: number
  scale: number
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
  isCropping: boolean
}

interface HistoryState extends EditState {
  imageData: ImageData | null
}

interface CropHandle {
  x: number
  y: number
  width: number
  height: number
  cursor: string
  type: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | "move"
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ isOpen, onClose, image, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [editState, setEditState] = useState<EditState>({
    rotation: 0,
    scale: 1,
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0,
    isCropping: false,
  })
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // Crop-specific state
  const [cropDragType, setCropDragType] = useState<string | null>(null)
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropWidth: 0, cropHeight: 0 })

  // Load image when modal opens
  useEffect(() => {
    if (isOpen && image) {
      setIsLoading(true)
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        setOriginalImage(img)
        setEditState({
          rotation: 0,
          scale: 1,
          cropX: 0,
          cropY: 0,
          cropWidth: img.width,
          cropHeight: img.height,
          isCropping: false,
        })
        setCanvasOffset({ x: 0, y: 0 })
        setHistory([])
        setHistoryIndex(-1)
        setIsLoading(false)
      }
      img.onerror = () => {
        setIsLoading(false)
        console.error("Failed to load image")
      }
      img.src = image.dataUrl
    }
  }, [isOpen, image])

  // Calculate image position and size on canvas
  const calculateImageBounds = useCallback(() => {
    if (!canvasRef.current || !originalImage) return { x: 0, y: 0, width: 0, height: 0 }

    const canvas = canvasRef.current
    const centerX = canvas.width / 2 + canvasOffset.x
    const centerY = canvas.height / 2 + canvasOffset.y

    let displayWidth = originalImage.width * editState.scale
    let displayHeight = originalImage.height * editState.scale

    // Adjust for rotation
    if (editState.rotation === 90 || editState.rotation === 270) {
      ;[displayWidth, displayHeight] = [displayHeight, displayWidth]
    }

    return {
      x: centerX - displayWidth / 2,
      y: centerY - displayHeight / 2,
      width: displayWidth,
      height: displayHeight,
    }
  }, [originalImage, editState.scale, editState.rotation, canvasOffset])

  // Get crop handles for interactive resizing
  const getCropHandles = useCallback((): CropHandle[] => {
    if (!editState.isCropping) return []

    const handleSize = 8
    const { cropX, cropY, cropWidth, cropHeight } = editState

    return [
      // Corner handles
      {
        x: cropX - handleSize / 2,
        y: cropY - handleSize / 2,
        width: handleSize,
        height: handleSize,
        cursor: "nw-resize",
        type: "nw",
      },
      {
        x: cropX + cropWidth - handleSize / 2,
        y: cropY - handleSize / 2,
        width: handleSize,
        height: handleSize,
        cursor: "ne-resize",
        type: "ne",
      },
      {
        x: cropX - handleSize / 2,
        y: cropY + cropHeight - handleSize / 2,
        width: handleSize,
        height: handleSize,
        cursor: "sw-resize",
        type: "sw",
      },
      {
        x: cropX + cropWidth - handleSize / 2,
        y: cropY + cropHeight - handleSize / 2,
        width: handleSize,
        height: handleSize,
        cursor: "se-resize",
        type: "se",
      },
      // Edge handles
      {
        x: cropX + cropWidth / 2 - handleSize / 2,
        y: cropY - handleSize / 2,
        width: handleSize,
        height: handleSize,
        cursor: "n-resize",
        type: "n",
      },
      {
        x: cropX + cropWidth / 2 - handleSize / 2,
        y: cropY + cropHeight - handleSize / 2,
        width: handleSize,
        height: handleSize,
        cursor: "s-resize",
        type: "s",
      },
      {
        x: cropX - handleSize / 2,
        y: cropY + cropHeight / 2 - handleSize / 2,
        width: handleSize,
        height: handleSize,
        cursor: "w-resize",
        type: "w",
      },
      {
        x: cropX + cropWidth - handleSize / 2,
        y: cropY + cropHeight / 2 - handleSize / 2,
        width: handleSize,
        height: handleSize,
        cursor: "e-resize",
        type: "e",
      },
      // Move handle (entire crop area)
      { x: cropX, y: cropY, width: cropWidth, height: cropHeight, cursor: "move", type: "move" },
    ]
  }, [editState])

  // Draw image on canvas
  const drawImage = useCallback(() => {
    if (!canvasRef.current || !originalImage) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 800
    canvas.height = 600

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context
    ctx.save()

    // Move to center
    ctx.translate(canvas.width / 2 + canvasOffset.x, canvas.height / 2 + canvasOffset.y)

    // Apply rotation
    ctx.rotate((editState.rotation * Math.PI) / 180)

    // Apply scale
    ctx.scale(editState.scale, editState.scale)

    // Draw image centered
    const drawWidth = originalImage.width
    const drawHeight = originalImage.height
    ctx.drawImage(originalImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

    // Restore context
    ctx.restore()

    // Update image position for crop calculations
    const bounds = calculateImageBounds()
    setImagePosition(bounds)

    // Draw crop overlay if cropping
    if (editState.isCropping) {
      // Draw semi-transparent overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Clear crop area
      ctx.globalCompositeOperation = "destination-out"
      ctx.fillRect(editState.cropX, editState.cropY, editState.cropWidth, editState.cropHeight)
      ctx.globalCompositeOperation = "source-over"

      // Draw crop border
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.strokeRect(editState.cropX, editState.cropY, editState.cropWidth, editState.cropHeight)

      // Draw crop handles
      const handles = getCropHandles()
      handles.forEach((handle, index) => {
        if (index < 8) {
          // Only draw the resize handles, not the move handle
          ctx.fillStyle = "#3b82f6"
          ctx.fillRect(handle.x, handle.y, handle.width, handle.height)
          ctx.strokeStyle = "#ffffff"
          ctx.lineWidth = 1
          ctx.strokeRect(handle.x, handle.y, handle.width, handle.height)
        }
      })

      // Draw crop dimensions
      ctx.fillStyle = "#3b82f6"
      ctx.font = "12px Arial"
      ctx.fillText(
        `${Math.round(editState.cropWidth)} × ${Math.round(editState.cropHeight)}`,
        editState.cropX + 5,
        editState.cropY - 5,
      )
    }
  }, [originalImage, editState, canvasOffset, calculateImageBounds, getCropHandles])

  // Redraw when state changes
  useEffect(() => {
    drawImage()
  }, [drawImage])

  // Save current state to history
  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newState: HistoryState = {
      ...editState,
      imageData,
    }

    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newState)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [editState, history, historyIndex])

  // Handle rotation
  const handleRotate = (degrees: number) => {
    setEditState((prev) => ({
      ...prev,
      rotation: (prev.rotation + degrees) % 360,
    }))
    saveToHistory()
  }

  // Handle zoom
  const handleZoom = (factor: number) => {
    setEditState((prev) => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale * factor)),
    }))
  }

  // Handle crop toggle
  const handleCropToggle = () => {
    if (!canvasRef.current || !originalImage) return

    if (!editState.isCropping) {
      // Start cropping - set initial crop area in the center of the visible image
      const bounds = calculateImageBounds()
      const cropSize = Math.min(bounds.width * 0.6, bounds.height * 0.6, 200)

      setEditState((prev) => ({
        ...prev,
        isCropping: true,
        cropX: bounds.x + (bounds.width - cropSize) / 2,
        cropY: bounds.y + (bounds.height - cropSize) / 2,
        cropWidth: cropSize,
        cropHeight: cropSize,
      }))
    } else {
      setEditState((prev) => ({
        ...prev,
        isCropping: false,
      }))
    }
  }

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setEditState({
        rotation: prevState.rotation,
        scale: prevState.scale,
        cropX: prevState.cropX,
        cropY: prevState.cropY,
        cropWidth: prevState.cropWidth,
        cropHeight: prevState.cropHeight,
        isCropping: prevState.isCropping,
      })
      setHistoryIndex(historyIndex - 1)
    }
  }

  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setEditState({
        rotation: nextState.rotation,
        scale: nextState.scale,
        cropX: nextState.cropX,
        cropY: nextState.cropY,
        cropWidth: nextState.cropWidth,
        cropHeight: nextState.cropHeight,
        isCropping: nextState.isCropping,
      })
      setHistoryIndex(historyIndex + 1)
    }
  }

  // Get cursor style based on mouse position
  const getCursorStyle = useCallback(
    (clientX: number, clientY: number): string => {
      if (!editState.isCropping || !canvasRef.current) return "default"

      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      const handles = getCropHandles()
      for (const handle of handles) {
        if (x >= handle.x && x <= handle.x + handle.width && y >= handle.y && y <= handle.y + handle.height) {
          return handle.cursor
        }
      }

      return "default"
    },
    [editState.isCropping, getCropHandles],
  )

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (editState.isCropping) {
      // Check if clicking on crop handles
      const handles = getCropHandles()
      for (const handle of handles) {
        if (x >= handle.x && x <= handle.x + handle.width && y >= handle.y && y <= handle.y + handle.height) {
          setCropDragType(handle.type)
          setCropDragStart({
            x: e.clientX,
            y: e.clientY,
            cropX: editState.cropX,
            cropY: editState.cropY,
            cropWidth: editState.cropWidth,
            cropHeight: editState.cropHeight,
          })
          return
        }
      }
    } else {
      // Regular pan mode
      setIsDragging(true)
      setDragStart({
        x: e.clientX - canvasOffset.x,
        y: e.clientY - canvasOffset.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return

    // Update cursor
    const canvas = canvasRef.current
    canvas.style.cursor = getCursorStyle(e.clientX, e.clientY)

    if (cropDragType) {
      // Handle crop resizing/moving
      const deltaX = e.clientX - cropDragStart.x
      const deltaY = e.clientY - cropDragStart.y
      const bounds = imagePosition

      let newCropX = cropDragStart.cropX
      let newCropY = cropDragStart.cropY
      let newCropWidth = cropDragStart.cropWidth
      let newCropHeight = cropDragStart.cropHeight

      switch (cropDragType) {
        case "nw":
          newCropX = Math.max(
            bounds.x,
            Math.min(cropDragStart.cropX + deltaX, cropDragStart.cropX + cropDragStart.cropWidth - 20),
          )
          newCropY = Math.max(
            bounds.y,
            Math.min(cropDragStart.cropY + deltaY, cropDragStart.cropY + cropDragStart.cropHeight - 20),
          )
          newCropWidth = cropDragStart.cropWidth - (newCropX - cropDragStart.cropX)
          newCropHeight = cropDragStart.cropHeight - (newCropY - cropDragStart.cropY)
          break
        case "ne":
          newCropY = Math.max(
            bounds.y,
            Math.min(cropDragStart.cropY + deltaY, cropDragStart.cropY + cropDragStart.cropHeight - 20),
          )
          newCropWidth = Math.max(
            20,
            Math.min(bounds.x + bounds.width - cropDragStart.cropX, cropDragStart.cropWidth + deltaX),
          )
          newCropHeight = cropDragStart.cropHeight - (newCropY - cropDragStart.cropY)
          break
        case "sw":
          newCropX = Math.max(
            bounds.x,
            Math.min(cropDragStart.cropX + deltaX, cropDragStart.cropX + cropDragStart.cropWidth - 20),
          )
          newCropWidth = cropDragStart.cropWidth - (newCropX - cropDragStart.cropX)
          newCropHeight = Math.max(
            20,
            Math.min(bounds.y + bounds.height - cropDragStart.cropY, cropDragStart.cropHeight + deltaY),
          )
          break
        case "se":
          newCropWidth = Math.max(
            20,
            Math.min(bounds.x + bounds.width - cropDragStart.cropX, cropDragStart.cropWidth + deltaX),
          )
          newCropHeight = Math.max(
            20,
            Math.min(bounds.y + bounds.height - cropDragStart.cropY, cropDragStart.cropHeight + deltaY),
          )
          break
        case "n":
          newCropY = Math.max(
            bounds.y,
            Math.min(cropDragStart.cropY + deltaY, cropDragStart.cropY + cropDragStart.cropHeight - 20),
          )
          newCropHeight = cropDragStart.cropHeight - (newCropY - cropDragStart.cropY)
          break
        case "s":
          newCropHeight = Math.max(
            20,
            Math.min(bounds.y + bounds.height - cropDragStart.cropY, cropDragStart.cropHeight + deltaY),
          )
          break
        case "w":
          newCropX = Math.max(
            bounds.x,
            Math.min(cropDragStart.cropX + deltaX, cropDragStart.cropX + cropDragStart.cropWidth - 20),
          )
          newCropWidth = cropDragStart.cropWidth - (newCropX - cropDragStart.cropX)
          break
        case "e":
          newCropWidth = Math.max(
            20,
            Math.min(bounds.x + bounds.width - cropDragStart.cropX, cropDragStart.cropWidth + deltaX),
          )
          break
        case "move":
          newCropX = Math.max(
            bounds.x,
            Math.min(bounds.x + bounds.width - cropDragStart.cropWidth, cropDragStart.cropX + deltaX),
          )
          newCropY = Math.max(
            bounds.y,
            Math.min(bounds.y + bounds.height - cropDragStart.cropHeight, cropDragStart.cropY + deltaY),
          )
          break
      }

      setEditState((prev) => ({
        ...prev,
        cropX: newCropX,
        cropY: newCropY,
        cropWidth: newCropWidth,
        cropHeight: newCropHeight,
      }))
    } else if (isDragging && !editState.isCropping) {
      // Handle image panning
      setCanvasOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (cropDragType) {
      setCropDragType(null)
      saveToHistory()
    }
  }

  // Handle save
  const handleSave = async () => {
    if (!canvasRef.current || !originalImage || !image) return

    setIsLoading(true)

    try {
      // Create a new canvas for the final image
      const finalCanvas = document.createElement("canvas")
      const finalCtx = finalCanvas.getContext("2d")
      if (!finalCtx) throw new Error("Failed to get canvas context")

      if (editState.isCropping) {
        // Calculate crop coordinates relative to the original image
        const bounds = imagePosition
        const scaleX = originalImage.width / bounds.width
        const scaleY = originalImage.height / bounds.height

        const cropXRel = (editState.cropX - bounds.x) * scaleX
        const cropYRel = (editState.cropY - bounds.y) * scaleY
        const cropWidthRel = editState.cropWidth * scaleX
        const cropHeightRel = editState.cropHeight * scaleY

        // Set canvas to crop size
        finalCanvas.width = cropWidthRel
        finalCanvas.height = cropHeightRel

        // Apply transformations and draw cropped area
        finalCtx.save()

        if (editState.rotation !== 0) {
          finalCtx.translate(cropWidthRel / 2, cropHeightRel / 2)
          finalCtx.rotate((editState.rotation * Math.PI) / 180)
          finalCtx.translate(-cropWidthRel / 2, -cropHeightRel / 2)
        }

        finalCtx.drawImage(
          originalImage,
          cropXRel,
          cropYRel,
          cropWidthRel,
          cropHeightRel,
          0,
          0,
          cropWidthRel,
          cropHeightRel,
        )

        finalCtx.restore()
      } else {
        // No cropping, apply other transformations
        let finalWidth = originalImage.width
        let finalHeight = originalImage.height

        // Apply rotation to dimensions
        if (editState.rotation === 90 || editState.rotation === 270) {
          finalWidth = originalImage.height
          finalHeight = originalImage.width
        }

        finalCanvas.width = finalWidth
        finalCanvas.height = finalHeight

        // Draw the edited image
        finalCtx.save()
        finalCtx.translate(finalWidth / 2, finalHeight / 2)
        finalCtx.rotate((editState.rotation * Math.PI) / 180)
        finalCtx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2)
        finalCtx.restore()
      }

      // Convert to data URL
      const editedDataUrl = finalCanvas.toDataURL("image/jpeg", 0.9)

      // Create edited image object with same ID
      const editedImage: ScannedImage = {
        ...image,
        dataUrl: editedDataUrl,
        timestamp: Date.now(),
      }

      onSave(editedImage)
      onClose()
    } catch (error) {
      console.error("Failed to save edited image:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle fit to screen
  const handleFitToScreen = () => {
    if (!canvasRef.current || !originalImage) return

    const canvas = canvasRef.current
    const scaleX = (canvas.width * 0.8) / originalImage.width
    const scaleY = (canvas.height * 0.8) / originalImage.height
    const scale = Math.min(scaleX, scaleY)

    setEditState((prev) => ({
      ...prev,
      scale,
    }))
    setCanvasOffset({ x: 0, y: 0 })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/80 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Image</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {/* Rotation */}
            <button
              onClick={() => handleRotate(-90)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              disabled={isLoading}
              title="Rotate Left"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRotate(90)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              disabled={isLoading}
              title="Rotate Right"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Zoom */}
            <button
              onClick={() => handleZoom(1.2)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              disabled={isLoading}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              disabled={isLoading}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFitToScreen}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              disabled={isLoading}
              title="Fit to Screen"
            >
              <Maximize className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Crop */}
            <button
              onClick={handleCropToggle}
              className={`p-2 rounded transition-colors ${
                editState.isCropping
                  ? "text-blue-600 bg-blue-100 hover:bg-blue-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
              }`}
              disabled={isLoading}
              title={editState.isCropping ? "Exit Crop Mode" : "Enter Crop Mode"}
            >
              <Crop className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* History */}
            <button
              onClick={handleUndo}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || historyIndex <= 0}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || historyIndex >= history.length - 1}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Scale indicator */}
          <div className="text-sm text-gray-600">
            Scale: {Math.round(editState.scale * 100)}%
            {editState.isCropping && (
              <span className="ml-4">
                Crop: {Math.round(editState.cropWidth)} × {Math.round(editState.cropHeight)}
              </span>
            )}
          </div>

          {/* Save/Cancel */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-100" ref={containerRef}>
          {isLoading && originalImage === null ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading image...</p>
              </div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="absolute inset-0"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          )}

          {/* Instructions */}
          {!editState.isCropping && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded">
              <div className="flex items-center space-x-2">
                <Move className="w-3 h-3" />
                <span>Drag to pan • Use zoom controls to resize</span>
              </div>
            </div>
          )}

          {editState.isCropping && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded">
              <div className="flex items-center space-x-2">
                <Crop className="w-3 h-3" />
                <span>Drag handles to resize crop area • Drag inside to move</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
