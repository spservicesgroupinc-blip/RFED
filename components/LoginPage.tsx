
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2, AlertCircle, Download, Mail } from 'lucide-react';
import { emailLogin, emailSignup, googleLogin } from '../services/firebase';

interface LoginPageProps {
  installPrompt?: any;
  onInstall?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ installPrompt, onInstall }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const friendlyError = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/user-not-found': return 'No account found with this email.';
      case 'auth/wrong-password': return 'Incorrect password.';
      case 'auth/invalid-credential': return 'Invalid email or password.';
      case 'auth/email-already-in-use': return 'An account with this email already exists.';
      case 'auth/weak-password': return 'Password must be at least 6 characters.';
      case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
      case 'auth/popup-closed-by-user': return 'Sign-in popup was closed.';
      default: return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignup) {
        await emailSignup(formData.email, formData.password);
      } else {
        await emailLogin(formData.email, formData.password);
      }
      // onAuthStateChanged in App.tsx handles the rest
    } catch (err: any) {
      setError(friendlyError(err?.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await googleLogin();
    } catch (err: any) {
      setError(friendlyError(err?.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300 relative">
        
        {/* PWA Install Banner */}
        {installPrompt && onInstall && (
          <button 
            onClick={onInstall}
            className="w-full bg-emerald-600 text-white py-2 px-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Install Desktop/Mobile App
          </button>
        )}

        {/* Header */}
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center justify-center select-none">
            <div className="flex items-center gap-2 mb-2">
                 <div className="bg-brand text-white px-2 py-0.5 -skew-x-12 transform origin-bottom-left shadow-sm flex items-center justify-center">
                    <span className="skew-x-12 font-black text-3xl tracking-tighter">RFE</span>
                 </div>
                 <span className="text-3xl font-black italic tracking-tighter text-white leading-none">RFE</span>
            </div>
            <span className="text-[0.6rem] font-bold tracking-[0.2em] text-brand-yellow bg-black px-2 py-0.5 leading-none">FOAM EQUIPMENT</span>
            <p className="text-slate-400 text-xs mt-4 uppercase tracking-widest font-bold">Professional Estimation Suite</p>
          </div>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand via-slate-900 to-slate-900"></div>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
             {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none transition-all"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  {isSignup ? 'Create Account' : 'Login'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-semibold text-slate-700">Continue with Google</span>
          </button>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(null); }}
              className="text-sm text-slate-500 hover:text-brand font-medium transition-colors"
            >
              {isSignup ? "Already have an account? Login" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
