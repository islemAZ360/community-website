import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayRemove, collection, addDoc, serverTimestamp, query, getDocs } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { X, Search, Shield, UserX, Send, Loader2, Users, Crown, Activity } from 'lucide-react';

interface RoomMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    roomData: any;
}

export function RoomMembersModal({ isOpen, onClose, roomId, roomData }: RoomMembersModalProps) {
    const { user, userData } = useAuthStore();
    const [members, setMembers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState('');

    const isAdmin = roomData?.admins?.includes(user?.uid);

    useEffect(() => {
        if (!isOpen || !roomId || !roomData) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const usersSnap = await getDocs(query(collection(db, 'users')));
                const usersMap = new Map();
                const usersList: any[] = [];

                usersSnap.forEach(d => {
                    const data = d.data();
                    usersMap.set(d.id, data);
                    usersList.push({ uid: d.id, ...data });
                });

                setAllUsers(usersList);

                const currentMembers = (roomData.participants || []).map((uid: string) => ({
                    uid,
                    nickname: usersMap.get(uid)?.nickname || 'Unknown Agent',
                    isAdmin: roomData.admins?.includes(uid)
                }));

                currentMembers.sort((a: any, b: any) => (a.isAdmin === b.isAdmin) ? 0 : a.isAdmin ? -1 : 1);

                setMembers(currentMembers);
            } catch (err: any) {
                console.error("Error fetching members:", err);
                setError("Protocol interruption: Payload failed");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, roomId, roomData]);

    if (!isOpen) return null;

    const handleKickUser = async (targetUid: string) => {
        if (!isAdmin || !roomId) return;
        if (!window.confirm("ARE YOU SURE YOU WANT TO TERMINATE THIS ACCESS?")) return;

        setActionLoading(targetUid);
        try {
            await updateDoc(doc(db, 'rooms', roomId), {
                participants: arrayRemove(targetUid),
                admins: arrayRemove(targetUid)
            });
            setMembers(prev => prev.filter(m => m.uid !== targetUid));
        } catch (err: any) {
            console.error("Kick error:", err);
            setError("Termination failed. Command rejected.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleInviteUser = async (targetUser: any) => {
        if (!user || !roomId) return;
        setActionLoading(`invite_${targetUser.uid}`);

        try {
            await addDoc(collection(db, 'invitations'), {
                roomId,
                roomName: roomData.name,
                fromId: user.uid,
                fromNickname: userData?.nickname || 'Unknown',
                toId: targetUser.uid,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            setSearchQuery('');
        } catch (err: any) {
            console.error("Invite error:", err);
            setError("Invitation signal lost.");
        } finally {
            setActionLoading(null);
        }
    };

    const searchResults = searchQuery.trim()
        ? allUsers.filter(u =>
            u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) &&
            u.uid !== user?.uid &&
            !roomData.participants?.includes(u.uid)
        ).slice(0, 5)
        : [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-panel w-full max-w-xl rounded-[40px] p-0 relative animate-in fade-in zoom-in duration-500 border-white/[0.05] shadow-[0_0_100px_rgba(99,102,241,0.1)] overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-8 md:p-10 border-b border-white/[0.03] flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 text-white">
                            <Users size={24} className="text-indigo-400" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter holographic-text">Manifest</h2>
                        </div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 inline-flex items-center gap-2">
                            <Activity size={12} className="text-emerald-500/50" /> {members.length} Registered Agents
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-600 hover:text-white transition-all p-2 rounded-xl hover:bg-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mx-8 mt-6 bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-10 custom-scrollbar">
                    {/* Member List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="animate-spin text-indigo-400" size={32} />
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scanning Network...</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {members.map((m) => (
                                    <div key={m.uid} className="flex items-center justify-between p-4 rounded-[24px] bg-white/[0.02] border border-white/[0.03] group hover:bg-white/[0.04] transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 flex items-center justify-center rounded-[18px] bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-white/5 text-sm font-black text-white shadow-inner">
                                                {m.nickname.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-white uppercase tracking-tight text-sm">{m.nickname}</span>
                                                    {m.isAdmin && (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/10 text-[9px] font-black uppercase tracking-widest">
                                                            <Crown size={10} /> Root
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && m.uid !== user?.uid && (
                                            <button
                                                onClick={() => handleKickUser(m.uid)}
                                                disabled={actionLoading === m.uid}
                                                className="text-zinc-700 hover:text-red-500 transition-all p-3 hover:bg-red-500/5 rounded-xl border border-transparent hover:border-red-500/10"
                                                title="Terminate Access"
                                            >
                                                {actionLoading === m.uid ? <Loader2 size={18} className="animate-spin" /> : <UserX size={18} />}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Invite Section */}
                    {(roomData.isPrivate || isAdmin) && (
                        <div className="border-t border-white/[0.03] pt-10 space-y-6">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Enlist New Agents</label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="SEARCH_QUERY_INIT"
                                        className="w-full bg-white/[0.02] border border-white/5 rounded-[20px] py-4 pl-12 pr-6 text-sm font-medium text-white placeholder:text-zinc-800 focus:outline-none focus:border-indigo-500/30 focus:bg-white/[0.04] transition-all"
                                    />
                                </div>
                            </div>

                            {searchQuery.trim() && (
                                <div className="grid gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {searchResults.length === 0 ? (
                                        <div className="text-[10px] font-black text-zinc-700 text-center py-6 uppercase tracking-widest italic border border-dashed border-zinc-800 rounded-2xl">
                                            No matching frequencies detected
                                        </div>
                                    ) : (
                                        searchResults.map(u => (
                                            <div key={u.uid} className="flex items-center justify-between p-4 rounded-[22px] bg-white/[0.01] border border-white/[0.02] hover:bg-indigo-500/5 hover:border-indigo-500/10 transition-all group/item">
                                                <span className="text-xs text-zinc-300 font-bold uppercase tracking-tight">{u.nickname}</span>
                                                <button
                                                    onClick={() => handleInviteUser(u)}
                                                    disabled={actionLoading === `invite_${u.uid}`}
                                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white px-5 py-2.5 rounded-xl transition-all border border-indigo-500/10 group-hover/item:shadow-lg group-hover/item:shadow-indigo-500/20"
                                                >
                                                    {actionLoading === `invite_${u.uid}` ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                    Send Intel
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
