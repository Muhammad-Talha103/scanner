import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProvider from "./ClientProvider";
import Script from "next/script";

// 🟢 i18n imports
import { dir } from "i18next";
import I18nProvider from "./i18n-provider";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: {
    default: "GrewScan - Innovative Document & Imaging Solutions",
    template: "%s | GrewScan",
  },
  description:
    "GrewScan offers advanced document scanning, imaging solutions, and software tools for efficient business operations across Europe and beyond.",
  keywords: [
    "GrewScan",
    "Document Scanning",
    "Grewe Scanner Interface Online Document Scanning",
    "Browser TWAIN scan application",
    "Imaging Solutions",
    "GreweScan",
    "Digital Transformation",
    "Business Automation",
    "PDF Management",
    "Scanning Software",
    "OCR Solutions",
    "Enterprise Solutions",
    "Germany Technology",
  ],
  authors: [{ name: "GrewScan", url: "https://grewscan.de" }],
  creator: "GrewScan",
  publisher: "GrewScan",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-snippet": -1 as any,
      "max-image-preview": "large",
      "max-video-preview": -1 as any,
    },
  },
  openGraph: {
    title: "GrewScan - Innovative Document & Imaging Solutions",
    description:
      "Follow GrewScan on Facebook, Instagram, LinkedIn, Threads, and TikTok for updates, document imaging tips, and software innovations for businesses.",
    url: "https://grewscan.de",
    siteName: "GrewScan",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "https://grewscan.de/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GrewScan - Digital Document Experts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GrewScan - Smart Document Solutions",
    description:
      "Discover efficient document scanning and imaging solutions with GrewScan: software, automation tools, and digital services for modern businesses.",
    site: "@GrewScan_DE",
    creator: "@GrewScan_DE",
    images: ["https://grewscan.de/twitter-card.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "https://grewscan.de",
    languages: {
      "de-DE": "https://grewscan.de",
    },
  },
  metadataBase: new URL("https://grewscan.de"),
};


// 🟢 Default language (agar params nahi hain)
const defaultLocale = "en";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Future me agar aapko dynamic locale chahiye to URL/params se lang pick kar lena
  const lng = defaultLocale;

  return (
    <html lang={lng} dir={dir(lng)}>
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
        <Script src="/encleso.js" strategy="afterInteractive" />
      </head>
      <body className={inter.className}>
        <ClientProvider>
        
          <I18nProvider>{children}</I18nProvider>
        </ClientProvider>
      </body>
    </html>
  );
}
