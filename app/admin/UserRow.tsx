"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Trash2, Eye, EyeOff } from "lucide-react";
import { MdOutlineWorkspacePremium } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { client } from "@/sanity/lib/client";

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  //  Added isPasswordUpdated property
  isPasswordUpdated?: boolean;
}

interface UserRowProps {
  user: User;
  serialNumber: number;
  onDelete: (userId: string, userName: string) => void;
  isDesktop: boolean;
}

export default function UserRow({
  user,
  serialNumber,
  onDelete,
  isDesktop,
}: UserRowProps) {
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();
  const [isPremium, setIsPremium] = useState(false);

  const maskPassword = (password: string) => {
    return "•".repeat(password.length);
  };

  const handleShowPasswordStart = () => {
    setShowPassword(true);
  };

  const handleShowPasswordEnd = () => {
    setShowPassword(false);
  };

    // Fetch premium users and check if current user is premium
 useEffect(() => {
    async function checkPremium() {
      try {
        const PREMIUM_USERS_QUERY = `*[_type == "premiumUser"].email`;
        const premiumEmails: string[] = await client.fetch(PREMIUM_USERS_QUERY);
        // Check if the current user's email is in premiumEmails
        setIsPremium(
          premiumEmails.some(
            (email) => email.toLowerCase() === user.email.toLowerCase()
          )
        );
      } catch (err) {
        console.error("Failed to check premium status:", err);
      }
    }
    checkPremium();
  }, [user.email]);
  
  if (isDesktop) {
    return (
      <tr className="hover:bg-gray-50 transition-colors duration-200 animate-fade-in">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {serialNumber}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className={`text-sm font-medium ${isPremium ? "text-yellow-400" : "text-gray-900"}`}>{user.name}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{user.email}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap flex flex-col space-y-1 font-mono text-sm text-gray-900">
          {/*  Show UPDATED label when password was updated from forgetPassword */}
          {user.isPasswordUpdated && (
            <span className="uppercase font-semibold text-xs text-white select-none bg-blue-500 w-fit px-2 py-1 rounded-full">
              {t("user_row.updated")}
            </span>
          )}

          {/* Password and button side by side */}
          <div className="flex items-center space-x-2">
            <span>
              {showPassword ? user.password : maskPassword(user.password)}
            </span>
            <button
              onMouseDown={handleShowPasswordStart}
              onMouseUp={handleShowPasswordEnd}
              onMouseLeave={handleShowPasswordEnd}
              onTouchStart={handleShowPasswordStart}
              onTouchEnd={handleShowPasswordEnd}
              className="focus:outline-none"
              aria-label={showPassword ? t("user_row.hidePassword") : t("user_row.showPassword")}
              type="button"
            >
              {/* {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-500" />
              ) : (
                <Eye className="w-5 h-5 text-gray-500" />
              )} */}
            </button>
          </div>
        </td>

        <td className="px-4 py-4 whitespace-nowrap relative">
         {isPremium && (
          <div className="flex items-center absolute right-2 top-2 text-xs font-bold justify-center">
            <MdOutlineWorkspacePremium className="text-yellow-500" size={30} />
          </div>
        )}
          <button
            onClick={() => onDelete(user.id, user.name)}
            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="hidden lg:flex">{t("user_row.delete")}</span>
          </button>
        </td>
      </tr>
    );
  }

  return (
    <div className="border-b border-gray-200 animate-fade-in">
      <div
        className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-500">
            #{serialNumber}
          </span>
          <span className={`text-sm font-medium ${isPremium ? "text-yellow-400" : "text-gray-900"}`}>{user.name}</span>
          {/*  Show UPDATED badge in mobile view */}
          {user.isPasswordUpdated && (
            <span className="uppercase font-semibold text-xs text-white select-none bg-blue-500 px-2 py-1 rounded-full">
              {t("user_row.updated")}
            </span>
          )}
          {isPremium && (
          <MdOutlineWorkspacePremium className=" text-yellow-500" size={30} />
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400 transition-transform duration-200" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200" />
          )}
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 bg-gray-50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              {t("user_row.email")}
            </label>
            <div className="text-sm text-gray-900">{user.email}</div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                 {t("user_row.password")}
              </label>
              {/*  Show UPDATED label in mobile expanded view */}
              {user.isPasswordUpdated && (
                <span className="uppercase font-semibold text-xs text-white select-none bg-blue-500 px-2 py-1 rounded-full">
                   {t("user_row.updated")}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-900 font-mono flex items-center space-x-2">
              <span>
                {maskPassword(user.password)}
              </span>
             
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user.id, user.name);
              }}
              className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
             {t("user_row.deleteUser")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
