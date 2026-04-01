
import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, UserCircle, GraduationCap, Mail, ShieldCheck, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [signupStep, setSignupStep] = useState<'info' | 'verify' | 'password'>('info');
  const [forgotStep, setForgotStep] = useState<'email' | 'verify' | 'password'>('email');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [major, setMajor] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'info'>('error');

  const showError = (msg: string) => {
    setError(msg);
    setMessageType('error');
  };

  const showInfo = (msg: string) => {
    setError(msg);
    setMessageType('info');
  };

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith('.edu.in');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (signInError) {
        // If login fails, check if they exist in user_data to give a better error message
        const { data: existingUser } = await supabase
          .from('user_data')
          .select('email')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (!existingUser) {
          showError('You need to sign up first');
        } else {
          showError('Invalid email or password.');
        }
        setLoading(false);
        return;
      }

      // Fetch user info
      const { data: userData } = await supabase
        .from('user_data')
        .select('user_info')
        .eq('email', cleanEmail)
        .maybeSingle();

      let userInfo = userData?.user_info;
      if (typeof userInfo === 'string') {
        try { userInfo = JSON.parse(userInfo); } catch (e) {}
      }

      const userMetadataName = authData.user?.user_metadata?.name;
      const userMetadataMajor = authData.user?.user_metadata?.major;

      onLogin({
        name: userMetadataName || userInfo?.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        major: userMetadataMajor || userInfo?.major || '',
        joinedAt: userInfo?.joinedAt || new Date().toISOString()
      });
    } catch (err: any) {
      showError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.toLowerCase().trim();
    if (!validateEmail(cleanEmail)) {
      showError('Only college email IDs ending with .edu.in are allowed.');
      return;
    }

    setLoading(true);
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('user_data')
        .select('user_info')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser?.user_info) {
        showInfo('The email is already signed up');
        setLoading(false);
        return;
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          data: {
            name: name.trim(),
            major: major,
          }
        },
      });

      if (otpError) {
        if (otpError.message.toLowerCase().includes('rate limit')) {
          showError('Rate limit exceeded. Please check your email for a previously sent code, or wait an hour.');
          setSignupStep('verify');
          setLoading(false);
          return;
        }
        throw otpError;
      }
      
      setSignupStep('verify');
    } catch (err: any) {
      showError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.toLowerCase().trim();
    if (!validateEmail(cleanEmail)) {
      showError('Only college email IDs ending with .edu.in are allowed.');
      return;
    }

    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false
        }
      });

      if (otpError) {
        if (otpError.message.toLowerCase().includes('rate limit')) {
          showError('Rate limit exceeded. Please check your email for a previously sent code, or wait an hour.');
          setForgotStep('verify');
          setLoading(false);
          return;
        }
        if (otpError.message.toLowerCase().includes('signups not allowed') || otpError.message.toLowerCase().includes('user not found')) {
          showError('You need to sign up first');
          setLoading(false);
          return;
        }
        throw otpError;
      }
      
      setForgotStep('verify');
    } catch (err: any) {
      showError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otp,
        type: 'email',
      });

      if (verifyError) throw verifyError;

      // OTP verified, move to password setup
      if (authMode === 'forgot-password') {
        setForgotStep('password');
      } else {
        setSignupStep('password');
      }
    } catch (err: any) {
      showError('Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      const cleanEmail = email.toLowerCase().trim();
      
      // Fetch user info in case it's a forgot password flow and we don't have it in state
      const { data: userData } = await supabase
        .from('user_data')
        .select('user_info')
        .eq('email', cleanEmail)
        .maybeSingle();

      let userInfo = userData?.user_info;
      if (typeof userInfo === 'string') {
        try { userInfo = JSON.parse(userInfo); } catch (e) {}
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userMetadataName = user?.user_metadata?.name;
      const userMetadataMajor = user?.user_metadata?.major;

      onLogin({
        name: userMetadataName || userInfo?.name || name.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        major: userMetadataMajor || userInfo?.major || major || '',
        joinedAt: userInfo?.joinedAt || new Date().toISOString()
      });
    } catch (err: any) {
      showError(err.message || 'Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">EXAMVIBE</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {authMode === 'login' 
              ? 'Welcome back! Please log in.' 
              : authMode === 'forgot-password'
                ? forgotStep === 'email'
                  ? 'Reset your password'
                  : forgotStep === 'verify'
                    ? 'Check your email for the code'
                    : 'Set your new password'
                : signupStep === 'info' 
                  ? 'Create your student account' 
                  : signupStep === 'verify' 
                    ? 'Check your email for the code' 
                    : 'Set your password'}
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-3 border text-sm rounded-lg flex items-center gap-2 ${
            messageType === 'info' 
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
              : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400'
          }`}>
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">College Email (.edu.in)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="student@college.edu.in"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('forgot-password');
                    setForgotStep('email');
                    setError(null);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              Login
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setError(null);
                }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>
        )}

        {authMode === 'forgot-password' && (
          <>
            {forgotStep === 'email' && (
              <form onSubmit={handleForgotPasswordEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">College Email (.edu.in)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="student@college.edu.in"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Send Reset Code
                </button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError(null);
                    }}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Back to login
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    We sent a verification code to <br />
                    <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Verification Code</label>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  Verify Code
                </button>

                <button
                  type="button"
                  onClick={() => setForgotStep('email')}
                  className="w-full text-slate-500 text-sm hover:underline"
                >
                  Back to email
                </button>
              </form>
            )}

            {forgotStep === 'password' && (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Email verified! Now set a new password for your account.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Set New Password
                </button>
              </form>
            )}
          </>
        )}

        {authMode === 'signup' && (
          <>
            {signupStep === 'info' && (
              <form onSubmit={handleSignupInfo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">College Email (.edu.in)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="student@college.edu.in"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Engineering Major</label>
                  <select
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select your major</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Send Verification Code
                </button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError(null);
                    }}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Already have an account? Log in
                  </button>
                </div>
              </form>
            )}

            {signupStep === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    We sent a verification code to <br />
                    <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Verification Code</label>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  Verify Code
                </button>

                <button
                  type="button"
                  onClick={() => setSignupStep('info')}
                  className="w-full text-slate-500 text-sm hover:underline"
                >
                  Back to info
                </button>
              </form>
            )}

            {signupStep === 'password' && (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Email verified! Now set a password for your account.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Complete Registration
                </button>
              </form>
            )}
          </>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400">
            Secure College Authentication System
          </p>
        </div>
      </div>
    </div>
  );
};
