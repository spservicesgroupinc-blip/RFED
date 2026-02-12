import React, { useEffect, useState, useCallback } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isiOS);

    // Listen for the browser's install prompt (Chrome / Edge / Samsung / etc.)
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault(); // Prevent the mini-infobar
      setDeferredPrompt(e);
      // Show our custom banner after a short delay so the app loads first
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    // On iOS, show a manual install guide after delay if not already installed
    if (isiOS && !isStandalone) {
      const dismissed = sessionStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt]);

  const handleDismiss = () => {
    setShowBanner(false);
    if (isIOS) {
      sessionStorage.setItem('pwa-ios-dismissed', 'true');
    }
  };

  if (isInstalled || !showBanner) return null;

  // iOS-specific "Add to Home Screen" guide
  if (isIOS) {
    return (
      <>
        {/* Overlay backdrop */}
        {showIOSGuide && (
          <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={() => setShowIOSGuide(false)} />
        )}

        {/* Bottom banner */}
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 safe-area-inset-bottom">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-brand to-brand-hover rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm">Install RFE Foam Pro</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tap the <strong>Share</strong> button
                  <span className="inline-block mx-1">
                    <svg className="inline w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </span>
                  then <strong>"Add to Home Screen"</strong>
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Chrome / Edge / Android install banner
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-brand to-brand-hover rounded-xl flex items-center justify-center">
            <Monitor className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm">Install RFE Foam Pro</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add to your home screen for quick access, offline support, and a native app experience.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
