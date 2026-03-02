import { useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { X, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';

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

                // 3. Claim nickname in `usernames` collection
                await setDoc(usernameRef, { uid: user.uid });

                // 4. Create User Profile in `users` collection
                await setDoc(doc(db, 'users', user.uid), {
                    nickname: nickname,
                    email: email,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-center">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Nickname</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                    placeholder="Unique nickname"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                placeholder="you@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-zinc-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}
