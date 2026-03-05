import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { Newspaper, Calendar, Loader2, Image as ImageIcon, ArrowRight, Star, X, Terminal, Shield, Zap, Activity, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    isFeatured?: boolean;
    poll?: {
        question: string;
        options: { id: string; text: string; votes: number }[];
        voters: string[];
    } | null;
    createdAt: any;
}

export function News() {
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

    if (loading) return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <div className="absolute inset-0 blur-xl bg-emerald-500/20 animate-pulse" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/40">Synchronizing Tactical Feed...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-12 animate-in fade-in duration-1000">
            {/* Tactical Header */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/[0.03] pb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 py-1.5 px-3 bg-emerald-500/5 text-emerald-500/40 text-[7px] font-mono tracking-tighter hidden md:block border-l border-b border-white/5 uppercase rounded-bl-lg">
                    Frequency: 2.44GHz // Status: encrypted // Ping: 14ms
                </div>
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/[0.02] rounded-2xl flex items-center justify-center text-emerald-400 border border-white/5 shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/5 blur-xl rounded-full group-hover:bg-emerald-500/10 transition-all" />
                        <div className="absolute inset-x-0 h-px top-0 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent animate-scan" />
                        <Newspaper size={32} className="relative z-10" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-[8px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-1">
                            <Activity size={10} className="animate-pulse" /> Live Intel Node Activated
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter holographic-text">Latest <span className="text-white/40 font-light">Intel</span></h1>
                        <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest flex items-center gap-2">
                            Direct Tactical Stream <span className="h-0.5 w-0.5 rounded-full bg-zinc-800" /> Source: iDIDDY Mainframe
                        </p>
                    </div>
                </div>
            </header>

            {news.length === 0 ? (
                <div className="glass-panel p-16 rounded-3xl text-center flex flex-col items-center justify-center space-y-6 border-dashed border-zinc-900 bg-zinc-900/10">
                    <div className="p-6 bg-zinc-900/50 rounded-full text-zinc-800">
                        <Newspaper size={60} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-zinc-700 uppercase tracking-tighter">Transmission Clear</h3>
                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No tactical broadcasts detected on this frequency.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Featured Hero Article */}
                    {featuredArticle && (
                        <article
                            className="relative rounded-3xl overflow-hidden group border border-white/[0.03] hover:border-emerald-500/20 transition-all duration-700 shadow-xl bg-zinc-900/40 cursor-pointer"
                            onClick={() => setSelectedArticle(featuredArticle)}
                        >
                            <div className="grid lg:grid-cols-2 h-full min-h-[350px]">
                                <div className="relative overflow-hidden h-[250px] lg:h-auto border-r border-white/5">
                                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                                        <div className="bg-amber-500 text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 shadow-2xl backdrop-blur-md">
                                            <Star size={12} fill="currentColor" /> Priority Intel
                                        </div>
                                    </div>

                                    {featuredArticle.imageUrl ? (
                                        <img
                                            src={featuredArticle.imageUrl}
                                            alt={featuredArticle.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 filter brightness-75 group-hover:brightness-100"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-800 bg-zinc-900">
                                            <ImageIcon size={80} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent lg:bg-gradient-to-r" />
                                </div>

                                <div className="p-8 lg:p-12 space-y-6 flex flex-col justify-center relative bg-gradient-to-br from-white/[0.02] to-transparent">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                                            <Calendar size={14} />
                                            {(() => {
                                                if (!featuredArticle.createdAt) return 'Recent Transmission';
                                                const date = featuredArticle.createdAt.toDate ? featuredArticle.createdAt.toDate() : new Date(featuredArticle.createdAt);
                                                return format(date, 'MMMM dd, yyyy');
                                            })()}
                                        </div>
                                        <h2 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter leading-tight group-hover:text-emerald-400 transition-colors">
                                            {featuredArticle.title}
                                        </h2>
                                    </div>

                                    <div className="prose prose-invert max-w-none text-zinc-400 font-medium leading-relaxed line-clamp-3 text-sm italic border-l-2 border-emerald-500/20 pl-6">
                                        {featuredArticle.content}
                                    </div>

                                    <div className="pt-4 flex flex-wrap items-center gap-6 border-t border-white/5">
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">Integrity Status</p>
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500">
                                                <Shield size={10} /> VERIFIED
                                            </div>
                                        </div>
                                        <button
                                            className="flex items-center gap-3 ml-auto px-6 py-3 bg-emerald-500 text-black rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-400 active:scale-95 transition-all outline-none"
                                        >
                                            Read Report <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    )}

                    {/* Other Intel Grid */}
                    {otherArticles.length > 0 && (
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <h3 className="text-[8px] font-black text-white/20 uppercase tracking-[0.6em] whitespace-nowrap flex items-center gap-2">
                                    <Terminal size={10} /> Tactical Stream
                                </h3>
                                <div className="h-px w-full bg-white/[0.03]" />
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherArticles.map(item => (
                                    <article
                                        key={item.id}
                                        onClick={() => setSelectedArticle(item)}
                                        className="glass-panel rounded-2xl overflow-hidden group hover:bg-white/[0.04] transition-all duration-500 border-white/[0.03] flex flex-col cursor-pointer shadow-lg relative"
                                    >
                                        <div className="h-40 relative overflow-hidden shrink-0">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-100"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-800 bg-zinc-900/50">
                                                    <ImageIcon size={32} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                                        </div>

                                        <div className="p-5 space-y-3 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                                                    <Calendar size={10} />
                                                    {(() => {
                                                        if (!item.createdAt) return 'Recent';
                                                        const date = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
                                                        return format(date, 'MMM dd, yyyy');
                                                    })()}
                                                </div>
                                            </div>

                                            <h2 className="text-sm font-black text-white uppercase tracking-tight leading-snug group-hover:text-emerald-400 transition-colors line-clamp-2">
                                                {item.title}
                                            </h2>

                                            <p className="text-[11px] font-medium text-zinc-500 leading-relaxed line-clamp-3 italic flex-1 border-l border-white/5 pl-3">
                                                {item.content}
                                            </p>

                                            <div className="pt-3 border-t border-white/[0.03] flex items-center justify-between">
                                                <div className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-emerald-500 transition-all">
                                                    Trace Report
                                                </div>
                                                <div className="text-[7px] font-mono text-white/10 uppercase tracking-tighter">
                                                    #{item.id.substring(0, 6)}
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="bg-[#070708] w-full max-w-5xl max-h-full rounded-[48px] overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(16,185,129,0.15)] relative flex flex-col animate-in zoom-in-95 duration-500">
                        {/* Close Action */}
                        <div className="absolute top-8 right-8 z-[110]">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="p-5 bg-white/5 hover:bg-red-500/20 rounded-2xl text-white/40 hover:text-red-500 transition-all backdrop-blur-md border border-white/5 group"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <div className="relative h-[300px] sm:h-[450px] border-b border-white/10">
                                {selectedArticle.imageUrl ? (
                                    <img
                                        src={selectedArticle.imageUrl}
                                        alt={selectedArticle.title}
                                        className="w-full h-full object-cover filter brightness-75"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-zinc-900/50 flex items-center justify-center text-zinc-800">
                                        <ImageIcon size={120} className="opacity-10" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-[#070708]/40 to-transparent" />
                                <div className="absolute top-8 left-8 p-4 bg-emerald-500/10 backdrop-blur-md rounded-2xl border border-emerald-500/20 flex flex-col gap-1">
                                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.4em]">Node Identifier</p>
                                    <p className="text-[10px] font-mono text-white/80 tracking-widest">{selectedArticle.id.toUpperCase()}</p>
                                </div>

                                <div className="absolute bottom-12 left-12 right-12 space-y-4">
                                    <div className="flex items-center gap-4 text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em]">
                                        <Calendar size={16} />
                                        {(() => {
                                            if (!selectedArticle.createdAt) return 'Recent Transmission';
                                            const date = selectedArticle.createdAt.toDate ? selectedArticle.createdAt.toDate() : new Date(selectedArticle.createdAt);
                                            return format(date, 'MMMM dd, yyyy');
                                        })()}
                                    </div>
                                    <h2 className="text-3xl sm:text-6xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-2xl">
                                        {selectedArticle.title}
                                    </h2>
                                </div>
                            </div>

                            <div className="p-12 sm:p-24 pt-8 sm:pt-16 space-y-16">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-3">
                                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 w-fit">
                                            <Shield size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Integrity</p>
                                            <p className="text-xs font-bold text-white tracking-wide uppercase">100% Reliable</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-3">
                                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 w-fit">
                                            <Terminal size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Protocol</p>
                                            <p className="text-xs font-bold text-white tracking-wide uppercase">Tactical.v4</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-3">
                                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 w-fit">
                                            <Zap size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Clearance</p>
                                            <p className="text-xs font-bold text-white tracking-wide uppercase">Unrestricted</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="prose prose-invert max-w-none">
                                    <p className="text-xl sm:text-2xl text-zinc-300 font-medium leading-relaxed italic whitespace-pre-wrap selection:bg-emerald-500/40 border-l-4 border-emerald-500/20 pl-12 py-4">
                                        {selectedArticle.content}
                                    </p>
                                </div>

                                {selectedArticle.poll && (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 sm:p-12 space-y-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Activity size={120} className="text-indigo-500" />
                                        </div>

                                        <div className="relative z-10 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                                                    <Zap size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Tactical Consensus</h3>
                                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Live Intelligence Gathering</p>
                                                </div>
                                            </div>
                                            <h4 className="text-lg sm:text-2xl font-bold text-white leading-tight pt-4">
                                                {selectedArticle.poll.question}
                                            </h4>
                                        </div>

                                        <div className="relative z-10 space-y-4">
                                            {(() => {
                                                const hasVoted = user && selectedArticle.poll.voters.includes(user.uid);
                                                const totalVotes = selectedArticle.poll.options.reduce((acc, opt) => acc + opt.votes, 0);

                                                return selectedArticle.poll.options.map((option) => {
                                                    const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

                                                    const handleVote = async () => {
                                                        if (!user) {
                                                            alert("Please sign in to participate in the tactical consensus.");
                                                            return;
                                                        }
                                                        if (hasVoted) return;

                                                        try {
                                                            const newsRef = doc(db, 'news', selectedArticle.id);
                                                            const newOptions = selectedArticle.poll!.options.map(opt => {
                                                                if (opt.id === option.id) {
                                                                    return { ...opt, votes: opt.votes + 1 };
                                                                }
                                                                return opt;
                                                            });

                                                            await updateDoc(newsRef, {
                                                                'poll.options': newOptions,
                                                                'poll.voters': arrayUnion(user.uid)
                                                            });
                                                        } catch (err) {
                                                            console.error("Error voting:", err);
                                                        }
                                                    };

                                                    return (
                                                        <button
                                                            key={option.id}
                                                            onClick={handleVote}
                                                            disabled={!!hasVoted}
                                                            className={`w-full relative h-16 rounded-2xl overflow-hidden border transition-all duration-500 group/opt ${hasVoted ? 'cursor-default border-white/10' : 'hover:border-indigo-500/50 border-white/10 hover:bg-white/[0.02]'}`}
                                                        >
                                                            {hasVoted && (
                                                                <div
                                                                    className="absolute inset-y-0 left-0 bg-indigo-500/10 transition-all duration-1000 ease-out"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            )}

                                                            <div className="absolute inset-0 px-6 flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${hasVoted && selectedArticle.poll!.voters.includes(user.uid) && option.votes > 0 ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/10 group-hover/opt:border-indigo-500/50'}`}>
                                                                        {hasVoted ? (
                                                                            <div className="text-[10px] font-black">{percentage}%</div>
                                                                        ) : (
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover/opt:bg-indigo-500 transition-colors" />
                                                                        )}
                                                                    </div>
                                                                    <span className={`text-sm font-bold uppercase tracking-tight transition-colors ${hasVoted ? 'text-white' : 'text-zinc-400 group-hover/opt:text-white'}`}>
                                                                        {option.text}
                                                                    </span>
                                                                </div>

                                                                {hasVoted && (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{option.votes} Votos</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>

                                        {user && selectedArticle.poll.voters.includes(user.uid) && (
                                            <div className="pt-4 flex items-center justify-center gap-2 text-indigo-400 animate-in fade-in zoom-in duration-500">
                                                <CheckCircle2 size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Intel Transmission Verified</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-16 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-12">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                            System Log Identifier: <span className="text-emerald-500/50">{selectedArticle.id}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                            Transmission Status: <span className="text-white/40 italic">COMPLETED // SUCCESS</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedArticle(null)}
                                        className="w-full sm:w-auto px-16 py-6 bg-emerald-500 text-black hover:bg-emerald-400 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] transition-all outline-none shadow-[0_15px_40px_rgba(16,185,129,0.2)]"
                                    >
                                        Close Intel Board
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
