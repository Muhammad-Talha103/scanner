import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProvider from "./ClientProvider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GREWE Scanner",
  description: "GREWE Scanner Interface Cloud Version",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Add Script Tags Here */}
        <Script
          src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.3/jquery.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-Fy6S3B9q64WdZWQUiU+q4/2Lc9npb8tCaSX9FK7E8HnRr0Jz8D6OP9dO5Vg3Q9ct"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          src="https://encleso.com/Assets/scripts/encleso.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="/encleso.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>
        <ClientProvider>

        {children}
        </ClientProvider>
        </body>
    </html>
  );
}
