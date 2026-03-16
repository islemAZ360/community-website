import { useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
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
                    throw new Error("Nickname must be at least 3 characters");
                }

                // 1. Check if nickname is available (Unique Nickname constraint)
                const usernameRef = doc(db, 'usernames', nickname.toLowerCase());
                const usernameSnap = await getDoc(usernameRef);

                if (usernameSnap.exists()) {
                    throw new Error("This nickname is already taken!");
                }

                // 2. Create User Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 3. Update Profile Display Name
                const { updateProfile } = await import('firebase/auth');
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
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-[440px] glass rounded-[2rem] shadow-2xl p-8 md:p-12 relative overflow-hidden animate-in zoom-in duration-300 border border-white/10">
                {/* Logo Area */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-500 hover:text-white transition-all p-2 rounded-xl hover:bg-white/5"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>

                <div className="flex flex-col items-center mb-10 mt-4">
                    <div className="size-20 flex items-center justify-center mb-6">
                        <img src={communityLogo} alt="OUR-FIX" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">OUR-FIX HUB</h1>
                    <p className="text-slate-400 text-sm font-medium tracking-wide">
                        {isLogin ? 'Secure Access Protocol' : 'Identity Registration'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-3 rounded-2xl mb-8 text-[11px] font-bold uppercase tracking-widest animate-in slide-in-from-top-2 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Identity Tag</label>
                            <input
                                type="text"
                                required
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-slate-100 placeholder:text-slate-600 focus:outline-none input-glow transition-all duration-300"
                                placeholder="NICKNAME"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email or Phone</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-slate-100 placeholder:text-slate-600 focus:outline-none input-glow transition-all duration-300"
                            placeholder="example@hub.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">Pass-key</label>
                        <div className="relative group">
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 pr-12 text-slate-100 placeholder:text-slate-600 focus:outline-none input-glow transition-all duration-300"
                                placeholder="Enter pass-key"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors">
                                <span className="material-symbols-outlined text-xl">fingerprint</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-premium text-background-dark font-bold h-12 rounded-xl mt-4 shadow-lg flex items-center justify-center gap-2"
                    >
                        {loading ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span> : null}
                        {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
                    </button>
                </form>

                <div className="text-center mt-8">
                    <p className="text-slate-400 text-sm">
                        {isLogin ? "New to Holographic? " : "Already established? "}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-primary hover:text-primary/80 font-semibold ml-1 transition-colors"
                        >
                            {isLogin ? 'Create Account' : 'Access Hub'}
                        </button>
                    </p>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 flex justify-center gap-8">
                    <a href="#" className="text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors">Forgot Password?</a>
                    <a href="#" className="text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors">Privacy Policy</a>
                </div>
            </div>
        </div>
    );
}
