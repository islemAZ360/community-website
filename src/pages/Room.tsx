import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Send, Hash, Settings, Users, ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
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
                    setError("Room not found");
                    return;
                }

                const data = roomDoc.data() as RoomData;

                // Privacy check
                if (data.isPrivate && !data.participants.includes(user.uid) && !data.admins.includes(user.uid)) {
                    setError("You do not have access to this private room");
                    return;
                }

                setRoom(data);

                // Subscribe to messages
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
                setError("Failed to load room");
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
        if (window.confirm("Delete this message?")) {
            try {
                await deleteDoc(doc(db, 'rooms', roomId, 'messages', messageId));
            } catch (err) {
                console.error("Error deleting message:", err);
            }
        }
    };

    const handleSendAdminAnnouncement = async () => {
        if (!newMessage.trim() || !user || !roomId || !isAdmin) return;

        try {
            await addDoc(collection(db, 'rooms', roomId, 'messages'), {
                text: newMessage.trim(),
                senderId: user.uid,
                senderNickname: `⭐ ${userData?.nickname} (Admin)`,
                createdAt: serverTimestamp(),
                type: 'admin_announcement'
            });
            setNewMessage('');
            setIsMenuOpen(false);
        } catch (err) {
            console.error("Error sending announcement:", err);
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-500 animate-pulse">Loading Room...</div>;

    if (error) return (
        <div className="max-w-xl mx-auto mt-20 p-6 glass-panel rounded-2xl text-center space-y-4">
            <AlertCircle size={48} className="mx-auto text-red-400" />
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <p className="text-zinc-400">{error}</p>
            <button
                onClick={() => navigate('/community')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl transition-colors"
            >
                Return to Community
            </button>
        </div>
    );

    const isAdmin = room?.admins.includes(user?.uid || '');

    return (
        <div className="max-w-5xl mx-auto h-[calc(100vh-80px)] py-4 px-4 md:px-0 flex flex-col">
            {/* Room Header */}
            <header className="glass-panel p-4 rounded-t-2xl flex items-center justify-between border-b border-white/5 sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/community')}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <Hash size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-white leading-tight">{room?.name}</h1>
                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                                {room?.isPrivate ? 'Private Room' : 'Public Room'} • Created by {room?.creatorNickname}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <Settings size={20} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 glass-panel rounded-xl border border-white/10 shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                                Room Settings
                            </div>
                            <button
                                onClick={() => {
                                    setIsMembersModalOpen(true);
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <Users size={16} /> View Members
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={handleSendAdminAnnouncement}
                                    className="w-full text-left px-4 py-2 text-sm text-amber-400 hover:bg-amber-400/10 transition-colors flex items-center gap-2"
                                >
                                    <AlertCircle size={16} /> Send as Announcement
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 glass-panel rounded-none border-x border-y-0 border-white/5 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
                        <Hash size={48} className="text-zinc-700" />
                        <p>This is the start of the #{room?.name} room.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === user?.uid;
                        const showNickname = !isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showNickname && (
                                        <span className="text-xs text-zinc-500 mb-1 ml-1">{msg.senderNickname}</span>
                                    )}
                                    <div className="flex items-center gap-2 relative">
                                        {isAdmin && !isMe && (
                                            <button
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="absolute -right-8 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-opacity"
                                                title="Delete Message"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl text-sm ${msg.type === 'admin_announcement' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' :
                                                isMe ? 'bg-indigo-500 text-white rounded-br-sm' :
                                                    'bg-white/5 text-zinc-200 border border-white/5 rounded-bl-sm'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-zinc-600 mt-1 mx-1">
                                        {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : 'Now'}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="glass-panel p-4 rounded-b-2xl border-t border-white/5 shrink-0 bg-zinc-900/50 backdrop-blur-xl">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message #${room?.name}...`}
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Send size={20} />
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
