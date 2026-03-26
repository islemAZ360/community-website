import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { Mail, Check, X, Loader2, UserPlus, Hash, Sparkles, Radio } from 'lucide-react';
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
        <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center gap-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="relative size-20 rounded-2xl glass flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
            </div>
            <div className="flex flex-col items-center gap-2">
                <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-sm animate-pulse">Decrypting Signals...</p>
                <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Scanning Secure Frequencies</p>
            </div>
        </div>
    );

    return (
        <main className="flex-1 overflow-y-auto py-24 px-6 lg:px-20 animate-in fade-in duration-700 relative">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none opacity-50"></div>

            <div className="max-w-5xl mx-auto space-y-12 relative z-10">
                <Reveal amount={0.25}>
                    <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-12 border-b border-white/5 pb-8">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-2xl group-hover:bg-indigo-500/30 transition-colors duration-500"></div>
                                <div className="h-16 w-16 bg-gradient-to-br from-indigo-500/20 to-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/30 shadow-inner relative z-10 backdrop-blur-md">
                                    <Mail size={32} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-4">
                                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-white drop-shadow-lg">
                                        Signal <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/60 to-white/20">Inbox</span>
                                    </h1>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex h-2 w-2">
                                        {invitations.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>}
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${invitations.length > 0 ? 'bg-indigo-500' : 'bg-white/20'}`}></span>
                                    </div>
                                    <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">
                                        {invitations.length} pending authentication {invitations.length === 1 ? 'request' : 'requests'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </header>

                    {invitations.length === 0 ? (
                        <div className="glass p-20 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-8 border border-dashed border-white/10 relative overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0,transparent_100%)]"></div>

                            <div className="relative">
                                <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full"></div>
                                <div className="size-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 relative z-10">
                                    <Radio size={40} className="text-white/20" />
                                </div>
                            </div>

                            <div className="space-y-3 relative z-10">
                                <p className="text-white/60 font-black uppercase tracking-[0.3em] text-sm italic">Frequencies Clear</p>
                                <p className="text-white/30 font-medium text-xs tracking-widest uppercase">No external nodes are requesting connection.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {invitations.map((inv, idx) => (
                                <Reveal key={inv.id} delay={idx * 0.1} variant="fadeUp" amount={0.2}>
                                    <div className="glass p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-white/[0.04] transition-all duration-500 border border-white/5 hover:border-indigo-500/30 hover:shadow-[0_10px_40px_-10px_rgba(99,102,241,0.15)] relative overflow-hidden">

                                        {/* Accent line on hover */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                        <div className="flex items-center gap-6 w-full md:w-auto">
                                            <div className="h-14 w-14 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500 shadow-inner flex-shrink-0">
                                                <Hash size={24} className="opacity-80 group-hover:opacity-100" />
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="font-black text-lg md:text-xl text-white uppercase tracking-tight flex flex-wrap items-center gap-2">
                                                    <span className="text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">{inv.fromNickname}</span>
                                                    <span className="text-white/30 font-bold text-sm tracking-widest px-2">enlisted you to</span>
                                                    <span className="text-white italic">{inv.roomName}</span>
                                                </h3>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                                                    <Sparkles size={12} className="text-indigo-400/70" />
                                                    {inv.createdAt?.toDate ? formatDistanceToNow(inv.createdAt.toDate(), { addSuffix: true }) : 'Recent Sync'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 pt-6 md:pt-0 border-t border-white/5 md:border-none">
                                            <button
                                                onClick={() => handleDecline(inv.id)}
                                                disabled={!!actionLoading}
                                                className="h-12 w-full md:w-16 flex flex-1 md:flex-none items-center justify-center text-white/40 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-xl border border-white/5 transition-all duration-300 disabled:opacity-50 group/btn"
                                                title="Decline Signal"
                                            >
                                                {actionLoading === `decline_${inv.id}` ? (
                                                    <Loader2 size={20} className="animate-spin text-rose-500" />
                                                ) : (
                                                    <X size={20} className="group-hover/btn:scale-110 transition-transform" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => handleAccept(inv)}
                                                disabled={!!actionLoading}
                                                className="h-12 px-8 flex flex-[2] md:flex-none items-center justify-center gap-3 bg-indigo-500/10 text-indigo-400 hover:text-white hover:bg-indigo-500 border border-indigo-500/30 hover:border-indigo-400 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] disabled:opacity-50 group/accept hover:-translate-y-0.5"
                                            >
                                                {actionLoading === `accept_${inv.id}` ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Check size={18} className="group-hover/accept:scale-110 transition-transform" />
                                                )}
                                                Establish Link
                                            </button>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    )}
                </Reveal>
            </div>
        </main>
    );
}