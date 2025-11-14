"use client";

import { ScannedImage } from "@/components/scanner/Dropdown";
import { useCallback } from "react";
import { client } from "@/sanity/lib/client";
import QrCode from "@/public/greweqr.png";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export const usePrintHandler = () => {
  const userInfo = useSelector((state: RootState) => state.user.userInfo);

  const printImages = useCallback(
    async (images: ScannedImage[]): Promise<void> => {
      if (!images.length) throw new Error("No images to print");

      let isPremium = false;
      try {
        if (userInfo?.email) {
          const premiumUser = await client.fetch(
            `*[_type == "premiumUser" && email == $email][0]`,
            { email: userInfo.email }
          );
          isPremium = Boolean(premiumUser);
        }
      } catch {
        console.warn("Premium check failed → defaulting to demo");
      }

      try {
        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";
        iframe.style.top = "-9999px";
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        iframe.style.border = "none";

        document.body.appendChild(iframe);

        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) throw new Error("Unable to access iframe document");

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>&#8203;</title>
          <style>
            @page {
              size: auto;
              margin: 0;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
            }

            .page {
              width: 100%;
              height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              position: relative;
              page-break-after: always;
            }
            .page:last-child {
              page-break-after: avoid;
            }

            .scan-img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              display: block;
            }

            ${
              !isPremium
                ? `
            .watermark-container {
              position: absolute;
              top: 75%;
              left: 0;
              margin-left: 10px;
              transform: translateY(-50%) rotate(-90deg);
              transform-origin: left top;
              display: flex;
              align-items: center;
              gap: 4px;
              z-index: 9999;
              opacity: 0.85;
              white-space: nowrap;
            }

            .watermark-text {
              font-size: 12px;
              font-weight: bold;
              border: 2px solid #000;
              padding: 4px 8px;
             
              white-space: nowrap;
              line-height: 1;
            }

            .qr {
              width: 38px;
              height: 38px;
              flex-shrink: 0;
               transform: rotate(90deg);
            }
            `
                : ""
            }
          </style>
        </head>

        <body>
          ${images
            .map(
              (image, index) => `
              <div class="page">
                ${
                  !isPremium
                    ? `
                    <div class="watermark-container">
                      <span class="watermark-text">
                       This document is created with the demo version of Grewe Web Scan. Visit grewescan.de to purchase a license.
                      </span>
                      -
                      <img src="${QrCode.src}" class="qr" crossorigin="anonymous" />
                    </div>
                  `
                    : ""
                }
                <img src="${image.dataUrl}" class="scan-img" />
              </div>
            `
            )
            .join("")}
        </body>
        </html>
      `;

        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        await new Promise<void>((resolve) => {
          const imgs = iframeDoc.querySelectorAll("img");
          let loaded = 0;
          if (!imgs.length) return resolve();

          imgs.forEach((img) => {
            if (img.complete) {
              loaded++;
              if (loaded === imgs.length) resolve();
            } else {
              img.onload = img.onerror = () => {
                loaded++;
                if (loaded === imgs.length) resolve();
              };
            }
          });
        });

        iframe.contentWindow?.focus();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 500);
      } catch (error) {
        console.error("Error printing images:", error);
        throw new Error("Failed to print document");
      }
    },
    [userInfo?.email]
  );

  return { printImages };
};
