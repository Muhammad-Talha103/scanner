"use client"
import { useState, useEffect } from 'react'
import { Home, ArrowLeft, Search, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const [isVisible, setIsVisible] = useState(false)
  const [glitchActive, setGlitchActive] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
    
    // Trigger glitch effect periodically
    const glitchInterval = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 200)
    }, 3000)

    return () => clearInterval(glitchInterval)
  }, [])

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-pink-500/20 rounded-full blur-xl animate-float-slow"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Shooting Stars */}
        <div className="absolute top-1/4 left-0 w-1 h-1 bg-white rounded-full animate-shooting-star"></div>
        <div className="absolute top-1/2 left-0 w-1 h-1 bg-blue-400 rounded-full animate-shooting-star-delayed"></div>
        <div className="absolute top-3/4 left-0 w-1 h-1 bg-purple-400 rounded-full animate-shooting-star-slow"></div>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 text-center max-w-2xl mx-auto transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}>
        
        {/* 404 Number with Glitch Effect */}
        <div className="relative mb-8">
          <h1 className={`text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse-slow ${
            glitchActive ? 'animate-glitch' : ''
          }`}>
            404
          </h1>
          
          {/* Glitch Layers */}
          <h1 className={`absolute inset-0 text-8xl md:text-9xl font-black text-red-500 opacity-0 ${
            glitchActive ? 'animate-glitch-red' : ''
          }`}>
            404
          </h1>
          <h1 className={`absolute inset-0 text-8xl md:text-9xl font-black text-blue-500 opacity-0 ${
            glitchActive ? 'animate-glitch-blue' : ''
          }`}>
            404
          </h1>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white animate-fade-in-up">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-300 text-lg animate-fade-in-up animation-delay-200">
            The page you&apos;re looking for seems to have vanished into the digital void.
          </p>
          <p className="text-gray-400 text-sm animate-fade-in-up animation-delay-400">
            Don&apos;t worry, even the best explorers sometimes take a wrong turn.
          </p>
        </div>

        {/* Animated Robot/Search Icon */}
        <div className="mb-8 animate-bounce-gentle">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-2xl animate-spin-slow">
            <Search className="w-12 h-12 text-white animate-pulse" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-600">
          <button
            onClick={handleGoHome}
            className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5 group-hover:animate-bounce" />
            <span>Go Home</span>
          </button>
          
          <button
            onClick={handleGoBack}
            className="group flex items-center space-x-2 px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-600"
          >
            <ArrowLeft className="w-5 h-5 group-hover:animate-bounce-horizontal" />
            <span>Go Back</span>
          </button>
          
          <button
            onClick={handleRefresh}
            className="group flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-5 h-5 group-hover:animate-spin" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Fun Fact */}
        <div className="mt-12 p-4 bg-black/20 backdrop-blur-sm rounded-lg border border-gray-700/50 animate-fade-in-up animation-delay-800">
          <p className="text-gray-300 text-sm">
            <span className="text-purple-400 font-semibold">Fun Fact:</span> The first 404 error was discovered at CERN in 1992. 
            You&apos;re now part of internet history! 🚀
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-180deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(90deg); }
        }
        
        @keyframes shooting-star {
          0% { transform: translateX(-100px) translateY(0px) rotate(45deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(100vw) translateY(-100px) rotate(45deg); opacity: 0; }
        }
        
        @keyframes shooting-star-delayed {
          0% { transform: translateX(-100px) translateY(0px) rotate(45deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(100vw) translateY(-50px) rotate(45deg); opacity: 0; }
        }
        
        @keyframes shooting-star-slow {
          0% { transform: translateX(-100px) translateY(0px) rotate(45deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(100vw) translateY(-75px) rotate(45deg); opacity: 0; }
        }
        
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
        
        @keyframes glitch-red {
          0%, 100% { transform: translate(0); opacity: 0; }
          20% { transform: translate(2px, 0); opacity: 0.8; }
          40% { transform: translate(-2px, 0); opacity: 0.8; }
          60% { transform: translate(0, 2px); opacity: 0.8; }
          80% { transform: translate(0, -2px); opacity: 0.8; }
        }
        
        @keyframes glitch-blue {
          0%, 100% { transform: translate(0); opacity: 0; }
          20% { transform: translate(-2px, 0); opacity: 0.8; }
          40% { transform: translate(2px, 0); opacity: 0.8; }
          60% { transform: translate(0, -2px); opacity: 0.8; }
          80% { transform: translate(0, 2px); opacity: 0.8; }
        }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes bounce-horizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-5px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite 2s; }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite 1s; }
        .animate-shooting-star { animation: shooting-star 3s linear infinite; }
        .animate-shooting-star-delayed { animation: shooting-star-delayed 4s linear infinite 1s; }
        .animate-shooting-star-slow { animation: shooting-star-slow 5s linear infinite 2s; }
        .animate-glitch { animation: glitch 0.2s ease-in-out; }
        .animate-glitch-red { animation: glitch-red 0.2s ease-in-out; }
        .animate-glitch-blue { animation: glitch-blue 0.2s ease-in-out; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
        .animate-bounce-horizontal { animation: bounce-horizontal 1s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        
        .animation-delay-200 { animation-delay: 0.2s; animation-fill-mode: both; }
        .animation-delay-400 { animation-delay: 0.4s; animation-fill-mode: both; }
        .animation-delay-600 { animation-delay: 0.6s; animation-fill-mode: both; }
        .animation-delay-800 { animation-delay: 0.8s; animation-fill-mode: both; }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  )
}
