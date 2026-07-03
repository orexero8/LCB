"use client";

import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-xs w-full">
      <p className="text-sm font-semibold">Install Le Cheval Blanc</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Install for offline access and a better experience.
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") setShow(false);
            setDeferredPrompt(null);
          }}
          className="px-3 py-1.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
        >
          Install
        </button>
        <button
          onClick={() => setShow(false)}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
