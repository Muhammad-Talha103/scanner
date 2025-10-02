"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"

interface ScrollingTextProps {
  className?: string
}

export default function ScrollingText({ className = "" }: ScrollingTextProps) {
  const { t } = useTranslation()
  const text = t("scrollingText")

  const linkedText = text.split("encleso.com").map((part, idx, arr) => (
    <span key={idx}>
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
    </span>
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
