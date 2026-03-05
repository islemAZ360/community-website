import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Newspaper, Calendar, Loader2, Image as ImageIcon, ArrowRight, Star, X, Terminal, Share2, Bookmark } from 'lucide-react';
import { format } from 'date-fns';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    isFeatured?: boolean;
    createdAt: any;
}

export function News() {
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
            // Sort: featured first, then by date
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

    if (loading) return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <div className="absolute inset-0 blur-xl bg-emerald-500/20 animate-pulse" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/40">Syncing Intelligence Manifest...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-20 animate-in fade-in duration-1000">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/[0.03] pb-12">
                <div className="flex items-center gap-8">
                    <div className="h-24 w-24 bg-white/[0.02] rounded-[32px] flex items-center justify-center text-emerald-400 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative group">
                        <div className="absolute inset-0 bg-emerald-500/5 blur-2xl rounded-full group-hover:bg-emerald-500/10 transition-all" />
                        <Newspaper size={44} className="relative z-10" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2">
                            <Terminal size={12} /> Live Frequency Active
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter holographic-text">Latest <span className="text-white/40 font-light">Intel</span></h1>
                        <p className="text-sm font-bold text-zinc-500 mt-2 uppercase tracking-widest flex items-center gap-3">
                            Internal Tactical Broadcast Agency <span className="h-1 w-1 rounded-full bg-zinc-800" /> v4.0.2
                        </p>
                    </div>
                </div>
            </header>

            {news.length === 0 ? (
                <div className="glass-panel p-24 rounded-[48px] text-center flex flex-col items-center justify-center space-y-8 border-dashed border-zinc-900 bg-zinc-900/10">
                    <div className="p-8 bg-zinc-900/50 rounded-full text-zinc-800">
                        <Newspaper size={80} />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-zinc-700 uppercase tracking-tighter">Transmission Clear</h3>
                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No active tactical broadcasts detected at this frequency.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-24">
                    {/* Featured Hero Article */}
                    {featuredArticle && (
                        <article
                            className="relative rounded-[48px] overflow-hidden group border border-white/[0.03] hover:border-emerald-500/20 transition-all duration-700 shadow-2xl bg-zinc-900/40"
                            onClick={() => setSelectedArticle(featuredArticle)}
                        >
                            <div className="grid lg:grid-cols-2 h-full min-h-[500px]">
                                <div className="relative overflow-hidden h-[400px] lg:h-auto">
                                    <div className="absolute top-8 left-8 z-20 flex gap-3">
                                        <div className="bg-amber-500 text-black px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl backdrop-blur-md">
                                            <Star size={14} fill="currentColor" /> Featured Intel
                                        </div>
                                        <div className="bg-black/60 text-white/60 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 backdrop-blur-md border border-white/5">
                                            <Terminal size={14} /> Priority One
                                        </div>
                                    </div>

                                    {featuredArticle.imageUrl ? (
                                        <img
                                            src={featuredArticle.imageUrl}
                                            alt={featuredArticle.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 filter brightness-75 group-hover:brightness-100"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-800 bg-zinc-900 transition-colors group-hover:bg-zinc-800">
                                            <ImageIcon size={120} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent lg:bg-gradient-to-r" />
                                </div>

                                <div className="p-12 lg:p-20 space-y-8 flex flex-col justify-center relative bg-gradient-to-br from-white/[0.02] to-transparent">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                                            <Calendar size={16} />
                                            {(() => {
                                                if (!featuredArticle.createdAt) return 'Recent Transmission';
                                                const date = featuredArticle.createdAt.toDate ? featuredArticle.createdAt.toDate() : new Date(featuredArticle.createdAt);
                                                return format(date, 'MMMM dd, yyyy');
                                            })()}
                                        </div>
                                        <h2 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-[1.1] group-hover:text-emerald-400 transition-colors">
                                            {featuredArticle.title}
                                        </h2>
                                    </div>

                                    <div className="prose prose-invert max-w-none text-zinc-400 font-medium leading-[1.8] line-clamp-4 text-base italic border-l-2 border-emerald-500/20 pl-8">
                                        {featuredArticle.content}
                                    </div>

                                    <div className="pt-8 flex items-center gap-6">
                                        <button
                                            className="flex items-center gap-4 px-8 py-4 bg-emerald-500 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_15px_40px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.4)] hover:bg-emerald-400 active:scale-95 transition-all outline-none"
                                        >
                                            Read Full Report <ArrowRight size={18} />
                                        </button>
                                        <div className="hidden sm:flex items-center gap-4">
                                            <button className="p-4 rounded-full bg-white/[0.03] border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
                                                <Share2 size={18} />
                                            </button>
                                            <button className="p-4 rounded-full bg-white/[0.03] border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
                                                <Bookmark size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    )}

                    {/* Other Intel Grid */}
                    {otherArticles.length > 0 && (
                        <div className="space-y-12">
                            <div className="flex items-center gap-6">
                                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] whitespace-nowrap">Intelligence Stream</h3>
                                <div className="h-px w-full bg-white/[0.03]" />
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {otherArticles.map(item => (
                                    <article
                                        key={item.id}
                                        onClick={() => setSelectedArticle(item)}
                                        className="glass-panel rounded-[36px] overflow-hidden group hover:bg-white/[0.04] transition-all duration-500 border-white/[0.03] flex flex-col cursor-pointer hover:translate-y-[-8px] shadow-xl"
                                    >
                                        <div className="h-56 relative overflow-hidden shrink-0">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-100"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-800 bg-zinc-900/50">
                                                    <ImageIcon size={48} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
                                        </div>

                                        <div className="p-8 space-y-5 flex-1 flex flex-col">
                                            <div className="flex items-center gap-3 text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                                                <Calendar size={12} />
                                                {(() => {
                                                    if (!item.createdAt) return 'Recent';
                                                    const date = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
                                                    return format(date, 'MMM dd, yyyy');
                                                })()}
                                            </div>

                                            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
                                                {item.title}
                                            </h2>

                                            <p className="text-xs font-medium text-zinc-500 leading-relaxed line-clamp-3 italic">
                                                {item.content}
                                            </p>

                                            <div className="pt-4 mt-auto">
                                                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white transition-all flex items-center gap-2">
                                                    Secure Access <ArrowRight size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Immersive Report Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-[#070708] w-full max-w-5xl max-h-full rounded-[48px] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(16,185,129,0.1)] relative flex flex-col animate-in zoom-in-95 duration-500">
                        {/* Modal Header Actions */}
                        <div className="absolute top-8 right-8 z-[110] flex gap-4">
                            <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all backdrop-blur-md border border-white/5">
                                <Share2 size={20} />
                            </button>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="p-4 bg-white/5 hover:bg-red-500/20 rounded-2xl text-white/40 hover:text-red-500 transition-all backdrop-blur-md border border-white/5"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <div className="relative h-[300px] sm:h-[450px]">
                                {selectedArticle.imageUrl ? (
                                    <img
                                        src={selectedArticle.imageUrl}
                                        alt={selectedArticle.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-800">
                                        <ImageIcon size={80} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#070708] to-transparent" />

                                <div className="absolute bottom-12 left-12 right-12 space-y-4">
                                    <div className="flex items-center gap-4 text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em]">
                                        <Calendar size={16} />
                                        {(() => {
                                            if (!selectedArticle.createdAt) return 'Recent Transmission';
                                            const date = selectedArticle.createdAt.toDate ? selectedArticle.createdAt.toDate() : new Date(selectedArticle.createdAt);
                                            return format(date, 'MMMM dd, yyyy');
                                        })()}
                                    </div>
                                    <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-2xl">
                                        {selectedArticle.title}
                                    </h2>
                                </div>
                            </div>

                            <div className="p-12 sm:p-20 pt-8 sm:pt-12 space-y-12">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                        <ShieldCheck className="w-4 h-4" /> Authenticated Source
                                    </div>
                                    <div className="h-px flex-1 bg-white/[0.05]" />
                                </div>

                                <div className="prose prose-invert max-w-none">
                                    <p className="text-lg sm:text-xl text-zinc-300 font-medium leading-[1.8] italic whitespace-pre-wrap selection:bg-emerald-500/30">
                                        {selectedArticle.content}
                                    </p>
                                </div>

                                <div className="pt-12 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                        Broadcast Identifier: <span className="text-zinc-400">{selectedArticle.id.toUpperCase()}</span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedArticle(null)}
                                        className="w-full sm:w-auto px-12 py-5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-zinc-300 transition-all outline-none"
                                    >
                                        Close Manifest
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
