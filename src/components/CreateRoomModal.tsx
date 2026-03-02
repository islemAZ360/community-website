import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { X, Lock, Globe, Loader2, Hash } from 'lucide-react';
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
            if (!name.trim()) throw new Error("Room name is required");

            const roomData = {
                name: name.trim(),
                isPrivate,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
                creatorNickname: userData?.nickname || 'Unknown',
                participants: isPrivate ? [user.uid] : [], // Empty if public, all can join
                admins: [user.uid] // Creator is Room Admin by default
            };

            const roomRef = await addDoc(collection(db, 'rooms'), roomData);

            onClose();
            setName('');
            setIsPrivate(false);

            navigate(`/room/${roomRef.id}`);

        } catch (err: any) {
            console.error("Room creation error:", err);
            setError(err.message || "Failed to create room");
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

                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Hash className="text-indigo-400" />
                    Create New Room
                </h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Room Name</label>
                        <input
                            type="text"
                            required
                            maxLength={30}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                            placeholder="e.g. React Developers"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-zinc-400">Privacy Setting</label>

                        <button
                            type="button"
                            onClick={() => setIsPrivate(false)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${!isPrivate ? 'bg-indigo-500/10 border-indigo-500/50 text-white' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-300'}`}
                        >
                            <Globe className={!isPrivate ? 'text-indigo-400' : 'text-zinc-500'} />
                            <div className="text-left">
                                <div className="font-medium">Public Room</div>
                                <div className="text-xs opacity-70">Anyone can find and join this room</div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsPrivate(true)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${isPrivate ? 'bg-indigo-500/10 border-indigo-500/50 text-white' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-300'}`}
                        >
                            <Lock className={isPrivate ? 'text-indigo-400' : 'text-zinc-500'} />
                            <div className="text-left">
                                <div className="font-medium">Private Room</div>
                                <div className="text-xs opacity-70">Only invited members can join</div>
                            </div>
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-8"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        Create Room
                    </button>
                </form>
            </div>
        </div>
    );
}
