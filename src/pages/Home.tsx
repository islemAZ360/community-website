import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Reveal } from '../components/Reveal';


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

    const instructionalVideos = [
        { src: "/system_core.mp4", title: "System Capabilities Showcase" },
        { src: "/system_core1.mp4", title: "How to Use OUR-FIX" },
        { src: "/system_core2.mp4", title: "Getting a Free API Key" }
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
                    
                    // Direct link to the .exe asset if it exists
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
    }, []);

    return (
        <div className="flex-1 flex flex-col">
            {/* Hero Section */}
            <section className="relative pt-64 pb-96 px-6 lg:px-20 overflow-hidden">
                {/* Dynamic Brand Glows */}
                <div className="glow-circle w-[600px] h-[600px] -top-[300px] -left-[100px] opacity-20 animate-pulse"></div>
                <div className="glow-circle w-[800px] h-[800px] -bottom-[400px] -right-[200px] opacity-10"></div>
                <div className="glow-circle w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5"></div>

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <Reveal amount={0.05}>
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl glass border-white/5 mb-8 shadow-2xl">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13eca4] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#13eca4]"></span>
                            </span>
                            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#13eca4]">Tactical Mesh: v5.2.0 • Online</span>
                        </div>
                    </Reveal>

                    <Reveal delay={0.1} amount={0.05}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-premium mb-6 leading-[0.85] uppercase">
                            {t('home.hero.title')}
                        </h1>
                    </Reveal>

                    <Reveal delay={0.2} amount={0.05}>
                        <p className="max-w-2xl mx-auto text-base md:text-lg text-white/40 leading-relaxed mb-10 font-medium italic">
                            {i18n.language === 'en' ? (
                                <>
                                    The undetectable tactical companion for <span className="text-white">high-stakes technical interviews</span>. Real-time intelligence at your fingertips.
                                </>
                            ) : t('home.hero.subtitle')}
                        </p>
                    </Reveal>

                    <Reveal delay={0.3} amount={0.05}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                            {loading ? (
                                <div className="h-16 w-64 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
                            ) : latestVersion ? (
                                <a
                                    href={latestVersion.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-premium group flex items-center gap-4"
                                >
                                    <span>{t('home.hero.downloadLatest', { version: latestVersion.version })}</span>
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-xl">arrow_forward</span>
                                </a>

                            ) : (
                                <div className="glass p-4 rounded-xl text-slate-400 flex items-center gap-2 border-white/10">
                                    <span className="material-symbols-outlined animate-spin">refresh</span>
                                    <span>{t('home.hero.checkingUpdates')}</span>
                                </div>
                            )}

                            <a href="https://github.com/islemAZ360/DODI-Releases" target="_blank" rel="noopener noreferrer" className="px-8 py-4 glass rounded-2xl text-white font-black text-sm uppercase tracking-[0.2em] hover:bg-white/10 transition-all border-white/10">
                                {t('home.hero.viewDocs')}
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>
 
            {/* Video Showcase Section */}
            <Reveal delay={0.05} amount={0.05}>
                <section className="px-6 lg:px-20 pb-96">
                <div className="max-w-5xl mx-auto">
                    <div className="relative aspect-video rounded-[2rem] glass overflow-hidden hero-glow group border border-primary/20 shadow-2xl">
                        <video
                            controls
                            preload="metadata"
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover bg-black"
                            src={instructionalVideos[currentVideoIndex].src}
                        />

                        <button
                            onClick={prevVideo}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 border border-white/10 text-white flex items-center justify-center hover:bg-primary hover:border-primary hover:text-background-dark backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-30 shadow-lg hover:scale-110"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button
                            onClick={nextVideo}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 border border-white/10 text-white flex items-center justify-center hover:bg-primary hover:border-primary hover:text-background-dark backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-30 shadow-lg hover:scale-110"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    <div className="mt-8 text-center flex flex-col items-center justify-center gap-4">
                        <p className="text-xl font-bold tracking-tight text-white uppercase tracking-[0.2em] opacity-80 animate-pulse">
                            {instructionalVideos[currentVideoIndex].title}
                        </p>
                        <div className="flex gap-2">
                            {instructionalVideos.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentVideoIndex(idx)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentVideoIndex ? 'w-8 bg-primary shadow-[0_0_15px_rgba(19,236,164,0.8)]' : 'w-2 bg-white/10 hover:bg-white/30'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            </Reveal>

            {/* Metrics Grid */}
            <section className="px-6 lg:px-20 pb-96">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: 'hub', label: t('home.metrics.activeNodes'), value: '1.2M+', growth: '+12%', progress: '75%' },
                        { icon: 'bolt', label: t('home.metrics.latency'), value: '< 2ms', growth: '-5%', progress: '100%', accent: 'text-rose-500' },
                        { icon: 'shield', label: t('home.metrics.encryption'), value: t('home.metrics.military'), growth: 'v256-bit', progress: '85%' }
                    ].map((metric, idx) => (
                        <Reveal key={idx} delay={idx * 0.1} variant="fadeUp" amount={0.05}>
                            <div className="premium-card p-10 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:scale-110">
                                    <span className="material-symbols-outlined text-7xl text-primary">{metric.icon}</span>
                                </div>
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{metric.label}</p>
                                <div className="flex items-baseline gap-4 mb-6">
                                    <h3 className="text-4xl font-black text-white italic">{metric.value}</h3>
                                    <span className={`${metric.accent || 'text-primary'} text-xs font-bold`}>{metric.growth}</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary rounded-full shadow-[0_0_20px_rgba(19,236,164,0.8)] transition-all duration-1000 delay-500"
                                        style={{ width: metric.progress }}
                                    ></div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* Features Matrix */}
            <section className="px-6 lg:px-20 pb-96">
                <div className="max-w-7xl mx-auto">
                    <Reveal amount={0.05}>
                        <div className="flex flex-col mb-12">
                            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 italic">Core Architecture</h2>
                            <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none italic">{t('home.features.title')}</h3>
                        </div>
                    </Reveal>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: 'psychology', title: t('home.features.neural.title'), description: t('home.features.neural.description') },
                            { icon: 'enhanced_encryption', title: t('home.features.quantum.title'), description: t('home.features.quantum.description') },
                            { icon: 'all_out', title: t('home.features.scalability.title'), description: t('home.features.scalability.description'), accent: 'text-sky-400' },
                            { icon: 'stream', title: t('home.features.ui.title'), description: t('home.features.ui.description'), accent: 'text-primary' }
                        ].map((feature, idx) => (
                            <Reveal key={idx} delay={idx * 0.15} variant="scale" amount={0.05}>
                                <div className="premium-card aspect-[4/5] p-10 flex flex-col justify-end group cursor-default relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:scale-110">
                                        <span className={`material-symbols-outlined text-8xl ${feature.accent || 'text-primary'}`}>{feature.icon}</span>
                                    </div>
                                    <span className={`material-symbols-outlined ${feature.accent || 'text-primary'} text-5xl mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                        {feature.icon}
                                    </span>
                                    <h4 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">{feature.title}</h4>
                                    <p className="text-white/40 text-sm font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                        {feature.description}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>
             {/* Usage Protocol & Archive */}
            <section className="px-6 lg:px-20 pb-96">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <Reveal delay={0.1} variant="fadeUp" amount={0.05}>
                        <div className="premium-card p-10 text-left rtl:text-right">
                            <div className="flex items-center gap-6 mb-10">
                                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
                                    <span className="material-symbols-outlined text-primary text-2xl">gavel</span>
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{t('home.protocol.title')}</h2>
                            </div>
                            <ul className="space-y-10">
                                {[
                                    { step: '01', title: t('home.protocol.p1.title'), desc: t('home.protocol.p1.description') },
                                    { step: '02', title: t('home.protocol.p2.title'), desc: t('home.protocol.p2.description') },
                                    { step: '03', title: t('home.protocol.p3.title'), desc: t('home.protocol.p3.description') }
                                ].map((step, idx) => (
                                    <li key={idx} className="flex gap-8 group">
                                        <span className="text-primary font-black italic text-2xl opacity-40 group-hover:opacity-100 transition-opacity">{step.step}</span>
                                        <div>
                                            <h4 className="text-white font-bold text-lg mb-2 uppercase tracking-tight">{step.title}</h4>
                                            <p className="text-white/40 text-sm leading-relaxed italic">{step.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Reveal>

                    <Reveal delay={0.2} variant="fadeUp" amount={0.05}>
                        <div className="premium-card p-12 flex flex-col text-left rtl:text-right h-full">
                            <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-6">
                                    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
                                        <span className="material-symbols-outlined text-primary text-3xl">history</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{t('home.archive.title')}</h2>
                                </div>
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('home.archive.buildsAvailable', { count: olderVersions.length })}</span>
                            </div>

                            <div className="space-y-4 flex-1 overflow-y-auto pr-4 custom-scrollbar" style={{ maxHeight: '400px' }}>
                                {olderVersions.map((v) => (
                                    <a
                                        key={v.id}
                                        href={v.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-primary/30 hover:bg-white/[0.05] transition-all cursor-pointer group"
                                    >
                                        <div>
                                            <p className="text-white font-black text-lg group-hover:text-primary transition-colors uppercase italic tracking-tighter">v{v.version}</p>
                                            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                                                {t('home.archive.released', { date: v.releaseDate ? format(new Date(v.releaseDate), 'MMM dd, yyyy') : 'Unknown' })}
                                            </p>
                                        </div>
                                        <span className="material-symbols-outlined text-white/10 group-hover:text-primary transition-all group-hover:translate-y-1">download</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

        </div>
    );
}
