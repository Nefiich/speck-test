"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import CalendarEvents from "../components/CalendarEvents";

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
        <div className="max-w-6xl mx-auto">
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

          <div>
            <CalendarEvents />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
