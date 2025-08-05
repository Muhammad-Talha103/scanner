"use client"

import { useCallback } from "react"

interface ScannedImage {
  id: string
  dataUrl: string
  timestamp: number
}

export const usePDFGenerator = () => {
  const generatePDF = useCallback(async (images: ScannedImage[], fileName?: string): Promise<void> => {
    if (images.length === 0) {
      throw new Error("No images to save")
    }

    try {
      const hasEnclesoImages = images.some((img) => img.id.startsWith("scan-"))

      if (hasEnclesoImages && window.Encleso && !fileName) {
        // Use Encleso for scanned images (legacy behavior)
        const scannedIndexes = images
          .map((img, index) => (img.id.startsWith("scan-") ? index : -1))
          .filter((index) => index !== -1)

        if (scannedIndexes.length > 0) {
          window.Encleso.SaveImageToFilesystem("pdf-multi", scannedIndexes)
          return
        }
      }

      // Generate PDF using canvas and download with custom filename
      await generateClientSidePDF(images, fileName)
    } catch (error) {
      console.error("Error generating PDF:", error)
      throw new Error("Failed to generate PDF")
    }
  }, [])

  const generateClientSidePDF = async (images: ScannedImage[], fileName?: string): Promise<void> => {
    // Import jsPDF dynamically
        const jsPDFModule = await import("jspdf")
    const jsPDF = jsPDFModule.default


    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10

    for (let i = 0; i < images.length; i++) {
      const image = images[i]

      if (i > 0) {
        pdf.addPage()
      }

      try {
        // Create a temporary image to get dimensions
        const img = new Image()
        img.crossOrigin = "anonymous"

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error("Failed to load image"))
          img.src = image.dataUrl
        })

        // Calculate dimensions to fit within page
        const imgWidth = img.width
        const imgHeight = img.height
        const availableWidth = pageWidth - 2 * margin
        const availableHeight = pageHeight - 2 * margin

        let finalWidth = availableWidth
        let finalHeight = (imgHeight * availableWidth) / imgWidth

        if (finalHeight > availableHeight) {
          finalHeight = availableHeight
          finalWidth = (imgWidth * availableHeight) / imgHeight
        }

        const x = (pageWidth - finalWidth) / 2
        const y = (pageHeight - finalHeight) / 2

        pdf.addImage(image.dataUrl, "JPEG", x, y, finalWidth, finalHeight)
      } catch (error) {
        console.error("Error adding image to PDF:", error)
        // Continue with other images
      }
    }

    // Save the PDF with custom filename or default
    const finalFileName = fileName ? `${fileName}.pdf` : "scanned-document.pdf"
    pdf.save(finalFileName)
  }

  return { generatePDF }
}
