"use client"

import Link from "next/link";
import { Button } from "../ui/button";

export default function NotAuthorized() {

   
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
            <div className="bg-white shadow-md rounded-2xl p-8 max-w-md text-center">
                <div className="text-red-500 text-6xl mb-4">⛔</div>
                <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
                <p className="text-gray-600 mb-6">
                    You are not authorized to view this page.
                    Please contact your administrator or go back to the previous page.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href={`/`}>
                        <Button>
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
