import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { Mail, Check, X, Loader2, UserPlus, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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
            // We sort manually since Firestore needs composite index for orderBy with where(==)
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
            // Join the room
            const roomRef = doc(db, 'rooms', invitation.roomId);
            await updateDoc(roomRef, {
                participants: arrayUnion(user.uid)
            });

            // Mark invitation as accepted
            await updateDoc(doc(db, 'invitations', invitation.id), {
                status: 'accepted'
            });

            // Navigate to room
            navigate(`/room/${invitation.roomId}`);
        } catch (err) {
            console.error("Error accepting invitation:", err);
            alert("Failed to accept invitation.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (invitationId: string) => {
        setActionLoading(`decline_${invitationId}`);
        try {
            // Either delete it or mark as declined. Deleting preserves space.
            await deleteDoc(doc(db, 'invitations', invitationId));
        } catch (err) {
            console.error("Error declining invitation:", err);
            alert("Failed to decline invitation.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-500 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
            <header className="flex items-center gap-4 glass-panel p-6 rounded-2xl">
                <div className="h-16 w-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                    <Mail size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Room Invitations</h1>
                    <p className="text-zinc-400 mt-1">
                        You have {invitations.length} pending {invitations.length === 1 ? 'invitation' : 'invitations'}.
                    </p>
                </div>
            </header>

            {invitations.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center justify-center space-y-4 border border-white/5 border-dashed">
                    <UserPlus size={48} className="text-zinc-600" />
                    <p className="text-zinc-400">You don't have any pending invitations.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {invitations.map(inv => (
                        <div key={inv.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between group border border-white/5 hover:bg-white/[0.04] transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                    <Hash size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">
                                        <span className="text-indigo-400">{inv.fromNickname}</span> invited you to <span className="text-white">#{inv.roomName}</span>
                                    </h3>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        {inv.createdAt?.toDate ? formatDistanceToNow(inv.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDecline(inv.id)}
                                    disabled={!!actionLoading}
                                    className="p-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
                                    title="Decline"
                                >
                                    {actionLoading === `decline_${inv.id}` ? <Loader2 size={20} className="animate-spin" /> : <X size={20} />}
                                </button>
                                <button
                                    onClick={() => handleAccept(inv)}
                                    disabled={!!actionLoading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                >
                                    {actionLoading === `accept_${inv.id}` ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                    Accept
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
