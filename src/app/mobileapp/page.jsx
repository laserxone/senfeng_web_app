"use client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";

export default function SenFengAppPage() {
  const href =
    "https://github.com/laserxone/senfeng-app-apk/releases/download/lte/senfeng.apk";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white px-4">
      {/* Logo */}
      <img
        src="/senfengLogo.png" 
        alt="SenFeng Logo"
        className="w-32 h-32 mb-6 rounded shadow-lg bg-white"
      />

      {/* App Name */}
      <h1 className="text-4xl font-bold mb-2">Senfeng Mobile App</h1>
      <p className="text-gray-300 mb-6 text-center max-w-md">
        Manage your Senfeng experience on the go with our official mobile app.
      </p>

      {/* Download Button */}
      <Link href={href} target="blank">
        <Button className="text-white bg-blue-600 hover:bg-blue-700 text-lg px-6 py-4 rounded-xl">
          <Download className="mr-2 h-5 w-5" />
          Download App
        </Button>
      </Link>
    </div>
  );
}
