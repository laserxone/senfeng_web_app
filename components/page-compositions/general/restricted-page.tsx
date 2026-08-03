"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotAuthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-800">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-md">
        <div className="mb-4 text-6xl text-red-500">⛔</div>
        <h1 className="mb-3 text-3xl font-bold">Access Denied</h1>
        <p className="mb-6 text-gray-600">
          You are not authorized to view this page. Please contact your
          administrator or go back to the previous page.
        </p>
        <div className="flex justify-center gap-4">
          <Link href={`/`}>
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
