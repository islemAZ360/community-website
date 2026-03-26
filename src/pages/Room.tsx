import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { 
    doc, 
    onSnapshot, 
    collection, 
    query, 
    orderBy, 
    addDoc, 
    serverTimestamp,
    limit 
} from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { RoomMembersModal } from '../components/RoomMembersModal';
import { Reveal } from '../components/Reveal';
import { 
    Send, 
    Users, 
    MessageSquare, 
    ShieldAlert, 
    Loader2, 
    ArrowLeft,
    Clock,
    User,
    Wifi
} from 'lucide-react';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderNickname: string;
    createdAt: any;
}

export function Room() {
    const { t } = useTranslation();
    const { roomId } = useParams<{ roomId: string }>();
    const { user, userData } = useAuthStore();
    const navigate = useNavigate();
    
    const [roomData, setRoomData] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isMembersOpen, setIsMembersOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!roomId || !user) return;

        // Listen to room metadata
        const roomUnsub = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
            if (!docSnap.exists()) {
                setError(t('common.error'));
                setLoading(false);
                return;
            }
            const data = docSnap.data();
            
            // Check authorization
            if (data.isPrivate && !data.participants?.includes(user.uid)) {
                setError(t('community.room.accessDenied'));
                setLoading(false);
                return;
            }
            
            setRoomData({ id: docSnap.id, ...data });
            setLoading(false);
        });

        // Listen to messages
        const msgsQuery = query(
            collection(db, 'rooms', roomId, 'messages'),
            orderBy('createdAt', 'asc'),
            limit(100)
        );
        
        const msgsUnsub = onSnapshot(msgsQuery, (snapshot) => {
            const list: Message[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(list);
            setTimeout(scrollToBottom, 100);
        });

        return () => {
            roomUnsub();
            msgsUnsub();
        };
    }, [roomId, user, t]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userData || !newMessage.trim() || !roomId || sending) return;

        setSending(true);
        try {
            await addDoc(collection(db, 'rooms', roomId, 'messages'), {
                text: newMessage.trim(),
                senderId: user.uid,
                senderNickname: userData.nickname || 'Unknown Agent',
                createdAt: serverTimestamp()
            });
            setNewMessage('');
        } catch (err) {
            console.error("Transmission error:", err);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
                <div className="relative size-20 rounded-2xl glass flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(19,236,164,0.15)] mb-6">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
                <p className="text-primary font-black uppercase tracking-[0.3em] text-sm animate-pulse">Syncing Hub Presence...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md w-full glass rounded-[3rem] p-12 text-center border-rose-500/20 shadow-[0_0_80px_rgba(244,63,94,0.1)]">
                    <div className="size-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-rose-500 border border-rose-500/20">
                        <ShieldAlert size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">{error}</h2>
                    <button 
                        onClick={() => navigate('/community')}
                        className="flex items-center gap-2 px-8 py-3 bg-white text-background-dark font-black rounded-xl hover:bg-rose-500 transition-colors mx-auto active:scale-95 shadow-xl uppercase tracking-widest text-xs"
                    >
                        <ArrowLeft size={16} />
                        Return to Network
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 flex flex-col h-[calc(100vh-80px)] overflow-hidden aurora-bg animate-in fade-in duration-700">
            {/* Hub Header */}
            <div className="glass border-b border-white/5 py-6 px-6 lg:px-20 shrink-0 relative z-20">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/community')}
                            className="size-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
                                {roomData?.name}
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="size-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(19,236,164,0.8)]"></div>
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-primary/80">
                                    {t('community.roomCard.host', { name: roomData?.creatorNickname })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsMembersOpen(true)}
                        className="flex items-center gap-3 px-5 py-2.5 glass border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                    >
                        <Users size={18} className="text-white/40 group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">
                            {t('community.room.members')}
                        </span>
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:px-20 py-10 space-y-8 relative">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center glass rounded-[3rem] border-dashed border-white/10 opacity-50">
                            <MessageSquare size={48} className="text-white/10 mb-6" />
                            <p className="text-white/30 font-black uppercase tracking-[0.3em] text-xs italic">
                                {t('community.room.noMessages')}
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === user?.uid;
                            return (
                                <Reveal key={msg.id} delay={0} variant="fadeUp" amount={0}>
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-2 group`}>
                                        <div className={`flex items-center gap-3 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic group-hover:text-primary transition-colors">
                                                {msg.senderNickname}
                                            </span>
                                            <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1">
                                                <Clock size={8} />
                                                {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt), { addSuffix: true }) : 'Syncing...'}
                                            </span>
                                        </div>
                                        <div className={`relative max-w-[85%] sm:max-w-lg glass p-5 rounded-2xl border transition-all duration-300 ${
                                            isMe 
                                            ? 'bg-primary/5 border-primary/20 rounded-tr-none hover:bg-primary/10' 
                                            : 'bg-white/[0.02] border-white/5 rounded-tl-none hover:bg-white/[0.05]'
                                        }`}>
                                            <p className="text-sm font-medium text-white/80 leading-relaxed whitespace-pre-wrap">
                                                {msg.text}
                                            </p>
                                        </div>
                                    </div>
                                </Reveal>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="glass border-t border-white/5 p-6 lg:px-20 shrink-0 relative z-20">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSendMessage} className="relative group">
                        <div className="absolute inset-x-0 -top-full h-24 bg-gradient-to-t from-background-dark/80 to-transparent pointer-events-none -translate-y-4"></div>
                        
                        <div className="relative flex items-center gap-4">
                            <div className="flex-1 relative">
                                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">terminal</span>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={t('community.room.chatPlaceholder')}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl h-16 pl-14 pr-6 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 transition-all focus:ring-4 focus:ring-primary/5"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="size-16 bg-white text-background-dark rounded-2xl flex items-center justify-center hover:bg-primary transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl group/send"
                            >
                                {sending ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                )}
                            </button>
                        </div>
                    </form>
                    <div className="mt-4 flex items-center justify-center gap-6 opacity-30">
                        <div className="flex items-center gap-2">
                            <Wifi size={10} className="text-primary" />
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Encryption: AES-256</span>
                        </div>
                        <div className="size-1 bg-white/20 rounded-full"></div>
                        <div className="flex items-center gap-2">
                            <User size={10} className="text-primary" />
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Identity: Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            <RoomMembersModal 
                isOpen={isMembersOpen}
                onClose={() => setIsMembersOpen(false)}
                roomId={roomId || ''}
                roomData={roomData}
            />
        </main>
    );
}