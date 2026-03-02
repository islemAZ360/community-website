import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Newspaper, Calendar, Loader2, Image as ImageIcon } from 'lucide-react';
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

    if (loading) return <div className="p-8 text-center text-zinc-500 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
            <header className="flex items-center gap-4 glass-panel p-6 rounded-2xl">
                <div className="h-16 w-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                    <Newspaper size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">News & Updates</h1>
                    <p className="text-zinc-400 mt-1">
                        Stay up to date with the latest announcements.
                    </p>
                </div>
            </header>

            {news.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center justify-center space-y-4 border border-white/5 border-dashed">
                    <Newspaper size={48} className="text-zinc-600" />
                    <p className="text-zinc-400">There are no news updates at the moment.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {news.map(item => (
                        <article key={item.id} className="glass-panel rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors">
                            {item.imageUrl && (
                                <div className="w-full h-64 bg-zinc-900 border-b border-white/5 relative group">
                                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600 group-hover:text-zinc-500 transition-colors">
                                        <ImageIcon size={48} />
                                    </div>
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover relative z-10"
                                    />
                                </div>
                            )}
                            <div className="p-6 md:p-8 space-y-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">{item.title}</h2>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                        <Calendar size={14} />
                                        {item.createdAt?.toDate ? format(item.createdAt.toDate(), 'MMMM d, yyyy - h:mm a') : 'Recently'}
                                    </div>
                                </div>

                                <div className="prose prose-invert max-w-none text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                    {item.content}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
