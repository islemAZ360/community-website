import { useEffect, useState } from 'react';
import { db, rtdb } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { Users, Search, MessageSquarePlus, Circle, Hash, ArrowRight } from 'lucide-react';
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
        <div className="max-w-5xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 glass-panel p-6 rounded-2xl">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                        <Users size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Community Hub</h1>
                        <p className="text-zinc-400 mt-1 flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {onlineCount} {onlineCount === 1 ? 'user' : 'users'} online right now
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-auto flex gap-4">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search nicknames..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>
                    {user && (
                        <button
                            onClick={() => setIsCreateRoomOpen(true)}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                        >
                            <MessageSquarePlus size={18} />
                            <span>New Room</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 font-medium rounded-lg transition-all ${activeTab === 'users' ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                >
                    Online Users
                </button>
                <button
                    onClick={() => setActiveTab('rooms')}
                    className={`px-4 py-2 font-medium rounded-lg transition-all ${activeTab === 'rooms' ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                >
                    Public Rooms
                </button>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
                    ))}
                </div>
            ) : activeTab === 'users' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map(u => (
                        <div key={u.uid} className="glass-panel p-4 rounded-2xl flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-lg font-bold text-indigo-300">
                                    {u.nickname.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-white">{u.nickname}</h3>
                                        {u.uid === user?.uid && (
                                            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">You</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                        {u.isOnline ? (
                                            <>
                                                <Circle size={8} className="fill-emerald-500 text-emerald-500" />
                                                <span className="text-emerald-400 font-medium">Online</span>
                                            </>
                                        ) : (
                                            <>
                                                <Circle size={8} className="text-zinc-600" />
                                                <span>Offline {u.lastSeen ? `• ${formatDistanceToNow(u.lastSeen, { addSuffix: true })}` : ''}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredUsers.length === 0 && (
                        <div className="col-span-full py-12 text-center text-zinc-500">
                            No users found matching "{searchTerm}"
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {publicRooms.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(room => (
                        <div key={room.id} className="glass-panel p-5 rounded-2xl group hover:bg-white/[0.04] transition-all flex flex-col h-full border border-white/5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                        <Hash size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">{room.name}</h3>
                                        <p className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md inline-block mt-1">
                                            Created by {room.creatorNickname}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="text-xs text-zinc-500">
                                    {room.createdAt?.toDate ? format(room.createdAt.toDate(), 'MMM dd, yyyy') : 'Recent'}
                                </span>

                                <button
                                    onClick={() => navigate(`/room/${room.id}`)}
                                    className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-4 py-2 rounded-xl hover:bg-indigo-500/20"
                                >
                                    Join Room <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {publicRooms.length === 0 && (
                        <div className="col-span-full py-12 text-center text-zinc-500">
                            No public rooms found. Create one to get started!
                        </div>
                    )}
                </div>
            )}

            <CreateRoomModal
                isOpen={isCreateRoomOpen}
                onClose={() => setIsCreateRoomOpen(false)}
            />
        </div>
    );
}
