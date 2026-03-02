import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayRemove, collection, addDoc, serverTimestamp, query, getDocs } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { X, Search, Shield, UserX, Send, Loader2 } from 'lucide-react';

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
                // Fetch All Users for search / member names
                const usersSnap = await getDocs(query(collection(db, 'users')));
                const usersMap = new Map();
                const usersList: any[] = [];

                usersSnap.forEach(d => {
                    const data = d.data();
                    usersMap.set(d.id, data);
                    usersList.push({ uid: d.id, ...data });
                });

                setAllUsers(usersList);

                // Map current participants
                const currentMembers = (roomData.participants || []).map((uid: string) => ({
                    uid,
                    nickname: usersMap.get(uid)?.nickname || 'Unknown User',
                    isAdmin: roomData.admins?.includes(uid)
                }));

                // Sort admins first
                currentMembers.sort((a: any, b: any) => (a.isAdmin === b.isAdmin) ? 0 : a.isAdmin ? -1 : 1);

                setMembers(currentMembers);
            } catch (err: any) {
                console.error("Error fetching members:", err);
                setError("Failed to load members");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, roomId, roomData]);

    if (!isOpen) return null;

    const handleKickUser = async (targetUid: string) => {
        if (!isAdmin || !roomId) return;
        if (!window.confirm("Are you sure you want to kick this user?")) return;

        setActionLoading(targetUid);
        try {
            await updateDoc(doc(db, 'rooms', roomId), {
                participants: arrayRemove(targetUid),
                admins: arrayRemove(targetUid) // Optional: also remove from admins
            });
            setMembers(prev => prev.filter(m => m.uid !== targetUid));
        } catch (err: any) {
            console.error("Kick error:", err);
            setError("Failed to kick user.");
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
            // Show some success feedback
            alert(`Invited ${targetUser.nickname}!`);
        } catch (err: any) {
            console.error("Invite error:", err);
            alert("Failed to send invitation.");
        } finally {
            setActionLoading(null);
        }
    };

    const searchResults = searchQuery.trim()
        ? allUsers.filter(u =>
            u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) &&
            u.uid !== user?.uid &&
            !roomData.participants?.includes(u.uid)
        )
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6">Room Members</h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {/* Member List */}
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                            Current Members ({members.length})
                        </h3>
                        {loading ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-zinc-500" /></div>
                        ) : (
                            <div className="space-y-2">
                                {members.map((m) => (
                                    <div key={m.uid} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 flexitems-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center">
                                                <span className="w-full text-center">{m.nickname.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-white">{m.nickname}</span>
                                                    {m.isAdmin && <Shield size={14} className="text-amber-400" />}
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && m.uid !== user?.uid && (
                                            <button
                                                onClick={() => handleKickUser(m.uid)}
                                                disabled={actionLoading === m.uid}
                                                className="text-zinc-500 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-lg"
                                                title="Kick User"
                                            >
                                                {actionLoading === m.uid ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Invite Section (Only for Private Rooms or Admins) */}
                    {(roomData.isPrivate || isAdmin) && (
                        <div className="border-t border-white/10 pt-6">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                                Invite Users
                            </h3>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by nickname to invite..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            {searchQuery.trim() && (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {searchResults.length === 0 ? (
                                        <div className="text-sm text-zinc-500 text-center py-2">No users found</div>
                                    ) : (
                                        searchResults.map(u => (
                                            <div key={u.uid} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                                                <span className="text-sm text-zinc-300 font-medium">{u.nickname}</span>
                                                <button
                                                    onClick={() => handleInviteUser(u)}
                                                    disabled={actionLoading === `invite_${u.uid}`}
                                                    className="flex items-center gap-2 text-xs bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-3 py-1.5 rounded-lg transition-all"
                                                >
                                                    {actionLoading === `invite_${u.uid}` ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                    Invite
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
