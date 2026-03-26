import { useEffect, useState } from 'react';
import { db, rtdb } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { collection, query, getDocs, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { formatDistanceToNow, format } from 'date-fns';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Reveal } from '../components/Reveal';

interface UserProfile {
    uid: string;
    nickname: string;
    profilePicture?: string;
    isOnline?: boolean;
    lastSeen?: Date | null;
}

export function Community() {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [publicRooms, setPublicRooms] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'rooms'>('users');

    const [searchTerm, setSearchTerm] = useState('');
    const [onlineCount, setOnlineCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

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
                    const data = doc.data();
                    fetchedUsers.push({
                        uid: doc.id,
                        nickname: data.nickname,
                        profilePicture: data.profilePicture
                    });
                });

                // Attach listeners to RTDB for statuses
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

        const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (snapshot) => {
            if (snapshot.exists()) {
                setIsLocked(snapshot.data().isLocked || false);
            }
        });

        fetchAllUsers();
        fetchPublicRooms();

        return () => {
            unsubConfig();
        };
    }, []);

    const filteredUsers = users.filter(u =>
        u.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredRooms = publicRooms.filter(r =>
        r.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="flex-1 overflow-y-auto aurora-bg py-24 px-6 lg:px-20 animate-in fade-in duration-700 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <Reveal amount={0.25}>
                    <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between mb-12 gap-8">
                        <div className="flex flex-col gap-4 w-full xl:w-auto">
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(19,236,164,0.15)] backdrop-blur-md">
                                    <span className="material-symbols-outlined text-3xl">sensors</span>
                                </div>
                                <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 uppercase italic tracking-tighter leading-none">
                                    {t('community.title')}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3 glass border border-white/5 px-5 py-2.5 rounded-2xl w-fit shadow-lg">
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute size-3 bg-primary rounded-full animate-ping opacity-75"></div>
                                    <div className="relative size-2 bg-primary rounded-full shadow-[0_0_10px_rgba(19,236,164,0.8)]"></div>
                                </div>
                                <span className="text-[11px] font-black tracking-[0.25em] uppercase text-primary/90">
                                    {t('community.activeAgents', { count: onlineCount })}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                            <div className="relative w-full sm:w-80 group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg group-focus-within:text-primary transition-colors duration-300">search</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl h-14 pl-12 pr-6 rtl:pr-12 rtl:pl-6 text-sm font-bold text-white placeholder:text-white/30 focus:outline-none transition-all duration-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-white/5 shadow-inner"
                                    placeholder={t('community.searchPlaceholder')}
                                />
                            </div>

                            {isLocked ? (
                                <div className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 h-14 glass text-rose-500 rounded-2xl font-bold border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                                    <span className="material-symbols-outlined text-xl animate-pulse">shield_alert</span>
                                    <span className="text-xs uppercase font-black tracking-widest">{t('community.meshLocked')}</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreateRoomOpen(true)}
                                    className="btn-premium flex items-center justify-center gap-3 h-14 px-8 w-full sm:w-auto shadow-2xl hover:scale-105 transition-transform duration-300"
                                >
                                    <span className="material-symbols-outlined text-xl">add_circle</span>
                                    <span className="text-sm tracking-wider">{t('community.deployRoom')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </Reveal>

                {/* Modern Tabs */}
                <Reveal delay={0.06} amount={0.18}>
                    <div className="flex p-1.5 glass rounded-2xl w-fit mb-12 border border-white/5 shadow-lg backdrop-blur-xl">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-8 py-3 rounded-xl text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap ${activeTab === 'users' ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(19,236,164,0.1)]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-lg">explore</span>
                            {t('community.tabs.explorers')}
                        </button>

                        <button
                            onClick={() => setActiveTab('rooms')}
                            className={`px-8 py-3 rounded-xl text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap ${activeTab === 'rooms' ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(19,236,164,0.1)]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-lg">hub</span>
                            {t('community.tabs.hubs')}
                        </button>
                    </div>
                </Reveal>

                {/* Content Area */}
                <Reveal delay={0.1} amount={0.12}>
                    {loading ? (
                        // Improved Skeleton Loading
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                <div key={i} className="glass rounded-[1.5rem] p-3 aspect-[4/5] flex flex-col border border-white/5">
                                    <div className="w-full flex-1 bg-white/5 rounded-xl mb-4 animate-pulse"></div>
                                    <div className="h-4 bg-white/10 rounded-md w-3/4 mb-2 animate-pulse"></div>
                                    <div className="h-3 bg-white/5 rounded-md w-1/2 animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'users' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredUsers.map((u, idx) => (
                                <Reveal key={u.uid} delay={idx * 0.03} variant="fadeUp" amount={0.1}>
                                    <div className="glass group p-3 rounded-[1.5rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] flex flex-col cursor-pointer border border-white/5 hover:border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
                                        <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-black/40">
                                            {u.profilePicture ? (
                                                <>
                                                    <img className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" src={u.profilePicture} alt={u.nickname} />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                </>
                                            ) : (
                                                <div className="size-full flex items-center justify-center text-white/10 group-hover:text-primary/50 transition-colors duration-500">
                                                    <span className="material-symbols-outlined text-6xl">person</span>
                                                </div>
                                            )}

                                            {/* Status Badge */}
                                            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`size-2 rounded-full ${u.isOnline ? 'bg-primary shadow-[0_0_8px_rgba(19,236,164,0.8)] animate-pulse' : 'bg-white/30'}`}></div>
                                                    <span className={`text-[9px] font-black tracking-widest uppercase ${u.isOnline ? 'text-primary' : 'text-white/40'}`}>
                                                        {u.isOnline ? t('community.userCard.active') : t('community.userCard.offline')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-1 flex flex-col flex-1 justify-end">
                                            <h3 className="text-base font-black text-white truncate tracking-tight mb-1 group-hover:text-primary transition-colors">
                                                {u.nickname}
                                            </h3>
                                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest truncate flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[10px]">
                                                    {u.isOnline ? 'wifi' : 'schedule'}
                                                </span>
                                                {u.isOnline
                                                    ? t('community.userCard.pulseDetected')
                                                    : u.lastSeen
                                                        ? t('community.userCard.seen', { time: formatDistanceToNow(u.lastSeen, { addSuffix: true }) })
                                                        : t('community.userCard.archive')}
                                            </p>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}

                            {filteredUsers.length === 0 && (
                                <div className="col-span-full py-24 flex flex-col items-center justify-center glass rounded-[2rem] border border-dashed border-white/10">
                                    <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined text-4xl text-white/30">search_off</span>
                                    </div>
                                    <p className="text-white/50 font-bold uppercase tracking-[0.2em] text-sm">{t('community.userCard.noExplorers')}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredRooms.map((room, idx) => (
                                <Reveal key={room.id} delay={idx * 0.05} variant="fadeUp" amount={0.1}>
                                    <div
                                        onClick={() => navigate(`/room/${room.id}`)}
                                        className="glass group rounded-[1.5rem] p-6 sm:p-8 transition-all duration-500 hover:-translate-y-1 flex flex-col border border-white/5 hover:border-primary/30 cursor-pointer relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-transparent hover:shadow-[0_10px_40px_-10px_rgba(19,236,164,0.15)]"
                                    >
                                        {/* Decorative Background Glow */}
                                        <div className="absolute -right-20 -top-20 size-40 bg-primary/10 rounded-full blur-[50px] group-hover:bg-primary/20 transition-colors duration-500 pointer-events-none"></div>

                                        <div className="flex items-start justify-between mb-8 relative z-10">
                                            <div className="flex items-center gap-4 sm:gap-6">
                                                <div className="size-14 sm:size-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                    <span className="material-symbols-outlined text-3xl sm:text-4xl">hub</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl sm:text-2xl text-white tracking-tight group-hover:text-primary transition-colors mb-2">{room.name}</h3>
                                                    <div className="flex items-center gap-2 rtl:flex-row-reverse bg-white/5 w-fit px-3 py-1 rounded-lg border border-white/5">
                                                        <span className="material-symbols-outlined text-white/40 text-[14px]">shield_person</span>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                                                            {t('community.roomCard.host', { name: room.creatorNickname })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 hidden sm:block">
                                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                                    {room.createdAt ? format(room.createdAt.toDate ? room.createdAt.toDate() : new Date(room.createdAt), 'MMM dd, yyyy') : 'vRT'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="flex -space-x-3">
                                                    {/* Just an illustrative fake avatar stack, can be replaced with real members later */}
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="size-8 sm:size-9 rounded-full border-2 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50 backdrop-blur-sm">
                                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                                                    {t('community.roomCard.activeCount', { count: 12 })}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-primary/70 group-hover:text-primary group-hover:translate-x-2 transition-all duration-300">
                                                <span className="text-xs font-black uppercase tracking-widest hidden sm:block">Connect Hub</span>
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}

                            {filteredRooms.length === 0 && (
                                <div className="col-span-full py-24 flex flex-col items-center justify-center glass rounded-[2rem] border border-dashed border-white/10">
                                    <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined text-4xl text-white/30">analytics</span>
                                    </div>
                                    <p className="text-white/50 font-bold uppercase tracking-[0.2em] text-sm">{t('community.roomCard.noHubs')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </Reveal>
            </div>

            <CreateRoomModal
                isOpen={isCreateRoomOpen}
                onClose={() => setIsCreateRoomOpen(false)}
            />
        </main>
    );
}