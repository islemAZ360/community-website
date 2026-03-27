import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Reveal } from '../components/Reveal';
import { PaymentModal } from '../components/PaymentModal';
import { ReviewSection } from '../components/ReviewSection';

interface AppVersion {
    id: string;
    version: string;
    releaseNotes: string;
    downloadUrl: string;
    releaseDate: string | Date;
    isLatest: boolean;
}

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

    const nextVideo = () => {
        setCurrentVideoIndex((prev) => (prev + 1) % instructionalVideos.length);
    };

    const prevVideo = () => {
        setCurrentVideoIndex((prev) => (prev - 1 + instructionalVideos.length) % instructionalVideos.length);
    };

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const response = await fetch('https://api.github.com/repos/islemAZ360/DODI-Releases/releases');
                if (!response.ok) throw new Error('Failed to fetch releases');
                const data = await response.json();

                const versions: AppVersion[] = data.map((release: any) => {
                    const rawVersion = release.tag_name || release.name;
                    const cleanVersion = rawVersion.startsWith('v') ? rawVersion.slice(1) : rawVersion;

                    const exeAsset = release.assets?.find((a: any) =>
                        a.name.toLowerCase().endsWith('.exe') ||
                        a.name.toLowerCase().includes('setup')
                    );

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

        // SEO: Set dynamic title based on language
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
                {/* Dynamic Brand Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-40 pointer-events-none mix-blend-screen"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sky-500/10 blur-[150px] rounded-full opacity-30 pointer-events-none"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10 w-full flex flex-col items-center">
                    <Reveal amount={0.05}>
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-white/10 mb-10 shadow-[0_0_30px_rgba(19,236,164,0.15)] backdrop-blur-md">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary shadow-[0_0_10px_rgba(19,236,164,1)]"></span>
                            </span>
                            <span className="text-[11px] font-black tracking-[0.3em] uppercase text-primary/90">
                                Tactical Mesh: v5.2.0 • Online
                            </span>
                        </div>
                    </Reveal>

                    <Reveal delay={0.1} amount={0.05}>
                        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40 mb-8 leading-[1.1] uppercase tracking-tighter drop-shadow-2xl">
                            {t('home.hero.title')}
                        </h1>
                    </Reveal>

                    <Reveal delay={0.2} amount={0.05}>
                        <p className="max-w-2xl mx-auto text-base md:text-xl text-white/50 leading-relaxed mb-12 font-medium italic">
                            {i18n.language === 'en' ? (
                                <>
                                    The undetectable tactical companion for <span className="text-white">high-stakes technical interviews</span>. Real-time intelligence at your fingertips.
                                </>
                            ) : t('home.hero.subtitle')}
                        </p>
                    </Reveal>

                    <Reveal delay={0.3} amount={0.05}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
                            {loading ? (
                                <div className="h-14 w-full sm:w-72 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
                            ) : latestVersion ? (
                                <a
                                    href={latestVersion.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-premium group flex items-center justify-center gap-4 h-14 px-8 w-full sm:w-auto shadow-[0_0_40px_rgba(19,236,164,0.2)] hover:shadow-[0_0_60px_rgba(19,236,164,0.4)] transition-all duration-500"
                                >
                                    <span className="text-sm tracking-wider font-bold">{t('home.hero.downloadLatest', { version: latestVersion.version })}</span>
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-xl">download</span>
                                </a>

                            ) : (
                                <div className="glass px-8 h-14 rounded-2xl text-slate-400 flex items-center justify-center gap-3 border-white/10 w-full sm:w-auto">
                                    <span className="material-symbols-outlined animate-spin text-primary">refresh</span>
                                    <span className="text-sm font-bold uppercase tracking-widest">{t('home.hero.checkingUpdates')}</span>
                                </div>
                            )}

                            <a href="https://github.com/islemAZ360/DODI-Releases" target="_blank" rel="noopener noreferrer" className="h-14 px-8 glass flex items-center justify-center rounded-2xl text-white/70 font-black text-sm uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all border border-white/10 w-full sm:w-auto">
                                {t('home.hero.viewDocs')}
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Video Showcase Section */}
            <section className="px-6 lg:px-20 py-24 relative z-20">
                <Reveal delay={0.05} amount={0.05}>
                    <div className="max-w-5xl mx-auto flex flex-col items-center">
                        <div className="relative w-full aspect-video rounded-[2rem] glass p-2 sm:p-3 overflow-hidden border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] group bg-white/[0.02]">
                            {/* Decorative Corner Accents */}
                            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-primary/50 rounded-tl-[2rem] z-20 pointer-events-none opacity-50"></div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-primary/50 rounded-br-[2rem] z-20 pointer-events-none opacity-50"></div>

                            <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden bg-black/80">
                                <video
                                    controls
                                    preload="metadata"
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                                    src={instructionalVideos[currentVideoIndex].src}
                                />

                                {/* Gradient Overlay for controls */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                <button
                                    onClick={prevVideo}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/40 border border-white/10 text-white flex items-center justify-center hover:bg-primary/20 hover:border-primary hover:text-primary backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 z-30 hover:scale-110"
                                >
                                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                                </button>
                                <button
                                    onClick={nextVideo}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/40 border border-white/10 text-white flex items-center justify-center hover:bg-primary/20 hover:border-primary hover:text-primary backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 z-30 hover:scale-110"
                                >
                                    <span className="material-symbols-outlined text-2xl">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 text-center flex flex-col items-center justify-center gap-5">
                            <p className="text-lg font-black tracking-[0.2em] text-white uppercase opacity-90 drop-shadow-lg">
                                {instructionalVideos[currentVideoIndex].title}
                            </p>
                            <div className="flex gap-3">
                                {instructionalVideos.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentVideoIndex(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentVideoIndex ? 'w-10 bg-primary shadow-[0_0_15px_rgba(19,236,164,0.8)]' : 'w-3 bg-white/20 hover:bg-white/40'}`}
                                        aria-label={`Go to video ${idx + 1}`}
                                    />
                                ))}
                            </div>
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
                            <div className="glass p-10 rounded-[2rem] group relative overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
                                {/* Large background Icon */}
                                <div className="absolute -top-6 -right-6 p-8 opacity-[0.03] group-hover:opacity-10 transition-all duration-700 group-hover:scale-125 group-hover:rotate-12 pointer-events-none">
                                    <span className={`material-symbols-outlined text-[120px] ${metric.color}`}>{metric.icon}</span>
                                </div>

                                <div className={`size-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                    <span className={`material-symbols-outlined text-2xl ${metric.color}`}>{metric.icon}</span>
                                </div>

                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{metric.label}</p>
                                <div className="flex items-baseline gap-4 mb-8">
                                    <h3 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">{metric.value}</h3>
                                    <span className={`${metric.color} text-xs font-bold px-2 py-1 rounded-md bg-white/5`}>{metric.growth}</span>
                                </div>

                                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className={`h-full ${metric.bg} rounded-full shadow-[0_0_15px_currentColor] transition-all duration-1000 ease-out`}
                                        style={{ width: metric.progress }}
                                    ></div>
                                </div>
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
                            <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary text-sm">memory</span>
                                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Core Architecture</h2>
                            </div>
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
                                <div className="glass aspect-[4/5] p-8 md:p-10 rounded-[2rem] flex flex-col justify-end group border border-white/5 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden bg-gradient-to-t from-white/[0.05] to-transparent">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:scale-125 pointer-events-none">
                                        <span className={`material-symbols-outlined text-8xl ${feature.accent || 'text-primary'}`}>{feature.icon}</span>
                                    </div>

                                    <div className="mt-auto relative z-10">
                                        <span className={`material-symbols-outlined ${feature.accent || 'text-primary'} text-5xl mb-6 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg`}>
                                            {feature.icon}
                                        </span>
                                        <h4 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">{feature.title}</h4>
                                        <p className="text-white/40 text-sm font-medium leading-relaxed group-hover:text-white/70 transition-colors duration-300">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Strategic Investment Plans (Pricing) */}
            <section className="px-6 lg:px-20 py-24 relative overflow-hidden">
                {/* Background Accents */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <Reveal amount={0.05}>
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                                <span className="material-symbols-outlined text-primary text-sm">payments</span>
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Capital Investment</span>
                            </div>
                            <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">
                                {t('home.pricing.title')}
                            </h3>
                            <p className="max-w-2xl mx-auto text-white/40 text-lg font-medium leading-relaxed">
                                {t('home.pricing.subtitle')}
                            </p>
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
                                    {plan.badge && (
                                        <div className="absolute -top-4 right-8 px-4 py-1.5 rounded-full bg-primary text-background-dark text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(19,236,164,0.4)]">
                                            {plan.badge}
                                        </div>
                                    )}

                                    <div className="mb-10 text-left rtl:text-right">
                                        <div className={`size-14 rounded-2xl flex items-center justify-center mb-6 border transition-transform duration-500 group-hover:scale-110 ${plan.highlight ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/10'}`}>
                                            <span className={`material-symbols-outlined text-3xl ${plan.highlight ? 'text-primary' : 'text-white/40 group-hover:text-white'}`}>{plan.icon}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">{t(`home.pricing.${plan.key}.name`)}</h4>
                                        <p className="text-white/30 text-sm leading-relaxed">{t(`home.pricing.${plan.key}.desc`)}</p>
                                    </div>

                                    <div className="mt-auto pt-8 border-t border-white/5 text-left rtl:text-right">
                                        <div className="flex items-baseline gap-1 mb-10">
                                            <span className="text-5xl font-black text-white italic tracking-tighter">{t(`home.pricing.${plan.key}.price`)}</span>
                                            <span className="text-xl font-bold text-white/40 ml-2 italic">₽</span>
                                            <span className="text-white/20 text-sm ml-2 font-medium">/ {t(`home.pricing.${plan.key}.period`)}</span>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedPlan({
                                                    name: t(`home.pricing.${plan.key}.name`),
                                                    price: t(`home.pricing.${plan.key}.price`),
                                                    key: plan.key
                                                });
                                                setIsPaymentModalOpen(true);
                                            }}
                                            className={`flex items-center justify-center gap-3 w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 ${plan.highlight ? 'bg-primary text-background-dark hover:shadow-[0_0_30px_rgba(19,236,164,0.5)] hover:scale-[1.02]' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}
                                        >
                                            {t('home.pricing.cta')}
                                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    <Reveal delay={0.5} amount={0.05}>
                        <p className="mt-12 text-center text-white/30 text-xs font-medium max-w-2xl mx-auto leading-relaxed">
                            <span className="material-symbols-outlined text-[10px] align-middle mr-1 text-primary">info</span>
                            {t('home.pricing.paymentNote')}
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* Reviews Section */}
            <ReviewSection />

            {/* FAQ Section */}
            <section className="px-6 lg:px-20 py-24 bg-black/40 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                
                <div className="max-w-4xl mx-auto relative z-10">
                    <Reveal amount={0.05}>
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">{t('home.faq.title')}</h2>
                            <p className="text-white/40 text-lg font-medium">{t('home.faq.subtitle')}</p>
                        </div>
                    </Reveal>

                    <div className="space-y-4">
                        {[0, 1, 2].map((i) => (
                            <Reveal key={i} delay={i * 0.1} variant="fadeUp" amount={0.05}>
                                <details className="group glass rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-primary/20">
                                    <summary className="flex items-center justify-between p-8 cursor-pointer list-none">
                                        <h4 className="text-white font-bold text-lg pr-8">{t(`home.faq.questions.${i}.q`)}</h4>
                                        <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all group-open:rotate-180 group-open:bg-primary/20 group-open:border-primary/30">
                                            <span className="material-symbols-outlined text-primary text-xl">expand_more</span>
                                        </div>
                                    </summary>
                                    <div className="px-8 pb-8 text-white/50 leading-relaxed border-t border-white/5 pt-6 animate-in slide-in-from-top-2 duration-500">
                                        {t(`home.faq.questions.${i}.a`)}
                                    </div>
                                </details>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Activation & Usage Guide */}
            <section className="px-6 lg:px-20 py-24 bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
                <div className="absolute -bottom-24 -left-24 size-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <Reveal amount={0.05}>
                        <div className="flex flex-col mb-16 text-center md:text-left rtl:md:text-right">
                            <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary text-sm">terminal</span>
                                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Operational Protocol</h2>
                            </div>
                            <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-6">{t('home.activation.title')}</h3>
                            <p className="max-w-xl text-white/40 text-lg font-medium">{t('home.activation.subtitle')}</p>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <Reveal key={i} delay={i * 0.1} variant="fadeUp" amount={0.05}>
                                <div className="glass p-8 rounded-[2rem] border border-white/5 hover:border-primary/20 transition-all duration-500 group h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-primary font-black text-xl group-hover:bg-primary/10 transition-colors">
                                            {i + 1}
                                        </div>
                                        {i === 2 && (
                                            <div className="px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                Important Note
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-white font-bold text-lg mb-3 uppercase tracking-tight group-hover:text-primary transition-colors">
                                        {t(`home.activation.steps.${i}.title`)}
                                    </h4>
                                    <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/70 transition-colors">
                                        {t(`home.activation.steps.${i}.desc`)}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    <Reveal delay={0.6} amount={0.05}>
                        <div className="mt-16 p-8 rounded-[2rem] bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-lg">
                                    <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
                                </div>
                                <div>
                                    <h5 className="text-white font-black text-xl uppercase tracking-tighter">Ready to Deploy?</h5>
                                    <p className="text-white/50 text-sm">Start your professional journey with the most advanced AI assistant.</p>
                                </div>
                            </div>
                            <a 
                                href="https://t.me/islamazaizia" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn-premium px-10 h-14 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(19,236,164,0.3)] hover:shadow-[0_0_50px_rgba(19,236,164,0.5)]"
                            >
                                <span className="font-black text-xs uppercase tracking-widest">Connect with Admin</span>
                                <span className="material-symbols-outlined text-lg">send</span>
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Usage Protocol & Archive */}
            <section className="px-6 lg:px-20 py-24 bg-black/20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    <Reveal delay={0.1} variant="fadeUp" amount={0.05}>
                        <div className="glass p-8 md:p-12 rounded-[2rem] border border-white/5 h-full text-left rtl:text-right hover:border-primary/20 transition-colors duration-500">
                            <div className="flex items-center gap-5 mb-12">
                                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center border border-primary/20 shadow-lg">
                                    <span className="material-symbols-outlined text-primary text-2xl">gavel</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">{t('home.protocol.title')}</h2>
                            </div>
                            <ul className="space-y-8">
                                {[
                                    { step: '01', title: t('home.protocol.p1.title'), desc: t('home.protocol.p1.description') },
                                    { step: '02', title: t('home.protocol.p2.title'), desc: t('home.protocol.p2.description') },
                                    { step: '03', title: t('home.protocol.p3.title'), desc: t('home.protocol.p3.description') }
                                ].map((step, idx) => (
                                    <li key={idx} className="flex gap-6 group">
                                        <div className="flex flex-col items-center">
                                            <span className="text-primary font-black text-xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 bg-primary/10 size-12 rounded-full flex items-center justify-center border border-primary/20">{step.step}</span>
                                            {idx !== 2 && <div className="w-px h-full bg-white/10 mt-4 group-hover:bg-primary/30 transition-colors"></div>}
                                        </div>
                                        <div className="pb-8">
                                            <h4 className="text-white font-bold text-lg mb-2 uppercase tracking-tight group-hover:text-primary transition-colors">{step.title}</h4>
                                            <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Reveal>

                    <Reveal delay={0.2} variant="fadeUp" amount={0.05}>
                        <div className="glass p-8 md:p-12 rounded-[2rem] border border-white/5 flex flex-col text-left rtl:text-right h-full hover:border-white/10 transition-colors duration-500">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-5">
                                    <div className="size-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10 shadow-lg">
                                        <span className="material-symbols-outlined text-white text-2xl">history</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">{t('home.archive.title')}</h2>
                                </div>
                                <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hidden sm:block">
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{t('home.archive.buildsAvailable', { count: olderVersions.length })}</span>
                                </div>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '420px' }}>
                                {olderVersions.length > 0 ? olderVersions.map((v) => (
                                    <a
                                        key={v.id}
                                        href={v.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-5 rounded-[1.25rem] bg-black/20 border border-white/5 hover:border-primary/30 hover:bg-white/[0.04] hover:shadow-[0_5px_20px_rgba(19,236,164,0.1)] transition-all duration-300 cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                <span className="material-symbols-outlined text-white/40 group-hover:text-primary text-lg transition-colors">terminal</span>
                                            </div>
                                            <div>
                                                <p className="text-white font-black text-lg group-hover:text-primary transition-colors uppercase tracking-tighter">v{v.version}</p>
                                                <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">
                                                    {t('home.archive.released', { date: v.releaseDate ? format(new Date(v.releaseDate), 'MMM dd, yyyy') : 'Unknown' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-background-dark transition-all duration-300 group-hover:-translate-y-1">
                                            <span className="material-symbols-outlined text-white/40 group-hover:text-background-dark transition-colors">download</span>
                                        </div>
                                    </a>
                                )) : (
                                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                                        <span className="material-symbols-outlined text-4xl mb-4 text-white/20">cloud_off</span>
                                        <p className="text-sm font-bold uppercase tracking-widest text-white/40">No Older Builds Found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>
            {/* Payment Modal */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                plan={selectedPlan}
            />
        </div>
    );
}