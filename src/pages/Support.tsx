import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Reveal } from '../components/Reveal';

export function Support() {
    const { t } = useTranslation();
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
            setError(t('support.form.identityRequired'));
            return;
        }

        if (!subject.trim() || !message.trim()) {
            setError(t('support.form.parametersRequired'));
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
            setError(t('support.form.collision'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-700">
                <div className="max-w-xl w-full glass rounded-[3rem] p-12 text-center border-primary/20 shadow-[0_0_80px_rgba(19,236,164,0.1)]">
                    <div className="size-24 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 glow-shadow text-primary">
                        <span className="material-symbols-outlined text-5xl">verified</span>
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">{t('support.success.title')}</h2>
                    <p className="text-slate-400 font-medium leading-relaxed mb-10 whitespace-pre-line">
                        {t('support.success.description')}
                    </p>
                    <button
                        onClick={() => setSuccess(false)}
                        className="flex items-center gap-2 px-10 py-4 bg-white text-background-dark font-bold rounded-2xl hover:bg-primary transition-all mx-auto active:scale-95"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        {t('support.success.newSignal')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto aurora-bg py-24 px-6 lg:px-20 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto">
                <Reveal amount={0.25}>
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-16 gap-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-2xl">
                                    <span className="material-symbols-outlined text-2xl">support_agent</span>
                                </div>
                                <h2 className="text-5xl md:text-6xl font-black text-premium uppercase italic tracking-tighter leading-none">
                                    {t('support.title')}
                                </h2>
                            </div>
                            <div className="flex items-center gap-3 glass border-white/5 px-4 py-2 rounded-2xl w-fit">
                                <div className="size-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(19,236,164,0.5)]"></div>
                                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">
                                    {t('support.responseStatus')}
                                </span>
                            </div>
                        </div>
                    </div>
                </Reveal>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                    <div className="lg:col-span-12">
                        <Reveal delay={0.1} amount={0.2}>
                            <p className="text-xl md:text-2xl text-white/40 mb-20 max-w-3xl leading-relaxed italic font-medium text-left rtl:text-right">
                                {t('support.description')}
                            </p>
                        </Reveal>
                    </div>

                    {/* New Ticket Section */}
                    <div className="lg:col-span-7">
                        <Reveal delay={0.2} variant="fadeUp" amount={0.1}>
                            <div className="premium-card p-10 group">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <span className="material-symbols-outlined text-primary">add_task</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{t('support.newTicket.title')}</h3>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest italic rounded-xl">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <div className="space-y-3 text-left rtl:text-right">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic px-2">{t('support.form.subject')}</label>
                                            <input
                                                type="text"
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                required
                                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl h-14 px-6 text-[11px] font-bold text-slate-200 placeholder:text-white/10 focus:outline-none focus:border-primary/50 transition-all font-mono"
                                                placeholder={t('support.form.subjectPlaceholder')}
                                            />
                                        </div>

                                        <div className="space-y-3 text-left rtl:text-right">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic px-2">{t('support.form.payload')}</label>
                                            <textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                required
                                                rows={6}
                                                className="w-full bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-[11px] font-bold text-slate-200 placeholder:text-white/10 focus:outline-none focus:border-primary/50 transition-all resize-none font-mono"
                                                placeholder={t('support.form.payloadPlaceholder')}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-premium w-full h-16 flex items-center justify-center gap-4 shadow-2xl"
                                    >
                                        {loading ? (
                                            <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-xl">send</span>
                                                <span className="text-sm font-black uppercase tracking-[0.2em]">{t('support.form.submit')}</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </Reveal>
                    </div>

                    {/* Technical Protocol Column */}
                    <div className="lg:col-span-5">
                        <Reveal delay={0.4} variant="fadeUp" amount={0.1}>
                            <div className="premium-card p-10 group overflow-hidden h-full">
                                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                    <span className="material-symbols-outlined text-[10rem] text-primary">lock</span>
                                </div>
                                <div className="flex items-center gap-6 mb-12">
                                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
                                        <span className="material-symbols-outlined text-primary text-3xl">terminal</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{t('support.protocols.title')}</h2>
                                </div>
                                <div className="space-y-10 relative z-10 text-left rtl:text-right">
                                    {[
                                        { icon: 'key', title: t('support.protocols.lock.title'), desc: t('support.protocols.lock.description') },
                                        { icon: 'schedule', title: t('support.protocols.sla.title'), desc: t('support.protocols.sla.description', { time: '2.4 Hours' }) },
                                        { icon: 'all_inclusive', title: t('support.protocols.availability.title'), desc: t('support.protocols.availability.description') }
                                    ].map((item, idx) => (
                                        <div key={idx} className="space-y-4 group/item">
                                            <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover/item:border-primary/30 transition-colors">
                                                <span className="material-symbols-outlined text-white/40 group-hover/item:text-primary transition-colors">{item.icon}</span>
                                            </div>
                                            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">{item.title}</h3>
                                            <p className="text-sm text-white/40 leading-relaxed font-medium italic">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Ticket History Section */}
                    <div className="lg:col-span-12 mt-10">
                        <Reveal delay={0.3} variant="fadeUp" amount={0.1}>
                            <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
                                <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">{t('support.history.title')}</h3>
                                <div className="flex items-center gap-3 px-4 py-2 glass border-white/5 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Live Signal Feed</span>
                                    <div className="size-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(19,236,164,0.8)]"></div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {tickets.length > 0 ? (
                                    tickets.map((ticket, idx) => (
                                        <Reveal key={ticket.id} delay={idx * 0.1} variant="fadeUp" amount={0.1}>
                                            <div className="premium-card p-8 group hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                <div className="space-y-4 max-w-2xl text-left rtl:text-right">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border italic shadow-2xl ${ticket.status === 'open' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                                            {ticket.status === 'open' ? t('support.history.transit') : t('support.history.resolved')}
                                                        </span>
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">#{ticket.id.substring(0, 8).toUpperCase()}</span>
                                                    </div>
                                                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">{ticket.subject}</h4>
                                                    <p className="text-white/40 text-sm line-clamp-1 italic font-medium">{ticket.message}</p>
                                                    
                                                    {ticket.adminResponse && (
                                                        <div className="mt-6 p-6 rounded-2xl bg-primary/5 border border-primary/10 relative">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className="material-symbols-outlined text-primary text-lg">memory</span>
                                                                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Mainframe Response</span>
                                                            </div>
                                                            <p className="text-sm text-slate-300 italic opacity-80 leading-relaxed pl-6 border-l-2 border-primary/20">
                                                                "{ticket.adminResponse}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-3 shrink-0">
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">
                                                        {ticket.createdAt ? format(ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt), 'MMM dd, HH:mm') : 'Recent'}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-primary/50">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">SECURE_CHANNEL</span>
                                                        <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Reveal>
                                    ))
                                ) : (
                                    <div className="py-24 text-center glass rounded-[2.5rem] border-dashed border-white/5">
                                        <span className="material-symbols-outlined text-5xl text-white/10 mb-6 font-light">satellite_alt</span>
                                        <p className="text-white/20 font-black uppercase tracking-[0.3em] text-[10px] italic">{t('support.history.noHistory')}</p>
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    </div>
                </div>
            </div>
        </main>
    );
}
