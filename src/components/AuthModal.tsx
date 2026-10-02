import React, { useState } from 'react';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  db,
  doc,
  setDoc,
  getDoc,
  User,
} from '../lib/firebase';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const configurePersistence = async () => {
    try {
      const mode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, mode);
    } catch (persistErr) {
      console.warn('Could not set custom auth persistence:', persistErr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        throw new Error('Please enter a valid email address.');
      }

      await configurePersistence();

      if (isSignUp) {
        // Account Creation Validation
        const cleanName = displayName.trim();
        if (!cleanName || cleanName.length < 2) {
          throw new Error('Please enter your full name (at least 2 characters).');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        // 1. Create account in Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);

        // 2. Update Auth display name
        await updateProfile(cred.user, { displayName: cleanName });

        // 3. Synchronize profile in Firestore
        const userDocRef = doc(db, 'users', cred.user.uid);
        await setDoc(
          userDocRef,
          {
            uid: cred.user.uid,
            email: cred.user.email || cleanEmail,
            displayName: cleanName,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            authProvider: 'password',
          },
          { merge: true }
        );

        // 4. Force reload to guarantee client token has updated profile
        try {
          await cred.user.reload();
        } catch (_) {}

        const finalUser = auth.currentUser || cred.user;
        setSuccessNotice('Account created successfully!');
        setTimeout(() => {
          onAuthSuccess(finalUser);
          onClose();
        }, 400);
      } else {
        // Sign-in Validation
        if (!password) {
          throw new Error('Please enter your password.');
        }

        // 1. Sign in with Firebase Auth
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);

        // 2. Retrieve Firestore profile to synchronize user state
        const userDocRef = doc(db, 'users', cred.user.uid);
        let profileData: any = null;
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            profileData = snap.data();
          }
        } catch (fetchErr) {
          console.warn('Could not load user profile from Firestore:', fetchErr);
        }

        // 3. If Firestore has a displayName but Auth doesn't, sync it to Auth
        if (profileData?.displayName && !cred.user.displayName) {
          try {
            await updateProfile(cred.user, { displayName: profileData.displayName });
          } catch (syncErr) {
            console.warn('Failed to update displayName on auth user:', syncErr);
          }
        }

        // 4. Update lastLoginAt in Firestore and ensure profile document exists
        const resolvedName =
          cred.user.displayName ||
          profileData?.displayName ||
          cleanEmail.split('@')[0] ||
          'Candidate';

        try {
          await setDoc(
            userDocRef,
            {
              uid: cred.user.uid,
              email: cred.user.email || cleanEmail,
              displayName: resolvedName,
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              authProvider: 'password',
              ...(profileData ? {} : { createdAt: new Date().toISOString() }),
            },
            { merge: true }
          );
        } catch (syncDocErr) {
          console.warn('Could not update Firestore profile login status:', syncDocErr);
        }

        // 5. Reload user
        try {
          await cred.user.reload();
        } catch (_) {}

        const finalUser = auth.currentUser || cred.user;
        setSuccessNotice('Welcome back!');
        setTimeout(() => {
          onAuthSuccess(finalUser);
          onClose();
        }, 400);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = err.message || 'Authentication failed.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = 'Incorrect email or password. Please verify and try again.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email. Switch to "Create Account" above.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please wait a few moments and try again.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessNotice(null);
    setLoading(true);
    try {
      await configurePersistence();
      const cred = await signInWithPopup(auth, googleProvider);

      const userDocRef = doc(db, 'users', cred.user.uid);
      let existingProfile: any = null;
      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          existingProfile = snap.data();
        }
      } catch (e) {
        console.warn('Could not query Firestore for Google user:', e);
      }

      const resolvedName =
        cred.user.displayName ||
        existingProfile?.displayName ||
        cred.user.email?.split('@')[0] ||
        'Candidate';

      // Ensure user profile in Firestore
      await setDoc(
        userDocRef,
        {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: resolvedName,
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authProvider: 'google.com',
          ...(existingProfile ? {} : { createdAt: new Date().toISOString() }),
        },
        { merge: true }
      );

      try {
        await cred.user.reload();
      } catch (_) {}

      const finalUser = auth.currentUser || cred.user;
      setSuccessNotice('Signed in with Google!');
      setTimeout(() => {
        onAuthSuccess(finalUser);
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      let message = err.message || 'Google sign in was cancelled or failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Google sign-in was cancelled before completion.';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'Popup was blocked by your browser. Please allow popups or use email sign in.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection and try again.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative text-white animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isSignUp ? 'Create your Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp
              ? 'Save your resumes, analyses, versions, and ATS simulation history'
              : 'Sign in to access your cloud-saved resumes and past audit reports'}
          </p>
        </div>

        {/* Tab switch between Login and Sign Up */}
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
              setSuccessNotice(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
              setSuccessNotice(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isSignUp
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950/80 border border-white/15 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder-slate-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950/80 border border-white/15 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-950/80 border border-white/15 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Session Persistence Toggle */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/20 bg-slate-950 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer w-3.5 h-3.5"
              />
              <span>Remember me on this device</span>
            </label>

            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted</span>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-60 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isSignUp ? 'Create Free Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-slate-900 px-3 text-slate-400 font-medium">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/15 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-inner active:scale-[0.99]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
};
