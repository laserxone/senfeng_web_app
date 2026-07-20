'use client';
import { auth } from '@/config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ReactNode, useEffect, useState } from 'react';

export default function MaintenanceWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);


  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      const email = fbUser?.email ?? null;
      if (email && isMaintenance)
        signOut(auth)
    });

    return () => unsub()

  }, [isMaintenance]);

  if (!mounted) return null;

  if (isMaintenance) {

    return (
      <div className="h-screen bg-zinc-900 text-white flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-3xl font-bold mb-2">🚧 Site Under Maintenance</h1>
        <p className="text-lg mb-4">Will be back <strong>soon</strong>.</p>
      </div>
    );
  }

  return children;
}
