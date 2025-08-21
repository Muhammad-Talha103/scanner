import { ScannedImage } from "@/components/scanner/Dropdown"
import { jsPDF } from "jspdf"


export const usePDFGenerator = () => {
  const generatePDF = async (
    images: ScannedImage[],
    fileName: string,
    fileHandle?: FileSystemFileHandle,
  ) => {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage()
        const img = new Image()
        img.src = images[i].dataUrl
        await new Promise((resolve) => {
          img.onload = resolve
        })

        const imgProps = pdf.getImageProperties(img)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = imgProps.width
        const imgHeight = imgProps.height
        const aspectRatio = imgWidth / imgHeight

        let scaledWidth = pdfWidth
        let scaledHeight = pdfWidth / aspectRatio
        if (scaledHeight > pdfHeight) {
          scaledHeight = pdfHeight
          scaledWidth = pdfHeight * aspectRatio
        }

        const x = (pdfWidth - scaledWidth) / 2
        const y = (pdfHeight - scaledHeight) / 2

        pdf.addImage(img, "JPEG", x, y, scaledWidth, scaledHeight)
      }

      if (fileHandle) {
        const writable = await fileHandle.createWritable()
        const pdfBlob = pdf.output("blob")
        await writable.write(pdfBlob)
        await writable.close()
      } else {
        pdf.save(`${fileName}.pdf`)
      }
    } catch (error) {
      console.error("PDF generation failed:", error)
      throw new Error("Failed to generate PDF")
    }
  }

  return { generatePDF }
}