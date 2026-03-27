import React, { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from "framer-motion";
import { 
    X, QrCode, CreditCard, Send, CheckCircle2, AlertCircle, Loader2,
    Star, MessageSquare, UserCircle2, ShieldCheck, Lock,
    Mail, Camera, Save, Copy, Check
} from 'lucide-react';
import { 
    collection, query, orderBy, limit, onSnapshot, addDoc, 
    serverTimestamp, doc, updateDoc, getDocs, where, getDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { sendTelegramMessage } from '../lib/telegram';

// --- Types & Interfaces ---

export type RevealVariant = "fadeUp" | "fade" | "scale";

interface RevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    once?: boolean;
    amount?: number;
    variant?: RevealVariant;
}

interface AppVersion {
    id: string;
    version: string;
    releaseNotes: string;
    downloadUrl: string;
    releaseDate: string | Date;
    isLatest: boolean;
}

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

// --- Internal Components ---

const revealVariants: Record<RevealVariant, any> = {
    fadeUp: {
        hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)" },
    },
    fade: {
        hidden: { opacity: 0, filter: "blur(10px)" },
        show: { opacity: 1, filter: "blur(0px)" },
    },
    scale: {
        hidden: { opacity: 0, scale: 0.9, filter: "blur(10px)" },
        show: { opacity: 1, scale: 1, filter: "blur(0px)" },
    },
};

const Reveal: React.FC<RevealProps> = ({
    children,
    className,
    delay = 0,
    duration = 0.7,
    once = true,
    amount = 0.2,
    variant = "fadeUp",
}) => {
    const reduce = useReducedMotion();
    if (reduce) return <div className={className}>{children}</div>;

    return (
        <motion.div
            className={className}
            variants={revealVariants[variant]}
            initial="hidden"
            whileInView="show"
            viewport={{ once, amount }}
            transition={{
                duration,
                delay,
                ease: [0.22, 1, 0.36, 1],
            }}
            style={{ willChange: "transform, opacity, filter" }}
        >
            {children}
        </motion.div>
    );
};

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: {
        name: string;
        price: string;
        key: string;
    } | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, plan }) => {
    const { user, userData } = useAuthStore();
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !plan || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transactionId.trim()) {
            setError('Please enter your Transaction ID');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await addDoc(collection(db, 'payment_requests'), {
                userId: user.uid,
                userEmail: user.email,
                userName: userData?.nickname || 'Anonymous',
                planKey: plan.key,
                planName: plan.name,
                amount: plan.price,
                transactionId: transactionId,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            const message = `
🚀 <b>New Payment Request!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>User:</b> ${userData?.nickname || 'Anonymous'}
📧 <b>Email:</b> ${user.email}
📦 <b>Plan:</b> ${plan.name} (${plan.price} RUB)
🆔 <b>Transaction:</b> <code>${transactionId}</code>
━━━━━━━━━━━━━━━━━━
<i>Verify the payment in your bank app and approve via the Admin Dashboard.</i>
            `;
            
            const replyMarkup = {
                inline_keyboard: [[{ text: '🌐 Open Admin Dashboard', url: 'https://cod-admin.vercel.app/' }]]
            };

            await sendTelegramMessage('5071905656', message.trim(), replyMarkup);

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setTransactionId('');
            }, 5000);
        } catch (err) {
            console.error('Payment submission error:', err);
            setError('Failed to submit. Please contact admin directly.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="bg-[#050505]/90 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(19,236,164,0.1)] relative animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all z-20">
                    <X size={20} />
                </button>

                {isSuccess ? (
                    <div className="p-12 text-center space-y-6">
                        <div className="size-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto border border-primary/30 shadow-[0_0_30px_rgba(19,236,164,0.3)]">
                            <CheckCircle2 size={48} className="text-primary animate-bounce" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Mission Transmitted</h3>
                        <p className="text-white/50 text-sm leading-relaxed max-w-sm mx-auto">
                            Your payment details are now being verified by the Tactical Hub. Activation will be complete within minutes.
                        </p>
                        <div className="pt-4">
                            <button onClick={onClose} className="px-8 py-3 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-xl">Acknowledged</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full max-h-[90vh]">
                        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                    <CreditCard size={20} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Strategic Acquisition</h3>
                            </div>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] font-mono">Initializing Protocol: {plan.name}</p>
                        </div>

                        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-6 bg-primary/20 rounded-md flex items-center justify-center text-primary font-black text-[10px]">01</div>
                                    <h4 className="text-xs font-black text-white/80 uppercase tracking-widest">Scan & Transfer</h4>
                                </div>
                                <div className="glass p-6 rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent flex flex-col items-center gap-6">
                                    <div className="relative group">
                                        <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                        <div className="relative bg-white p-3 rounded-2xl shadow-2xl overflow-hidden">
                                            <img src="/QR_code.jpg" alt="Payment QR" className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-lg" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <div className="flex items-center justify-center gap-2 text-2xl font-black text-white italic">
                                            <span>{plan.price}</span>
                                            <span className="text-primary tracking-tighter italic">RUB</span>
                                        </div>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">Scan via your Banking App (SBP)</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-6 bg-primary/20 rounded-md flex items-center justify-center text-primary font-black text-[10px]">02</div>
                                        <h4 className="text-xs font-black text-white/80 uppercase tracking-widest">Verify Transaction</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">Terminal Reference (ID)</label>
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                placeholder="Enter Transaction ID from Bank..." 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-primary/40 focus:bg-white/[0.08] transition-all text-sm font-mono"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary/40 transition-colors">
                                                <QrCode size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
                                        <AlertCircle size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                                    </div>
                                )}

                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(19,236,164,0.3)] hover:shadow-[0_0_50px_rgba(19,236,164,0.5)] transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 size={18} className="animate-spin" /><span>Transmitting Signal...</span></>
                                    ) : (
                                        <><Send size={18} /><span>Transmit Proof of Payment</span></>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ReviewSection: React.FC = () => {
    const { user, userData } = useAuthStore();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAuthorized = userData?.status === 'approved' && !!userData?.licenseKey;

    useEffect(() => {
        const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
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
                    <div className="lg:col-span-1">
                        <Reveal variant="scale" amount={0.05}>
                            <div className="glass p-8 rounded-[2.5rem] border border-white/5 sticky top-32">
                                {!user ? (
                                    <div className="text-center py-8 space-y-4">
                                        <div className="size-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-white/20"><UserCircle2 size={40} /></div>
                                        <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Login to share your experience</p>
                                    </div>
                                ) : !isAuthorized ? (
                                    <div className="text-center py-8 space-y-6">
                                        <div className="size-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20"><Lock size={32} /></div>
                                        <div className="space-y-2">
                                            <h4 className="text-white font-black uppercase tracking-tight">Exclusive Review Access</h4>
                                            <p className="text-xs text-white/40 leading-relaxed uppercase tracking-wider">Only authorized agents with an active license can submit feedback.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="size-12 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-center text-primary"><MessageSquare size={24} /></div>
                                            <div><h4 className="text-white font-black uppercase tracking-tight leading-none">Share Intel</h4><p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1">Authorized Protocol</p></div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex gap-2 justify-center py-4 bg-white/5 rounded-2xl border border-white/5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button key={star} type="button" onClick={() => setNewRating(star)} className={`transition-all duration-300 ${star <= newRating ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-white/10 hover:text-white/30'}`}>
                                                        <Star size={24} fill={star <= newRating ? 'currentColor' : 'none'} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Write your review here..."
                                                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-primary/40 transition-all resize-none" required
                                            />
                                        </div>
                                        <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(19,236,164,0.3)] transition-all hover:scale-[1.02] flex items-center justify-center gap-3">
                                            {isSubmitting ? 'Transmitting...' : 'Submit Review'}<Send size={18} />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </Reveal>
                    </div>

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
                                                    {review.userAvatar ? <img src={review.userAvatar} alt="" className="w-full h-full object-cover" /> : <UserCircle2 size={32} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="text-white font-black uppercase tracking-tight">{review.userName}</h5>
                                                        {review.isAuthorized && (
                                                            <div className="flex items-center gap-1 text-[8px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-widest"><ShieldCheck size={10} /> Authorized</div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 mt-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={12} className={i < review.rating ? 'text-amber-400' : 'text-white/10'} fill={i < review.rating ? 'currentColor' : 'none'} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-mono text-white/20 uppercase">
                                                {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Decrypted Date'}
                                            </div>
                                        </div>
                                        <p className="text-white/60 text-sm leading-relaxed italic">"{review.comment}"</p>
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

// --- Main Home Component ---

export function Home() {
    const { t, i18n } = useTranslation();
    const [latestVersion, setLatestVersion] = useState<AppVersion | null>(null);
    const [olderVersions, setOlderVersions] = useState<AppVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [selectedPlan, setSelectedPlan] = useState<{ name: string, price: string, key: string } | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const instructionalVideos = [
        { src: "https://media.githubusercontent.com/media/islemAZ360/community-website/main/public/how-to-use.mp4", title: "How to use Our-Fix" },
        { src: "https://media.githubusercontent.com/media/islemAZ360/community-website/main/public/how-to-get-free-api.mp4", title: "How to get free API" }
    ];

    const nextVideo = () => setCurrentVideoIndex((prev) => (prev + 1) % instructionalVideos.length);
    const prevVideo = () => setCurrentVideoIndex((prev) => (prev - 1 + instructionalVideos.length) % instructionalVideos.length);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const response = await fetch('https://api.github.com/repos/islemAZ360/DODI-Releases/releases');
                if (!response.ok) throw new Error('Failed to fetch releases');
                const data = await response.json();
                const versions: AppVersion[] = data.map((release: any) => {
                    const rawVersion = release.tag_name || release.name;
                    const cleanVersion = rawVersion.startsWith('v') ? rawVersion.slice(1) : rawVersion;
                    const exeAsset = release.assets?.find((a: any) => a.name.toLowerCase().endsWith('.exe') || a.name.toLowerCase().includes('setup'));
                    return {
                        id: release.id.toString(),
                        version: cleanVersion,
                        releaseNotes: release.body || 'No release notes provided.',
                        downloadUrl: exeAsset ? exeAsset.browser_download_url : release.html_url,
                        releaseDate: new Date(release.published_at),
                        isLatest: false
                    };
                });
                if (versions.length > 0) {
                    versions[0].isLatest = true;
                    setLatestVersion(versions[0]);
                    setOlderVersions(versions.slice(1));
                }
            } catch (error) {
                console.error("Error fetching versions from GitHub:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVersions();
        const titles: { [key: string]: string } = {
            ar: 'الرئيسية | OUR-FIX - مساعد المقابلات التقنية الذكي',
            en: 'Home | OUR-FIX - AI Technical Interview Assistant',
            ru: 'Главная | OUR-FIX - ИИ помощник для собеседований'
        };
        document.title = titles[i18n.language] || titles.en;
    }, [i18n.language]);

    return (
        <div className="flex-1 flex flex-col w-full overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-32 px-6 lg:px-20 overflow-hidden flex flex-col items-center justify-center min-h-[85vh]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-40 pointer-events-none mix-blend-screen"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sky-500/10 blur-[150px] rounded-full opacity-30 pointer-events-none"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10 w-full flex flex-col items-center">
                    <Reveal amount={0.05}>
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-white/10 mb-10 shadow-[0_0_30px_rgba(19,236,164,0.15)]">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                            </span>
                            <span className="text-[11px] font-black tracking-[0.3em] uppercase text-primary/90">Tactical Mesh: v5.2.0 • Online</span>
                        </div>
                    </Reveal>
                    <Reveal delay={0.1} amount={0.05}><h1 className="text-6xl md:text-8xl lg:text-[8rem] font-black text-white mb-8 leading-[0.85] uppercase tracking-tighter drop-shadow-[0_0_40px_rgba(19,236,164,0.3)]">Tactical<br />Mesh</h1></Reveal>
                    <Reveal delay={0.2} amount={0.05}><p className="max-w-2xl mx-auto text-base md:text-xl text-white/50 leading-relaxed mb-12 font-medium italic">{i18n.language === 'en' ? "The undetectable tactical companion for technical interviews." : t('home.hero.subtitle')}</p></Reveal>
                    <Reveal delay={0.3} amount={0.05}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
                            {loading ? <div className="h-14 w-full sm:w-72 bg-white/5 rounded-2xl animate-pulse" /> : latestVersion ? (
                                <a href={latestVersion.downloadUrl} target="_blank" rel="noopener noreferrer" className="btn-premium flex items-center justify-center gap-4 h-14 px-8 w-full sm:w-auto transition-all duration-500">
                                    <span className="text-sm tracking-wider font-bold">{t('home.hero.downloadLatest', { version: latestVersion.version })}</span>
                                    <span className="material-symbols-outlined text-xl">download</span>
                                </a>
                            ) : (
                                <div className="glass px-8 h-14 rounded-2xl flex items-center justify-center gap-3 w-full sm:w-auto"><span className="material-symbols-outlined animate-spin text-primary">refresh</span><span className="text-sm font-bold uppercase tracking-widest">{t('home.hero.checkingUpdates')}</span></div>
                            )}
                            <a href="https://github.com/islemAZ360/DODI-Releases" target="_blank" rel="noopener noreferrer" className="h-14 px-8 glass flex items-center justify-center rounded-2xl text-white/70 font-black text-sm uppercase tracking-[0.2em] border border-white/10 w-full sm:w-auto">{t('home.hero.viewDocs')}</a>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Video Showcase Section */}
            <section className="px-6 lg:px-20 py-24 relative z-20">
                <Reveal delay={0.05} amount={0.05}>
                    <div className="max-w-5xl mx-auto flex flex-col items-center">
                        <div className="relative w-full aspect-video rounded-[2rem] glass p-2 sm:p-3 overflow-hidden border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] group bg-white/[0.02]">
                            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/50 rounded-tl-[2rem] z-20 opacity-50"></div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/50 rounded-br-[2rem] z-20 opacity-50"></div>
                            <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden bg-black/80">
                                <video controls preload="metadata" playsInline className="absolute inset-0 w-full h-full object-cover" src={instructionalVideos[currentVideoIndex].src} />
                                <button onClick={prevVideo} className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/40 border border-white/10 text-white flex items-center justify-center hover:bg-primary/20 transition-all opacity-0 group-hover:opacity-100 z-30"><span className="material-symbols-outlined text-2xl">chevron_left</span></button>
                                <button onClick={nextVideo} className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/40 border border-white/10 text-white flex items-center justify-center hover:bg-primary/20 transition-all opacity-0 group-hover:opacity-100 z-30"><span className="material-symbols-outlined text-2xl">chevron_right</span></button>
                            </div>
                        </div>
                        <div className="mt-8 text-center flex flex-col items-center justify-center gap-5">
                            <p className="text-lg font-black tracking-[0.2em] text-white uppercase opacity-90">{instructionalVideos[currentVideoIndex].title}</p>
                            <div className="flex gap-3">{instructionalVideos.map((_, idx) => (
                                <button key={idx} onClick={() => setCurrentVideoIndex(idx)} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentVideoIndex ? 'w-10 bg-primary shadow-[0_0_15px_rgba(19,236,164,0.8)]' : 'w-3 bg-white/20'}`} />
                            ))}</div>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* Metrics Grid */}
            <section className="px-6 lg:px-20 py-24 border-y border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: 'hub', label: t('home.metrics.activeNodes'), value: '1.2M+', growth: '+12%', progress: '75%', color: 'text-primary', bg: 'bg-primary' },
                        { icon: 'bolt', label: t('home.metrics.latency'), value: '< 2ms', growth: '-5%', progress: '100%', color: 'text-sky-400', bg: 'bg-sky-400' },
                        { icon: 'shield', label: t('home.metrics.encryption'), value: t('home.metrics.military'), growth: 'v256-bit', progress: '85%', color: 'text-purple-400', bg: 'bg-purple-400' }
                    ].map((metric, idx) => (
                        <Reveal key={idx} delay={idx * 0.1} variant="fadeUp" amount={0.05}>
                            <div className="glass p-10 rounded-[2rem] group relative overflow-hidden border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1">
                                <div className="absolute -top-6 -right-6 p-8 opacity-[0.03] group-hover:opacity-10 transition-all group-hover:scale-125 group-hover:rotate-12 pointer-events-none"><span className={`material-symbols-outlined text-[120px] ${metric.color}`}>{metric.icon}</span></div>
                                <div className={`size-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform`}><span className={`material-symbols-outlined text-2xl ${metric.color}`}>{metric.icon}</span></div>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{metric.label}</p>
                                <div className="flex items-baseline gap-4 mb-8"><h3 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">{metric.value}</h3><span className={`${metric.color} text-xs font-bold px-2 py-1 rounded-md bg-white/5`}>{metric.growth}</span></div>
                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5"><div className={`h-full ${metric.bg} rounded-full transition-all duration-1000`} style={{ width: metric.progress }}></div></div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* Features Matrix */}
            <section className="px-6 lg:px-20 py-24">
                <div className="max-w-7xl mx-auto">
                    <Reveal amount={0.05}>
                        <div className="flex flex-col mb-16 text-center md:text-left rtl:md:text-right">
                            <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-4"><span className="material-symbols-outlined text-primary text-sm">memory</span><h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Core Architecture</h2></div>
                            <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none">{t('home.features.title')}</h3>
                        </div>
                    </Reveal>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: 'psychology', title: t('home.features.neural.title'), description: t('home.features.neural.description') },
                            { icon: 'enhanced_encryption', title: t('home.features.quantum.title'), description: t('home.features.quantum.description') },
                            { icon: 'all_out', title: t('home.features.scalability.title'), description: t('home.features.scalability.description'), accent: 'text-sky-400' },
                            { icon: 'stream', title: t('home.features.ui.title'), description: t('home.features.ui.description'), accent: 'text-primary' }
                        ].map((feature, idx) => (
                            <Reveal key={idx} delay={idx * 0.15} variant="scale" amount={0.05}>
                                <div className="glass aspect-[4/5] p-8 md:p-10 rounded-[2rem] flex flex-col justify-end group border border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 relative overflow-hidden bg-gradient-to-t from-white/[0.05] to-transparent">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all group-hover:scale-125 pointer-events-none"><span className={`material-symbols-outlined text-8xl ${feature.accent || 'text-primary'}`}>{feature.icon}</span></div>
                                    <div className="mt-auto relative z-10">
                                        <span className={`material-symbols-outlined ${feature.accent || 'text-primary'} text-5xl mb-6 group-hover:scale-110 transition-transform drop-shadow-lg`}>{feature.icon}</span>
                                        <h4 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">{feature.title}</h4>
                                        <p className="text-white/40 text-sm font-medium leading-relaxed group-hover:text-white/70 transition-colors">{feature.description}</p>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Strategic Investment Plans (Pricing) */}
            <section className="px-6 lg:px-20 py-24 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <Reveal amount={0.05}>
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6"><span className="material-symbols-outlined text-primary text-sm">payments</span><span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Capital Investment</span></div>
                            <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">{t('home.pricing.title')}</h3>
                            <p className="max-w-2xl mx-auto text-white/40 text-lg font-medium leading-relaxed">{t('home.pricing.subtitle')}</p>
                        </div>
                    </Reveal>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { key: 'monthly', icon: 'token', highlight: false },
                            { key: 'sixMonths', icon: 'military_tech', highlight: true, badge: t('home.pricing.sixMonths.save') },
                            { key: 'lifetime', icon: 'all_inclusive', highlight: false, badge: t('home.pricing.lifetime.save') }
                        ].map((plan, idx) => (
                            <Reveal key={plan.key} delay={idx * 0.15} variant="fadeUp" amount={0.05}>
                                <div className={`group relative h-full flex flex-col p-8 md:p-10 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-2 ${plan.highlight ? 'bg-white/[0.05] border-primary/30 shadow-[0_20px_50px_rgba(19,236,164,0.15)] scale-105 z-10' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                                    {plan.badge && <div className="absolute -top-4 right-8 px-4 py-1.5 rounded-full bg-primary text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(19,236,164,0.4)]">{plan.badge}</div>}
                                    <div className="mb-10 text-left rtl:text-right">
                                        <div className={`size-14 rounded-2xl flex items-center justify-center mb-6 border transition-transform group-hover:scale-110 ${plan.highlight ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/10'}`}><span className={`material-symbols-outlined text-3xl ${plan.highlight ? 'text-primary' : 'text-white/40 group-hover:text-white'}`}>{plan.icon}</span></div>
                                        <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">{t(`home.pricing.${plan.key}.name`)}</h4>
                                        <p className="text-white/30 text-sm leading-relaxed">{t(`home.pricing.${plan.key}.desc`)}</p>
                                    </div>
                                    <div className="mt-auto pt-8 border-t border-white/5 text-left rtl:text-right">
                                        <div className="flex items-baseline gap-1 mb-10"><span className="text-5xl font-black text-white italic tracking-tighter">{t(`home.pricing.${plan.key}.price`)}</span><span className="text-xl font-bold text-white/40 ml-2 italic">₽</span><span className="text-white/20 text-sm ml-2 font-medium">/ {t(`home.pricing.${plan.key}.period`)}</span></div>
                                        <button
                                            onClick={() => { setSelectedPlan({ name: t(`home.pricing.${plan.key}.name`), price: t(`home.pricing.${plan.key}.price`), key: plan.key }); setIsPaymentModalOpen(true); }}
                                            className={`flex items-center justify-center gap-3 w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${plan.highlight ? 'bg-primary text-black hover:shadow-[0_0_30px_rgba(19,236,164,0.5)] hover:scale-[1.02]' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                                        >
                                            {t('home.pricing.cta')}<span className="material-symbols-outlined text-lg">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <ReviewSection />

            {/* FAQ Section */}
            <section className="px-6 lg:px-20 py-24 bg-black/40 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <Reveal amount={0.05}><div className="text-center mb-16"><h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">{t('home.faq.title')}</h2><p className="text-white/40 text-lg font-medium">{t('home.faq.subtitle')}</p></div></Reveal>
                    <div className="space-y-4">{[0, 1, 2].map((i) => (
                        <Reveal key={i} delay={i * 0.1} variant="fadeUp" amount={0.05}>
                            <details className="group glass rounded-3xl border border-white/5 overflow-hidden transition-all hover:border-primary/20">
                                <summary className="flex items-center justify-between p-8 cursor-pointer list-none">
                                    <h4 className="text-white font-bold text-lg pr-8">{t(`home.faq.questions.${i}.q`)}</h4>
                                    <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all group-open:rotate-180 group-open:bg-primary/20 group-open:border-primary/30"><span className="material-symbols-outlined text-primary text-xl">expand_more</span></div>
                                </summary>
                                <div className="px-8 pb-8 text-white/50 leading-relaxed border-t border-white/5 pt-6 animate-in slide-in-from-top-2">{t(`home.faq.questions.${i}.a`)}</div>
                            </details>
                        </Reveal>
                    ))}</div>
                </div>
            </section>

            {/* Activation & Usage Guide */}
            <section className="px-6 lg:px-20 py-24 bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <Reveal amount={0.05}>
                        <div className="flex flex-col mb-16 text-center md:text-left rtl:md:text-right">
                            <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-4"><span className="material-symbols-outlined text-primary text-sm">terminal</span><h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Operational Protocol</h2></div>
                            <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">{t('home.activation.title')}</h3>
                            <p className="max-w-xl text-white/40 text-lg font-medium">{t('home.activation.subtitle')}</p>
                        </div>
                    </Reveal>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[0, 1, 2, 3, 4, 5].map((i) => (
                        <Reveal key={i} delay={i * 0.1} variant="fadeUp" amount={0.05}>
                            <div className="glass p-8 rounded-[2rem] border border-white/5 hover:border-primary/20 transition-all group flex flex-col">
                                <div className="flex items-start justify-between mb-6"><div className="size-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-primary font-black text-xl group-hover:bg-primary/10 transition-colors">{i + 1}</div>{i === 2 && <div className="px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Important Note</div>}</div>
                                <h4 className="text-white font-bold text-lg mb-3 uppercase tracking-tight group-hover:text-primary transition-colors">{t(`home.activation.steps.${i}.title`)}</h4>
                                <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/70 transition-colors">{t(`home.activation.steps.${i}.desc`)}</p>
                            </div>
                        </Reveal>
                    ))}</div>
                </div>
            </section>

            {/* Usage Protocol & Archive */}
            <section className="px-6 lg:px-20 py-24 bg-black/20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    <Reveal delay={0.1} variant="fadeUp" amount={0.05}>
                        <div className="glass p-8 md:p-12 rounded-[2rem] border border-white/5 h-full text-left rtl:text-right hover:border-primary/20 transition-colors duration-500">
                            <div className="flex items-center gap-5 mb-12"><div className="size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border border-primary/20 shadow-lg"><span className="material-symbols-outlined text-primary text-2xl">gavel</span></div><h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">{t('home.protocol.title')}</h2></div>
                            <ul className="space-y-8">{[
                                { step: '01', title: t('home.protocol.p1.title'), desc: t('home.protocol.p1.description') },
                                { step: '02', title: t('home.protocol.p2.title'), desc: t('home.protocol.p2.description') },
                                { step: '03', title: t('home.protocol.p3.title'), desc: t('home.protocol.p3.description') }
                            ].map((step, idx) => (
                                <li key={idx} className="flex gap-6 group">
                                    <div className="flex flex-col items-center"><span className="text-primary font-black text-xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 bg-primary/10 size-12 rounded-full flex items-center justify-center border border-primary/20">{step.step}</span>{idx !== 2 && <div className="w-px h-full bg-white/10 mt-4 group-hover:bg-primary/30 transition-colors"></div>}</div>
                                    <div className="pb-8"><h4 className="text-white font-bold text-lg mb-2 uppercase tracking-tight group-hover:text-primary transition-colors">{step.title}</h4><p className="text-white/40 text-sm leading-relaxed">{step.desc}</p></div>
                                </li>
                            ))}</ul>
                        </div>
                    </Reveal>
                    <Reveal delay={0.2} variant="fadeUp" amount={0.05}>
                        <div className="glass p-8 md:p-12 rounded-[2rem] border border-white/5 flex flex-col text-left rtl:text-right h-full hover:border-white/10 transition-colors duration-500">
                            <div className="flex items-center justify-between mb-10"><div className="flex items-center gap-5"><div className="size-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10 shadow-lg"><span className="material-symbols-outlined text-white text-2xl">history</span></div><h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">{t('home.archive.title')}</h2></div></div>
                            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '420px' }}>
                                {olderVersions.length > 0 ? olderVersions.map((v) => (
                                    <a key={v.id} href={v.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 rounded-[1.25rem] bg-black/20 border border-white/5 hover:border-primary/30 hover:bg-white/[0.04] transition-all cursor-pointer group">
                                        <div className="flex items-center gap-4"><div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors"><span className="material-symbols-outlined text-white/40 group-hover:text-primary text-lg">terminal</span></div><div><p className="text-white font-black text-lg group-hover:text-primary uppercase tracking-tighter">v{v.version}</p><p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">{t('home.archive.released', { date: v.releaseDate ? format(new Date(v.releaseDate), 'MMM dd, yyyy') : 'Unknown' })}</p></div></div>
                                        <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary transition-all group-hover:-translate-y-1"><span className="material-symbols-outlined text-white/40 group-hover:text-black">download</span></div>
                                    </a>
                                )) : <div className="flex flex-col items-center justify-center h-full opacity-50"><span className="material-symbols-outlined text-4xl mb-4 text-white/20">cloud_off</span><p className="text-sm font-bold uppercase tracking-widest text-white/40">No Older Builds Found</p></div>}
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} plan={selectedPlan} />
        </div>
    );
}