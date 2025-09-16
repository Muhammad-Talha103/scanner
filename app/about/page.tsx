"use client"

import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <section className="bg-blue-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center fade-in-up">
          <h1 className="text-5xl font-bold text-blue-900 mb-6 text-balance">GreweScan</h1>
          <p className="text-xl text-blue-700 mb-8 text-pretty max-w-2xl mx-auto">
            Professional browser-based TWAIN scanning solution powered by Encleso SDK
          </p>
          <span className="inline-block bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-full font-medium">
            Browser-Based • Requires Encleso Client Installation
          </span>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        {/* What is GreweScan Section */}
        <section className="fade-in-up-delay-1">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">What is GreweScan?</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-800 leading-relaxed mb-6">
                GreweScan is a revolutionary browser-based application that enables TWAIN scanning directly from web
                browsers using the powerful Encleso SDK. While the web interface requires no installation, the Encleso
                client software must be installed on the local machine to bridge browser and scanner communication.
              </p>
              <p className="text-gray-800 leading-relaxed mb-6">
                This hybrid approach provides the convenience of web-based access while maintaining direct hardware
                communication for optimal scanning performance. GreweScan supports nearly all TWAIN-compatible scanners
                and works seamlessly across Chrome, Firefox, Edge, and Opera browsers on Windows systems.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  Cloud-Based
                </span>
                <span className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Cross-Platform
                </span>
                <span className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Instant Access
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Key Benefits</h3>
              <ul className="space-y-3 text-gray-800">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Web interface with no browser plugins required</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Direct scanner communication via Encleso client</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Support for nearly all TWAIN-compatible scanners</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Compatible with Windows 7 through Windows 11</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* Our Technology Section */}
        <section className="fade-in-up-delay-2">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">How It Works</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-blue-900 mb-4">Client-Server Architecture</h3>
              <p className="text-gray-800 leading-relaxed max-w-3xl mx-auto">
                GreweScan uses a hybrid architecture where the web application runs in your browser while the Encleso
                client software installed on your machine handles direct scanner communication through TWAIN drivers.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Web Interface</h3>
                <p className="text-sm text-gray-600">
                  Browser-based UI with no plugins required. Works with Chrome, Firefox, Edge, and Opera
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Encleso Client</h3>
                <p className="text-sm text-gray-600">
                  Local software that bridges browser and scanner via REST API communication
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">TWAIN Scanner</h3>
                <p className="text-sm text-gray-600">
                  Direct hardware communication with nearly all TWAIN-compatible scanners
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Supported Formats</h3>
              <div className="flex flex-wrap gap-2">
                {["PDF", "JPEG", "TIFF", "Multi-page TIFF", "PNG", "BMP"].map((format) => (
                  <span key={format} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {format}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">System Requirements</h3>
              <ul className="space-y-2 text-sm text-gray-800">
                <li>• Windows 7 through Windows 11 (32-bit and 64-bit)</li>
                <li>• TWAIN-compatible scanner with drivers installed</li>
                <li>• Encleso client software installation required</li>
                <li>• Modern web browser (Chrome, Firefox, Edge, Opera)</li>
              </ul>
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* About JSE Imaging Solutions Section */}
        <section className="fade-in-up-delay-3">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">About JSE Imaging Solutions</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-blue-900 mb-4">30 Years of TWAIN Innovation</h3>
                <p className="text-gray-800 leading-relaxed mb-4">
                  JSE Imaging Solutions is a leading developer of TWAIN development toolkits, TWAIN drivers, TWAIN
                  utilities, and imaging tools with 30 years of innovation in scan and image solutions. They specialize
                  in creating OEM TWAIN and WIA drivers for various manufacturers and provide comprehensive imaging
                  solutions for businesses worldwide.
                </p>
                <p className="text-gray-800 leading-relaxed mb-6">
                  JSE developed the Encleso SDK that powers GreweScan, bringing their decades of TWAIN expertise to
                  modern web-based applications. Their solutions bridge the gap between traditional desktop scanning and
                  contemporary web technologies.
                </p>
                <a
                  href="https://www.jse.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Visit JSE Imaging Solutions
                </a>
              </div>
              <div className="space-y-4">
                {[
                  {
                    name: "SnapTwain",
                    desc: "TWAIN driver for Fujitsu and Ricoh ScanSnap scanners (iX100, iX500, iX1300, iX1400, iX1500, iX1600)",
                  },
                  {
                    name: "TWAINCommander",
                    desc: "Command line scan utility for batch scanning from any TWAIN compliant device",
                  },
                  { name: "Encleso SDK", desc: "Web TWAIN SDK enabling browser-based scanning applications" },
                ].map((product) => (
                  <div key={product.name} className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* Powered by Encleso SDK Section */}
        <section className="fade-in-up-delay-1">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Powered by Encleso SDK</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="text-center mb-8">
              <p className="text-lg text-gray-800 leading-relaxed max-w-3xl mx-auto">
                GreweScan is powered by the Encleso SDK, a TWAIN scanning component designed specifically for
                browser-based web applications. Encleso enables users to select connected scanners, configure settings
                like resolution and color, and view scanned pages directly within web pages through its JavaScript
                Library integration.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9",
                  title: "Browser Integration",
                  desc: "JavaScript Library for seamless web integration",
                },
                {
                  icon: "M13 10V3L4 14h7v7l9-11h-7z",
                  title: "High Performance",
                  desc: "Direct TWAIN communication for optimal scanning speed",
                },
                {
                  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                  title: "Wide Compatibility",
                  desc: "Supports nearly all TWAIN-compatible scanners",
                },
                {
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zm-6 3a2 2 0 11-4 0 2 2 0 014 0z",
                  title: "Developer Friendly",
                  desc: "Easy integration with comprehensive documentation",
                },
              ].map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-blue-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <a
                href="https://encleso.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Learn More About Encleso SDK
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12 px-4 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-2 text-sm leading-relaxed">
            <p className="font-semibold">GreweScan version 1.00</p>
            <p>Browser-based application for TWAIN scanning powered by Encleso SDK.</p>
            <p>(C) 2025 by JSE Imaging Solutions.</p>
            <p>
              <a href="https://www.jse.de" className="hover:text-blue-200 underline">
                www.jse.de
              </a>
            </p>
            <p>
              Using Encleso web TWAIN SDK from{" "}
              <a href="https://encleso.com" className="hover:text-blue-200 underline">
                encleso.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
