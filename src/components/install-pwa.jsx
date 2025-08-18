"use client";

import { useEffect, useState } from "react";

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true); // show button when install available
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false); // hide after interaction
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleInstall}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md"
    >
      Install App
    </button>
  );
}
