"use client"
import { auth } from "@/config/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { ReactNode, useEffect, useState } from "react"

export default function MaintenanceWrapper({
  children,
}: {
  children: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [isMaintenance, setIsMaintenance] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      const email = fbUser?.email ?? null
      if (email && isMaintenance) signOut(auth)
    })

    return () => unsub()
  }, [isMaintenance])

  if (!mounted) return null

  if (isMaintenance) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-900 px-6 text-center text-white">
        <h1 className="mb-2 text-3xl font-bold">🚧 Site Under Maintenance</h1>
        <p className="mb-4 text-lg">
          Will be back <strong>soon</strong>.
        </p>
      </div>
    )
  }

  return children
}
