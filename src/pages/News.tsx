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
            <div className="flex-1 flex items-center justify-center p-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary animate-pulse">
                        <span className="material-symbols-outlined text-4xl">auto_awesome</span>
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 italic">Syncing Intelligence Feed...</span>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-20 py-24 aurora-bg animate-in fade-in duration-1000">
            {/* Immersive Hero Section */}
            <Reveal amount={0.25}>
                {featuredArticle && (
                    <section className="relative group mb-32 cursor-pointer" onClick={() => setSelectedArticle(featuredArticle)}>
                        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl shadow-2xl border border-white/5">
                            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/40 to-transparent z-10"></div>
                            {featuredArticle.imageUrl ? (
                                <img
                                    src={featuredArticle.imageUrl}
                                    alt={featuredArticle.title}
                                    className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-[2000ms] filter brightness-50 group-hover:brightness-75"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-white/5 flex items-center justify-center text-white/10">
                                    <span className="material-symbols-outlined text-9xl">newspaper</span>
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 rtl:left-auto rtl:right-0 p-12 lg:p-16 z-20 max-w-4xl text-left rtl:text-right">
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="inline-block text-primary text-[10px] font-black uppercase tracking-[0.4em] glass border-white/5 px-3 py-1.5 rounded-lg shadow-2xl">{t('news.featured.tag')}</span>
                                    <span className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em]">{t('news.featured.priority')}</span>
                                </div>

                                <h1 className="text-5xl lg:text-7xl font-black text-premium mb-8 leading-[0.9] uppercase italic tracking-tighter group-hover:tracking-tight transition-all duration-700">
                                    {featuredArticle.title}
                                </h1>
                                <p className="text-white/40 text-lg lg:text-xl max-w-2xl mb-10 leading-relaxed line-clamp-2 font-medium italic opacity-80 group-hover:opacity-100 group-hover:text-white/60 transition-all">
                                    {featuredArticle.content}
                                </p>
                                <div className="flex items-center gap-8">
                                    <button className="btn-premium px-10 py-4 flex items-center gap-3">
                                        <span>{t('news.featured.readStory')}</span>
                                        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <span className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">
                                            {t('news.featured.readTime', { time: featuredArticle.readTime || '8 MIN' })} • {featuredArticle.author || t('news.featured.systemCore')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                {/* Latest Updates Grid */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-16 border-b border-white/5 pb-8">
                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">{t('news.latest.title')}</h3>
                        <div className="flex items-center gap-3 px-4 py-2 glass border-white/5 rounded-2xl">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">{t('news.latest.liveFeed')}</span>
                            <div className="size-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(19,236,164,0.8)]"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {otherArticles.map((item, idx) => (
                            <Reveal key={item.id} delay={idx * 0.15} variant="fadeUp" amount={0.1}>
                                <div className="flex flex-col group cursor-pointer text-left rtl:text-right" onClick={() => setSelectedArticle(item)}>
                                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-8 shadow-2xl border border-white/5">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.title}
                                                className="size-full object-cover group-hover:scale-110 transition-transform duration-[1500ms] brightness-50 group-hover:brightness-90"
                                            />
                                        ) : (
                                            <div className="size-full bg-white/5 flex items-center justify-center text-white/10">
                                                <span className="material-symbols-outlined text-4xl">feed</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4 italic opacity-60">{item.category || 'Architecture'}</span>
                                    <h4 className="text-2xl font-black text-white italic leading-none mb-4 group-hover:text-primary transition-colors uppercase tracking-tighter">
                                        {item.title}
                                    </h4>
                                    <p className="text-white/40 text-sm line-clamp-3 leading-relaxed font-medium italic opacity-80 group-hover:text-white/60 transition-all">
                                        {item.content}
                                    </p>
                                    <div className="mt-8 flex items-center gap-4 pt-8 border-t border-white/5">
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">
                                            {item.createdAt ? format(item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt), 'MMM dd, yyyy') : 'Recent'}
                                        </span>
                                        <div className="size-1 bg-white/10 rounded-full"></div>
                                        <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em]">Signal #{item.id.substring(0, 6).toUpperCase()}</span>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    {otherArticles.length === 0 && (
                        <div className="col-span-full py-20 text-center glass rounded-3xl border-dashed border-white/10">
                            <p className="text-white/20 font-black uppercase tracking-[0.2em] text-[10px] italic">{t('news.latest.noStories')}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Content */}
                <aside className="lg:col-span-4 space-y-16">
                    {/* Hub Insights Poll */}
                    {featuredArticle?.poll && (
                        <div className="premium-card p-8 group">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <span className="material-symbols-outlined text-primary text-lg">insights</span>
                                </div>
                                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Hub Insights Poll</h3>
                            </div>
                            <p className="text-xl font-black text-white uppercase italic tracking-tighter mb-10 leading-none">
                                {featuredArticle.poll.question}
                            </p>
                            <div className="space-y-4">
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
                                                className={`w-full relative h-14 rounded-xl overflow-hidden glass border transition-all duration-500 flex items-center px-6 ${hasVoted ? 'cursor-default border-white/5' : 'hover:border-purple-500/30 border-white/5 hover:bg-white/5 active:scale-[0.98]'} ${i18n.dir() === 'rtl' ? 'flex-row-reverse' : ''}`}
                                            >
                                                {hasVoted && (
                                                    <div
                                                        className={`absolute inset-y-0 bg-primary/10 transition-all duration-1000 ease-out ${i18n.dir() === 'rtl' ? 'right-0' : 'left-0'}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                )}

                                                <div className="relative z-20 flex justify-between w-full items-center">
                                                    <span className={`text-[11px] font-black uppercase tracking-tight transition-colors ${hasVoted ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>
                                                        {option.text}
                                                    </span>
                                                    {hasVoted && <span className="text-[10px] font-black text-primary">{percentage}%</span>}
                                                </div>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                            <p className="text-[9px] text-white/20 mt-8 text-center uppercase tracking-[0.3em] font-black italic">
                                {t('news.sidebar.poll.transmissions', { count: featuredArticle.poll.voters.length })} • {t('news.sidebar.poll.consensus')}
                            </p>
                        </div>
                    )}

                    {/* Magazine Issue Section */}
                    <div className="space-y-10">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] italic">{t('news.sidebar.magazine.title')}</h3>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{format(new Date(), 'MMMM yyyy')}</span>
                        </div>

                        <div className="relative group cursor-pointer">
                            <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
                            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-white/5 shadow-2xl border border-white/5">
                                <img
                                    className="size-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] brightness-50 group-hover:brightness-75"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO5h-C2KBXLfLen4RugZa7_HzkLhDOY9odWjgRYXrPRiOjDTARMzrQIdfhQM7Ctm-3PC8_KOPiLzX-jQMWkYGxRzyujXvz6k7sO5RpTeO5xugXGI9eZucdjEhHqIuSudcSKnUGQ41i0320CYqHHSigQiruHhfCo7ugzTKkq-DSSx0HYDfpMUXpyWTp5MnGQFhPBsv76BDZpXumpB-ImCbrpQ3a_CEe6DpWOpzqL3iYsdx2RbsL-_IAkDLJkthFlZSsZsSPB29yUJI"
                                    alt="Magazine Cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent text-left rtl:text-right">
                                    <h4 className="text-3xl font-black text-white leading-none uppercase italic tracking-tighter">{t('news.sidebar.magazine.edition')}</h4>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-between items-center px-2">
                                <div className="text-left rtl:text-right">
                                    <p className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">{t('news.sidebar.magazine.artIntel')}</p>
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2">{t('news.sidebar.magazine.fieldReports', { count: 12 })}</p>
                                </div>

                                <button className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/40 transition-all hover:scale-110 active:scale-95 shadow-2xl">
                                    <span className="material-symbols-outlined text-2xl">download</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Article Detail Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-background-dark/95 backdrop-blur-xl" onClick={() => setSelectedArticle(null)}></div>

                    <div className="relative w-full max-w-7xl max-h-full glass rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-[0_0_100px_rgba(168,85,247,0.15)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
                        <button
                            onClick={() => setSelectedArticle(null)}
                            className="absolute top-8 right-8 z-50 size-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all hover:scale-110 active:scale-90"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <div className="relative aspect-video lg:aspect-[21/9]">
                                {selectedArticle.imageUrl ? (
                                    <img
                                        src={selectedArticle.imageUrl}
                                        className="size-full object-cover brightness-50"
                                        alt={selectedArticle.title}
                                    />
                                ) : (
                                    <div className="size-full bg-white/5"></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent z-10"></div>
                                <div className="absolute inset-x-0 bottom-0 p-12 lg:p-20 z-20 text-left rtl:text-right">
                                    <div className="max-w-4xl">
                                        <Reveal amount={0.1}>
                                            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-6 inline-block glass border-white/5 px-4 py-2 rounded-xl italic">{selectedArticle.category || t('news.modal.category')}</span>
                                            <h2 className="text-4xl lg:text-7xl font-black text-premium leading-[0.9] uppercase italic tracking-tighter">
                                                {selectedArticle.title}
                                            </h2>
                                        </Reveal>
                                    </div>
                                </div>
                            </div>

                            <div className="px-12 lg:px-20 pb-24 pt-16">
                                <div className="flex flex-col lg:flex-row gap-20">
                                    <div className="flex-1">
                                        <Reveal delay={0.2} amount={0.1}>
                                            <div className="prose prose-invert prose-lg max-w-none text-left rtl:text-right">
                                                <p className="text-2xl lg:text-3xl text-white font-black italic uppercase tracking-tighter leading-none border-l-8 rtl:border-l-0 rtl:border-r-8 border-primary/30 pl-12 rtl:pl-0 rtl:pr-12 py-6 mb-16 shadow-2xl">
                                                    {selectedArticle.content}
                                                </p>

                                                <div className="text-white/40 font-medium leading-relaxed text-lg space-y-10 italic">
                                                    <p>{selectedArticle.content}</p>
                                                    <p>Operational data retrieved from the Neural Engine indicates this development will significantly stabilize the node mesh across the secondary sector. The architecture proposed represents a paradigm shift in how we envision decentralized intelligence.</p>
                                                    <p>Strategic deployment of these protocols ensures maximum stealth and efficiency in technical assessments. Our proprietary algorithms continue to evolve, providing unparalleled depth to candidate evaluation metrics.</p>
                                                </div>
                                            </div>
                                        </Reveal>
                                    </div>
                                    <aside className="w-full lg:w-96 shrink-0">
                                        <Reveal delay={0.4} variant="fadeUp" amount={0.1}>
                                            <div className="premium-card p-10 space-y-10 text-left rtl:text-right mb-10">
                                                <div className="space-y-2">
                                                    <dt className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">{t('news.modal.published')}</dt>
                                                    <dd className="text-base font-black text-white italic uppercase tracking-tight">
                                                        {selectedArticle.createdAt ? format(selectedArticle.createdAt.toDate ? selectedArticle.createdAt.toDate() : new Date(selectedArticle.createdAt), 'MMMM dd, yyyy') : t('news.latest.recent')}
                                                    </dd>
                                                </div>

                                                <div className="space-y-2">
                                                    <dt className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">{t('news.modal.readTime')}</dt>
                                                    <dd className="text-base font-black text-white italic uppercase tracking-tight">{selectedArticle.readTime || t('news.featured.readTime', { time: '12 Minutes' })}</dd>
                                                </div>

                                                <div className="space-y-2 pt-8 border-t border-white/5">
                                                    <dt className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">{t('news.modal.verification')}</dt>
                                                    <dd className="text-base font-black text-primary flex items-center gap-3 italic uppercase tracking-tight">
                                                        <span className="material-symbols-outlined text-xl">verified</span>
                                                        {t('news.modal.secured')}
                                                    </dd>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setSelectedArticle(null)}
                                                className="btn-premium w-full py-6 text-sm flex items-center justify-center gap-4"
                                            >
                                                <span className="material-symbols-outlined">first_page</span>
                                                <span>{t('news.modal.return')}</span>
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
