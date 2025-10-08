"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated by calling backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
          method: "GET",
          credentials: "include", // Include cookies
        });

        if (response.ok) {
          // User is authenticated, redirect to home
          router.push("/home");
        } else {
          // User is not authenticated, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // On error, redirect to login
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // This will not be shown as user will be redirected
  return null;
}
