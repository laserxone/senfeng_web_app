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
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    setMounted(true); // Ensures hydration mismatch is avoided

    const updateTimer = () => {
      const now = new Date();
      const target = getNextSixAM();
      const diff = target - now;

      setTimeLeft(diff > 0 ? diff : 0);
      setIsMaintenance(diff > 0);
    };

    updateTimer(); // run once immediately
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null; // Prevent mismatch by rendering nothing during SSR

  if (isMaintenance) {
    return (
      <div className="h-screen bg-zinc-900 text-white flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-3xl font-bold mb-2">🚧 Site Under Maintenance</h1>
        <p className="text-lg mb-4">Will be back at <strong>6:00 AM tomorrow</strong>.</p>
        <p className="text-2xl font-mono">{formatTime(timeLeft)}</p>
      </div>
    );
  }

  return children;
}
