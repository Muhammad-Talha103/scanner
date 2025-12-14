"use client";

import { useEffect, useRef, useState } from "react";
import { fetchUsersWithPasswordMerge, Userr } from "./datafetch";
import UserTable from "./UserTable";
import { useRouter } from "next/navigation";
import { Shield, Users, Loader2, Key, LogOut, UserIcon, CreditCard } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function AdminPage() {
   const { t } = useTranslation()
  const router = useRouter();
  const [users, setUsers] = useState<Userr[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if admin is authenticated
    const checkAuth = async () => {
      // Add a small delay to show the auth checking animation
      await new Promise((resolve) => setTimeout(resolve, 800));

      const isAdmin = localStorage.getItem("isAdminAuthenticated");

      if (isAdmin !== "true") {
        router.push("/admin/admin-login");
        return;
      }

      setAuthorized(true);
      setAuthChecking(false);

      // Fetch users with password merge logic
      try {
        setLoading(true);

        const fetchedUsers: Userr[] = await fetchUsersWithPasswordMerge();

        // Log each user for debugging
        fetchedUsers.map((user) => ({
          name: user.name,
          email: user.email,
          isPasswordUpdated: user.isPasswordUpdated,
          passwordLength: user.password.length,
        }));

        setUsers(fetchedUsers);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        // handle fetch error if needed
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    router.push("/admin/admin-login");
  };

    useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  // Authorization checking state
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#EDF2FE] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-[#4564EE] rounded-2xl flex items-center justify-center mx-auto animate-gentle-bounce">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -inset-4 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {t("admin.verifying")}
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
               {t("admin.checkadminCredentials")}
            </p>

            <div className="flex items-center justify-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#EDF2FE] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
           {t("admin.accessDenied")}
          </h2>
          <p className="text-gray-600">{t("admin.redirecting")}</p>
        </div>
      </div>
    );
  }

  // Loading users state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 animate-fade-in">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#4564EE] rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                 {t("admin.admin_dashboard")}
                </h1>
                <p className="text-gray-600"> {t("admin.loadingDashboard")}</p>
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
                  <div className="w-16 h-16 bg-[#4564EE] rounded-2xl flex items-center justify-center mx-auto">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <div className="absolute -inset-4 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                   {t("admin.loadingUsers")}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                     {t("admin.fetchingUsers")}
                  </p>

                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("admin.admin_dashboard")}
            </h1>
            <p className="text-gray-600">{t("admin.manage_users")} </p>
          </div>

          {/* Buttons container */}
           <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
            >
              <UserIcon className="w-6 h-6 text-gray-700" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fade-in">
                <Link
                  href="/admin/change-password"
                  className="flex items-center px-4 py-2 text-gray-800 text-sm hover:bg-gray-100 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Key className="w-4 h-4 mr-2" />
                  {t("admin.change_credentials")}
                </Link>
                <Link
                  href="/admin/premium-users"
                  className="flex items-center px-4 py-2 text-gray-800 text-sm hover:bg-gray-100 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Key className="w-4 h-4 mr-2" />
                  {t("admin.premium_users")}
                </Link>
                <Link
                  href="/admin/expired-premium-users"
                  className="flex items-center px-4 py-2 text-gray-800 text-sm hover:bg-gray-100 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Key className="w-4 h-4 mr-2" />
                  {t("admin.expired_premium_users")}
                </Link>
                <Link
                  href="/admin/payments-record"
                  className="flex items-center px-4 py-2 text-gray-800 text-sm hover:bg-gray-100 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  <span className="text-[11px]">{t("admin.payment_records")}</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-gray-800 text-sm hover:bg-gray-100 transition"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("admin.logout")}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-fade-in">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
               {t("admin.user_management")}
            </h2>
          </div>

          <UserTable users={users} />
        </div>
      </div>
    </div>
  );
}
