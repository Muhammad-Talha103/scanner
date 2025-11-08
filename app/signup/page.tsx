"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { auth } from "@/firebase/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { client } from "@/sanity/lib/client"
import { useRouter } from "next/navigation"
import { FirebaseError } from "firebase/app"
import Link from "next/link"
import emailjs from "@emailjs/browser"
import { useTranslation } from "react-i18next"

interface ValidationErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

type SignupStep = "form" | "otp" | "success"

export default function Signup() {
  const { t } = useTranslation()
  const router = useRouter()

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<ValidationErrors>({})

  // OTP state
  const [step, setStep] = useState<SignupStep>("form")
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")

  // Timer states
  const [otpTimeLeft, setOtpTimeLeft] = useState(0) // Start at 0, set to 30 when sending OTP
  // const [resendTimeLeft, setResendTimeLeft] = useState(0) // Removed to simplify per instructions
  const [countdownTimeLeft, setCountdownTimeLeft] = useState(5)
  const [showCountdown, setShowCountdown] = useState(false)

  // 1. FIXED: OTP expiry timer
  // Now depends on both 'step' and 'otpTimeLeft' to ensure it restarts when otpTimeLeft is reset for a new OTP.
  useEffect(() => {
    // Only run if we are on the OTP step and the timer is actually running (> 0)
    if (step !== "otp" || otpTimeLeft <= 0) return

    const timer = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setOtpError(t("signup.otp_has_expired"))
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Cleanup function: clears the interval when the component unmounts or dependencies change
    return () => clearInterval(timer)
  }, [step, otpTimeLeft]) // Added otpTimeLeft as a dependency

  // Resend timer (Removed for simplicity - original logic was here)

  // Success countdown timer
  useEffect(() => {
    if (!showCountdown) return

    const timer = setInterval(() => {
      setCountdownTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/signin")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showCountdown, router])

  // Validation functions (rest remain the same)
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return t("signup.name_is_required")
    if (name.trim().length < 2) return t("signup.name_min_length")
    if (name.trim().length > 50) return t("signup.name_max_length")
    return undefined
  }

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return  t("signup.email_is_required")
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return  t("signup.invalid_email_address")
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password) return t("signup.password_is_required")
    if (password.length < 6) return t("signup.password_min_length")
    if (password.length > 128) return t("signup.password_max_length")
    if (!/(?=.*[a-z])/.test(password)) return t("signup.password_lowercase_required")
    if (!/(?=.*[A-Z])/.test(password)) return  t("signup.password_uppercase_required")
    if (!/(?=.*\d)/.test(password)) return t("signup.password_number_required")
    return undefined
  }

  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return t("signup.confirm_password_is_required")
    if (password !== confirmPassword) return  t("signup.passwords_do_not_match")
    return undefined
  }

  // Real-time validation (rest remain the same)
  const handleNameChange = (value: string) => {
    setName(value)
    if (errors.name) {
      const error = validateName(value)
      setErrors((prev) => ({ ...prev, name: error }))
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (errors.email) {
      const error = validateEmail(value)
      setErrors((prev) => ({ ...prev, email: error }))
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (errors.password) {
      const error = validatePassword(value)
      setErrors((prev) => ({ ...prev, password: error }))
    }
    if (errors.confirmPassword && confirmPassword) {
      const confirmError = validateConfirmPassword(value, confirmPassword)
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (errors.confirmPassword) {
      const error = validateConfirmPassword(password, value)
      setErrors((prev) => ({ ...prev, confirmPassword: error }))
    }
  }

  // Form validation (rest remain the same)
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== undefined)
  }

  // Firebase error messages (rest remain the same)
  const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return t("signup.email_already_in_use_error")
      case "auth/invalid-email":
        return t("signup.firebase_invalid_email_error")
      case "auth/operation-not-allowed":
        return t("signup.operation_not_allowed_error")
      case "auth/weak-password":
        return t("signup.weak_password_error")
      case "auth/network-request-failed":
        return t("signup.network_error")
      case "auth/too-many-requests":
        return t("signup.too_many_requests_error")
      default:
        return t("signup.unknown_error")
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setMessage("")
    setMessageType("")

    if (!validateForm()) {
      setMessage(t("signup.fix_validation_errors"))
      setMessageType("error")
      return
    }

    setIsLoading(true)

    try {
      // Generate random OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
      localStorage.setItem("signup_otp", generatedOtp)
      localStorage.setItem("signup_email", email)

      // Send email using EmailJS
      await emailjs.send(
        "service_5e3pegm",
        "template_ksqtsyp",
        {
          to_email: email,
          otp: generatedOtp,
        },
        "yElbkX08frFpeH4BD"
      )

      setMessage(t("signup.otp_sent_success"))
      setMessageType("success")
      setOtpTimeLeft(300) // Reset to 30 seconds - this will now trigger the useEffect
      setOtpError("")
      setOtp("")
      setTimeout(() => {
  setStep("otp"); // Move to OTP step after delay
  setMessage(""); // Clear the message after moving
}, 2000);
    } catch (error) {
      console.error("EmailJS error:", error)
      setMessage(t("signup.failed_to_send_otp"))
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setOtpError("")
    setIsLoading(true)

    try {
      const savedOtp = localStorage.getItem("signup_otp")
      const savedEmail = localStorage.getItem("signup_email")

      if (otp !== savedOtp || email !== savedEmail) {
        throw new Error(t("signup.invalid_or_expired_otp"))
      }

      // Check for OTP expiry (redundant with timer, but good safety check)
      if (otpTimeLeft <= 0) {
        throw new Error(t("signup.invalid_or_expired_otp"))
      }

      // ✅ OTP verified — proceed with Firebase + Sanity registration
      await createUserWithEmailAndPassword(auth, email, password)

      await client.create({
        _type: "user",
        username: name,
        email,
        userpassword: password,
        createdAt: new Date().toISOString(),
      })

      setStep("success")
      setShowCountdown(true)

      // Clear local OTP
      localStorage.removeItem("signup_otp")
      localStorage.removeItem("signup_email")
    } catch (error) {
      const errorMessage =
        error instanceof FirebaseError
          ? getFirebaseErrorMessage(error.code)
          : (error as Error).message.includes(t("signup.invalid_or_expired_otp"))
          ? t("signup.entered_otp_invalid_or_expired")
          :  t("signup.verification_error")

      setOtpError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendOtp() {
    setIsLoading(true)
    setOtpError("")
    setMessage("")

    try {
      // Generate random OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
      localStorage.setItem("signup_otp", generatedOtp)
      localStorage.setItem("signup_email", email) // Ensure email is correctly set

      // Send email using EmailJS
      await emailjs.send(
        "service_5e3pegm",
        "template_ksqtsyp",
        {
          to_email: email,
          otp: generatedOtp,
        },
        "yElbkX08frFpeH4BD"
      )

      setOtpTimeLeft(300) // Reset to 30 seconds - this will now trigger the useEffect to start the timer
      // setResendTimeLeft(60) // Removed
      setOtp("")
      setMessage(t("signup.otp_resent_success"))
      setMessageType("success")

      setTimeout(() => setMessage(""), 2000)
    } catch (error) {
      console.error(t("signup.failed_to_resend_otp"), error)
      setOtpError(t("signup.failed_to_resend_otp"))
      setMessageType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const getInputClassName = (fieldName: keyof ValidationErrors) => {
    const baseClass =
      "appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm transition-colors duration-200"
    return errors[fieldName]
      ? `${baseClass} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`
      : `${baseClass} border-gray-300 focus:ring-blue-500 focus:border-blue-500`
  }

 

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 sm:px-6 lg:px-8">
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 bg-white cursor-pointer hover:bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("signup.back_to_home")}
        </Link>
      </div>

      <h2 className="text-2xl sm:text-[18px] font-extrabold text-[#675CF1] bg-clip-text text-center drop-shadow-md">
        {t("signup.grewe_scanner_interface_title")}
        <br className="hidden sm:block" />
      </h2>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === "form" && t("signup.create_your_account_title")}
          {step === "otp" && t("signup.verify_your_email_title")}
          {step === "success" && t("signup.account_created_title")}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === "form" && t("signup.join_us_today_message")}
          {step === "otp" && `${t("signup.enter_code_sent_to_email")} ${email}`}
          {step === "success" && t("signup.account_created_successfully_message")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Message Alert */}
          {message && (
            <div
              className={`mb-6 rounded-lg p-4 border-l-4 animate-in fade-in slide-in-from-top-2 duration-300 ${
                messageType === "success" ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  {messageType === "success" ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <div
                    className={`text-sm font-medium ${messageType === "success" ? "text-green-800" : "text-red-800"}`}
                  >
                    {message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORM STEP */}
          {step === "form" && (
            <form className="space-y-6" onSubmit={handleSignup}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  {t("signup.full_name_label")}
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    onChange={(e) => handleNameChange(e.target.value)}
                    value={name}
                    placeholder={t("signup.full_name_placeholder")}
                    className={getInputClassName("name")}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center animate-in fade-in duration-200">
                      <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                     {t("signup.email_address_label")}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    onChange={(e) => handleEmailChange(e.target.value)}
                    value={email}
                    required
                    placeholder={t("signup.email_address_placeholder")}
                    className={getInputClassName("email")}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center animate-in fade-in duration-200">
                      <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t("signup.password_label")}
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    value={password}
                    required
                    placeholder="••••••••"
                    className={getInputClassName("password")}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center animate-in fade-in duration-200">
                      <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                   {t("signup.confirm_password_label")}
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={getInputClassName("confirmPassword")}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center animate-in fade-in duration-200">
                      <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-[#2563EB] hover:bg-blue-700"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                     {t("signup.sending_otp_button")}
                    </div>
                  ) : (
                    t("signup.create_account_button")
                  )}
                </button>
              </div>
            </form>
          )}

          {/* OTP VERIFICATION STEP */}
          {step === "otp" && (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  {t("signup.otp_sent_to_email_message")} <span className="font-semibold">{email}</span>
                </p>
              </div>

              <div>
                
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "")
                      setOtp(value)
                      setOtpError("")
                    }}
                    placeholder="000000"
                    className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm transition-colors duration-200 text-center text-2xl tracking-widest font-mono ${
                      otpError
                        ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    disabled={isLoading}
                  />
                  {otpError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center animate-in fade-in duration-200">
                      <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {otpError}
                    </p>
                  )}
                </div>
              </div>

              {/* Timer and Resend */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span
                    className={otpTimeLeft <= 10 && otpTimeLeft > 0 ? "text-red-600 font-semibold" : "text-gray-600"}
                  >
                    {t("signup.time_remaining_label")} {Math.floor(otpTimeLeft / 60)} min {otpTimeLeft % 60}s
                  </span>
                </div>
                {otpTimeLeft <= 0 && (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className={`text-sm font-medium transition-colors ${
                      isLoading ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-700 cursor-pointer"
                    }`}
                  >
                   {t("signup.resend_otp_button")}
                  </button>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6 || otpTimeLeft <= 0}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isLoading || otp.length !== 6 || otpTimeLeft <= 0
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-[#2563EB] hover:bg-blue-700"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                       {t("signup.verifying_button")}
                    </div>
                  ) : (
                     t("signup.verify_otp_button")
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep("form")
                  setOtp("")
                  setOtpError("")
                  setOtpTimeLeft(0) // Clear timer on step back
                }}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-700 cursor-pointer transition-colors"
              >
               {t("signup.back_to_signup_button")}
              </button>
            </form>
          )}

          {/* SUCCESS STEP */}
          {step === "success" && (
            <div className="text-center space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-center">
                <div className="relative w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t("signup.verification_successful_heading")}</h3>
                <p className="mt-2 text-sm text-gray-600">{t("signup.verification_successful_description")}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                {t("signup.now_login_redirecting")} <span className="font-bold text-blue-900">{countdownTimeLeft}s</span>
                </p>
              </div>

              <button
                onClick={() => router.push("/signin")}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t("signup.go_to_signin_button")}
              </button>
            </div>
          )}

          {/* Sign In Link */}
          {step === "form" && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500"> {t("signup.already_have_account_question")}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <a
                    href="/signin"
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                  >
                    {t("signup.sign_in_instead_button")}
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
















// 'use client'

// import { useState } from 'react'
// import { auth } from '@/firebase/firebase'
// import { createUserWithEmailAndPassword } from 'firebase/auth'
// import { client } from '@/sanity/lib/client'
// import { useRouter } from 'next/navigation'
// import { FirebaseError } from 'firebase/app'
// import { useTranslation } from 'react-i18next'
// import Link from 'next/link'


// interface ValidationErrors {
//   name?: string
//   email?: string
//   password?: string
//   confirmPassword?: string
// }

// export default function Signup() {
//    const { t } = useTranslation()
//   const router = useRouter()
//   const [name, setName] = useState('')
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [confirmPassword, setConfirmPassword] = useState('')
//   const [message, setMessage] = useState('')
//   const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [errors, setErrors] = useState<ValidationErrors>({})

//   // Validation functions
//   const validateName = (name: string): string | undefined => {
//     if (!name.trim()) return t('signup.nameRequired')
//     if (name.trim().length < 2) return t('signup.nameTooShort')
//     if (name.trim().length > 50) return t('signup.nameTooLong')
//     return undefined
//   }

//   const validateEmail = (email: string): string | undefined => {
//     if (!email.trim()) return t('signup.emailRequired')
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//     if (!emailRegex.test(email)) return t('signup.emailInvalid')
//     return undefined
//   }

 
//   const validatePassword = (password: string): string | undefined => {
//     if (!password) return t('signup.passwordRequired')
//     if (password.length < 6) return t('signup.passwordTooShort')
//     if (password.length > 128) return t('signup.passwordTooLong')
//     if (!/(?=.*[a-z])/.test(password)) return t('signup.passwordLowercase')
//     if (!/(?=.*[A-Z])/.test(password)) return t('signup.passwordUppercase')
//     if (!/(?=.*\d)/.test(password)) return t('signup.passwordNumber')
//     return undefined
//   }

//   const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
//     if (!confirmPassword) return t('signup.confirmPasswordRequired')
//     if (password !== confirmPassword) return t('signup.confirmPasswordMismatch')
//     return undefined
//   }

//   // Real-time validation
//   const handleNameChange = (value: string) => {
//     setName(value)
//     if (errors.name) {
//       const error = validateName(value)
//       setErrors(prev => ({ ...prev, name: error }))
//     }
//   }

//   const handleEmailChange = (value: string) => {
//     setEmail(value)
//     if (errors.email) {
//       const error = validateEmail(value)
//       setErrors(prev => ({ ...prev, email: error }))
//     }
//   }

//   const handlePasswordChange = (value: string) => {
//     setPassword(value)
//     if (errors.password) {
//       const error = validatePassword(value)
//       setErrors(prev => ({ ...prev, password: error }))
//     }
//     if (errors.confirmPassword && confirmPassword) {
//       const confirmError = validateConfirmPassword(value, confirmPassword)
//       setErrors(prev => ({ ...prev, confirmPassword: confirmError }))
//     }
//   }

//   const handleConfirmPasswordChange = (value: string) => {
//     setConfirmPassword(value)
//     if (errors.confirmPassword) {
//       const error = validateConfirmPassword(password, value)
//       setErrors(prev => ({ ...prev, confirmPassword: error }))
//     }
//   }

//   // Form validation
//   const validateForm = (): boolean => {
//     const newErrors: ValidationErrors = {
//       name: validateName(name),
//       email: validateEmail(email),
//       password: validatePassword(password),
//       confirmPassword: validateConfirmPassword(password, confirmPassword)
//     }

//     setErrors(newErrors)
//     return !Object.values(newErrors).some(error => error !== undefined)
//   }

//   // Firebase error messages
//    const getFirebaseErrorMessage = (errorCode: string): string => {
//     switch (errorCode) {
//       case 'auth/email-already-in-use':
//         return t('signup.firebaseErrors.emailAlreadyInUse')
//       case 'auth/invalid-email':
//         return t('signup.firebaseErrors.invalidEmail')
//       case 'auth/operation-not-allowed':
//         return t('signup.firebaseErrors.operationNotAllowed')
//       case 'auth/weak-password':
//         return t('signup.firebaseErrors.weakPassword')
//       case 'auth/network-request-failed':
//         return t('signup.firebaseErrors.networkRequestFailed')
//       case 'auth/too-many-requests':
//         return t('signup.firebaseErrors.tooManyRequests')
//       default:
//         return t('signup.firebaseErrors.default')
//     }
//   }


//  async function handleSignup(e: React.FormEvent) {
//     e.preventDefault()
//     setMessage('')
//     setMessageType('')

//     const newErrors: ValidationErrors = {
//       name: validateName(name),
//       email: validateEmail(email),
//       password: validatePassword(password),
//       confirmPassword: validateConfirmPassword(password, confirmPassword),
//     }
//     setErrors(newErrors)

//     if (Object.values(newErrors).some(error => error !== undefined)) {
//       setMessage(t('signup.fixErrors'))
//       setMessageType('error')
//       return
//     }

//     setIsLoading(true)

//     try {
//       await createUserWithEmailAndPassword(auth, email, password)

//       await client.create({
//         _type: 'user',
//         username: name,
//         email,
//         userpassword: confirmPassword,
//         createdAt: new Date().toISOString(),
//       })

//       setMessage(t('signup.accountCreated'))
//       setMessageType('success')

//       setTimeout(() => {
//         router.push('/signin')
//       }, 1500)

//       setName('')
//       setEmail('')
//       setPassword('')
//       setConfirmPassword('')
//       setErrors({})
//     } catch (error: unknown) {
//       let errorMessage = t('signup.firebaseErrors.default')
//       if (error instanceof FirebaseError) {
//         errorMessage = getFirebaseErrorMessage(error.code)
//       }
//       setMessage(errorMessage)
//       setMessageType('error')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const getInputClassName = (fieldName: keyof ValidationErrors) => {
//     const baseClass =
//       'appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm transition-colors duration-200'
//     return errors[fieldName]
//       ? `${baseClass} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`
//       : `${baseClass} border-gray-300 focus:ring-blue-500 focus:border-blue-500`
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 sm:px-6 lg:px-8">
//            <div className="fixed top-4 left-4 z-50">
//         <Link
//           href="/"
//           className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg shadow-sm transition-colors"
//         >
//           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//           </svg>
//         {t("helpCenter.backToHome")}
//         </Link>
//       </div>
//       <h2 className="text-2xl sm:text-[18px] font-extrabold  text-[#675CF1] bg-clip-text text-center drop-shadow-md">
//            {t('signup.appTitle')}<br className="hidden sm:block" />
//           </h2>
//       <div className="sm:mx-auto sm:w-full sm:max-w-md">
//         <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
//        {t('signup.pageTitle')}
//         </h2>
//         <p className="mt-2 text-center text-sm text-gray-600">
//           {t('signup.subtitle')}
//         </p>
//       </div>

//       <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
//         <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
//           {/* Success/Error Message */}
//           {message && (
//             <div className={`mb-6 rounded-lg p-4 border-l-4 ${messageType === 'success'
//                 ? 'bg-green-50 border-green-400'
//                 : 'bg-red-50 border-red-400'
//               }`}>
//               <div className="flex">
//                 <div className="flex-shrink-0">
//                   {messageType === 'success' ? (
//                     <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                   ) : (
//                     <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                     </svg>
//                   )}
//                 </div>
//                 <div className="ml-3">
//                   <h3 className={`text-sm font-medium ${messageType === 'success' ? 'text-green-800' : 'text-red-800'
//                     }`}>
//                    {messageType === 'success' ? t('signup.successTitle') : t('signup.errorTitle')}
//                   </h3>
//                   <div className={`mt-1 text-sm ${messageType === 'success' ? 'text-green-700' : 'text-red-700'
//                     }`}>
//                     {message}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           <form className="space-y-6" onSubmit={handleSignup}>
//             <div>
//               <label htmlFor="name" className="block text-sm font-medium text-gray-700">
//                   {t('signup.nameLabel')}
//               </label>
//               <div className="mt-1">
//                 <input
//                   id="name"
//                   name="name"
//                   type="text"
//                   required
//                   onChange={(e) => handleNameChange(e.target.value)}
//                   value={name}
//                  placeholder={t('signup.namePlaceholder')}
//                   className={getInputClassName('name')}
//                   disabled={isLoading}
//                 />
//                 {errors.name && (
//                   <p className="mt-2 text-sm text-red-600 flex items-center animate-fade-in">
//                     <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                     </svg>
//                     {errors.name}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//                 {t('signup.emailLabel')}
//               </label>
//               <div className="mt-1">
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   onChange={(e) => handleEmailChange(e.target.value)}
//                   value={email}
//                   required
//                   placeholder={t('signup.emailPlaceholder')}
//                   className={getInputClassName('email')}
//                   disabled={isLoading}
//                 />
//                 {errors.email && (
//                   <p className="mt-2 text-sm text-red-600 flex items-center animate-fade-in">
//                     <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                     </svg>
//                     {errors.email}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div>
//               <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//                   {t('signup.passwordLabel')}
//               </label>
//               <div className="mt-1">
//                 <input
//                   id="password"
//                   name="password"
//                   type="password"
//                   onChange={(e) => handlePasswordChange(e.target.value)}
//                   value={password}
//                   required
//                    placeholder={t('signup.passwordPlaceholder')}
//                   className={getInputClassName('password')}
//                   disabled={isLoading}
//                 />
//                 {errors.password && (
//                   <p className="mt-2 text-sm text-red-600 flex items-center animate-fade-in">
//                     <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                     </svg>
//                     {errors.password}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div>
//               <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
//                   {t('signup.confirmPasswordLabel')}
//               </label>
//               <div className="mt-1">
//                 <input
//                   id="confirm-password"
//                   name="confirm-password"
//                   type="password"
//                   value={confirmPassword}
//                   onChange={(e) => handleConfirmPasswordChange(e.target.value)}
//                   required
//                   placeholder={t('signup.confirmPasswordPlaceholder')}
//                   className={getInputClassName('confirmPassword')}
//                   disabled={isLoading}
//                 />
//                 {errors.confirmPassword && (
//                   <p className="mt-2 text-sm text-red-600 flex items-center animate-fade-in">
//                     <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                     </svg>
//                     {errors.confirmPassword}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div>
//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading
//                     ? 'bg-blue-400 cursor-not-allowed'
//                     : 'bg-[#2563EB] hover:bg-blue-700'
//                   }`}
//               >
//                 {isLoading ? (
//                   <div className="flex items-center">
//                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                      {t('signup.creatingAccount')}
//                   </div>
//                 ) : (
//                   t('signup.createAccount')
//                 )}
//               </button>
//             </div>
//           </form>

//           <div className="mt-6">
//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-gray-300" />
//               </div>
//               <div className="relative flex justify-center text-sm">
//                 <span className="px-2 bg-white text-gray-500">{t('signup.alreadyHaveAccount')}</span>
//               </div>
//             </div>

//             <div className="mt-6">
//               <a
//                 href="/signin"
//                 className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
//               >
//                {t('signup.signInInstead')}
//               </a>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
