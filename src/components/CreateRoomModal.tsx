import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="glass w-full max-w-md rounded-[2.5rem] p-10 md:p-12 relative animate-in fade-in zoom-in duration-500 border-white/[0.05] shadow-[0_0_100px_rgba(19,236,164,0.15)] overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all size-10 rounded-xl hover:bg-white/5 flex items-center justify-center"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="text-center space-y-3 mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] border border-primary/20 mb-2">
                        <span className="material-symbols-outlined text-sm">terminal</span>
                        System Command
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                        Initialize <span className="text-primary">Hub</span>
                    </h2>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-5 py-3 rounded-2xl mb-8 text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] ml-1">Room Designation</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-colors text-xl">tag</span>
                            <input
                                type="text"
                                required
                                maxLength={30}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-background-dark/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-white placeholder:text-slate-800 focus:outline-none focus:border-primary/30 transition-all outline-none"
                                placeholder="E.G. NEURAL_NETWORK"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] ml-1">Security Protocol</label>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPrivate(false)}
                                className={`flex items-start gap-4 p-5 rounded-[1.5rem] border transition-all duration-300 ${!isPrivate ? 'bg-primary/10 border-primary/30 text-white shadow-[0_0_20px_rgba(19,236,164,0.05)]' : 'bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/[0.05] hover:text-slate-300'}`}
                            >
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors ${!isPrivate ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-white/5 text-slate-600'}`}>
                                    <span className="material-symbols-outlined">public</span>
                                </div>
                                <div className="text-left py-0.5">
                                    <div className="text-xs font-bold uppercase tracking-widest mb-1">Public Frequency</div>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Open link for all agents</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsPrivate(true)}
                                className={`flex items-start gap-4 p-5 rounded-[1.5rem] border transition-all duration-300 ${isPrivate ? 'bg-primary/10 border-primary/30 text-white shadow-[0_0_20px_rgba(19,236,164,0.05)]' : 'bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/[0.05] hover:text-zinc-300'}`}
                            >
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors ${isPrivate ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-white/5 text-slate-600'}`}>
                                    <span className="material-symbols-outlined">encrypted</span>
                                </div>
                                <div className="text-left py-0.5">
                                    <div className="text-xs font-bold uppercase tracking-widest mb-1">Encrypted Line</div>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Invitation only access</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-white text-background-dark font-black rounded-2xl hover:bg-primary transition-all shadow-[0_0_30px_rgba(19,236,164,0.15)] uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-background-dark border-t-transparent animate-spin rounded-full"></div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">bolt</span>
                                    DEPLOY HUB
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
