import { useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { X, Mail, Lock, User as UserIcon, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

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
                    password: password, // Stored for Admin visibility as requested
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
            <div className="glass-panel w-full max-w-md rounded-[40px] p-10 md:p-12 relative animate-in fade-in zoom-in duration-500 border-white/[0.05] shadow-[0_0_100px_rgba(16,185,129,0.15)] overflow-hidden">
                {/* Decorative background blur */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-all p-2 rounded-xl hover:bg-white/5"
                >
                    <X size={20} />
                </button>

                <div className="text-center space-y-3 mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 mb-2">
                        <ShieldCheck size={12} /> Secure Auth Protocol
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter holographic-text">
                        {isLogin ? 'Access' : 'Registration'} <span className="text-white/40 font-light">Node</span>
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-3 rounded-2xl mb-8 text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {!isLogin && (
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Identity Tag</label>
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-white placeholder:text-zinc-800 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] transition-all"
                                    placeholder="NICKNAME_STR_3"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Email Frequency</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-400 transition-colors" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-white placeholder:text-zinc-800 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] transition-all"
                                placeholder="IDENT_RELAY@HUB.COM"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Pass-Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-400 transition-colors" size={18} />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-white placeholder:text-zinc-800 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="premium-button premium-button-primary w-full py-5 text-sm uppercase tracking-[0.3em] mt-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                    >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={18} />}
                        {loading ? 'Initializing...' : isLogin ? 'Establish Link' : 'Register Core'}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest text-zinc-600">
                        {isLogin ? "No connection archive? " : "Already registered? "}
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-emerald-400 hover:text-white hover:underline transition-all underline-offset-4"
                        >
                            {isLogin ? 'Create Profile' : 'Access Node'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
