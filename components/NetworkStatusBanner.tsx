import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkStatusBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [showBackOnlineBanner, setShowBackOnlineBanner] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
      setHasBeenOffline(true);
    } else {
      setShowOfflineBanner(false);
      if (hasBeenOffline) {
        setShowBackOnlineBanner(true);
        // Auto-hide "back online" message after 5 seconds
        const timer = setTimeout(() => {
          setShowBackOnlineBanner(false);
          setHasBeenOffline(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, hasBeenOffline]);

  if (!showOfflineBanner && !showBackOnlineBanner) {
    return null;
  }

  return (
    <>
      {/* Offline Banner */}
      {showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="font-bold text-sm">You're offline</p>
                <p className="text-xs text-red-100">
                  Don't worry - your work is being saved locally and will sync when you reconnect
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOfflineBanner(false)}
              className="p-1 hover:bg-red-600 rounded-lg transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Back Online Banner */}
      {showBackOnlineBanner && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-emerald-500 text-white px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-sm">You're back online!</p>
                <p className="text-xs text-emerald-100">
                  Your changes are now syncing to the cloud
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBackOnlineBanner(false)}
              className="p-1 hover:bg-emerald-600 rounded-lg transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
