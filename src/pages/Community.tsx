import { useEffect, useState } from 'react';
import { db, rtdb } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { Users, Search, MessageSquarePlus, Hash, ArrowRight, User as UserIcon, Activity } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
    uid: string;
    nickname: string;
    isOnline?: boolean;
    lastSeen?: Date | null;
}

export function Community() {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [publicRooms, setPublicRooms] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'rooms'>('users');

    const [searchTerm, setSearchTerm] = useState('');
    const [onlineCount, setOnlineCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

    // Track user's own online presence
    useEffect(() => {
        if (!user) return;

        const userStatusRef = ref(rtdb, `/status/${user.uid}`);

        const isOfflineForDatabase = {
            state: 'offline',
            last_changed: new Date().getTime(),
        };

        const isOnlineForDatabase = {
            state: 'online',
            last_changed: new Date().getTime(),
        };

        const connectedRef = ref(rtdb, '.info/connected');
        const unsubscribe = onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                onDisconnect(userStatusRef).set(isOfflineForDatabase).then(() => {
                    set(userStatusRef, isOnlineForDatabase);
                });
            }
        });

        return () => {
            set(userStatusRef, isOfflineForDatabase);
            unsubscribe();
        };
    }, [user]);

    // Fetch all users and listen to active presences
    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const q = query(collection(db, 'users'), orderBy('nickname'));
                const snap = await getDocs(q);
                let fetchedUsers: UserProfile[] = [];
                snap.forEach(doc => {
                    fetchedUsers.push({ uid: doc.id, nickname: doc.data().nickname });
                });

                // Now attach listeners to RTDB for statuses
                const statusesRef = ref(rtdb, '/status');
                onValue(statusesRef, (snapshot) => {
                    const statuses = snapshot.val() || {};
                    let currentOnline = 0;

                    const mappedUsers = fetchedUsers.map(u => {
                        const status = statuses[u.uid];
                        const isOnline = status?.state === 'online';
                        if (isOnline) currentOnline++;

                        return {
                            ...u,
                            isOnline,
                            lastSeen: status?.last_changed ? new Date(status.last_changed) : null
                        };
                    });

                    // Sort so online users appear first
                    mappedUsers.sort((a, b) => {
                        if (a.isOnline && !b.isOnline) return -1;
                        if (!a.isOnline && b.isOnline) return 1;
                        return 0;
                    });

                    setUsers(mappedUsers);
                    setOnlineCount(currentOnline);
                    setLoading(false);
                });

            } catch (err) {
                console.error("Error fetching community users:", err);
                setLoading(false);
            }
        };

        const fetchPublicRooms = async () => {
            try {
                const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
                const snap = await getDocs(q);
                let rooms: any[] = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    if (!data.isPrivate) {
                        rooms.push({ id: doc.id, ...data });
                    }
                });
                setPublicRooms(rooms);
            } catch (err) {
                console.error("Error fetching rooms:", err);
            }
        };

        fetchAllUsers();
        fetchPublicRooms();
    }, []);

    const filteredUsers = users.filter(u =>
        u.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <header className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-emerald-500/10 rounded-[24px] flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <Users size={40} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter holographic-text">Community <span className="text-white/40 font-light">Hub</span></h1>
                        <p className="text-sm font-bold text-zinc-500 mt-1 flex items-center gap-2.5 uppercase tracking-widest">
                            <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            {onlineCount} {onlineCount === 1 ? 'Agent' : 'Agents'} Active
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Find explorers..."
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.05] transition-all"
                        />
                    </div>
                    {user && (
                        <button
                            onClick={() => setIsCreateRoomOpen(true)}
                            className="premium-button premium-button-primary text-[11px] uppercase tracking-[0.2em] w-full sm:w-auto px-8"
                        >
                            <MessageSquarePlus size={18} />
                            Deploy Room
                        </button>
                    )}
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-white/[0.02] border border-white/[0.05] rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'users' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                >
                    Explorers
                </button>
                <button
                    onClick={() => setActiveTab('rooms')}
                    className={`px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'rooms' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                >
                    Public Hubs
                </button>
            </div>

            {/* Content Display */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-32 bg-white/5 animate-pulse rounded-[24px] border border-white/5" />
                        ))}
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map(u => (
                            <div key={u.uid} className="glass-panel p-6 rounded-[28px] group hover:bg-white/[0.05] transition-all duration-300 border-white/[0.03]">
                                <div className="flex items-center gap-5">
                                    <div className="relative">
                                        <div className="h-16 w-16 rounded-[20px] bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center text-xl font-black text-white group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                            {u.nickname.charAt(0).toUpperCase()}
                                        </div>
                                        {u.isOnline && (
                                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-[#070708] rounded-full flex items-center justify-center">
                                                <div className="h-3 w-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white truncate max-w-[140px] uppercase tracking-tight">{u.nickname}</h3>
                                            {u.uid === user?.uid && (
                                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg uppercase tracking-widest font-black border border-emerald-500/20">Self</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                            {u.isOnline ? (
                                                <span className="text-emerald-400 flex items-center gap-1.5 italic">
                                                    <Activity size={12} /> Active Now
                                                </span>
                                            ) : (
                                                <span className="text-zinc-600">
                                                    {u.lastSeen ? `Seen ${formatDistanceToNow(u.lastSeen, { addSuffix: true })}` : 'Archived'}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredUsers.length === 0 && (
                            <div className="col-span-full py-20 text-center glass-panel rounded-[32px] border-dashed">
                                <Search className="mx-auto text-zinc-700 mb-4" size={40} />
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No explorers match your frequency</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {publicRooms.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(room => (
                            <div key={room.id} className="glass-panel p-8 rounded-[32px] group hover:bg-white/[0.05] transition-all duration-500 flex flex-col h-full border-white/[0.03] hover:translate-y-[-4px]">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <Hash size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{room.name}</h3>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <UserIcon size={12} className="text-zinc-600" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                                    Host: <span className="text-zinc-300">{room.creatorNickname}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.02]">
                                        {room.createdAt?.toDate ? format(room.createdAt.toDate(), 'MM.DD.YY') : 'RT'}
                                    </span>
                                </div>

                                <div className="mt-auto pt-8 border-t border-white/[0.03] flex items-center justify-between">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#070708] bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                {i}
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full border-2 border-[#070708] bg-emerald-500/10 flex items-center justify-center text-[8px] font-black text-emerald-400">
                                            +12
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/room/${room.id}`)}
                                        className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-400 hover:text-white transition-all group/btn bg-emerald-500/5 px-6 py-3 rounded-xl border border-emerald-500/10 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20"
                                    >
                                        Establish Connection <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {publicRooms.length === 0 && (
                            <div className="col-span-full py-20 text-center glass-panel rounded-[32px] border-dashed">
                                <Hash className="mx-auto text-zinc-700 mb-4" size={40} />
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Zero frequencies detected</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateRoomModal
                isOpen={isCreateRoomOpen}
                onClose={() => setIsCreateRoomOpen(false)}
            />
        </div>
    );
}
