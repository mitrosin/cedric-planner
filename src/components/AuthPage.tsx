import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Sparkles, User, Loader2 } from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import ReCAPTCHA from "react-google-recaptcha";
import { auth, db } from '../lib/firebase';

export interface AuthPageProps {
  onAuthSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sending verification email to:', result.user.email);
      await sendEmailVerification(result.user);
      console.log('Verification email sent successfully.');
      await signOut(auth);
      setMessage('Verification email sent! Please check your inbox or spam folder.');
      setNeedsVerification(false);
    } catch (err: any) {
      console.error('Error resending email:', err);
      setError(`Failed to resend: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create user doc if it doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!isLogin && !recaptchaToken) {
      setError('Please verify that you are not a robot.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (!result.user.emailVerified) {
          setNeedsVerification(true);
          await signOut(auth);
          throw new Error('Please verify your email address to log in. Check your inbox.');
        }
        onAuthSuccess();
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: name,
          updatedAt: serverTimestamp()
        });
        
        await sendEmailVerification(result.user);
        await signOut(auth);
        
        setIsLogin(true);
        setMessage('Account created successfully! Please check your email (and spam folder) to verify your account before logging in.');
        setEmail('');
        setPassword('');
        setName('');
        setRecaptchaToken(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] p-8 border border-slate-100/50">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/20">
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cedric Planner</h1>
          <p className="text-slate-500 mt-2 font-medium">{isLogin ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 font-medium">
            <p>{error}</p>
            {needsVerification && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="mt-3 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors w-full cursor-pointer"
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}
        
        {message && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm mb-6 border border-emerald-100 font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
                required
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {!isLogin && (
            <div className="flex justify-center py-2">
              <ReCAPTCHA
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                onChange={(token) => setRecaptchaToken(token)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md cursor-pointer"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-400 font-medium tracking-wide text-xs uppercase">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
          Google
        </button>

        <p className="text-center mt-8 text-sm text-slate-500 font-medium">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setMessage('');
              setNeedsVerification(false);
            }}
            className="text-slate-900 font-bold hover:underline cursor-pointer"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

