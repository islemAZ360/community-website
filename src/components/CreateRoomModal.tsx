import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { X, Lock, Globe, Loader2, Hash, Sparkles, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
    const { user, userData } = useAuthStore();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!name.trim()) throw new Error("Room identifier required");

            const roomData = {
                name: name.trim(),
                isPrivate,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
                creatorNickname: userData?.nickname || 'Unknown',
                participants: isPrivate ? [user.uid] : [],
                admins: [user.uid]
            };

            const roomRef = await addDoc(collection(db, 'rooms'), roomData);

            onClose();
            setName('');
            setIsPrivate(false);

            navigate(`/room/${roomRef.id}`);

        } catch (err: any) {
            console.error("Room creation error:", err);
            setError(err.message || "Protocol failure: Room creation aborted");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-panel w-full max-w-md rounded-[40px] p-10 md:p-12 relative animate-in fade-in zoom-in duration-500 border-white/[0.05] shadow-[0_0_100px_rgba(16,185,129,0.15)] overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-all p-2 rounded-xl hover:bg-white/5"
                >
                    <X size={20} />
                </button>

                <div className="text-center space-y-3 mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 mb-2">
                        <Terminal size={12} /> System Command
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter holographic-text">
                        Initialize <span className="text-white/40 font-light">Hub</span>
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-3 rounded-2xl mb-8 text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Room Designation</label>
                        <div className="relative group">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-400 transition-colors" size={18} />
                            <input
                                type="text"
                                required
                                maxLength={30}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-[20px] py-4 pl-12 pr-6 text-sm font-medium text-white placeholder:text-zinc-800 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] transition-all"
                                placeholder="E.G. NEURAL_NETWORK"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Security Protocol</label>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPrivate(false)}
                                className={`flex items-start gap-4 p-5 rounded-[24px] border transition-all duration-300 ${!isPrivate ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300'}`}
                            >
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors ${!isPrivate ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/5 text-zinc-600'}`}>
                                    <Globe size={20} />
                                </div>
                                <div className="text-left py-0.5">
                                    <div className="text-xs font-black uppercase tracking-widest mb-1">Public Frequency</div>
                                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Open link for all agents</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsPrivate(true)}
                                className={`flex items-start gap-4 p-5 rounded-[24px] border transition-all duration-300 ${isPrivate ? 'bg-indigo-500/10 border-indigo-500/30 text-white shadow-[0_0_20px_rgba(99,102,241,0.05)]' : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300'}`}
                            >
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors ${isPrivate ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/5 text-zinc-600'}`}>
                                    <Lock size={20} />
                                </div>
                                <div className="text-left py-0.5">
                                    <div className="text-xs font-black uppercase tracking-widest mb-1">Encrypted Line</div>
                                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Invitation only access</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="premium-button premium-button-primary w-full py-5 text-sm uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                        >
                            {loading ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={18} />}
                            {loading ? 'Processing...' : 'Deploy Hub'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
