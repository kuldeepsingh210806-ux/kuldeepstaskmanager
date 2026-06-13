import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { testFirestoreConnection } from '../../services/database';
import {
  GraduationCap,
  Phone,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Shield,
  AlertCircle,
  ArrowRight,
  WifiOff,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const { login, adminLogin, setAuthPage } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [adminError, setAdminError] = useState('');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [dbError, setDbError] = useState('');
  const mobileRef = useRef<HTMLInputElement>(null);

  // Test Firebase connection on mount
  useEffect(() => {
    async function checkDb() {
      const result = await testFirestoreConnection();
      if (result.ok) {
        setDbStatus('connected');
      } else {
        setDbStatus('error');
        const code = result.error || '';
        if (code.includes('permission-denied')) {
          setDbError('Firestore rules are blocking access. Update rules to allow read/write.');
        } else if (code.includes('unavailable') || code.includes('Failed to fetch')) {
          setDbError('Cannot reach Firebase. Check your internet connection.');
        } else if (code.includes('not-found') || code.includes('NOT_FOUND')) {
          setDbError('Firestore database not created yet. Go to Firebase Console → Build → Firestore Database → Create database.');
        } else {
          setDbError(code || 'Unknown connection error');
        }
      }
    }
    checkDb();
    mobileRef.current?.focus();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(mobile, password);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const result = adminLogin(adminKey);
    if (!result.success) {
      setAdminError(result.error || 'Invalid passkey');
    }
  };

  const handleMobileInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setMobile(digits);
    setError('');
  };

  const handlePasswordInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setPassword(digits);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-violet-400/30 rounded-full animate-pulse"
            style={{
              top: `${15 + i * 15}%`,
              left: `${10 + i * 16}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-2xl shadow-violet-500/30 mb-4">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">StudyFlow</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back! Login to continue.</p>
        </div>

        {/* Database Connection Status */}
        {dbStatus === 'error' && (
          <FirestoreFixGuide dbError={dbError} />
        )}

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/40 p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Mobile Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">+91</span>
                <input
                  ref={mobileRef}
                  type="tel"
                  value={mobile}
                  onChange={e => handleMobileInput(e.target.value)}
                  placeholder="Enter 10-digit number"
                  className="w-full pl-[4.5rem] pr-4 py-3.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all"
                  maxLength={10}
                  inputMode="numeric"
                />
                {mobile.length === 10 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">4-Digit PIN</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => handlePasswordInput(e.target.value)}
                  placeholder="● ● ● ●"
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all tracking-[0.5em] text-center font-mono"
                  maxLength={4}
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* PIN dots indicator */}
              <div className="flex justify-center gap-3 mt-3">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={cn(
                      'w-3 h-3 rounded-full transition-all duration-300',
                      i < password.length
                        ? 'bg-violet-500 scale-110 shadow-lg shadow-violet-500/30'
                        : 'bg-slate-700/50 border border-slate-600/50'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={mobile.length !== 10 || password.length !== 4}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300',
                mobile.length === 10 && password.length === 4
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:from-violet-500 hover:to-indigo-500'
                  : 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
              )}
            >
              <LogIn size={16} />
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Register link */}
          <button
            onClick={() => setAuthPage('register')}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-800/40 hover:bg-slate-800/70 border border-white/5 hover:border-white/10 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all duration-200"
          >
            <UserPlus size={16} />
            Create New Account
            <ArrowRight size={14} className="ml-1" />
          </button>
        </div>

        {/* Admin Access */}
        <div className="text-center mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setShowAdminModal(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-violet-400 transition-colors group"
          >
            <Shield size={12} className="group-hover:text-violet-400" />
            Admin Access
          </button>
        </div>

        {/* Footer with DB status */}
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-1.5 text-[11px]">
            {dbStatus === 'checking' ? (
              <><Loader2 size={10} className="text-slate-500 animate-spin" /><span className="text-slate-500">Connecting to database...</span></>
            ) : dbStatus === 'connected' ? (
              <><CheckCircle2 size={10} className="text-emerald-500" /><span className="text-emerald-500/70">Cloud database connected</span></>
            ) : (
              <><WifiOff size={10} className="text-red-500" /><span className="text-red-500/70">Database offline</span></>
            )}
          </div>
        </div>
      </div>

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-white/10 shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Admin Login</h3>
                <p className="text-xs text-slate-400">Enter admin passkey</p>
              </div>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminKey}
                  onChange={e => { setAdminKey(e.target.value); setAdminError(''); }}
                  placeholder="Enter admin passkey..."
                  className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                  autoFocus
                />
              </div>
              {adminError && (
                <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle size={14} className="text-red-400" />
                  <p className="text-xs text-red-300">{adminError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAdminModal(false); setAdminKey(''); setAdminError(''); }}
                  className="flex-1 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl text-sm text-white font-medium hover:from-amber-500 hover:to-orange-500 transition-all"
                >
                  Access Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

function FirestoreFixGuide({ dbError }: { dbError: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(FIRESTORE_RULES);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = FIRESTORE_RULES;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <WifiOff size={16} className="text-red-400" />
        <span className="text-sm font-semibold text-red-400">Database Connection Failed</span>
      </div>
      <p className="text-xs text-red-300/80 leading-relaxed mb-3">{dbError}</p>

      {/* Step by step */}
      <div className="space-y-2 mb-3">
        <p className="text-[11px] text-white font-semibold">🔧 Fix in 3 steps:</p>
        <div className="flex items-start gap-2">
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">1</span>
          <p className="text-[11px] text-slate-300">Open <a href="https://console.firebase.google.com/project/kuldeep-a1832/firestore/databases/-default-/rules" target="_blank" rel="noopener" className="text-amber-400 underline underline-offset-2">Firebase Console → Firestore → Rules</a></p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">2</span>
          <p className="text-[11px] text-slate-300">Delete everything in the rules editor</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">3</span>
          <p className="text-[11px] text-slate-300">Paste the rules below and click <span className="text-white font-semibold">Publish</span></p>
        </div>
      </div>

      {/* Rules with copy button */}
      <div className="relative bg-slate-900/80 rounded-lg border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-slate-800/50">
          <span className="text-[10px] text-slate-500 font-medium">Firestore Rules</span>
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all',
              copied
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
            )}
          >
            {copied ? (
              <><CheckCircle2 size={10} /> Copied!</>
            ) : (
              '📋 Copy Rules'
            )}
          </button>
        </div>
        <pre className="p-3 text-[11px] text-amber-400 font-mono leading-relaxed overflow-x-auto">{FIRESTORE_RULES}</pre>
      </div>
    </div>
  );
}
