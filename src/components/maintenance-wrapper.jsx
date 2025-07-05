'use client';
import { useEffect, useState } from 'react';

function getNextSixAM() {
  const now = new Date();
  const next = new Date();
  next.setDate(now.getDate() + 1);
  next.setHours(6, 0, 0, 0);
  return next;
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default function MaintenanceWrapper({ children }) {
  const [mounted, setMounted] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(true);

  useEffect(()=>{
    setMounted(true)
  },[])

  if (!mounted) return null;

  if (isMaintenance) {
    return (
      <div className="h-screen bg-zinc-900 text-white flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-3xl font-bold mb-2">🚧 Site Under Maintenance</h1>
        <p className="text-lg mb-4">Will be back by <strong>monday</strong>.</p>
      </div>
    );
  }

  return children;
}
