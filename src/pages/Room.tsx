import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Send, Hash, Settings, Users, ArrowLeft, Trash2, AlertCircle, ShieldCheck, Sparkles, MessageSquare, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { RoomMembersModal } from '../components/RoomMembersModal';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderNickname: string;
    createdAt: any;
    type?: 'default' | 'admin_announcement';
}

interface RoomData {
    name: string;
    isPrivate: boolean;
    createdBy: string;
    creatorNickname: string;
    admins: string[];
    participants: string[];
}

export function Room() {
    const { roomId } = useParams<{ roomId: string }>();
    const { user, userData } = useAuthStore();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [room, setRoom] = useState<RoomData | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    useEffect(() => {
        if (!roomId || !user) return;

        const fetchRoom = async () => {
            try {
                const roomDoc = await getDoc(doc(db, 'rooms', roomId));
                if (!roomDoc.exists()) {
                    setError("HUB_NOT_FOUND");
                    return;
                }

                const data = roomDoc.data() as RoomData;

                if (data.isPrivate && !data.participants.includes(user.uid) && !data.admins.includes(user.uid)) {
                    setError("AUTHENTICATION_REQUIRED_PRIVATE_LINK");
                    return;
                }

                setRoom(data);

                const q = query(
                    collection(db, 'rooms', roomId, 'messages'),
                    orderBy('createdAt', 'asc')
                );

                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const loadedMessages: Message[] = [];
                    snapshot.forEach((doc) => {
                        loadedMessages.push({ id: doc.id, ...doc.data() } as Message);
                    });
                    setMessages(loadedMessages);
                    scrollToBottom();
                });

                return () => unsubscribe();
            } catch (err: any) {
                console.error("Room fetch error:", err);
                setError("TRANSMISSION_FAILURE");
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();
    }, [roomId, user]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !roomId) return;

        try {
            await addDoc(collection(db, 'rooms', roomId, 'messages'), {
                text: newMessage.trim(),
                senderId: user.uid,
                senderNickname: userData?.nickname || 'Unknown',
                createdAt: serverTimestamp(),
                type: 'default'
            });
            setNewMessage('');
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!roomId || !isAdmin) return;
        if (window.confirm("TERMINATE THIS DATA SLICE?")) {
            try {
                await deleteDoc(doc(db, 'rooms', roomId, 'messages', messageId));
            } catch (err) {
                console.error("Error deleting message:", err);
            }
        }
    };

    const handleReportRoom = async () => {
        if (!roomId || !user) return;
        const reason = window.prompt("REASON FOR REPORTING THIS HUB?");
        if (!reason) return;

        try {
            await addDoc(collection(db, 'reports'), {
                type: 'room',
                targetId: roomId,
                targetName: room?.name,
                reporterId: user.uid,
                reporterNickname: userData?.nickname || 'Unknown',
                reason,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            alert("Report submitted to Internal Governance.");
        } catch (err) {
            console.error("Error reporting room:", err);
        }
    };

    const handleReportMessage = async (msg: Message) => {
        if (!roomId || !user || msg.senderId === user.uid) return;
        const reason = window.prompt(`REPORT MESSAGE FROM ${msg.senderNickname.toUpperCase()}?`);
        if (!reason) return;

        try {
            await addDoc(collection(db, 'reports'), {
                type: 'message',
                targetId: msg.id,
                targetNickname: msg.senderNickname,
                targetUid: msg.senderId,
                roomId,
                roomName: room?.name,
                messageText: msg.text,
                reporterId: user.uid,
                reporterNickname: userData?.nickname || 'Unknown',
                reason,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            alert("Manifest violation reported.");
        } catch (err) {
            console.error("Error reporting message:", err);
        }
    };

    const handleSendAdminAnnouncement = async () => {
        if (!newMessage.trim() || !user || !roomId || !isAdmin) return;

        try {
            await addDoc(collection(db, 'rooms', roomId, 'messages'), {
                text: newMessage.trim(),
                senderId: user.uid,
                senderNickname: `${userData?.nickname}`,
                createdAt: serverTimestamp(),
                type: 'admin_announcement'
            });
            setNewMessage('');
            setIsMenuOpen(false);
        } catch (err) {
            console.error("Error sending announcement:", err);
        }
    };

    if (loading) return (
        <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Establishing Frequency...</p>
        </div>
    );

    if (error) return (
        <div className="max-w-2xl mx-auto mt-20 p-12 glass-panel rounded-[40px] text-center space-y-8 animate-in fade-in zoom-in duration-700">
            <AlertCircle size={64} className="mx-auto text-red-500/50" />
            <div className="space-y-3">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Connection Rejected</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[11px]">{error}</p>
            </div>
            <button
                onClick={() => navigate('/community')}
                className="premium-button premium-button-secondary px-10"
            >
                <ArrowLeft size={16} /> Return to Community
            </button>
        </div>
    );

    const isAdmin = room?.admins.includes(user?.uid || '');

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col pt-4 px-6 animate-in fade-in duration-700">
            {/* Room Header */}
            <header className="glass-panel p-4 rounded-t-[2rem] flex items-center justify-between border-b border-white/[0.03] sticky top-0 z-10 shrink-0 shadow-lg">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/community')}
                        className="p-3 text-zinc-600 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                    >
                        <ArrowLeft size={22} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                            <Hash size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="font-black text-xl text-white uppercase tracking-tight holographic-text">{room?.name}</h1>
                                {room?.isPrivate && <ShieldCheck size={14} className="text-indigo-400/50" />}
                            </div>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Host: {room?.creatorNickname}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-3 text-zinc-600 hover:text-white hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5"
                    >
                        <Settings size={22} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-3 w-56 glass-panel rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden py-2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="px-4 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">
                                Command Center
                            </div>
                            <button
                                onClick={() => {
                                    setIsMembersModalOpen(true);
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-5 py-3 text-xs font-bold text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all flex items-center gap-3 uppercase tracking-widest"
                            >
                                <Users size={16} /> Hub Manifest
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={handleSendAdminAnnouncement}
                                    className="w-full text-left px-5 py-3 text-xs font-black text-amber-500 hover:bg-amber-500/10 transition-all flex items-center gap-3 uppercase tracking-widest border-t border-white/[0.03]"
                                >
                                    <Sparkles size={16} /> Broadcast Core
                                </button>
                            )}
                            <button
                                onClick={handleReportRoom}
                                className="w-full text-left px-5 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-3 uppercase tracking-widest border-t border-white/[0.03]"
                            >
                                <AlertTriangle size={16} /> Report Hub
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 glass-panel rounded-none border-x border-y-0 border-white/[0.03] overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-800 space-y-6">
                        <MessageSquare size={64} className="opacity-20 animate-pulse" />
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Hub Initialized</p>
                            <p className="text-sm font-medium italic">Begin data transmission for #{room?.name}.</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === user?.uid;
                        const showNickname = !isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showNickname && (
                                        <span className="text-[9px] font-black text-indigo-400/60 uppercase tracking-widest mb-2 ml-1">{msg.senderNickname}</span>
                                    )}
                                    <div className="flex items-center gap-4 relative">
                                        {isAdmin && !isMe && (
                                            <button
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-700 hover:text-red-500 transition-all hover:bg-red-500/5 rounded-lg"
                                                title="Purge Slice"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        <div
                                            className={`px-5 py-3 rounded-[20px] text-[13px] font-medium leading-relaxed ${msg.type === 'admin_announcement' ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)] italic' :
                                                isMe ? 'bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.1)] rounded-tr-none' :
                                                    'bg-white/[0.03] text-zinc-300 border border-white/[0.03] rounded-tl-none'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                        {!isMe && !isAdmin && (
                                            <button
                                                onClick={() => handleReportMessage(msg)}
                                                className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-zinc-800 hover:text-red-500 transition-all font-black"
                                                title="Report Violation"
                                            >
                                                <AlertTriangle size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-bold text-zinc-700 mt-2 mx-1 uppercase tracking-tighter">
                                        {(() => {
                                            if (!msg.createdAt) return 'SYNCING';
                                            const date = msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
                                            return format(date, 'HH:mm:ss');
                                        })()}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="glass-panel p-5 rounded-b-[2rem] border-t border-white/[0.03] shrink-0 bg-zinc-950/30 backdrop-blur-2xl">
                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`COMMAND_INPUT_#${room?.name?.toUpperCase()}...`}
                            className="w-full bg-white/[0.02] border border-white/5 rounded-[18px] py-4 px-6 text-xs font-medium text-white placeholder:text-zinc-800 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] transition-all"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-800 pointer-events-none group-focus-within:text-emerald-500/30 transition-colors">
                            RT_V2.0.4
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="h-12 w-12 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 disabled:hover:bg-emerald-500 text-white rounded-[16px] transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)] active:scale-95 group"
                    >
                        <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </form>
            </div>

            <RoomMembersModal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                roomId={roomId || ''}
                roomData={room}
            />
        </div>
    );
}
