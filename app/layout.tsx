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
  title: "GREWE Scanner",
  description: "GREWE Scanner Interface Cloud Version",
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
        <meta name="color-scheme" content="light only" />
  <meta name="theme-color" content="#ffffff" />
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
