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
        <main className="flex-1 overflow-y-auto aurora-bg py-24 px-6 lg:px-20 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto">
                <Reveal amount={0.25}>
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-16 gap-8">
                        <div className="flex flex-col gap-6 w-full md:w-auto">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-2xl">
                                    <span className="material-symbols-outlined text-2xl">sensors</span>
                                </div>
                                <h2 className="text-5xl md:text-6xl font-black text-premium uppercase italic tracking-tighter leading-none">
                                    {t('community.title')}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3 glass border-white/5 px-4 py-2 rounded-2xl w-fit">
                                <div className="size-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(19,236,164,0.5)]"></div>
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">
                                    {t('community.activeAgents', { count: onlineCount })}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                            <div className="relative w-full sm:w-80 group">
                                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-white/20 text-sm group-focus-within:text-primary transition-colors">search</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl h-12 pl-12 pr-6 rtl:pr-12 rtl:pl-6 text-[11px] font-bold text-slate-200 placeholder:text-white/10 focus:outline-none transition-all focus:border-primary/30"
                                    placeholder={t('community.searchPlaceholder')}
                                />
                            </div>

                            {isLocked ? (
                                <div className="flex items-center gap-3 px-6 h-12 glass text-rose-500 rounded-2xl font-bold border-rose-500/20 shadow-2xl">
                                    <span className="material-symbols-outlined text-lg">shield_alert</span>
                                    <span className="text-[10px] uppercase font-black tracking-widest">{t('community.meshLocked')}</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreateRoomOpen(true)}
                                    className="btn-premium flex items-center gap-3 h-12 shadow-2xl"
                                >
                                    <span className="material-symbols-outlined text-lg">add_circle</span>
                                    <span>{t('community.deployRoom')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </Reveal>

                <Reveal delay={0.06} amount={0.18}>
                    <div className="flex gap-12 border-b border-white/5 mb-12 overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`pb-5 text-[10px] font-black tracking-[0.4em] uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'border-b-2 border-primary text-white' : 'border-b-2 border-transparent text-white/20 hover:text-white/40'}`}
                        >
                            <span className="material-symbols-outlined text-lg">explore</span>
                            {t('community.tabs.explorers')}
                        </button>

                        <button
                            onClick={() => setActiveTab('rooms')}
                            className={`pb-5 text-[10px] font-black tracking-[0.4em] uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'rooms' ? 'border-b-2 border-primary text-white' : 'border-b-2 border-transparent text-white/20 hover:text-white/40'}`}
                        >
                            <span className="material-symbols-outlined text-lg">hub</span>
                            {t('community.tabs.hubs')}
                        </button>
                    </div>
                </Reveal>

                <Reveal delay={0.1} amount={0.12}>
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="glass rounded-2xl aspect-[4/5] animate-pulse border-white/5"></div>
                            ))}
                        </div>
                    ) : activeTab === 'users' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredUsers.map((u, idx) => (
                                <Reveal key={u.uid} delay={idx * 0.05} variant="fadeUp" amount={0.1}>
                                    <div className="premium-card group p-3 transition-all flex flex-col cursor-pointer border-white/5">
                                        <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                                            {u.profilePicture ? (
                                                <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" src={u.profilePicture} alt={u.nickname} />
                                            ) : (
                                                <div className="size-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-4xl">person_search</span>
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 glass px-2 py-1 rounded-lg border-white/5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`size-1.5 rounded-full ${u.isOnline ? 'bg-primary shadow-[0_0_8px_rgba(19,236,164,0.8)]' : 'bg-white/20'}`}></div>
                                                    <span className={`text-[8px] font-black tracking-widest uppercase ${u.isOnline ? 'text-primary' : 'text-white/20'}`}>
                                                        {u.isOnline ? t('community.userCard.active') : t('community.userCard.offline')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-2">
                                            <h3 className="text-sm font-black text-white italic truncate uppercase tracking-tight mb-1">
                                                {u.nickname}
                                            </h3>

                                            <p className="text-white/20 text-[8px] font-black uppercase tracking-widest truncate">
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
                                <div className="col-span-full py-20 text-center glass rounded-3xl border-dashed border-white/10">
                                    <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">search_off</span>
                                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">{t('community.userCard.noExplorers')}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {filteredRooms.map(room => (
                                <div
                                    key={room.id}
                                    onClick={() => navigate(`/room/${room.id}`)}
                                    className="glass glass-card group rounded-[2rem] p-8 transition-all flex flex-col border-white/5 cursor-pointer hover:border-primary/20"
                                >
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                <span className="material-symbols-outlined text-3xl">hub</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-2xl text-white tracking-tight group-hover:text-primary transition-colors">{room.name}</h3>
                                                <div className="flex items-center gap-2 mt-1.5 rtl:flex-row-reverse">
                                                    <span className="material-symbols-outlined text-slate-500 text-sm">person</span>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                        {t('community.roomCard.host', { name: room.creatorNickname })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {room.createdAt ? format(room.createdAt.toDate ? room.createdAt.toDate() : new Date(room.createdAt), 'MM.dd.yy') : 'vRT'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="size-8 rounded-full border-2 border-background-dark bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                                        {i}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('community.roomCard.activeCount', { count: 12 })}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
                                            <span className="text-[11px] font-bold uppercase tracking-widest">Connect Hub</span>
                                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredRooms.length === 0 && (
                                <div className="col-span-full py-20 text-center glass rounded-3xl border-dashed border-white/10">
                                    <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">analytics</span>
                                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">{t('community.roomCard.noHubs')}</p>
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
