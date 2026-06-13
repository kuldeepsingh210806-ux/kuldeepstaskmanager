import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { testFirestoreConnection } from '../../services/database';
import {
  GraduationCap,
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  WifiOff,
  Loader2,
} from 'lucide-react';

export default function RegisterPage() {
  const { register, setAuthPage } = useAuth();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function checkDb() {
      const result = await testFirestoreConnection();
      setDbStatus(result.ok ? 'connected' : 'error');
      if (!result.ok) {
        setError(`Database error: ${result.error}. Go back to login page to see fix instructions.`);
      }
    }
    checkDb();
    nameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('PINs do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(name, mobile, password);
      if (!result.success) {
        setError(result.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(`Connection error: ${err?.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setMobile(digits);
    setError('');
  };

  const handlePinInput = (value: string, setter: (v: string) => void) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setter(digits);
    setError('');
  };

  const isValid = name.trim().length >= 2 && mobile.length === 10 && password.length === 4 && confirmPassword.length === 4 && password === confirmPassword;

  const validations = [
    { label: 'Full name (at least 2 characters)', valid: name.trim().length >= 2 },
    { label: '10-digit mobile number', valid: mobile.length === 10 },
    { label: '4-digit PIN set', valid: password.length === 4 },
    { label: 'PIN confirmed & matches', valid: confirmPassword.length === 4 && password === confirmPassword },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-emerald-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <button
          onClick={() => setAuthPage('login')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors animate-fade-in"
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>

        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/30 mb-4">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join StudyFlow and start tracking your studies</p>
        </div>

        {/* DB Status Banner */}
        {dbStatus === 'error' && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
            <WifiOff size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">Database offline — go back to login page for fix instructions</p>
          </div>
        )}

        {/* Registration Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/40 p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="Enter your full name"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                />
                {name.trim().length >= 2 && (
                  <CheckCircle2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Mobile Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">+91</span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => handleMobileInput(e.target.value)}
                  placeholder="Enter 10-digit number"
                  className="w-full pl-[4.5rem] pr-4 py-3.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  maxLength={10}
                  inputMode="numeric"
                />
                {mobile.length === 10 && (
                  <CheckCircle2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                )}
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Create 4-Digit PIN</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => handlePinInput(e.target.value, setPassword)}
                  placeholder="● ● ● ●"
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-800/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all tracking-[0.5em] text-center font-mono"
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
              <div className="flex justify-center gap-3 mt-2.5">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-all duration-300',
                      i < password.length
                        ? 'bg-emerald-500 scale-110 shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-700/50 border border-slate-600/50'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Confirm PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Confirm PIN</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => handlePinInput(e.target.value, setConfirmPassword)}
                  placeholder="● ● ● ●"
                  className={cn(
                    'w-full pl-11 pr-12 py-3.5 bg-slate-800/60 border rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 transition-all tracking-[0.5em] text-center font-mono',
                    confirmPassword.length === 4 && password !== confirmPassword
                      ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10'
                      : confirmPassword.length === 4 && password === confirmPassword
                        ? 'border-emerald-500/50 focus:border-emerald-500/50 focus:ring-emerald-500/10'
                        : 'border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/10'
                  )}
                  maxLength={4}
                  inputMode="numeric"
                />
                {confirmPassword.length === 4 && (
                  password === confirmPassword
                    ? <CheckCircle2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                    : <AlertCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400" />
                )}
              </div>
            </div>

            {/* Validation checklist */}
            <div className="p-3 bg-slate-800/30 rounded-xl space-y-1.5">
              {validations.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  {v.valid ? (
                    <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-600 flex-shrink-0" />
                  )}
                  <span className={cn('text-[11px]', v.valid ? 'text-emerald-400' : 'text-slate-500')}>
                    {v.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 break-all">{error}</p>
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading || !isValid || dbStatus === 'error'}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300',
                isValid && dbStatus !== 'error'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-500 hover:to-teal-500'
                  : 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={16} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="text-center mt-5">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <button
                onClick={() => setAuthPage('login')}
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        {/* Footer with DB status */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-1.5 text-[11px]">
            {dbStatus === 'checking' ? (
              <><Loader2 size={10} className="text-slate-500 animate-spin" /><span className="text-slate-500">Connecting to database...</span></>
            ) : dbStatus === 'connected' ? (
              <><CheckCircle2 size={10} className="text-emerald-500" /><span className="text-emerald-500/70">Cloud database connected</span></>
            ) : (
              <><WifiOff size={10} className="text-red-500" /><span className="text-red-500/70">Database offline — fix rules first</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
