"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

export default function HomePage() {
  const router = useRouter();
  const { user, logout, logoutAll } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      router.push("/login");
    } catch (error) {
      console.error("Logout all error:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              {user && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Welcome back, {user.email}!
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLogoutAll}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200"
                title="Logout from all devices"
              >
                Logout All
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </header>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to your Calendar!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You have successfully logged in with Google.
              </p>

              {user && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Your Account Information
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>User ID:</strong> {user.userId}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Email:</strong> {user.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
