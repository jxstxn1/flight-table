"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AirportBoard from "./components/airport-board";

export default function Page() {
  const searchParams = useSearchParams();
  const [isValidToken, setIsValidToken] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const urlToken = searchParams.get("token");

    if (!urlToken) {
      // No token provided, redirect to Google
      window.location.href = "https://www.google.com";
      return;
    }

    // Store the token and mark as valid
    setToken(urlToken);
    setIsValidToken(true);
  }, [searchParams]);

  // Show loading while checking token
  if (!isValidToken || !token) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-400 text-xl mb-4">Authenticating...</div>
          <div className="text-gray-400 text-sm">Validating access token</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AirportBoard token={token} />
    </div>
  );
}
