'use client';
import { useEffect, useState } from 'react';

export default function MaintenanceWrapper({ children }) {
  const [mounted, setMounted] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(()=>{
    setMounted(true)
  },[])

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
