"use client";

import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictedCount, setConflictedCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      const { processQueue, getQueueStatus } = await import("@/lib/sync");
      await processQueue();
      const status = await getQueueStatus();
      setPendingCount(status.pending);
      setConflictedCount(status.conflicted);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { getQueueStatus } = await import("@/lib/sync");
      const status = await getQueueStatus();
      setPendingCount(status.pending);
      setConflictedCount(status.conflicted);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline && pendingCount === 0 && conflictedCount === 0) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 text-sm font-medium shadow-xl transition-all ${
        !isOnline
          ? "bg-yellow-500 text-black"
          : conflictedCount > 0
            ? "bg-red-500 text-white"
            : "bg-blue-600 text-white"
      }`}
    >
      {!isOnline ? (
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-black/40 animate-pulse" />
          Offline
          {pendingCount > 0 && ` (${pendingCount} pending)`}
        </span>
      ) : conflictedCount > 0 ? (
        <span>{conflictedCount} sync conflict{conflictedCount > 1 ? "s" : ""}</span>
      ) : (
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-white/60 animate-pulse" />
          Syncing {pendingCount} item{pendingCount !== 1 ? "s" : ""}...
        </span>
      )}
    </div>
  );
}
