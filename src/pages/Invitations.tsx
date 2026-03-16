import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { Mail, Check, X, Loader2, UserPlus, Hash, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '../components/Reveal';

export function Invitations() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'invitations'),
            where('toId', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            list.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

            setInvitations(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAccept = async (invitation: any) => {
        if (!user) return;
        setActionLoading(`accept_${invitation.id}`);
        try {
            const roomRef = doc(db, 'rooms', invitation.roomId);
            await updateDoc(roomRef, {
                participants: arrayUnion(user.uid)
            });

            await updateDoc(doc(db, 'invitations', invitation.id), {
                status: 'accepted'
            });

            navigate(`/room/${invitation.roomId}`);
        } catch (err) {
            console.error("Error accepting invitation:", err);
            alert("Protocol failure: Acceptance rejected.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (invitationId: string) => {
        setActionLoading(`decline_${invitationId}`);
        try {
            await deleteDoc(doc(db, 'invitations', invitationId));
        } catch (err) {
            console.error("Error declining invitation:", err);
            alert("Protocol failure: Termination rejected.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Decrypting Invites...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-700">
            <Reveal amount={0.25}>
            <header className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                        <Mail size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter holographic-text">Signal <span className="text-white/40 font-light">Inbox</span></h1>
                        <p className="text-sm font-bold text-zinc-500 mt-1 uppercase tracking-widest">
                            {invitations.length} pending authentication {invitations.length === 1 ? 'request' : 'requests'}.
                        </p>
                    </div>
                </div>
            </header>

            {invitations.length === 0 ? (
                <div className="glass-panel p-20 rounded-[40px] text-center flex flex-col items-center justify-center space-y-8 border-dashed border-zinc-800">
                    <UserPlus size={64} className="text-zinc-800" />
                    <div className="space-y-2">
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Frequencies Clear</p>
                        <p className="text-zinc-700 font-medium text-sm">No external nodes are requesting connection.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-5">
                    {invitations.map(inv => (
                        <div key={inv.id} className="glass-panel p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-white/[0.04] transition-all duration-500 border-white/[0.03]">
                            <div className="flex items-center gap-6">
                                <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                                    <Hash size={24} />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="font-black text-lg text-white uppercase tracking-tight">
                                        <span className="text-emerald-400">{inv.fromNickname}</span> <span className="text-white/40 font-light lowercase">enlisted you to</span> #{inv.roomName}
                                    </h3>
                                    <div className="flex items-center gap-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                        <Sparkles size={12} className="text-indigo-500/50" />
                                        {inv.createdAt?.toDate ? formatDistanceToNow(inv.createdAt.toDate(), { addSuffix: true }) : 'Recent Sync'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button
                                    onClick={() => handleDecline(inv.id)}
                                    disabled={!!actionLoading}
                                    className="p-4 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all disabled:opacity-50 flex-1 md:flex-none flex items-center justify-center"
                                    title="Decline Signal"
                                >
                                    {actionLoading === `decline_${inv.id}` ? <Loader2 size={24} className="animate-spin" /> : <X size={24} />}
                                </button>
                                <button
                                    onClick={() => handleAccept(inv)}
                                    disabled={!!actionLoading}
                                    className="premium-button premium-button-primary flex-1 md:flex-none px-8 py-3 text-[10px] uppercase tracking-[0.2em]"
                                >
                                    {actionLoading === `accept_${inv.id}` ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Establish Link
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </Reveal>
        </div>
    );
}
