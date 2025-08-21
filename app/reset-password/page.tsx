'use client'

import { useState, useEffect } from 'react'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '@/firebase/firebase'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FirebaseError } from 'firebase/app'
import { client } from '@/sanity/lib/client'

interface ValidationErrors {
  password?: string
  confirmPassword?: string
}

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [userEmail, setUserEmail] = useState('')
  const [isValidCode, setIsValidCode] = useState(false)

  const searchParams = useSearchParams()
  const oobCode = searchParams.get('oobCode')

  // Verify the reset code when component mounts
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setMessage('Invalid or missing reset code. Please request a new password reset link.')
        setMessageType('error')
        setIsVerifying(false)
        return
      }

      try {
        // Verify the password reset code and get the email
        const email = await verifyPasswordResetCode(auth, oobCode)
        setUserEmail(email)
        setIsValidCode(true)
        setMessage('')
        setMessageType('')
      } catch (error: unknown) {
        console.error('Code verification error:', error);

        let errorMessage = 'An unknown error occurred';

        if (error instanceof FirebaseError) {
          errorMessage = getFirebaseErrorMessage(error.code);
        }

        setMessage(errorMessage);
        setMessageType('error');
        setIsValidCode(false);
      } finally {
        setIsVerifying(false)
      }
    }

    verifyCode()
  }, [oobCode])

  // Validation functions
  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required'
    if (password.length < 6) return 'Password must be at least 6 characters'
    if (password.length > 128) return 'Password must be less than 128 characters'
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter'
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter'
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number'
    return undefined
  }

  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return 'Please confirm your password'
    if (password !== confirmPassword) return 'Passwords do not match'
    return undefined
  }

  // Real-time validation
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (errors.password) {
      const error = validatePassword(value)
      setErrors(prev => ({ ...prev, password: error }))
    }
    if (errors.confirmPassword && confirmPassword) {
      const confirmError = validateConfirmPassword(value, confirmPassword)
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }))
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (errors.confirmPassword) {
      const error = validateConfirmPassword(password, value)
      setErrors(prev => ({ ...prev, confirmPassword: error }))
    }
  }

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword)
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== undefined)
  }

  // Firebase error messages
  const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/expired-action-code':
        return 'The password reset link has expired. Please request a new password reset email.'
      case 'auth/invalid-action-code':
        return 'The password reset link is invalid or has already been used. Please request a new one.'
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support for assistance.'
      case 'auth/user-not-found':
        return 'No account found. The user may have been deleted.'
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.'
      case 'auth/too-many-requests':
        return 'Too many requests. Please wait a few minutes before trying again.'
      default:
        return 'Failed to reset password. Please try again or request a new reset link.'
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()

    if (!isValidCode || !oobCode) {
      setMessage('Invalid reset code. Please request a new password reset link.')
      setMessageType('error')
      return
    }

    setMessage('')
    setMessageType('')

    if (!validateForm()) {
      setMessage('Please fix the errors below and try again.')
      setMessageType('error')
      return
    }

    setIsLoading(true)

    try {
      // ✅ Reset the password using Firebase Auth only
      await confirmPasswordReset(auth, oobCode, password)

      setMessage('Password reset successful! You can now sign in with your new password.')
      setMessageType('success')

      await client.create({
        _type: 'forgetPassword',
        userEmail,
        password,
        updatedAt: new Date().toISOString(),
      })

      // Clear form
      setPassword('')
      setConfirmPassword('')
      setErrors({})
    } catch (error: unknown) {
      console.error('Password reset error:', error);

      let errorMessage = 'An unknown error occurred';

      if (error instanceof FirebaseError) {
        errorMessage = getFirebaseErrorMessage(error.code);
      }

      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsLoading(false)
    }
  }


  const getInputClassName = (fieldName: keyof ValidationErrors) => {
    const baseClass = "appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm transition-colors duration-200"
    const hasError = errors[fieldName]

    if (hasError) {
      return `${baseClass} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`
    }

    return `${baseClass} border-gray-300 focus:ring-blue-500 focus:border-blue-500`
  }

  // Loading state while verifying code
  if (isVerifying) {
    return (
      <div className="min-h-screen py-6 bg-gray-50 flex flex-col justify-center sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center justify-center space-y-4">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-600">Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Invalid code state
  if (!isValidCode) {
    return (
      <div className="min-h-screen py-6 bg-gray-50 flex flex-col justify-center sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Invalid Reset Link
          </h2>
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              {message && (
                <div className="mb-6 rounded-lg p-4 border-l-4 bg-red-50 border-red-400">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error!</h3>
                      <div className="mt-1 text-sm text-red-700">{message}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Link
                  href="/forgot-password"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                >
                  Request New Reset Link
                </Link>
                <Link
                  href="/signin"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 bg-gray-50 flex flex-col justify-center sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Set New Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password for <span className="font-medium text-gray-900">{userEmail}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Success/Error Message */}
          {message && (
            <div className={`mb-6 rounded-lg p-4 border-l-4 ${messageType === 'success'
                ? 'bg-green-50 border-green-400'
                : 'bg-red-50 border-red-400'
              }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {messageType === 'success' ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${messageType === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                    {messageType === 'success' ? 'Success!' : 'Error!'}
                  </h3>
                  <div className={`mt-1 text-sm ${messageType === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                    {message}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  value={password}
                  placeholder="Enter your new password"
                  className={getInputClassName('password')}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center animate-fade-in">
                    <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  value={confirmPassword}
                  placeholder="Confirm your new password"
                  className={getInputClassName('confirmPassword')}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center animate-fade-in">
                    <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating Password...
                  </div>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>

          {/* Success Actions */}
          {messageType === 'success' && (
            <div className="mt-6 space-y-3">
              <Link
                href="/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
              >
                Sign In Now
              </Link>
            </div>
          )}

          {/* Password Requirements */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-800">
                  Password Requirements
                </h3>
                <div className="mt-2 text-sm text-gray-600">
                  <ul className="list-disc list-inside space-y-1">
                    <li>At least 6 characters long</li>
                    <li>Contains at least one uppercase letter</li>
                    <li>Contains at least one lowercase letter</li>
                    <li>Contains at least one number</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
