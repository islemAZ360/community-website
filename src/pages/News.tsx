import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Newspaper, Calendar, Loader2, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    createdAt: any;
}

export function News() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

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
            setNews(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/20">Syncing Frequencies...</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-indigo-500/10 rounded-[24px] flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                        <Newspaper size={40} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter holographic-text">Latest <span className="text-white/40 font-light">Intel</span></h1>
                        <p className="text-sm font-bold text-zinc-500 mt-1 uppercase tracking-widest">
                            Stay ahead with the latest core updates.
                        </p>
                    </div>
                </div>
            </header>

            {news.length === 0 ? (
                <div className="glass-panel p-20 rounded-[40px] text-center flex flex-col items-center justify-center space-y-6 border-dashed border-zinc-800">
                    <Newspaper size={64} className="text-zinc-800" />
                    <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">Transmission clear. No new intel detected.</p>
                </div>
            ) : (
                <div className="grid gap-12">
                    {news.map(item => (
                        <article key={item.id} className="glass-panel rounded-[40px] overflow-hidden group hover:bg-white/[0.04] transition-all duration-500 border-white/[0.03]">
                            <div className="grid md:grid-cols-2">
                                <div className="h-80 md:h-auto bg-zinc-900/50 relative overflow-hidden">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-800">
                                            <ImageIcon size={64} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent md:bg-gradient-to-r" />
                                </div>

                                <div className="p-10 md:p-14 space-y-6 flex flex-col justify-center">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                                            <Calendar size={14} />
                                            {item.createdAt?.toDate ? format(item.createdAt.toDate(), 'MMMM dd, yyyy') : 'Recent'}
                                        </div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{item.title}</h2>
                                    </div>

                                    <div className="prose prose-invert max-w-none text-sm font-medium text-zinc-400 line-clamp-4 leading-relaxed italic">
                                        {item.content}
                                    </div>

                                    <div className="pt-4">
                                        <button className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-all">
                                            Read Full Report <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
