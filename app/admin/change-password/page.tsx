"use client";

import { client } from "@/sanity/lib/client";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FormData {
  currentUsername: string;
  currentPassword: string;
  newUsername: string;
  newPassword: string;
}

export default function ChangePasswordForm() {
    const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormData>({
    currentUsername: "",
    currentPassword: "",
    newUsername: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const admin = await client.fetch(
        `*[_type == "admin"][0]{_id, username, password}`
      );

      if (!admin) {
        throw new Error(t("changePassword_admin.errorNotFound"));
      }

      if (
        admin.username === formData.currentUsername &&
        admin.password === formData.currentPassword
      ) {
        setStep(2);
      } else {
        throw new Error(t("changePassword_admin.errorInvalid"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (t("changePassword_admin.errorGeneric")));
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const admin = await client.fetch(`*[_type == "admin"][0]{_id}`);

      if (!admin) {
        throw new Error(t("changePassword_admin.errorNotFound"));
      }

      await client
        .patch(admin._id)
        .set({
          username: formData.newUsername,
          password: formData.newPassword,
        })
        .commit();

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : (t("changePassword_admin.errorGeneric")));
    } finally {
      setLoading(false);
    }
  };



  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white border-2 border-blue-500 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-blue-900 mb-2">{t("changePassword_admin.successTitle")}</h2>
            <p className="text-blue-700 mb-6">
              {t("changePassword_admin.successMessage")}
            </p>
            <Link
              href="/admin"
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2563EB] transition-colors"
            >
             {t("changePassword_admin.goToDashboard")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-blue-500 rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">
              {t("changePassword_admin.pageTitle")}
            </h1>
            <div className="flex items-center justify-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1
                    ? "bg-blue-500 text-white"
                    : "bg-blue-100 text-blue-500"
                }`}
              >
                1
              </div>
              <div
                className={`w-12 h-1 ${step >= 2 ? "bg-blue-500" : "bg-blue-100"}`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2
                    ? "bg-blue-500 text-white"
                    : "bg-blue-100 text-blue-500"
                }`}
              >
                2
              </div>
            </div>
            <p className="text-blue-600 mt-2">
              {step === 1
                ?  t("changePassword_admin.step1")
                : t("changePassword_admin.step2")}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Verify Current Credentials */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label
                  htmlFor="currentUsername"
                  className="block text-sm font-medium text-blue-900 mb-2"
                >
                 {t("changePassword_admin.currentUsernameLabel")}
                </label>
                <input
                  type="text"
                  id="currentUsername"
                  value={formData.currentUsername}
                  onChange={(e) =>
                    handleInputChange("currentUsername", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder= {t("changePassword_admin.currentUsernamePlaceholder")}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-blue-900 mb-2"
                >
                  {t("changePassword_admin.currentPasswordLabel")}
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    handleInputChange("currentPassword", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder={t("changePassword_admin.currentPasswordPlaceholder")}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2563EB] disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t("changePassword_admin.verifying")  :t("changePassword_admin.verifyButton") }
              </button>
            </form>
          )}

          {/* Step 2: Update Credentials */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div>
                <label
                  htmlFor="newUsername"
                  className="block text-sm font-medium text-blue-900 mb-2"
                >
                  {t("changePassword_admin.newUsernameLabel")}
                </label>
                <input
                  type="text"
                  id="newUsername"
                  value={formData.newUsername}
                  onChange={(e) =>
                    handleInputChange("newUsername", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder= {t("changePassword_admin.newUsernamePlaceholder")}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-blue-900 mb-2"
                >
                   {t("changePassword_admin.newPasswordLabel")}
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={(e) =>
                    handleInputChange("newPassword", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder= {t("changePassword_admin.newPasswordPlaceholder")}
                  required
                  minLength={6}
                />
                <p className="text-sm text-blue-600 mt-1">
                 {t("changePassword_admin.passwordHint")}
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white text-blue-500 py-3 px-4 rounded-lg font-medium border-2 border-blue-500 hover:bg-blue-50 transition-colors"
                >
                   {t("changePassword_admin.backButton")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-[#2563EB] disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? t("changePassword_admin.updating") : t("changePassword_admin.updateButton")  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
