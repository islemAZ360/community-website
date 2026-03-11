import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';


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
                    <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-500">Syncing Intelligence Feed...</span>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 lg:px-20 py-10 animate-in fade-in duration-1000">
            {/* Immersive Hero Section */}
            {featuredArticle && (
                <section className="relative group mb-20 cursor-pointer" onClick={() => setSelectedArticle(featuredArticle)}>
                    <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl shadow-2xl shadow-black/20 border border-white/5">
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/20 to-transparent z-10"></div>
                        {featuredArticle.imageUrl ? (
                            <img
                                src={featuredArticle.imageUrl}
                                alt={featuredArticle.title}
                                className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000 filter brightness-75 group-hover:brightness-90"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-700">
                                <span className="material-symbols-outlined text-9xl">newspaper</span>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 rtl:left-auto rtl:right-0 p-8 lg:p-12 z-20 max-w-3xl text-left rtl:text-right">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="inline-block text-primary text-[10px] font-bold uppercase tracking-[0.2em] bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">{t('news.featured.tag')}</span>
                                <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em]">{t('news.featured.priority')}</span>
                            </div>

                            <h1 className="text-3xl lg:text-5xl font-serif italic text-white leading-[1.1] mb-5 group-hover:text-primary transition-colors">
                                {featuredArticle.title}
                            </h1>
                            <p className="text-slate-300 text-base lg:text-lg max-w-xl mb-6 leading-relaxed line-clamp-2 font-medium opacity-80">
                                {featuredArticle.content}
                            </p>
                            <div className="flex items-center gap-5">
                                <button className="px-8 py-3 bg-white text-background-dark font-bold rounded-full hover:bg-primary transition-all duration-300 shadow-xl active:scale-95 text-sm">
                                    {t('news.featured.readStory')}
                                </button>

                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        {t('news.featured.readTime', { time: featuredArticle.readTime || '8 MIN' })} • {featuredArticle.author || t('news.featured.systemCore')}
                                    </span>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Latest Updates Grid */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-4">
                        <h3 className="font-serif text-3xl italic text-white">{t('news.latest.title')}</h3>
                        <div className="flex items-center gap-2 text-primary">
                            <span className="text-xs font-bold uppercase tracking-widest animate-pulse">{t('news.latest.liveFeed')}</span>
                            <div className="size-1.5 bg-primary rounded-full"></div>
                        </div>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {otherArticles.map(item => (
                            <div key={item.id} className="flex flex-col group cursor-pointer text-left rtl:text-right" onClick={() => setSelectedArticle(item)}>

                                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-6 shadow-2xl shadow-black/20 border border-white/5">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="size-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-100"
                                        />
                                    ) : (
                                        <div className="size-full bg-slate-900 flex items-center justify-center text-slate-700">
                                            <span className="material-symbols-outlined text-4xl">feed</span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-3">{item.category || 'Technology'}</span>
                                <h4 className="text-2xl font-serif italic leading-tight mb-4 group-hover:text-primary transition-colors text-slate-100">
                                    {item.title}
                                </h4>
                                <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed font-medium">
                                    {item.content}
                                </p>
                                <div className="mt-6 flex items-center gap-3 pt-6 border-t border-white/5 opacity-50">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {item.createdAt ? format(item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt), 'MMM dd, yyyy') : 'Recent'}
                                    </span>
                                    <div className="size-1 bg-slate-800 rounded-full"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trace #{item.id.substring(0, 6).toUpperCase()}</span>
                                </div>
                            </div>
                        ))}
                        {otherArticles.length === 0 && (
                            <div className="col-span-full py-20 text-center glass rounded-3xl border-dashed border-white/10">
                                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs italic">{t('news.latest.noStories')}</p>
                            </div>

                        )}
                    </div>
                </div>

                {/* Sidebar Content */}
                <aside className="lg:col-span-4 space-y-16">
                    {/* Hub Insights Poll */}
                    {featuredArticle?.poll && (
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-[8rem] text-primary">poll</span>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 mb-8">
                                <span className="material-symbols-outlined text-primary text-xl">insights</span>
                                <h3 className="font-bold uppercase tracking-[0.25rem] text-[10px] text-slate-400">Hub Insights Poll</h3>
                            </div>
                            <p className="text-2xl font-serif italic mb-8 text-white leading-snug">
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
                                                className={`w-full relative h-12 rounded-2xl overflow-hidden border transition-all duration-500 flex items-center px-5 ${hasVoted ? 'cursor-default border-white/5' : 'hover:border-primary/40 border-white/10 hover:bg-white/5 active:scale-[0.98]'} ${i18n.dir() === 'rtl' ? 'flex-row-reverse' : ''}`}
                                            >
                                                {hasVoted && (
                                                    <div
                                                        className={`absolute inset-y-0 bg-primary/10 transition-all duration-1000 ease-out ${i18n.dir() === 'rtl' ? 'right-0' : 'left-0'}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                )}

                                                <div className="relative z-20 flex justify-between w-full items-center">
                                                    <span className={`text-sm font-bold tracking-tight uppercase transition-colors ${hasVoted ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                                        {option.text}
                                                    </span>
                                                    {hasVoted && <span className="text-[10px] font-black text-primary">{percentage}%</span>}
                                                </div>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                            <p className="text-[8px] text-slate-500 mt-6 text-center uppercase tracking-[0.3em] font-black">
                                {t('news.sidebar.poll.transmissions', { count: featuredArticle.poll.voters.length })} • {t('news.sidebar.poll.consensus')}
                            </p>

                        </div>
                    )}

                    {/* Magazine Issue Section */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold uppercase tracking-[0.15em] text-[10px] text-slate-500">{t('news.sidebar.magazine.title')}</h3>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{format(new Date(), 'MMMM yyyy')}</span>
                        </div>

                        <div className="relative group cursor-pointer">
                            <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-white/5">
                                <img
                                    className="size-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO5h-C2KBXLfLen4RugZa7_HzkLhDOY9odWjgRYXrPRiOjDTARMzrQIdfhQM7Ctm-3PC8_KOPiLzX-jQMWkYGxRzyujXvz6k7sO5RpTeO5xugXGI9eZucdjEhHqIuSudcSKnUGQ41i0320CYqHHSigQiruHhfCo7ugzTKkq-DSSx0HYDfpMUXpyWTp5MnGQFhPBsv76BDZpXumpB-ImCbrpQ3a_CEe6DpWOpzqL3iYsdx2RbsL-_IAkDLJkthFlZSsZsSPB29yUJI"
                                    alt="Magazine Cover"
                                />
                                <div className="absolute inset-x-0 top-0 p-8 bg-gradient-to-b from-black/80 to-transparent text-left rtl:text-right">
                                    <h4 className="text-3xl font-serif italic text-white leading-tight whitespace-pre-line">{t('news.sidebar.magazine.edition')}</h4>
                                </div>

                            </div>
                            <div className="mt-6 flex justify-between items-end">
                                <div className="text-left rtl:text-right">
                                    <p className="font-serif italic text-xl text-white">{t('news.sidebar.magazine.artIntel')}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{t('news.sidebar.magazine.fieldReports', { count: 12 })}</p>
                                </div>

                                <button className="size-10 rounded-full bg-primary flex items-center justify-center text-background-dark shadow-xl hover:scale-110 transition-all active:scale-95">
                                    <span className="material-symbols-outlined text-xl font-bold">download</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Immersive Article Modal */}
            {selectedArticle && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12 animate-in fade-in duration-500"
                    onClick={() => setSelectedArticle(null)}
                >
                    <div className="absolute inset-0 bg-background-dark/95 backdrop-blur-3xl"></div>
                    <div
                        className="bg-background-dark w-full max-w-5xl max-h-full rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(19,236,164,0.15)] relative flex flex-col animate-in slide-in-from-bottom-12 duration-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Action */}
                        <div className="absolute top-8 right-8 z-[110]">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="size-14 bg-white/5 hover:bg-red-500/20 rounded-2xl text-white/50 hover:text-red-500 transition-all backdrop-blur-md border border-white/5 flex items-center justify-center group"
                            >
                                <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform">close</span>
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <div className="relative aspect-[21/9] lg:aspect-[21/7]">
                                {selectedArticle.imageUrl ? (
                                    <img
                                        src={selectedArticle.imageUrl}
                                        className="size-full object-cover brightness-50"
                                        alt={selectedArticle.title}
                                    />
                                ) : (
                                    <div className="size-full bg-slate-900 border-b border-white/10"></div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-10 lg:p-16 bg-gradient-to-t from-background-dark to-transparent text-left rtl:text-right">
                                    <div className="max-w-4xl">
                                        <span className="text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-3 inline-block">{selectedArticle.category || t('news.modal.category')}</span>
                                        <h2 className="text-3xl lg:text-5xl font-serif italic text-white leading-[1.1]">
                                            {selectedArticle.title}
                                        </h2>
                                    </div>
                                </div>

                            </div>

                            <div className="px-10 lg:px-16 pb-16 pt-8">
                                <div className="flex flex-col lg:flex-row gap-16">
                                    <div className="flex-1">
                                        <div className="prose prose-invert prose-lg max-w-none text-left rtl:text-right">
                                            <p className="text-2xl lg:text-3xl text-slate-300 font-serif italic leading-relaxed border-l-4 rtl:border-l-0 rtl:border-r-4 border-primary/20 pl-10 rtl:pl-0 rtl:pr-10 py-4 mb-12">
                                                {selectedArticle.content}
                                            </p>

                                            <div className="text-slate-400 font-medium leading-[1.8] text-lg space-y-6">
                                                {/* In a real app, content would be split or have more body. 
                                                   Using the content twice for visual density as in design. */}
                                                <p>{selectedArticle.content}</p>
                                                <p>Operational data retrieved from the Neural Engine indicates this development will significantly stabilize the node mesh across the secondary sector. The architecture proposed represents a paradigm shift in how we envision decentralized intelligence.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <aside className="w-full lg:w-80 shrink-0 space-y-12">
                                        <div className="glass p-8 rounded-3xl border-white/5 space-y-6 text-left rtl:text-right">
                                            <div className="space-y-1">
                                                <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('news.modal.published')}</dt>
                                                <dd className="text-sm font-bold text-slate-100 italic font-serif">
                                                    {selectedArticle.createdAt ? format(selectedArticle.createdAt.toDate ? selectedArticle.createdAt.toDate() : new Date(selectedArticle.createdAt), 'MMMM dd, yyyy') : t('news.latest.recent')}
                                                </dd>
                                            </div>

                                            <div className="space-y-1">
                                                <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('news.modal.readTime')}</dt>
                                                <dd className="text-sm font-bold text-slate-100 italic font-serif">{selectedArticle.readTime || t('news.featured.readTime', { time: '12 Minutes' })}</dd>
                                            </div>

                                            <div className="space-y-1">
                                                <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('news.modal.verification')}</dt>
                                                <dd className="text-sm font-bold text-primary flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">verified</span>
                                                    {t('news.modal.secured')}
                                                </dd>
                                            </div>

                                        </div>
                                        <button
                                            onClick={() => setSelectedArticle(null)}
                                            className="w-full py-5 bg-white text-background-dark font-bold rounded-2xl hover:bg-primary transition-all shadow-xl shadow-black/40 uppercase tracking-widest text-sm"
                                        >
                                            {t('news.modal.return')}
                                        </button>

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
