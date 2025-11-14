"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Mail, Paperclip, FileText, Check, Loader2 } from "lucide-react"
import type { ScannedImage } from "./scanner/Dropdown"
import { client } from "@/sanity/lib/client"
import emailjs from "@emailjs/browser"
import { uploadFileToSanity } from "@/sanity/lib/uploadFile"
import { useTranslation } from "next-i18next"
import QrCode from "@/public/greweqr.png"
import { useSelector } from "react-redux"
import type { RootState } from "@/redux/store"

interface MailModalProps {
  isOpen: boolean
  onClose: () => void
  scannedImages: ScannedImage[]
}

interface FormData {
  to: string
  subject: string
  message: string
  attachFiles: File[]
  includePDF: boolean
  pdfName: string
}

export const MailModal: React.FC<MailModalProps> = ({ isOpen, onClose, scannedImages }) => {
  const { t } = useTranslation()
  const userInfo = useSelector((state: RootState) => state.user.userInfo)

  const [formData, setFormData] = useState<FormData>({
    to: "",
    subject: "",
    message: "",
    attachFiles: [],
    includePDF: false,
    pdfName: "",
  })
  const [senderType, setSenderType] = useState<"own" | "grewscanner">("own")
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
        attachFiles: [],
        includePDF: false,
        pdfName: "",
      })
      setSenderType("own")
      setIsLoading(false)
      setIsSuccess(false)
      setError(null)
    }
  }, [isOpen])

  const formatDateForFilename = (date = new Date()) => {
    const dd = String(date.getDate()).padStart(2, "0")
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const yyyy = date.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleFileSelect = () => fileInputRef.current?.click()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        attachFiles: [...prev.attachFiles, ...files],
      }))
    }
  }

const generatePDF = async (): Promise<Blob> => {
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default;

  let isPremium = false;
  try {
    const premiumUser = await client.fetch(
      `*[_type == "premiumUser" && email == $email][0]`,
      { email: userInfo?.email || "" }
    );
    isPremium = Boolean(premiumUser);
  } catch {
    console.warn("Premium check failed, applying demo watermark.");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 2;

  for (let i = 0; i < scannedImages.length; i++) {
    const image = scannedImages[i];
    if (i > 0) pdf.addPage();

    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = image.dataUrl;
    });

    const imgWidth = img.width;
    const imgHeight = img.height;

    const availableWidth = pageWidth - 2 * margin;
    const availableHeight = pageHeight - 2 * margin;

    let finalWidth = availableWidth;
    let finalHeight = (imgHeight * availableWidth) / imgWidth;

    if (finalHeight > availableHeight) {
      finalHeight = availableHeight;
      finalWidth = (imgWidth * availableHeight) / imgHeight;
    }

    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    pdf.addImage(image.dataUrl, "JPEG", x, y, finalWidth, finalHeight);

    // 🌊 WATERMARK
  if (!isPremium) {
  const leftMargin = 10; // X coordinate
  const qrSize = 15; // QR code size in mm
  const textOpacity = 0.35;
  const gapBetweenTextAndQr = 0.5; // gap between text and QR

  const watermarkText =
    "--This document is created with the demo version of Grewe Web Scan. Visit grewescan.de to purchase a license.";

  const qrImg = new Image();
  qrImg.crossOrigin = "anonymous";
  qrImg.src = QrCode.src;

  await new Promise<void>((resolveQR) => {
    qrImg.onload = () => resolveQR();
  });

  // 70% from top
  const startY = pageHeight * 0.70;

  // Draw vertical text first
  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(10);
  (pdf).setTextColor(0, 0, 0, textOpacity);

  pdf.saveGraphicsState();
  const textX = leftMargin;
  const textY = startY;
  pdf.text(watermarkText, textX, textY, { angle: 90 }); // vertical text
  pdf.restoreGraphicsState();

  // Measure text height to place QR below it
  const textLengthMM = pdf.getTextDimensions(watermarkText).h; // text height in mm
  const qrStartY = startY + textLengthMM + gapBetweenTextAndQr;
const qrX = leftMargin - 7;
  // Draw QR below text
  pdf.addImage(qrImg, "PNG", qrX, qrStartY, qrSize, qrSize);

  pdf.setTextColor(0, 0, 0);
    }
  }

  return pdf.output("blob");
};




  const validateForm = (): boolean => {
    if (!formData.to.trim()) {
      setError(t("errorRecipientRequired"))
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.to)) {
      setError(t("errorInvalidEmail"))
      return false
    }
    if (!formData.subject.trim()) {
      setError(t("errorSubjectRequired"))
      return false
    }
    if (formData.includePDF && !formData.pdfName.trim()) {
      setError(t("errorPdfNameRequired"))
      return false
    }
    return true
  }

  const handleSendWithUserEmail = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    setError(null)

    try {
      let finalMessage = formData.message || ""
      let fileUrls: string[] = []
      let pdfUrl: string | null = null

      if (formData.includePDF && scannedImages.length > 0) {
        const pdfBlob = await generatePDF()
        const pdfAsset = await client.assets.upload("file", pdfBlob, {
          filename: `${formData.pdfName || "document"}.pdf`,
        })
        pdfUrl = `${window.location.origin}/api/pdf/${pdfAsset._id}`

        const pdfDisplay = `${formData.pdfName || "Document"} - ${formatDateForFilename()}`
        finalMessage += `\n\n${pdfDisplay}\n${pdfUrl}`
      }

      if (formData.attachFiles.length > 0) {
        const uploadedAssets = await Promise.all(
          formData.attachFiles.map((file) => uploadFileToSanity(file, file.name)),
        )
        fileUrls = uploadedAssets.map((asset) => `${window.location.origin}/api/pdf/${asset._id}`)
        finalMessage += `\n\nAttachments:\n${fileUrls.map((url) => `- ${url}`).join("\n")}`
      }

      const mailtoLink = `mailto:${encodeURIComponent(formData.to)}?subject=${encodeURIComponent(
        formData.subject,
      )}&body=${encodeURIComponent(finalMessage)}`

      const a = document.createElement("a")
      a.href = mailtoLink
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setTimeout(() => setIsSuccess(true), 500)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendWithGrewScannerEmail = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    setError(null)

    try {
      let finalMessagePlain = formData.message || ""
      let fileUrls: string[] = []
      let pdfUrl: string | null = null
      let finalMessageHtml = `<p>${(formData.message || "").replace(/\n/g, "<br/>")}</p>`

      if (formData.includePDF && scannedImages.length > 0) {
        const pdfBlob = await generatePDF()
        const pdfAsset = await client.assets.upload("file", pdfBlob, {
          filename: `${formData.pdfName || "document"}.pdf`,
        })
        pdfUrl = `${window.location.origin}/api/pdf/${pdfAsset._id}`

        const pdfDisplay = `${formData.pdfName || "Document"} - ${formatDateForFilename()}`

        finalMessagePlain += `\n\n${pdfDisplay}\n${pdfUrl}`
        finalMessageHtml += `<p>Download PDF: <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer">${pdfDisplay}</a></p>`
      }

      if (formData.attachFiles.length > 0) {
        const uploadedAssets = await Promise.all(
          formData.attachFiles.map((file) => uploadFileToSanity(file, file.name)),
        )
        fileUrls = uploadedAssets.map((asset) => `${window.location.origin}/api/pdf/${asset._id}`)
        finalMessagePlain += `\n\nAttachments:\n${fileUrls.map((url) => `- ${url}`).join("\n")}`
        finalMessageHtml += `<p>Attachments:<br/>${fileUrls.map((u) => `<a href="${u}" target="_blank">${u}</a>`).join("<br/>")}</p>`
      }

      const templateParams = {
        to_email: formData.to,
        subject: formData.subject,
        message: finalMessagePlain,
        message_html: finalMessageHtml,
      }

      await emailjs.send("service_slh2t1t", "template_rhbj1ta", templateParams, "yElbkX08frFpeH4BD")

      setIsSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === "string" ? err : String(err)
      setError(message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = () => {
    if (senderType === "own") {
      handleSendWithUserEmail()
    } else {
      handleSendWithGrewScannerEmail()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }

  if (!isOpen) return null

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachFiles: prev.attachFiles.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="fixed inset-0 bg-white/80  flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onKeyDown={handleKeyPress}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!isSuccess ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("to")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="to"
                  type="email"
                  value={formData.to}
                  onChange={(e) => handleInputChange("to", e.target.value)}
                  placeholder={t("toPlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("subject")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  placeholder={t("subjectPlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("message")}
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder={t("messagePlaceholder")}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fileAttachment")}</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleFileSelect}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    disabled={isLoading}
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm">{t("chooseFile")}</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                  className="hidden"
                />
              </div>
              {formData.attachFiles.length > 0 && (
                <div className="space-y-2">
                  {formData.attachFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span className="truncate max-w-[180px]">{file.name}</span>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
                      {t("includePDF", {
                        count: scannedImages.length,
                        plural: scannedImages.length !== 1 ? "s" : "",
                      })}
                    </label>
                  </div>

                  {formData.includePDF && (
                    <div>
                      <label htmlFor="pdfName" className="block text-sm font-medium text-gray-700 mb-2">
                        {t("pdfName")} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="pdfName"
                          type="text"
                          value={formData.pdfName}
                          onChange={(e) => handleInputChange("pdfName", e.target.value)}
                          placeholder={t("pdfNamePlaceholder")}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t("sendFrom")}</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="own-email"
                      type="radio"
                      name="senderType"
                      value="own"
                      checked={senderType === "own"}
                      onChange={(e) => setSenderType(e.target.value as "own" | "grewscanner")}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <label htmlFor="own-email" className="ml-2 text-sm text-gray-700">
                      {t("ownEmail")}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="grewscanner-email"
                      type="radio"
                      name="senderType"
                      value="grewscanner"
                      checked={senderType === "grewscanner"}
                      onChange={(e) => setSenderType(e.target.value as "own" | "grewscanner")}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <label htmlFor="grewscanner-email" className="ml-2 text-sm text-gray-700">
                      {t("grewScannerEmail")}
                    </label>
                  </div>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  disabled={isLoading}
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("sending")} </span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>{t("send")} </span>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("successTitle")}</h3>
              <p className="text-sm text-gray-600">{t("successMessage", { email: formData.to })}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
