"use client"

import Link from "next/link"

interface ScrollingTextProps {
  text?: string
  className?: string
}

export default function ScrollingText({
  text = "GreweScanner is using the encleso TWAIN web scan component from encleso.com.",
  className = "",
}: ScrollingTextProps) {
  // Replace "encleso.com" in the text with a link
  const linkedText = text.split("encleso.com").map((part, idx, arr) => (
    <>
      {part}
      {idx < arr.length - 1 && (
        <Link
          href="https://encleso.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          encleso.com
        </Link>
      )}
    </>
  ))

  return (
    <div
      className={`relative overflow-hidden bg-white shadow-lg backdrop-blur-sm rounded-lg ${className}`}
    >
      <div className="flex animate-marquee hover:[animation-play-state:paused]">
        <span className="px-4 text-gray-800 font-semibold">{linkedText}</span>
        <span className="px-4 text-gray-800 font-semibold">{linkedText}</span>
        <span className="px-4 text-gray-800 font-semibold">{linkedText}</span>
        <span className="px-4 text-gray-800 font-semibold">{linkedText}</span>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          display: inline-flex;
          min-width: max-content;
          animation: marquee 20s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
