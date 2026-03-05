import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { LifeBuoy, Send, Loader2, CheckCircle2, ShieldAlert, Sparkles, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export function Support() {
    const { user, userData } = useAuthStore();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [tickets, setTickets] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'support_tickets'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const unsub = onSnapshot(q, (snapshot) => {
            const list: any[] = [];
            snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            setTickets(list);
        });
        return () => unsub();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userData) {
            setError("Authentication required for transmission.");
            return;
        }

        if (!subject.trim() || !message.trim()) {
            setError("All data fields must be populated.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            await addDoc(collection(db, 'support_tickets'), {
                userId: user.uid,
                userNickname: userData.nickname,
                subject: subject.trim(),
                message: message.trim(),
                status: 'open',
                createdAt: serverTimestamp()
            });

            setSuccess(true);
            setSubject('');
            setMessage('');
        } catch (err: any) {
            console.error("Support ticket error:", err);
            setError("Transmission failure. Re-attempt required.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-12 glass-panel rounded-[40px] text-center space-y-8 animate-in fade-in zoom-in duration-700 shadow-[0_0_100px_rgba(16,185,129,0.1)]">
                <div className="h-24 w-24 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={48} />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Transmission Secured</h2>
                    <p className="text-zinc-400 font-medium leading-relaxed">
                        Your support signal has been received by the core team. <br />
                        We will analyze and respond via your registered frequency soon.
                    </p>
                </div>
                <button
                    onClick={() => setSuccess(false)}
                    className="premium-button premium-button-secondary text-[10px] uppercase tracking-[0.2em] px-10"
                >
                    <ArrowLeft size={16} /> New Signal
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
            <header className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-emerald-500/10 rounded-[24px] flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <LifeBuoy size={40} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter holographic-text">Support <span className="text-white/40 font-light">Node</span></h1>
                        <p className="text-sm font-bold text-zinc-500 mt-1 uppercase tracking-widest">
                            Direct frequency for technical assistance.
                        </p>
                    </div>
                </div>
                <div className="hidden lg:flex items-center gap-4 text-xs font-black uppercase tracking-widest text-zinc-600">
                    <ShieldAlert size={16} /> Encrypted Line
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-8 rounded-[32px] border-white/[0.03] space-y-6">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Technical Protocol</h3>
                        <p className="text-xs font-medium text-zinc-500 leading-relaxed">
                            For critical system failures, please provide your license key and hardware fingerprint if applicable.
                        </p>
                        <div className="pt-4 space-y-3">
                            <div className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Response: ~2 Hours
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Availability: 24/7
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="lg:col-span-2 glass-panel p-10 md:p-14 rounded-[40px] border-white/[0.05] space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Subject Frequency</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="ISSUE_OVERVIEW_MARKER"
                                className="w-full bg-white/[0.02] border border-white/5 rounded-[20px] py-4 px-6 text-sm font-medium text-white placeholder:text-zinc-800 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Data Payload</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Describe the technical anomaly in detail..."
                                className="w-full h-56 bg-white/[0.02] border border-white/5 rounded-[24px] py-4 px-6 text-sm font-medium text-white placeholder:text-zinc-800 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] transition-all resize-none leading-relaxed"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col items-center gap-6">
                        <button
                            type="submit"
                            disabled={loading || !subject.trim() || !message.trim()}
                            className="premium-button premium-button-primary w-full py-5 text-sm uppercase tracking-[0.3em]"
                        >
                            {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                            {loading ? 'Transmitting...' : 'Initialize Signal'}
                        </button>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 text-center">
                            By transmitting, you agree to our technical diagnostic protocols.
                        </p>
                    </div>
                </form>
            </div>

            {/* Ticket History */}
            {tickets.length > 0 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/5" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Signal History Manifest</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {tickets.map((ticket) => (
                            <div key={ticket.id} className="glass-panel p-8 rounded-[32px] border-white/[0.03] space-y-6 hover:border-emerald-500/20 transition-all group">
                                <div className="flex justify-between items-start">
                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${ticket.status === 'resolved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
                                        {ticket.status === 'resolved' ? 'DECRYPTED & RESOLVED' : 'IN_TRANSIT'}
                                    </span>
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">
                                        {ticket.createdAt?.toDate ? format(ticket.createdAt.toDate(), 'MMM d, HH:mm') : 'SYNCING'}
                                    </span>
                                </div>

                                <div>
                                    <h4 className="text-white font-black uppercase tracking-tight text-lg mb-2 group-hover:text-emerald-400 transition-colors">{ticket.subject}</h4>
                                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{ticket.message}</p>
                                </div>

                                {ticket.adminResponse && (
                                    <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-3 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 text-emerald-500/20"><Sparkles size={14} /></div>
                                        <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Core response:</div>
                                        <p className="text-xs text-emerald-100 italic">"{ticket.adminResponse}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
