import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Reveal } from '../components/Reveal';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    isFeatured?: boolean;
    category?: string;
    author?: string;
    readTime?: string;
    poll?: {
        question: string;
        options: { id: string; text: string; votes: number }[];
        voters: string[];
    } | null;
    createdAt: any;
}

export function News() {
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();

    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'news'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: NewsItem[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() } as NewsItem);
            });
            list.sort((a, b) => {
                if (a.isFeatured && !b.isFeatured) return -1;
                if (!a.isFeatured && b.isFeatured) return 1;
                const dateA = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                const dateB = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                return dateB - dateA;
            });
            setNews(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const featuredArticle = news.find(item => item.isFeatured) || news[0];
    const otherArticles = news.filter(item => item.id !== (featuredArticle?.id));

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="relative size-20 rounded-2xl glass flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(19,236,164,0.15)] mb-6">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin" style={{ animationDuration: '3s' }}>radar</span>
                </div>
                <div className="flex flex-col items-center gap-2 relative z-10">
                    <p className="text-primary font-black uppercase tracking-[0.3em] text-sm animate-pulse">Syncing Feed...</p>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Establishing secure neural link</p>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-20 py-24 animate-in fade-in duration-1000 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none"></div>

            {/* Immersive Hero Section */}
            <Reveal amount={0.25}>
                {featuredArticle && (
                    <section className="relative group mb-24 lg:mb-32 cursor-pointer w-full" onClick={() => setSelectedArticle(featuredArticle)}>
                        {/* Outer Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-transparent to-purple-500/30 rounded-[2rem] lg:rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

                        <div className="relative aspect-video lg:aspect-[21/9] w-full overflow-hidden rounded-[2rem] lg:rounded-[3rem] shadow-2xl border border-white/10 group-hover:border-primary/40 transition-colors duration-700 bg-black">
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
                            {featuredArticle.imageUrl ? (
                                <img
                                    src={featuredArticle.imageUrl}
                                    alt={featuredArticle.title}
                                    className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-[2000ms] ease-out opacity-60 group-hover:opacity-80"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-white/5 flex items-center justify-center text-white/10">
                                    <span className="material-symbols-outlined text-9xl">newspaper</span>
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 rtl:left-auto rtl:right-0 p-8 md:p-12 lg:p-16 z-20 w-full lg:max-w-4xl text-left rtl:text-right flex flex-col justify-end">
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="inline-flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.4em] bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl shadow-2xl">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                        </span>
                                        {t('news.featured.tag')}
                                    </span>
                                    <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{t('news.featured.priority')}</span>
                                </div>

                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-6 leading-[1.1] uppercase tracking-tighter drop-shadow-2xl">
                                    {featuredArticle.title}
                                </h1>

                                <p className="text-white/50 text-base md:text-lg max-w-2xl mb-10 leading-relaxed line-clamp-2 font-medium italic group-hover:text-white/80 transition-colors duration-500">
                                    {featuredArticle.content}
                                </p>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
                                    <button className="btn-premium px-8 py-4 flex items-center gap-3 w-full sm:w-auto justify-center group/btn">
                                        <span className="text-sm tracking-wider font-bold">{t('news.featured.readStory')}</span>
                                        <span className="material-symbols-outlined text-xl group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                            <span className="material-symbols-outlined text-sm text-white/70">schedule</span>
                                        </div>
                                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest italic">
                                            {t('news.featured.readTime', { time: featuredArticle.readTime || '8 MIN' })} • {featuredArticle.author || t('news.featured.systemCore')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                {/* Latest Updates Grid */}
                <div className="lg:col-span-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 border-b border-white/5 pb-8 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                                <span className="material-symbols-outlined text-2xl text-white/50">dynamic_feed</span>
                            </div>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{t('news.latest.title')}</h3>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-2.5 glass border border-white/10 rounded-xl shadow-lg">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{t('news.latest.liveFeed')}</span>
                            <div className="size-2 bg-primary rounded-full shadow-[0_0_10px_rgba(19,236,164,1)] animate-pulse"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {otherArticles.map((item, idx) => (
                            <Reveal key={item.id} delay={idx * 0.1} variant="fadeUp" amount={0.1}>
                                <div className="glass p-5 rounded-[2rem] group cursor-pointer text-left rtl:text-right border border-white/5 hover:border-primary/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_-10px_rgba(19,236,164,0.15)] bg-gradient-to-b from-white/[0.02] to-transparent h-full flex flex-col" onClick={() => setSelectedArticle(item)}>
                                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-6 bg-black/50 border border-white/5 shadow-inner">
                                        {item.imageUrl ? (
                                            <>
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    className="size-full object-cover group-hover:scale-110 transition-transform duration-[1500ms] opacity-70 group-hover:opacity-100 ease-out"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            </>
                                        ) : (
                                            <div className="size-full flex items-center justify-center text-white/10 group-hover:text-primary/30 transition-colors duration-500">
                                                <span className="material-symbols-outlined text-5xl">article</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                            <span className="text-primary text-[9px] font-black uppercase tracking-[0.2em] italic">{item.category || 'Architecture'}</span>
                                        </div>
                                    </div>

                                    <h4 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug mb-3 group-hover:text-primary transition-colors uppercase italic">
                                        {item.title}
                                    </h4>

                                    <p className="text-white/40 text-sm line-clamp-3 leading-relaxed font-medium italic group-hover:text-white/60 transition-colors flex-1">
                                        {item.content}
                                    </p>

                                    <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                <span className="material-symbols-outlined text-[14px] text-white/40">calendar_today</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                                {item.createdAt ? format(item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt), 'MMM dd, yyyy') : 'Recent'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                            <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest">Read</span>
                                            <span className="material-symbols-outlined text-sm text-primary">arrow_forward</span>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    {otherArticles.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center glass rounded-[2.5rem] border border-dashed border-white/10">
                            <span className="material-symbols-outlined text-6xl text-white/10 mb-6">hourglass_empty</span>
                            <p className="text-white/30 font-black uppercase tracking-[0.3em] text-xs italic">{t('news.latest.noStories')}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Content */}
                <aside className="lg:col-span-4 space-y-12">
                    {/* Hub Insights Poll */}
                    {featuredArticle?.poll && (
                        <Reveal variant="fadeUp" amount={0.1}>
                            <div className="glass p-8 md:p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-primary/20 transition-colors duration-500 shadow-2xl">
                                {/* Decorative Glow */}
                                <div className="absolute -right-20 -top-20 size-40 bg-primary/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700"></div>

                                <div className="flex items-center gap-4 mb-8 relative z-10">
                                    <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border border-primary/20 shadow-inner">
                                        <span className="material-symbols-outlined text-primary text-2xl animate-pulse">insights</span>
                                    </div>
                                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] italic">Hub Insights Poll</h3>
                                </div>

                                <p className="text-2xl font-black text-white uppercase italic tracking-tighter mb-8 leading-tight relative z-10">
                                    {featuredArticle.poll.question}
                                </p>

                                <div className="space-y-4 relative z-10">
                                    {(() => {
                                        const hasVoted = user && featuredArticle.poll!.voters.includes(user.uid);
                                        const totalVotes = featuredArticle.poll!.options.reduce((acc, opt) => acc + opt.votes, 0);

                                        return featuredArticle.poll!.options.map((option) => {
                                            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

                                            const handleVote = async () => {
                                                if (!user) {
                                                    alert(t('news.sidebar.poll.noIdentity'));
                                                    return;
                                                }

                                                if (hasVoted) return;
                                                try {
                                                    const newsRef = doc(db, 'news', featuredArticle.id);
                                                    const newOptions = featuredArticle.poll!.options.map(opt =>
                                                        opt.id === option.id ? { ...opt, votes: opt.votes + 1 } : opt
                                                    );
                                                    await updateDoc(newsRef, {
                                                        'poll.options': newOptions,
                                                        'poll.voters': arrayUnion(user.uid)
                                                    });
                                                } catch (err) {
                                                    console.error("Poll Error:", err);
                                                }
                                            };

                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={(e) => { e.stopPropagation(); handleVote(); }}
                                                    className={`w-full relative h-14 rounded-xl overflow-hidden glass border transition-all duration-300 flex items-center px-6 ${hasVoted ? 'cursor-default border-white/10 bg-white/5' : 'hover:border-primary/40 border-white/5 hover:bg-white/10 active:scale-[0.98]'} ${i18n.dir() === 'rtl' ? 'flex-row-reverse' : ''}`}
                                                >
                                                    {hasVoted && (
                                                        <div
                                                            className={`absolute inset-y-0 bg-gradient-to-r from-primary/10 to-primary/30 transition-all duration-1000 ease-out ${i18n.dir() === 'rtl' ? 'right-0' : 'left-0'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    )}

                                                    <div className="relative z-20 flex justify-between w-full items-center">
                                                        <span className={`text-xs font-black uppercase tracking-tight transition-colors ${hasVoted ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                                                            {option.text}
                                                        </span>
                                                        {hasVoted && <span className="text-sm font-black text-primary shadow-lg">{percentage}%</span>}
                                                    </div>
                                                </button>
                                            );
                                        });
                                    })()}
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
                                    <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black italic">
                                        <span className="text-primary">{featuredArticle.poll.voters.length}</span> {t('news.sidebar.poll.transmissions')} • {t('news.sidebar.poll.consensus')}
                                    </p>
                                </div>
                            </div>
                        </Reveal>
                    )}

                </aside>
            </div>

            {/* Article Detail Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity" onClick={() => setSelectedArticle(null)}></div>

                    <div className="relative w-full max-w-6xl h-[90vh] glass rounded-[2rem] lg:rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 bg-gradient-to-b from-white/[0.05] to-black/90">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedArticle(null)}
                            className="absolute top-6 right-6 z-50 size-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/50 transition-all duration-300 hover:scale-110 active:scale-90 shadow-2xl"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>

                        <div className="overflow-y-auto flex-1 custom-scrollbar w-full">
                            {/* Modal Header/Cover */}
                            <div className="relative aspect-video lg:aspect-[21/8] w-full shrink-0">
                                {selectedArticle.imageUrl ? (
                                    <img
                                        src={selectedArticle.imageUrl}
                                        className="size-full object-cover opacity-60 mix-blend-overlay"
                                        alt={selectedArticle.title}
                                    />
                                ) : (
                                    <div className="size-full bg-gradient-to-br from-white/5 to-transparent"></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent z-10"></div>

                                <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 lg:p-16 z-20 text-left rtl:text-right">
                                    <div className="max-w-4xl">
                                        <Reveal amount={0.1}>
                                            <div className="flex items-center gap-3 mb-6">
                                                <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] inline-block bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg shadow-lg backdrop-blur-md">
                                                    {selectedArticle.category || t('news.modal.category')}
                                                </span>
                                            </div>
                                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 leading-[1.1] uppercase tracking-tighter drop-shadow-2xl">
                                                {selectedArticle.title}
                                            </h2>
                                        </Reveal>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Content Body */}
                            <div className="px-6 md:px-12 lg:px-16 pb-24 pt-10">
                                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
                                    {/* Article Text */}
                                    <div className="flex-1">
                                        <Reveal delay={0.2} amount={0.1}>
                                            <div className="prose prose-invert prose-lg max-w-none text-left rtl:text-right">
                                                <div className="relative">
                                                    <div className="absolute top-0 bottom-0 left-0 rtl:left-auto rtl:right-0 w-1.5 bg-gradient-to-b from-primary to-purple-500 rounded-full"></div>
                                                    <p className="text-xl md:text-2xl lg:text-3xl text-white font-black italic uppercase tracking-tighter leading-snug pl-8 rtl:pl-0 rtl:pr-8 py-2 mb-12 drop-shadow-md">
                                                        {selectedArticle.content}
                                                    </p>
                                                </div>

                                                <div className="text-white/60 font-medium leading-loose text-base md:text-lg space-y-8 glass p-8 md:p-10 rounded-[2rem] border border-white/5">
                                                    <p>{selectedArticle.content}</p>
                                                    <p>Operational data retrieved from the Neural Engine indicates this development will significantly stabilize the node mesh across the secondary sector. The architecture proposed represents a paradigm shift in how we envision decentralized intelligence.</p>
                                                    <div className="w-16 h-1 bg-white/10 rounded-full my-8 mx-auto"></div>
                                                    <p>Strategic deployment of these protocols ensures maximum stealth and efficiency in technical assessments. Our proprietary algorithms continue to evolve, providing unparalleled depth to candidate evaluation metrics.</p>
                                                </div>
                                            </div>
                                        </Reveal>
                                    </div>

                                    {/* Article Sidebar Metadata */}
                                    <aside className="w-full lg:w-80 shrink-0">
                                        <Reveal delay={0.4} variant="fadeUp" amount={0.1}>
                                            <div className="glass p-8 rounded-[2rem] space-y-8 text-left rtl:text-right mb-8 border border-white/5 shadow-2xl">
                                                <div className="flex items-start gap-4">
                                                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                                                        <span className="material-symbols-outlined text-white/50 text-xl">event</span>
                                                    </div>
                                                    <div className="space-y-1 pt-1">
                                                        <dt className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{t('news.modal.published')}</dt>
                                                        <dd className="text-sm font-black text-white uppercase tracking-tight">
                                                            {selectedArticle.createdAt ? format(selectedArticle.createdAt.toDate ? selectedArticle.createdAt.toDate() : new Date(selectedArticle.createdAt), 'MMMM dd, yyyy') : t('news.latest.recent')}
                                                        </dd>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-4">
                                                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                                                        <span className="material-symbols-outlined text-white/50 text-xl">timer</span>
                                                    </div>
                                                    <div className="space-y-1 pt-1">
                                                        <dt className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{t('news.modal.readTime')}</dt>
                                                        <dd className="text-sm font-black text-white uppercase tracking-tight">{selectedArticle.readTime || t('news.featured.readTime', { time: '12 Minutes' })}</dd>
                                                    </div>
                                                </div>

                                                <div className="pt-6 border-t border-white/5 flex items-start gap-4">
                                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                        <span className="material-symbols-outlined text-primary text-xl">verified</span>
                                                    </div>
                                                    <div className="space-y-1 pt-1">
                                                        <dt className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{t('news.modal.verification')}</dt>
                                                        <dd className="text-sm font-black text-primary uppercase tracking-tight">
                                                            {t('news.modal.secured')}
                                                        </dd>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setSelectedArticle(null)}
                                                className="btn-premium w-full h-14 flex items-center justify-center gap-3 shadow-[0_10px_30px_-10px_rgba(19,236,164,0.3)] hover:shadow-[0_10px_40px_-10px_rgba(19,236,164,0.5)] transition-shadow duration-300"
                                            >
                                                <span className="material-symbols-outlined text-lg">first_page</span>
                                                <span className="font-bold tracking-widest text-sm">{t('news.modal.return')}</span>
                                            </button>
                                        </Reveal>
                                    </aside>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}