"use client";

import { client } from "@/sanity/lib/client";
import Link from "next/link";
import { useState } from "react";

interface FormData {
  currentUsername: string;
  currentPassword: string;
  newUsername: string;
  newPassword: string;
}

export default function ChangePasswordForm() {
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
        throw new Error("Admin credentials not found in database");
      }

      if (
        admin.username === formData.currentUsername &&
        admin.password === formData.currentPassword
      ) {
        setStep(2);
      } else {
        throw new Error("Invalid username or password");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
        throw new Error("Admin record not found");
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
      setError(err instanceof Error ? err.message : "An error occurred");
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
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Success!</h2>
            <p className="text-blue-700 mb-6">
              Admin credentials have been updated successfully.
            </p>
            <Link
              href="/admin"
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Go to Admin Dashboard
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
              Change Admin Password
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
                ? "Verify Current Credentials"
                : "Set New Credentials"}
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
                  Current Username
                </label>
                <input
                  type="text"
                  id="currentUsername"
                  value={formData.currentUsername}
                  onChange={(e) =>
                    handleInputChange("currentUsername", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter current username"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-blue-900 mb-2"
                >
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    handleInputChange("currentPassword", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Verifying..." : "Verify Credentials"}
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
                  New Username
                </label>
                <input
                  type="text"
                  id="newUsername"
                  value={formData.newUsername}
                  onChange={(e) =>
                    handleInputChange("newUsername", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter new username"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-blue-900 mb-2"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={(e) =>
                    handleInputChange("newPassword", e.target.value)
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <p className="text-sm text-blue-600 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white text-blue-500 py-3 px-4 rounded-lg font-medium border-2 border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
