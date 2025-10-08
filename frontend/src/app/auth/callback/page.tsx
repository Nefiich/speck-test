"use client";

import { useEffect } from "react";
import { handleOAuthCallback } from "../../utils/auth";

export default function AuthCallbackPage() {
  useEffect(() => {
    handleOAuthCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Completing login...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we finish setting up your session.
        </p>
      </div>
    </div>
  );
}