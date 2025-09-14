"use client"

import { useEffect, useState } from "react"

export default function NotFound() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleGoHome = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* Floating Particles */}
      {mounted && (
        <>
          <div className="particle w-2 h-2 top-1/4 left-1/4 animate-float" />
          <div className="particle w-3 h-3 top-1/3 right-1/4 animate-float-reverse" />
          <div className="particle w-1 h-1 top-2/3 left-1/3 animate-float" />
          <div className="particle w-2 h-2 top-1/2 right-1/3 animate-float-reverse" />
          <div className="particle w-1 h-1 top-3/4 left-2/3 animate-float" />
          <div className="particle w-2 h-2 top-1/6 right-1/2 animate-float-reverse" />
          <div className="particle w-1 h-1 bottom-1/4 left-1/2 animate-float" />
          <div className="particle w-3 h-3 bottom-1/3 right-2/3 animate-float-reverse" />
        </>
      )}

      {/* Main Content */}
      <div className="text-center z-10 px-4">
        {/* Large 404 Number */}
        <div className="animate-fade-in">
          <h1 className="text-[12rem] md:text-[16rem] font-black text-black leading-none select-none">404</h1>
        </div>

        {/* Error Message */}
        <div className="animate-slide-in">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-4 text-balance">Page Not Found</h2>
          <p className="text-lg md:text-xl text-secondary mb-8 max-w-md mx-auto text-pretty">
            {"Oops! The page you're looking for doesn't exist."}
          </p>
        </div>

        {/* Go Home Button */}
        <div className="animate-slide-in-delay">
          <button
            onClick={handleGoHome}
            className="inline-flex items-center gap-3 bg-primary hover:bg-secondary text-primary-foreground hover:text-secondary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-2 border-primary hover:border-secondary"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go Home
          </button>
        </div>
      </div>

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="grid grid-cols-12 gap-4 h-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
