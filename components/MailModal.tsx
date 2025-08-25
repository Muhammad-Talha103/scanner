"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Mail, Paperclip, FileText, Check, Loader2 } from "lucide-react"
import { ScannedImage } from "./scanner/Dropdown"
import emailjs from "@emailjs/browser"

interface MailModalProps {
  isOpen: boolean
  onClose: () => void
  scannedImages: ScannedImage[]
}

interface FormData {
  to: string
  subject: string
  message: string
  attachFile: File | null
  includePDF: boolean
  pdfName: string
}

export const MailModal: React.FC<MailModalProps> = ({ isOpen, onClose, scannedImages }) => {
  const [formData, setFormData] = useState<FormData>({
    to: "",
    subject: "",
    message: "",
    attachFile: null,
    includePDF: false,
    pdfName: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        to: "",
        subject: "",
        message: "",
        attachFile: null,
        includePDF: false,
        pdfName: "",
      })
      setIsLoading(false)
      setIsSuccess(false)
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, onClose])

  const handleInputChange = (field: keyof FormData, value: string | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleInputChange("attachFile", file)
  }

  // --- Generate PDF from scannedImages ---
  const generatePDF = async (): Promise<Blob> => {
    const jsPDFModule = await import("jspdf")
    const jsPDF = jsPDFModule.default
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10

    for (let i = 0; i < scannedImages.length; i++) {
      const image = scannedImages[i]
      if (i > 0) pdf.addPage()

      const img = new Image()
      img.crossOrigin = "anonymous"
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = image.dataUrl
      })

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
    }

    return pdf.output("blob")
  }

  const validateForm = (): boolean => {
    if (!formData.to.trim()) {
      setError("Recipient email is required")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.to)) {
      setError("Please enter a valid email address")
      return false
    }
    if (!formData.subject.trim()) {
      setError("Subject is required")
      return false
    }
    if (formData.includePDF && !formData.pdfName.trim()) {
      setError("PDF name is required when including scanned images")
      return false
    }
    return true
  }

  const handleSend = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)
      setError(null)

      let finalMessage = formData.message
      let pdfUrl: string | null = null

      if (formData.includePDF && scannedImages.length > 0) {
        // Generate PDF
        const pdfBlob = await generatePDF()

        // Upload to Sanity
        const formDataUpload = new FormData()
        formDataUpload.append("pdfFile", pdfBlob, `${formData.pdfName || "document"}.pdf`)

        const res = await fetch("/api/upload-pdf", { method: "POST", body: formDataUpload })
        const data = await res.json()
        if (!data.url) throw new Error("Failed to upload PDF to Sanity")
        pdfUrl = data.url

        // Add PDF link to email
        finalMessage += `\n\nDownload PDF: ${pdfUrl}`
      }

      // Prepare EmailJS params
      const templateParams = {
        to_email: formData.to,
        subject: formData.subject,
        message: finalMessage,
      }

      await emailjs.send(
        "service_bwk31zq",
        "template_ebrmlnm",
        templateParams,
        "bX45Z98k0s3hHIUq9"
      )

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/80  flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onKeyDown={handleKeyPress}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Send Email</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {!isSuccess ? (
            <div className="space-y-4">
              {/* Recipient Email */}
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-2">
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  id="to"
                  type="email"
                  value={formData.to}
                  onChange={(e) => handleInputChange("to", e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  placeholder="Email subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="Your message here..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Attachment</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleFileSelect}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    disabled={isLoading}
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm">Choose File</span>
                  </button>
                  {formData.attachFile && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span className="truncate max-w-48">{formData.attachFile.name}</span>
                      <button
                        onClick={() => handleInputChange("attachFile", null)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                  className="hidden"
                />
              </div>

              {/* Include PDF Option */}
              {scannedImages.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      id="includePDF"
                      type="checkbox"
                      checked={formData.includePDF}
                      onChange={(e) => handleInputChange("includePDF", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <label htmlFor="includePDF" className="text-sm font-medium text-gray-700">
                      Include scanned/imported images as PDF ({scannedImages.length} page
                      {scannedImages.length !== 1 ? "s" : ""})
                    </label>
                  </div>

                  {formData.includePDF && (
                    <div>
                      <label htmlFor="pdfName" className="block text-sm font-medium text-gray-700 mb-2">
                        PDF Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="pdfName"
                          type="text"
                          value={formData.pdfName}
                          onChange={(e) => handleInputChange("pdfName", e.target.value)}
                          placeholder="Document name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isLoading}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 text-sm">.pdf</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span></span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email sent successfully!</h3>
              <p className="text-sm text-gray-600">Your email has been delivered to {formData.to}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

