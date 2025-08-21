"use client"

import { ScannedImage } from "@/components/scanner/Dropdown"
import { useCallback } from "react"


export const usePrintHandler = () => {
  const printImages = useCallback(async (images: ScannedImage[]): Promise<void> => {
    if (images.length === 0) {
      throw new Error("No images to print")
    }

    try {
      // Create a hidden iframe for printing
      const iframe = document.createElement("iframe")
      iframe.style.position = "absolute"
      iframe.style.left = "-9999px"
      iframe.style.top = "-9999px"
      iframe.style.width = "1px"
      iframe.style.height = "1px"
      iframe.style.border = "none"

      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error("Unable to access iframe document")
      }

      // Generate HTML content optimized for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Document</title>
            <style>
              @page {
                margin: 0.5in;
                size: auto;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                .page {
                  page-break-after: always;
                  page-break-inside: avoid;
                  width: 100%;
                  height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0;
                  padding: 0;
                }
                .page:last-child {
                  page-break-after: avoid;
                }
                .page img {
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                  display: block;
                }
              }
              @media screen {
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                }
                .page {
                  width: 100%;
                  height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0;
                  padding: 0;
                }
                .page img {
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                }
              }
            </style>
          </head>
          <body>
            ${images
              .map(
                (image, index) => `
              <div class="page">
                <img src="${image.dataUrl}" alt="Page ${index + 1}" crossorigin="anonymous" />
              </div>
            `,
              )
              .join("")}
          </body>
        </html>
      `

      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()

      // Wait for images to load
      await new Promise<void>((resolve) => {
        const images = iframeDoc.querySelectorAll("img")
        let loadedCount = 0

        if (images.length === 0) {
          resolve()
          return
        }

        const checkAllLoaded = () => {
          loadedCount++
          if (loadedCount === images.length) {
            resolve()
          }
        }

        images.forEach((img) => {
          if (img.complete) {
            checkAllLoaded()
          } else {
            img.onload = checkAllLoaded
            img.onerror = checkAllLoaded
          }
        })
      })

      // Focus the iframe and trigger print
      iframe.contentWindow?.focus()

      // Small delay to ensure everything is ready
      setTimeout(() => {
        iframe.contentWindow?.print()

        // Clean up iframe after printing
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 1000)
      }, 500)
    } catch (error) {
      console.error("Error printing images:", error)
      throw new Error("Failed to print document")
    }
  }, [])

  return { printImages }
}
