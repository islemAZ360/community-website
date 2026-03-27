import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { Star, MessageSquare, Send, UserCircle2, ShieldCheck, Lock } from 'lucide-react';
import { Reveal } from './Reveal';

interface Review {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    createdAt: any;
    isAuthorized: boolean;
}

export const ReviewSection: React.FC = () => {
    const { user, userData } = useAuthStore();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAuthorized = !!userData?.licenseKey;

    useEffect(() => {
        const q = query(
            collection(db, 'reviews'),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Review));
            setReviews(reviewsList);
        });

        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !isAuthorized || !newComment.trim()) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'reviews'), {
                userId: user.uid,
                userName: userData?.nickname || 'Anonymous Agent',
                userAvatar: userData?.profilePicture || null,
                rating: newRating,
                comment: newComment,
                isAuthorized: true,
                createdAt: serverTimestamp()
            });
            setNewComment('');
            setNewRating(5);
        } catch (error) {
            console.error('Error adding review:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="px-6 lg:px-20 py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <Reveal amount={0.05}>
                    <div className="flex flex-col mb-16 text-center md:text-left rtl:md:text-right">
                        <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary text-sm">reviews</span>
                            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Agent Feedback</h2>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-6">User Reviews</h3>
                        <p className="max-w-xl text-white/40 text-lg font-medium">Hear from our authorized agents who have deployed OUR-FIX in high-stakes environments.</p>
                    </div>
                </Reveal>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Review Form - Left Column */}
                    <div className="lg:col-span-1">
                        <Reveal variant="scale" amount={0.05}>
                            <div className="glass p-8 rounded-[2.5rem] border border-white/5 sticky top-32">
                                {!user ? (
                                    <div className="text-center py-8 space-y-4">
                                        <div className="size-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-white/20">
                                            <UserCircle2 size={40} />
                                        </div>
                                        <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Login to share your experience</p>
                                    </div>
                                ) : !isAuthorized ? (
                                    <div className="text-center py-8 space-y-6">
                                        <div className="size-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
                                            <Lock size={32} />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-white font-black uppercase tracking-tight">Exclusive Review Access</h4>
                                            <p className="text-xs text-white/40 leading-relaxed uppercase tracking-wider">Only authorized agents with an active license can submit feedback to ensure 100% mission authenticity.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="size-12 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center text-primary">
                                                <MessageSquare size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black uppercase tracking-tight leading-none">Share Intel</h4>
                                                <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1">Authorized Protocol</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex gap-2 justify-center py-4 bg-white/5 rounded-2xl border border-white/5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setNewRating(star)}
                                                        className={`transition-all duration-300 ${star <= newRating ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-white/10 hover:text-white/30'}`}
                                                    >
                                                        <Star size={24} fill={star <= newRating ? 'currentColor' : 'none'} />
                                                    </button>
                                                ))}
                                            </div>

                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Write your review here..."
                                                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm placeholder:text-white/10 focus:outline-none focus:border-primary/40 focus:bg-white/[0.08] transition-all resize-none"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full h-14 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(19,236,164,0.3)] hover:shadow-[0_0_50px_rgba(19,236,164,0.5)] transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Transmitting...' : 'Submit Review'}
                                            <Send size={18} />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </Reveal>
                    </div>

                    {/* Reviews List - Right 2 Columns */}
                    <div className="lg:col-span-2 space-y-6">
                        {reviews.length === 0 ? (
                            <div className="glass p-20 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center opacity-40">
                                <MessageSquare size={48} className="mb-4" />
                                <p className="font-black uppercase tracking-widest text-sm">No Intel Transmitted Yet</p>
                            </div>
                        ) : (
                            reviews.map((review, idx) => (
                                <Reveal key={review.id} delay={idx * 0.1} variant="fadeUp" amount={0.05}>
                                    <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent group hover:border-white/10 transition-all duration-500">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-white/20">
                                                    {review.userAvatar ? (
                                                        <img src={review.userAvatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserCircle2 size={32} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="text-white font-black uppercase tracking-tight">{review.userName}</h5>
                                                        {review.isAuthorized && (
                                                            <div className="flex items-center gap-1 text-[8px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-widest">
                                                                <ShieldCheck size={10} /> Authorized
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 mt-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i} 
                                                                size={12} 
                                                                className={i < review.rating ? 'text-amber-400' : 'text-white/10'} 
                                                                fill={i < review.rating ? 'currentColor' : 'none'} 
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-mono text-white/20 uppercase">
                                                {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Decrypted Date'}
                                            </div>
                                        </div>
                                        <p className="text-white/60 text-sm leading-relaxed italic">
                                            "{review.comment}"
                                        </p>
                                    </div>
                                </Reveal>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
