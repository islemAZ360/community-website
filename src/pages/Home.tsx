import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from "framer-motion";
import {
    Send, CreditCard,
    Star, MessageSquare, UserCircle2, ShieldCheck, Lock, Download,
    BookOpen, Network, Zap, Shield, Cpu, Brain, Layout, Calendar,
    Award, Infinity as InfinityIcon, ChevronDown, TerminalSquare,
    Scale, History, CloudOff, RefreshCw, ArrowRight, Maximize
} from 'lucide-react';
import {
    collection, query, orderBy, limit, onSnapshot, addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { StarfieldBackground } from '../components/StarfieldBackground';
import { PaymentModal } from '../components/PaymentModal';

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
        hidden: { opacity: 0, scale: 0.95, filter: "blur(10px)" },
        show: { opacity: 1, scale: 1, filter: "blur(0px)" },
    },
};

const Reveal: React.FC<RevealProps> = ({
    children,
    className,
    delay = 0,
    duration = 0.6,
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
        <section className="px-6 lg:px-20 py-24 relative overflow-hidden bg-black/20">
            <div className="max-w-7xl mx-auto">
                <Reveal amount={0.05}>
                    <div className="flex flex-col mb-16 text-center md:text-left rtl:md:text-right">
                        <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-4">
                            <MessageSquare className="text-primary w-4 h-4" />
                            <h2 className="text-xs font-bold text-primary tracking-widest uppercase">Agent Feedback</h2>
                        </div>
                        <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">User Reviews</h3>
                        <p className="max-w-xl text-white/50 text-base md:text-lg">Hear from our authorized agents who have deployed OUR-FIX in high-stakes environments.</p>
                    </div>
                </Reveal>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    <div className="lg:col-span-1">
                        <Reveal variant="scale" amount={0.05}>
                            <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] sticky top-32 backdrop-blur-sm shadow-xl">
                                {!user ? (
                                    <div className="text-center py-8 space-y-4">
                                        <div className="size-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-white/20"><UserCircle2 size={32} /></div>
                                        <p className="text-sm font-medium text-white/50">Login to share your experience</p>
                                    </div>
                                ) : !isAuthorized ? (
                                    <div className="text-center py-8 space-y-6">
                                        <div className="size-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-500"><Lock size={28} /></div>
                                        <div className="space-y-2">
                                            <h4 className="text-white font-semibold">Exclusive Access</h4>
                                            <p className="text-xs text-white/40 leading-relaxed">Only authorized agents with an active license can submit feedback.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><MessageSquare size={20} /></div>
                                            <div>
                                                <h4 className="text-white font-semibold">Share Intel</h4>
                                                <p className="text-xs text-primary/80 mt-1">Authorized Protocol</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex gap-2 justify-center py-3 bg-black/40 rounded-xl border border-white/5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button key={star} type="button" onClick={() => setNewRating(star)} className={`transition-all duration-300 ${star <= newRating ? 'text-amber-400 drop-shadow-md' : 'text-white/10 hover:text-white/30'}`}>
                                                        <Star size={24} fill={star <= newRating ? 'currentColor' : 'none'} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Write your review here..."
                                                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-primary/40 focus:bg-white/5 transition-all resize-none" required
                                            />
                                        </div>
                                        <button type="submit" disabled={isSubmitting} className="w-full h-12 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                            {isSubmitting ? 'Transmitting...' : 'Submit Review'}<Send size={16} />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </Reveal>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        {reviews.length === 0 ? (
                            <div className="p-16 rounded-3xl border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center opacity-50">
                                <MessageSquare size={40} className="mb-4 text-white/20" />
                                <p className="font-medium text-sm text-white/40">No Intel Transmitted Yet</p>
                            </div>
                        ) : (
                            reviews.map((review, idx) => (
                                <Reveal key={review.id} delay={idx * 0.1} variant="fadeUp" amount={0.05}>
                                    <div className="p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 group">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-full bg-white/5 overflow-hidden flex items-center justify-center text-white/20 shrink-0 border border-white/10">
                                                    {review.userAvatar ? <img src={review.userAvatar} alt="" className="w-full h-full object-cover" /> : <UserCircle2 size={24} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="text-white font-semibold">{review.userName}</h5>
                                                        {review.isAuthorized && (
                                                            <div className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20"><ShieldCheck size={12} /> Authorized</div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 mt-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={14} className={i < review.rating ? 'text-amber-400' : 'text-white/10'} fill={i < review.rating ? 'currentColor' : 'none'} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-white/30 font-medium">
                                                {review.createdAt?.toDate ? format(review.createdAt.toDate(), 'MMM dd, yyyy') : 'Recently'}
                                            </div>
                                        </div>
                                        <p className="text-white/70 text-sm leading-relaxed">"{review.comment}"</p>
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
        <StarfieldBackground className="flex-1 flex flex-col w-full overflow-x-hidden">
            <div className="flex-1 flex flex-col w-full relative z-10 pb-20">
                {/* Hero Section */}
                <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-32 px-6 lg:px-20 overflow-hidden flex flex-col items-center justify-center min-h-[85vh]">
                    {/* Background Glows */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/20 blur-[150px] rounded-full opacity-40 pointer-events-none mix-blend-screen"></div>

                    <div className="max-w-5xl mx-auto text-center relative z-10 w-full flex flex-col items-center">
                        <Reveal amount={0.05}>
                            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.03] border border-white/10 mb-8 backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                <span className="text-[11px] font-semibold tracking-widest uppercase text-white/70">Tactical Mesh: v5.2.0 • Online</span>
                            </div>
                        </Reveal>

                        <Reveal delay={0.1} amount={0}>
                            <h1 className="text-7xl md:text-9xl lg:text-[11rem] font-black mb-10 tracking-tighter leading-none select-none drop-shadow-[0_20px_50px_rgba(19,236,164,0.2)]">
                                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-[#13eca4] to-[#042f2e] inline-block">
                                    OUR-FIX
                                </span>
                            </h1>
                        </Reveal>

                        <Reveal delay={0.2} amount={0.05}>
                            <p className="max-w-2xl mx-auto text-base md:text-xl text-white/50 leading-relaxed mb-12">
                                {i18n.language === 'en' ? "The undetectable tactical companion for technical interviews. Elevate your performance securely." : t('home.hero.subtitle')}
                            </p>
                        </Reveal>

                        <Reveal delay={0.3} amount={0.05}>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                                {loading ? (
                                    <div className="h-14 w-full sm:w-64 bg-white/5 rounded-xl animate-pulse" />
                                ) : latestVersion ? (
                                    <a href={latestVersion.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 h-14 px-8 w-full sm:w-auto bg-white text-black hover:bg-white/90 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95">
                                        <span>{t('home.hero.downloadLatest', { version: latestVersion.version })}</span>
                                        <Download size={18} />
                                    </a>
                                ) : (
                                    <div className="px-8 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 w-full sm:w-auto">
                                        <RefreshCw className="animate-spin text-primary w-4 h-4" />
                                        <span className="text-sm font-medium text-white/70">{t('home.hero.checkingUpdates')}</span>
                                    </div>
                                )}
                                <a href="https://github.com/islemAZ360/DODI-Releases" target="_blank" rel="noopener noreferrer" className="h-14 px-8 flex items-center justify-center gap-2 rounded-xl text-white/80 font-semibold text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-colors w-full sm:w-auto">
                                    <BookOpen size={18} />
                                    <span>{t('home.hero.viewDocs')}</span>
                                </a>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* Video Showcase Section */}
                <section className="px-6 lg:px-20 py-12 relative z-20">
                    <Reveal delay={0.05} amount={0.05}>
                        <div className="max-w-5xl mx-auto flex flex-col items-center">
                            <div className="relative w-full aspect-video rounded-2xl p-2 bg-white/[0.02] border border-white/10 shadow-2xl backdrop-blur-sm group overflow-hidden">
                                <div className="relative w-full h-full rounded-xl overflow-hidden bg-black/90 shadow-inner">
                                    <video controls preload="metadata" playsInline className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" src={instructionalVideos[currentVideoIndex].src} />
                                    <button onClick={prevVideo} className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 z-30"><ArrowRight className="rotate-180 w-5 h-5" /></button>
                                    <button onClick={nextVideo} className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 z-30"><ArrowRight className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <div className="mt-8 text-center flex flex-col items-center justify-center gap-4">
                                <p className="text-sm font-semibold text-white/80">{instructionalVideos[currentVideoIndex].title}</p>
                                <div className="flex gap-2">{instructionalVideos.map((_, idx) => (
                                    <button key={idx} onClick={() => setCurrentVideoIndex(idx)} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentVideoIndex ? 'w-8 bg-white' : 'w-2 bg-white/20'}`} />
                                ))}</div>
                            </div>
                        </div>
                    </Reveal>
                </section>

                {/* Metrics Grid */}
                <section className="px-6 lg:px-20 py-24 border-y border-white/5 bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: <Network size={24} />, label: t('home.metrics.activeNodes'), value: '1.2M+', growth: '+12%', progress: '75%', color: 'text-primary', bg: 'bg-primary' },
                            { icon: <Zap size={24} />, label: t('home.metrics.latency'), value: '< 2ms', growth: '-5%', progress: '100%', color: 'text-sky-400', bg: 'bg-sky-400' },
                            { icon: <Shield size={24} />, label: t('home.metrics.encryption'), value: t('home.metrics.military'), growth: 'v256-bit', progress: '85%', color: 'text-purple-400', bg: 'bg-purple-400' }
                        ].map((metric, idx) => (
                            <Reveal key={idx} delay={idx * 0.1} variant="fadeUp" amount={0.05}>
                                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all hover:-translate-y-1 group relative overflow-hidden">
                                    <div className={`size-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 ${metric.color}`}>{metric.icon}</div>
                                    <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">{metric.label}</p>
                                    <div className="flex items-baseline gap-3 mb-6">
                                        <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{metric.value}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded bg-white/5 ${metric.color}`}>{metric.growth}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className={`h-full ${metric.bg} rounded-full transition-all duration-1000`} style={{ width: metric.progress }}></div></div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* Features Matrix */}
                <section className="px-6 lg:px-20 py-32">
                    <div className="max-w-7xl mx-auto">
                        <Reveal amount={0.05}>
                            <div className="flex flex-col mb-16 text-center md:text-left rtl:md:text-right">
                                <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-4">
                                    <Cpu className="text-primary w-4 h-4" />
                                    <h2 className="text-xs font-bold text-primary tracking-widest uppercase">Core Architecture</h2>
                                </div>
                                <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">{t('home.features.title')}</h3>
                            </div>
                        </Reveal>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: <Brain size={32} />, title: t('home.features.neural.title'), description: t('home.features.neural.description') },
                                { icon: <Lock size={32} />, title: t('home.features.quantum.title'), description: t('home.features.quantum.description') },
                                { icon: <Maximize size={32} />, title: t('home.features.scalability.title'), description: t('home.features.scalability.description') },
                                { icon: <Layout size={32} />, title: t('home.features.ui.title'), description: t('home.features.ui.description') }
                            ].map((feature, idx) => (
                                <Reveal key={idx} delay={idx * 0.1} variant="fadeUp" amount={0.05}>
                                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 h-full flex flex-col group">
                                        <div className="text-white/40 group-hover:text-primary transition-colors mb-6">{feature.icon}</div>
                                        <h4 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h4>
                                        <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Strategic Investment Plans (Pricing) */}
                <section className="px-6 lg:px-20 py-32 relative overflow-hidden bg-black/40">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <div className="max-w-7xl mx-auto relative z-10">
                        <Reveal amount={0.05}>
                            <div className="text-center mb-16">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                                    <CreditCard className="text-white/70 w-4 h-4" />
                                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Pricing Plans</span>
                                </div>
                                <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">{t('home.pricing.title')}</h3>
                                <p className="max-w-2xl mx-auto text-white/50 text-lg">{t('home.pricing.subtitle')}</p>
                            </div>
                        </Reveal>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                            {[
                                { key: 'monthly', icon: <Calendar size={28} />, highlight: false },
                                { key: 'sixMonths', icon: <Award size={28} />, highlight: true, badge: t('home.pricing.sixMonths.save') },
                                { key: 'lifetime', icon: <InfinityIcon size={28} />, highlight: false, badge: t('home.pricing.lifetime.save') }
                            ].map((plan, idx) => (
                                <Reveal key={plan.key} delay={idx * 0.15} variant="fadeUp" amount={0.05}>
                                    <div className={`relative flex flex-col p-8 md:p-10 rounded-3xl border transition-all duration-300 ${plan.highlight ? 'bg-[#0f0f0f] border-primary/30 shadow-[0_0_40px_rgba(19,236,164,0.1)] scale-105 z-10 py-12' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}>
                                        {plan.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-black text-xs font-bold uppercase tracking-widest">{plan.badge}</div>}

                                        <div className="mb-8">
                                            <div className={`size-14 rounded-2xl flex items-center justify-center mb-6 border ${plan.highlight ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-white/50'}`}>
                                                {plan.icon}
                                            </div>
                                            <h4 className="text-2xl font-bold text-white mb-2">{t(`home.pricing.${plan.key}.name`)}</h4>
                                            <p className="text-white/40 text-sm">{t(`home.pricing.${plan.key}.desc`)}</p>
                                        </div>

                                        <div className="mt-auto pt-8 border-t border-white/5">
                                            <div className="flex items-baseline gap-2 mb-8">
                                                <span className="text-4xl font-extrabold text-white">{t(`home.pricing.${plan.key}.price`)}</span>
                                                <span className="text-xl text-white/40">₽</span>
                                                <span className="text-white/30 text-sm font-medium ml-1">/ {t(`home.pricing.${plan.key}.period`)}</span>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedPlan({ name: t(`home.pricing.${plan.key}.name`), price: t(`home.pricing.${plan.key}.price`), key: plan.key }); setIsPaymentModalOpen(true); }}
                                                className={`w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${plan.highlight ? 'bg-primary text-black hover:bg-primary/90' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
                                            >
                                                {t('home.pricing.cta')}
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
                <section className="px-6 lg:px-20 py-32 relative overflow-hidden">
                    <div className="max-w-4xl mx-auto relative z-10">
                        <Reveal amount={0.05}>
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">{t('home.faq.title')}</h2>
                                <p className="text-white/50 text-lg">{t('home.faq.subtitle')}</p>
                            </div>
                        </Reveal>
                        <div className="space-y-4">
                            {[0, 1, 2].map((i) => (
                                <Reveal key={i} delay={i * 0.1} variant="fadeUp" amount={0.05}>
                                    <details className="group bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden transition-all hover:bg-white/[0.04]">
                                        <summary className="flex items-center justify-between p-6 md:p-8 cursor-pointer list-none">
                                            <h4 className="text-white font-semibold text-base md:text-lg pr-8">{t(`home.faq.questions.${i}.q`)}</h4>
                                            <div className="size-8 rounded-full bg-white/5 flex items-center justify-center transition-transform group-open:rotate-180 text-white/50 group-open:text-white">
                                                <ChevronDown size={20} />
                                            </div>
                                        </summary>
                                        <div className="px-6 md:px-8 pb-8 text-white/50 leading-relaxed border-t border-white/5 pt-6 text-sm md:text-base">
                                            {t(`home.faq.questions.${i}.a`)}
                                        </div>
                                    </details>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Activation & Usage Guide */}
                <section className="px-6 lg:px-20 py-24 bg-white/[0.01] border-y border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <Reveal amount={0.05}>
                            <div className="flex flex-col mb-16 text-center md:text-left rtl:md:text-right">
                                <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-4">
                                    <TerminalSquare className="text-primary w-4 h-4" />
                                    <h2 className="text-xs font-bold text-primary tracking-widest uppercase">Operational Protocol</h2>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">{t('home.activation.title')}</h3>
                                <p className="max-w-xl text-white/50">{t('home.activation.subtitle')}</p>
                            </div>
                        </Reveal>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <Reveal key={i} delay={i * 0.1} variant="fadeUp" amount={0.05}>
                                    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 h-full flex flex-col">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70 font-bold">{i + 1}</div>
                                            {i === 2 && <div className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest">Important</div>}
                                        </div>
                                        <h4 className="text-white font-semibold text-lg mb-2">{t(`home.activation.steps.${i}.title`)}</h4>
                                        <p className="text-white/40 text-sm leading-relaxed">{t(`home.activation.steps.${i}.desc`)}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Usage Protocol & Archive */}
                <section className="px-6 lg:px-20 py-24">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        <Reveal delay={0.1} variant="fadeUp" amount={0.05}>
                            <div className="p-8 md:p-10 rounded-3xl border border-white/5 bg-white/[0.02] h-full text-left rtl:text-right">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Scale size={24} /></div>
                                    <h2 className="text-2xl font-bold text-white">{t('home.protocol.title')}</h2>
                                </div>
                                <ul className="space-y-8">
                                    {[
                                        { step: '01', title: t('home.protocol.p1.title'), desc: t('home.protocol.p1.description') },
                                        { step: '02', title: t('home.protocol.p2.title'), desc: t('home.protocol.p2.description') },
                                        { step: '03', title: t('home.protocol.p3.title'), desc: t('home.protocol.p3.description') }
                                    ].map((step, idx) => (
                                        <li key={idx} className="flex gap-5 group">
                                            <div className="flex flex-col items-center">
                                                <span className="text-white/30 text-xs font-bold mt-1 bg-white/5 px-2 py-1 rounded">{step.step}</span>
                                                {idx !== 2 && <div className="w-px h-full bg-white/5 mt-3"></div>}
                                            </div>
                                            <div className="pb-6">
                                                <h4 className="text-white font-semibold mb-1">{step.title}</h4>
                                                <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>

                        <Reveal delay={0.2} variant="fadeUp" amount={0.05}>
                            <div className="p-8 md:p-10 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col h-full text-left rtl:text-right">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-white/70"><History size={24} /></div>
                                    <h2 className="text-2xl font-bold text-white">{t('home.archive.title')}</h2>
                                </div>
                                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '350px' }}>
                                    {olderVersions.length > 0 ? olderVersions.map((v) => (
                                        <a key={v.id} href={v.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-4">
                                                <div className="text-white/40 group-hover:text-white transition-colors"><TerminalSquare size={20} /></div>
                                                <div>
                                                    <p className="text-white font-semibold text-sm">v{v.version}</p>
                                                    <p className="text-white/40 text-xs mt-0.5">{t('home.archive.released', { date: v.releaseDate ? format(new Date(v.releaseDate), 'MMM dd, yyyy') : 'Unknown' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-white/30 group-hover:text-white transition-colors"><Download size={18} /></div>
                                        </a>
                                    )) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-50 py-10">
                                            <CloudOff size={32} className="mb-4 text-white/20" />
                                            <p className="text-sm font-medium text-white/50">No Older Builds Found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} plan={selectedPlan} />
            </div>
        </StarfieldBackground>
    );
}