"use client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";

export default function SenFengAppPage() {
  const href =
    "https://github.com/laserxone/senfeng-app-apk/releases/download/lte/senfeng.apk";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4 text-white">
      {/* Logo */}
      <img
        src="/senfengLogo.png"
        alt="SenFeng Logo"
        className="mb-6 h-32 w-32 rounded bg-white shadow-lg"
      />

      {/* App Name */}
      <h1 className="mb-2 text-4xl font-bold">Senfeng Mobile App</h1>
      <p className="mb-6 max-w-md text-center text-gray-300">
        Manage your Senfeng experience on the go with our official mobile app.
      </p>

      {/* Download Button */}
      <Link href={href} target="blank">
        <Button className="rounded-xl bg-blue-600 px-6 py-4 text-lg text-white hover:bg-blue-700">
          <Download className="mr-2 h-5 w-5" />
          Download App
        </Button>
      </Link>
    </div>
  );
}
