"use client"

import { useEffect, useState } from 'react'
import { fetchUsers, SanityUser, Userr } from './datafetch'
import UserTable from './UserTable'
import { useRouter } from 'next/navigation'
import { Shield, Users, Loader2 } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<Userr[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    // Check if admin is authenticated
    const checkAuth = async () => {
      // Add a small delay to show the auth checking animation
      await new Promise(resolve => setTimeout(resolve, 800))

      const isAdmin = localStorage.getItem('isAdminAuthenticated')
      if (isAdmin !== 'true') {
        router.push('/admin/admin-login')
        return
      }

      setAuthorized(true)
      setAuthChecking(false)

      // Fetch users
      try {
        const fetchedUsers: SanityUser[] = await fetchUsers()
        const formattedUsers: Userr[] = fetchedUsers.map((user, index) => ({
          id: user._id,
          serial: index + 1,
          name: user.username,
          email: user.email,
          password: user.userpassword,
          createdAt: user.createdAt,
        }))
        setUsers(formattedUsers)
        setLoading(false)
      } catch (error) {
        setLoading(false)
        // handle fetch error if needed
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated')
    router.push('/admin/admin-login')
  }

  // Authorization checking state
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto animate-gentle-bounce">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -inset-4 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Verifying Access</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Checking your admin credentials and permissions...
            </p>

            <div className="flex items-center justify-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Loading users state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 animate-fade-in">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Loading your dashboard...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded w-48 animate-pulse"></div>
                </div>
                <Users className="w-6 h-6 text-gray-400" />
              </div>
            </div>

            <div className="p-6">
              <div className="text-center py-12">
                <div className="relative mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <div className="absolute -inset-4 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">Loading Users</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Fetching user data from the database...
                  </p>

                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>

              {/* Loading Skeleton */}
              <div className="space-y-4 mt-8">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse"></div>
                  </div>
                  <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse"></div>
                  </div>
                  <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/5 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto ">
        <div className="mb-8 animate-fade-in flex items-center justify-between ">
          <div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users and their information</p>
          </div>
          <button
            onClick={handleLogout}
            className="
    px-6 py-3 
    bg-green-600 
    text-white 
    font-semibold 
    rounded-lg 
    shadow-md 
    hover:bg-green-700 
    focus:outline-none 
    focus:ring-2 
    focus:ring-green-400 
    focus:ring-offset-2 
    transition 
    duration-300 
    transform 
    hover:scale-105
    active:scale-95
    select-none
  "
          >
            Logout
          </button>

        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-fade-in">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
          </div>

          <UserTable users={users} />
        </div>
      </div>
    </div>
  )
}
