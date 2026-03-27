import { useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import communityLogo from '../public/community.png';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resetSent, setResetSent] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                onClose();
            } else {
                // Register flow
                if (nickname.trim().length < 3) {
                    throw new Error("Identity Tag must be at least 3 characters");
                }

                // 1. Check if nickname is available (Unique Nickname constraint)
                const usernameRef = doc(db, 'usernames', nickname.toLowerCase());
                const usernameSnap = await getDoc(usernameRef);

                if (usernameSnap.exists()) {
                    throw new Error("This Identity Tag is already in use by another agent!");
                }

                // 2. Create User Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 3. Update Profile Display Name
                await updateProfile(user, { displayName: nickname });

                // 4. Claim nickname in `usernames` collection
                await setDoc(usernameRef, { uid: user.uid });

                // 5. Create User Profile in `users` collection (compatible with Admin App)
                await setDoc(doc(db, 'users', user.uid), {
                    nickname: nickname,
                    name: nickname, // Sync with main app's 'name' field
                    email: email,
                    status: 'pending', // Required for main app access flow
                    createdAt: serverTimestamp()
                });

                onClose();
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.message || 'An error occurred during authentication protocol');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Modal Container */}
            <div className="w-full max-w-[440px] bg-[#0a0a0a]/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_0_80px_rgba(19,236,164,0.15)] relative overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">

                {/* Top Background Glow */}
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 size-10 flex items-center justify-center text-white/40 hover:text-white bg-white/5 hover:bg-white/10 transition-all rounded-xl active:scale-95 z-20"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>

                <div className="p-8 sm:p-10 relative z-10">
                    {/* Header & Logo Area */}
                    <div className="flex flex-col items-center mb-10 mt-2 text-center">
                        <div className="relative group mb-6">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-500" />
                            <div className="size-20 bg-black/50 border border-white/10 rounded-2xl flex items-center justify-center relative z-10 p-3 shadow-2xl">
                                <img src={communityLogo} alt="OUR-FIX" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic mb-2">
                            OUR-FIX HUB
                        </h1>
                        <p className="text-[10px] text-primary/80 font-bold uppercase tracking-[0.3em]">
                            {isLogin ? 'Secure Access Protocol' : 'Identity Registration'}
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl mb-8 animate-in slide-in-from-top-2">
                            <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">error</span>
                            <p className="text-[11px] font-bold uppercase tracking-widest leading-relaxed text-left">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-2 text-left rtl:text-right">
                                <label htmlFor="nickname" className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-2">
                                    Identity Tag
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">badge</span>
                                    </div>
                                    <input
                                        id="nickname"
                                        type="text"
                                        required
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="Enter Nickname"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 text-left rtl:text-right">
                            <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-2">
                                Encrypted Comm (Email)
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-lg">alternate_email</span>
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                                    placeholder="agent@hub.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 text-left rtl:text-right">
                            <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-2">
                                Security Pass-key
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-lg">fingerprint</span>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 pl-12 pr-12 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono tracking-widest"
                                    placeholder="••••••••"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10">
                                    <span className="material-symbols-outlined text-lg">lock</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-[0.2em] text-xs h-14 rounded-2xl mt-6 shadow-[0_0_20px_rgba(19,236,164,0.2)] hover:shadow-[0_0_30px_rgba(19,236,164,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-lg">autorenew</span>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                                        {isLogin ? 'login' : 'how_to_reg'}
                                    </span>
                                    <span>{isLogin ? 'Initialize Session' : 'Register Identity'}</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Actions */}
                    <div className="text-center mt-8">
                        <p className="text-white/40 text-xs font-medium">
                            {isLogin ? "New to the system? " : "Already established? "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                    setNickname('');
                                    setPassword('');
                                }}
                                className="text-primary hover:text-white font-black uppercase tracking-wider ml-1 transition-colors"
                            >
                                {isLogin ? 'Create Access' : 'Login Here'}
                            </button>
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-6">
                        {isLogin && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!email) {
                                        setError('Enter your email first, then click Forgot Protocol.');
                                        return;
                                    }
                                    try {
                                        await sendPasswordResetEmail(auth, email);
                                        setResetSent(true);
                                        setError('');
                                        setTimeout(() => setResetSent(false), 5000);
                                    } catch (err: any) {
                                        setError(err.message || 'Failed to send reset email.');
                                    }
                                }}
                                className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${resetSent ? 'text-primary' : 'text-white/30 hover:text-primary'}`}
                            >
                                {resetSent ? '✓ Reset Link Sent!' : 'Forgot Protocol?'}
                            </button>
                        )}
                        {isLogin && <span className="size-1 rounded-full bg-white/10"></span>}
                        <a href="#" className="text-[9px] text-white/30 hover:text-primary font-black uppercase tracking-[0.2em] transition-colors">
                            Security Policy
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}