
import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, UserCircle, GraduationCap, Mail, ShieldCheck, ArrowRight, Loader2, KeyRound, Sparkles, BookOpen, Target, Trophy, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

  const showError = (msg: string) => {
    setError(msg);
    setMessageType('error');
  };

  const showInfo = (msg: string) => {
    setError(msg);
    setMessageType('info');
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const lowerEmail = email.toLowerCase();
    return re.test(email) && (lowerEmail.endsWith('.edu.in') || lowerEmail === 'vijaithegamer@gmail.com');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    if (!validateEmail(cleanEmail)) {
      showError('Only college email IDs ending with .edu.in are allowed.');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (signInError) {
        // If login fails, check if they exist in profiles to give a better error message
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (!existingUser) {
          showError('Email not registered. Please SIGN UP first.');
        } else {
          showError('Invalid password. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Fetch user info
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      const userMetadataName = authData.user?.user_metadata?.name;
      const userMetadataMajor = authData.user?.user_metadata?.major;

      onLogin({
        name: userMetadataName || userData?.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        major: userMetadataMajor || userData?.major || '',
        joinedAt: userData?.created_at || new Date().toISOString()
      });
    } catch (err: any) {
      showError(err.message || 'An unexpected error occurred during login.');
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
        .from('profiles')
        .select('email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        showError('Email ID is already signed up. Please log in.');
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
          showError('Email not registered. Please SIGN UP first.');
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
      setPassword('');
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

  const getBackgroundImage = () => {
    if (authMode === 'signup') return "url('/bg-register.jpg')";
    return "url('/bg-login.jpg')";
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-[#1A0B2E] bg-cover bg-center p-4 relative overflow-hidden transition-all duration-700"
      style={{ backgroundImage: getBackgroundImage(), fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="max-w-[400px] w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 relative z-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-white overflow-hidden">
        {/* Tiny One Piece Easter Egg */}
        <span className="absolute bottom-2 right-3 text-[10px] opacity-[0.05] select-none pointer-events-none" title="King of the Pirates">👒</span>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-wide">
            {authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Register' : 'Reset Password'}
          </h1>
          <p className="text-sm text-white/70 mt-2">
            {authMode === 'login' 
              ? 'Welcome back to EXAMVIBE' 
              : authMode === 'forgot-password'
                ? forgotStep === 'email'
                  ? 'Enter your email to reset'
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
          <div className={`mb-6 p-3 border text-xs sm:text-sm rounded-lg flex items-center gap-2 ${
            messageType === 'info' 
              ? 'bg-blue-500/20 border-blue-300/30 text-blue-100'
              : 'bg-red-500/20 border-red-300/30 text-red-100'
          }`}>
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-5 pr-12 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all text-sm"
                placeholder="Email Address"
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-white/70" />
              </div>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-5 pr-12 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all text-sm"
                placeholder="Password"
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 text-white/70 hover:text-white focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm mt-2 px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-white/50 flex items-center justify-center group-hover:border-white/80 transition-colors">
                  <input type="checkbox" className="hidden peer" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-white scale-0 peer-checked:scale-100 transition-transform" />
                </div>
                <span className="text-white/80 group-hover:text-white transition-colors">Remember me</span>
              </label>
              
              <button
                type="button"
                onClick={() => {
                  setAuthMode('forgot-password');
                  setForgotStep('email');
                  setError(null);
                }}
                className="text-white/80 hover:text-white transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black font-bold py-3 mt-2 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg min-h-[48px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Login
            </button>

            <div className="text-center mt-6">
              <span className="text-white/70 text-sm">Don't have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setError(null);
                }}
                className="text-white font-semibold hover:underline text-sm"
              >
                Register
              </button>
            </div>
          </form>
        )}

        {authMode === 'forgot-password' && (
          <>
            {forgotStep === 'email' && (
              <form onSubmit={handleForgotPasswordEmail} className="space-y-5">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-5 pr-12 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all text-sm"
                    placeholder="Email Address"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-white/70" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black font-bold py-3 mt-2 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg min-h-[48px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Send Reset Code
                </button>

                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError(null);
                    }}
                    className="text-white/80 hover:text-white text-sm transition-colors"
                  >
                    Back to login
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center mb-4 px-2">
                  <p className="text-sm text-white/80">
                    We sent a verification code to <br />
                    <span className="font-semibold text-white break-all">{email}</span>
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-5 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] text-white placeholder-white/50 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black font-bold py-3 mt-2 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg min-h-[48px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Verify Code
                </button>

                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => setForgotStep('email')}
                    className="text-white/80 hover:text-white text-sm transition-colors"
                  >
                    Back to email
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'password' && (
              <form onSubmit={handleSetPassword} className="space-y-5">
                <div className="text-center mb-4 px-2">
                  <p className="text-sm text-white/80">
                    Email verified! Now set a new password.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-5 pr-12 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all text-sm"
                    placeholder="New Password"
                    minLength={6}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-white/70 hover:text-white focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black font-bold py-3 mt-2 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg min-h-[48px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Set New Password
                </button>
              </form>
            )}
          </>
        )}

        {authMode === 'signup' && (
          <>
            {signupStep === 'info' && (
              <form onSubmit={handleSignupInfo} className="space-y-5">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-5 pr-12 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all text-sm"
                    placeholder="Full Name"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <UserCircle className="w-5 h-5 text-white/70" />
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-5 pr-12 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all text-sm"
                    placeholder="College Email (.edu.in)"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-white/70" />
                  </div>
                </div>

                <div className="relative">
                  <select
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full pl-5 pr-12 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all text-sm appearance-none [&>option]:text-black"
                  >
                    <option value="" disabled hidden>Select your major</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <GraduationCap className="w-5 h-5 text-white/70" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black font-bold py-3 mt-2 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg min-h-[48px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Verify Email
                </button>

                <div className="text-center mt-6">
                  <span className="text-white/70 text-sm">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError(null);
                    }}
                    className="text-white font-semibold hover:underline text-sm"
                  >
                    Login
                  </button>
                </div>
              </form>
            )}

            {signupStep === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center mb-4 px-2">
                  <p className="text-sm text-white/80">
                    We sent a verification code to <br />
                    <span className="font-semibold text-white break-all">{email}</span>
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-5 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] text-white placeholder-white/50 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black font-bold py-3 mt-2 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg min-h-[48px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Verify Code
                </button>

                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => setSignupStep('info')}
                    className="text-white/80 hover:text-white text-sm transition-colors"
                  >
                    Back to info
                  </button>
                </div>
              </form>
            )}

            {signupStep === 'password' && (
              <form onSubmit={handleSetPassword} className="space-y-5">
                <div className="text-center mb-4 px-2">
                  <p className="text-sm text-white/80">
                    Email verified! Now set a password.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-5 pr-12 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all text-sm"
                    placeholder="New Password"
                    minLength={6}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-white/70 hover:text-white focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black font-bold py-3 mt-2 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg min-h-[48px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Complete Registration
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
