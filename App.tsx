
import React, { useState, useEffect } from 'react';
import SprayFoamCalculator from './components/SprayFoamCalculator';
import { CalculatorProvider } from './context/CalculatorContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import LoginPage from './components/LoginPage';
import { onAuthChange, type User } from './services/firebase';
import { Loader2 } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Loading spinner while Firebase checks auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  // Not logged in → show login
  if (!user) {
    return (
      <>
        <LoginPage />
        <PWAInstallPrompt />
      </>
    );
  }

  // Logged in → show app
  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <CalculatorProvider>
        <SprayFoamCalculator firebaseUser={user} />
      </CalculatorProvider>
      <PWAInstallPrompt />
    </div>
  );
}

export default App;
