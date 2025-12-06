import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProvider from "./ClientProvider";
import Script from "next/script";

// 🟢 i18n imports
import { dir } from "i18next";
import I18nProvider from "./i18n-provider";

const inter = Inter({ subsets: ["latin"] });
const seoKeywords = [
  "GreweScan",
  "Document Scanning",
  "Grewe Scanner Interface Online",
  "Browser TWAIN scan application",
  "Document Scanning Software",
  "Online Document Scanning",
  "Browser-Based TWAIN Scanner",
  "Web Scanner Application",
  "TWAIN Scanner Online",
  "PDF Generation Tool",
  "Scan to PDF Online",
  "Image Processing Software",
  "Cloud Document Scanning",
  "Digital Document Management",
  "Business Scanning Solutions",
  "Secure Online Scanning",
  "Enterprise Document Workflow",
  "Send PDF via Email",
  "Email PDF Attachment Tool",
  "Share Scanned Documents via Email"
];

const keywordString = seoKeywords.join(", ");
const generatedTitle = `GreweScan - Innovative Document & Imaging Solutions`;

export const metadata: Metadata = {
  title: {
    default: generatedTitle,
    template: "%s | GreweScan",
  },

  description:
    "GreweScan provides advanced browser-based TWAIN document scanning, PDF generation, and secure email delivery. Scan documents online, convert them to PDF, and instantly send them via email for fast and professional digital workflows.",

  keywords: keywordString,

  authors: [{ name: "GreweScan", url: "https://grewescan.de" }],
  creator: "GreweScan",
  publisher: "GreweScan",

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  openGraph: {
    title: "GreweScan – Online Document Scanning, PDF Tools & Email PDF Sending",
    description:
      "Use GreweScan to scan documents directly in your browser, generate high-quality PDFs, and send them instantly via email. Secure, fast, and built for modern businesses.",
    url: "https://grewescan.de",
    siteName: "GreweScan",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "https://grewescan.de/grewescanner.png",
        width: 1200,
        height: 630,
        alt: "GreweScan – Scan Documents, Create PDFs & Send via Email",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "GreweScan – Scan, Create PDFs & Send via Email",
    description:
      "A complete online scanning solution: scan documents, generate PDFs, process images, and send files via email with one click.",
    site: "@GreweScan_DE",
    creator: "@GreweScan_DE",
    images: ["https://grewescan.de/grewescanner.png"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  alternates: {
    canonical: "https://grewescan.de",
    languages: {
      "de-DE": "https://grewescan.de",
      "en-US": "https://grewescan.de/en",
    },
  },

  metadataBase: new URL("https://grewescan.de"),
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
        <meta name="google-site-verification" content="vP1M5mm-6MiR2x_Q6YpZKpdWvmHRuZJ8Kv5gMCjP60Q" />
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
