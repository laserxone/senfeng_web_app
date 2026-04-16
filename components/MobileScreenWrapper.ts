"use client";

import { useState, useEffect } from "react";

export default function MobileScreenWrapper({ children }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Adjust the breakpoint as needed
    };

    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-center p-4">
        <p className="text-lg font-semibold">
          This app is not suitable for small screen devices. Please use a larger screen.
        </p>
      </div>
    );
  }

  return children;
}
