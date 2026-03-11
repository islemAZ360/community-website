import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';


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
        <main className="flex-grow max-w-7xl mx-auto w-full px-6 lg:px-20 py-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/20 rounded-xl glow-shadow text-primary">
                            <span className="material-symbols-outlined text-3xl font-bold">support_agent</span>
                        </div>
                        <div className="text-left rtl:text-right">
                            <h1 className="text-3xl font-black text-slate-100 tracking-tight">{t('support.header.title')}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-bold text-primary uppercase tracking-wider">
                                    <span className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#13eca4]"></span>
                                    {t('support.header.encrypted')}
                                </span>
                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('support.header.protocol')}</span>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="flex items-center gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] border border-white/5 px-4 py-2 rounded-xl backdrop-blur-md">
                    <span className="material-symbols-outlined text-sm text-primary">security</span>
                    {t('support.header.hardened')}
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Form and History */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Support Form Section */}
                    <section className="glass rounded-[2rem] p-8 border-primary/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                            <span className="material-symbols-outlined text-[10rem] text-primary">rocket_launch</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-8 flex items-center gap-3 relative z-10 text-left rtl:text-right">
                            <span className="material-symbols-outlined text-primary">wifi_tethering</span>
                            {t('support.form.title')}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                            {error && (
                                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-6 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest animate-in shake duration-500">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-3 text-left rtl:text-right">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] ml-1 rtl:ml-0 rtl:mr-1">{t('support.form.subject')}</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-background-dark/40 border border-white/10 rounded-2xl px-5 py-3.5 text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-700 outline-none text-sm"
                                    placeholder={t('support.form.subjectPlaceholder')}
                                    required
                                />
                            </div>

                            <div className="space-y-3 text-left rtl:text-right">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] ml-1 rtl:ml-0 rtl:mr-1">{t('support.form.payload')}</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-background-dark/40 border border-white/10 rounded-[1.5rem] px-6 py-4 text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-700 outline-none resize-none leading-relaxed"
                                    placeholder={t('support.form.payloadPlaceholder')}
                                    rows={5}
                                    required
                                ></textarea>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-[0.1em]">
                                    <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
                                    {t('support.form.encryption')}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !subject.trim() || !message.trim()}
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-primary hover:bg-white text-background-dark font-black rounded-2xl transition-all glow-shadow uppercase tracking-wider text-xs group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="size-5 border-2 border-background-dark border-t-transparent animate-spin rounded-full"></div>
                                    ) : (
                                        <>
                                            {t('support.form.submit')}
                                            <span className="material-symbols-outlined group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">send</span>
                                        </>
                                    )}

                                </button>
                            </div>
                        </form>
                    </section>

                    {/* History Manifest */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between border-b border-white/5 pb-6 text-left rtl:text-right">
                            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">history</span>
                                {t('support.history.title')}
                            </h2>
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">{t('support.history.logged', { count: tickets.length })}</span>
                        </div>


                        <div className="space-y-6">
                            {tickets.map((ticket) => (
                                <div key={ticket.id} className="glass rounded-3xl border border-white/5 overflow-hidden group hover:border-primary/20 transition-all">
                                    <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-2 text-left rtl:text-right">
                                            <h3 className="text-white font-bold text-lg group-hover:text-primary transition-colors">{ticket.subject}</h3>
                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                                <span>{t('support.history.uuid', { id: ticket.id.substring(0, 8).toUpperCase() })}</span>
                                                <div className="size-1 rounded-full bg-slate-800"></div>
                                                <span>{t('support.history.initiated', { time: ticket.createdAt ? format(ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt), 'MMM dd, HH:mm') : t('support.history.syncing') })}</span>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] text-center shrink-0 ${ticket.status === 'resolved' ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-amber-500/5 border-amber-500/30 text-amber-500'}`}>
                                            {ticket.status === 'resolved' ? t('support.history.resolved') : t('support.history.transit')}
                                        </div>

                                    </div>

                                    {ticket.adminResponse && (
                                        <div className="mx-8 mb-8 p-6 rounded-2xl bg-primary/5 border border-primary/10 relative text-left rtl:text-right">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="material-symbols-outlined text-primary text-lg">memory</span>
                                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('support.history.mainframeResponse')}</span>
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed italic opacity-90 border-l-2 rtl:border-l-0 rtl:border-r-2 border-primary/20 pl-6 rtl:pl-0 rtl:pr-6">
                                                "{ticket.adminResponse}"
                                            </p>
                                            <div className="mt-4 pt-3 border-t border-primary/10 flex justify-end">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('support.history.signedBy')}</span>
                                            </div>
                                        </div>

                                    )}
                                </div>
                            ))}

                            {tickets.length === 0 && (
                                <div className="py-20 text-center glass rounded-[2rem] border-dashed border-white/5">
                                    <span className="material-symbols-outlined text-4xl text-slate-700 mb-4 scale-150">satellite_alt</span>
                                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs">{t('support.history.noHistory')}</p>
                                </div>

                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Instructions & Protocols */}
                <aside className="lg:col-span-4 space-y-8">
                    {/* Technical Protocol Card */}
                    <div className="glass rounded-[2rem] border-primary/20 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
                        <div className="aspect-[4/3] w-full bg-background-dark overflow-hidden relative border-b border-primary/10">
                            <div className="absolute inset-0 bg-primary/20 opacity-30 mix-blend-overlay"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary/40 text-7xl animate-pulse">settings_input_component</span>
                            </div>
                            <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcM4_x9jGDh9MIp_6oL_ykx5i4Yhpc-cfRcmC5r--RH7sANa2o39elc19oty7_siWAraiStai8_hLHTZ44bZQE5r8X5h7mYJ9Awgos3j7Nsi8Hje1wvLzrIKnf6pcwlR_QCre64gcE6Qlk8cXRxifVFdyOS4ZUGmBGAymQ5r5p044XlA44LvwysUZyRwLKvIzZQB_K9kRsuLfSqtGTHJK3QJ58LyYqj-jpQsLrJjiEc0fhRVWdKfBe81DVzzS0MGTdhoshK5NhSOs"
                                className="size-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-1000"
                                alt="Protocol"
                            />
                        </div>
                        <div className="p-8 space-y-6 text-left rtl:text-right">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">terminal</span>
                                {t('support.protocols.title')}
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary text-xs">key</span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-slate-400">
                                        <span className="text-slate-100 font-bold uppercase tracking-widest text-[10px] block mb-1">{t('support.protocols.lock.title')}</span>
                                        {t('support.protocols.lock.description')}
                                    </p>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="mt-1 size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary text-xs">schedule</span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-slate-400">
                                        <span className="text-slate-100 font-bold uppercase tracking-widest text-[10px] block mb-1">{t('support.protocols.sla.title')}</span>
                                        {t('support.protocols.sla.description', { time: '2.4 hours' })}
                                    </p>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="mt-1 size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary text-xs">all_inclusive</span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-slate-400">
                                        <span className="text-slate-100 font-bold uppercase tracking-widest text-[10px] block mb-1">{t('support.protocols.availability.title')}</span>
                                        {t('support.protocols.availability.description')}
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* AI Diagnostics Widget */}
                    <div className="glass rounded-[2rem] p-8 border-white/5 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 size-40 bg-primary/5 blur-3xl rounded-full"></div>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-primary text-xl">auto_fix_high</span>
                            <h4 className="font-bold text-slate-100 uppercase tracking-widest text-[13px]">{t('support.diagnostics.title')}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-6 font-medium text-left rtl:text-right">
                            {t('support.diagnostics.description')}
                        </p>
                        <div className="p-4 bg-background-dark/60 rounded-xl border border-white/5 flex items-center justify-between">
                            <span className="text-[9px] uppercase font-black text-slate-600 tracking-widest">{t('support.diagnostics.engine')}</span>
                            <span className="text-[9px] uppercase font-black text-primary tracking-widest animate-pulse">{t('support.diagnostics.status')}</span>
                        </div>

                    </div>
                </aside>
            </div>
        </main>
    );
}
