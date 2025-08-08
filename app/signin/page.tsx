'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase/firebase'
import Link from 'next/link'
import { setUserInfo } from "@/redux/slice";
import { useDispatch } from "react-redux";
import { useRouter } from 'next/navigation'
import { FirebaseError } from 'firebase/app'
interface ValidationErrors {
  email?: string
  password?: string
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const dispatch = useDispatch();

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required'
    if (password.length < 6) return 'Password must be at least 6 characters'
    return undefined
  }

  // Real-time validation
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (errors.email) {
      const error = validateEmail(value)
      setErrors(prev => ({ ...prev, email: error }))
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (errors.password) {
      const error = validatePassword(value)
      setErrors(prev => ({ ...prev, password: error }))
    }
  }

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      email: validateEmail(email),
      password: validatePassword(password)
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== undefined)
  }

  // Firebase error messages
  const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address. Please check your email or create a new account.'
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or reset your password.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support for assistance.'
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later or reset your password.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.'
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled. Please contact support.'
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.'
      default:
        return 'Login failed. Please check your credentials and try again.'
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    // Clear previous messages
    setMessage('')
    setMessageType('')

    // Validate form
    if (!validateForm()) {
      setMessage('Please fix the errors below and try again.')
      setMessageType('error')
      return
    }

    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
        .then((value) => {

          const user = value.user;
          dispatch(
            setUserInfo({
              id: user?.uid,
              email: user?.email,
              displayName: user?.displayName,
              photoURL: user?.photoURL,
              password: password,
            })
          );

          setMessage('Login successful! Welcome back!')
          setMessageType('success')
          setTimeout(() => {
            setIsLoading(false);
            router.push("/");
          }, 1500);
        })



      // Clear form on success
      setEmail('')
      setPassword('')
      setErrors({})



    } catch (error: unknown) {
 

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

  return (
    <div className="min-h-screen py-6 bg-gray-50 flex flex-col justify-center sm:px-6 lg:px-8">
      <h2 className="text-2xl sm:text-[18px] font-extrabold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-transparent bg-clip-text text-center drop-shadow-md">
            GREWE Scanner Interface Cloud Version<br className="hidden sm:block" />
          </h2>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back! Please enter your details
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

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  onChange={(e) => handleEmailChange(e.target.value)}
                  value={email}
                  required
                  placeholder="Enter your email"
                  className={getInputClassName('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center animate-fade-in">
                    <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  value={password}
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out"
                >
                  Forgot your password?
                </Link>
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
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{"Don't have an account?"}</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="/signup"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Create new account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
