import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';


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

                    return {
                        id: release.id.toString(),
                        version: cleanVersion,
                        releaseNotes: release.body || 'No release notes provided.',
                        downloadUrl: release.assets?.find((a: any) => a.name.endsWith('.exe'))?.browser_download_url || release.html_url,
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
            <section className="relative pt-16 pb-24 px-6 lg:px-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none opacity-20">
                    <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full transform -translate-y-1/2"></div>
                </div>
                <div className="max-w-7xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border-primary/20 mb-6 shadow-[0_0_15px_rgba(19,236,164,0.1)]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-primary">System Update Available</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-gradient mb-6 leading-[0.9]">
                        {t('home.hero.title')}
                    </h1>
                    <p className="max-w-xl mx-auto text-base md:text-lg text-slate-400 leading-relaxed mb-10">
                        {i18n.language === 'en' ? (
                            <>
                                <span className="text-primary">O</span>ur <span className="text-primary">U</span>nified <span className="text-primary">R</span>esponse: <span className="text-primary">F</span>ast <span className="text-primary">I</span>nterview & <span className="text-primary">X</span>-am assist.
                            </>
                        ) : t('home.hero.subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        {loading ? (
                            <div className="h-16 w-64 bg-white/5 rounded-xl animate-pulse border border-white/10" />
                        ) : latestVersion ? (
                            <a
                                href={latestVersion.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hero-glow group relative flex items-center gap-3 px-6 py-3 bg-primary rounded-xl text-background-dark font-bold text-base hover:scale-105 transition-all shadow-xl"
                            >
                                <span>{t('home.hero.downloadLatest', { version: latestVersion.version })}</span>
                                <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform text-lg">download</span>
                            </a>

                        ) : (
                            <div className="glass p-4 rounded-xl text-slate-400 flex items-center gap-2 border-white/10">
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                                <span>{t('home.hero.checkingUpdates')}</span>
                            </div>
                        )}

                        <a href="https://github.com/islemAZ360/DODI-Releases" target="_blank" rel="noopener noreferrer" className="px-6 py-3 glass rounded-xl text-slate-100 font-bold text-base hover:bg-white/10 transition-all border-white/20">
                            {t('home.hero.viewDocs')}
                        </a>

                    </div>
                </div>
            </section>

            {/* Video Showcase Section */}
            <section className="px-6 lg:px-20 pb-20">
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

            {/* Metrics Grid */}
            <section className="px-6 lg:px-20 pb-20">
                <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass p-6 rounded-2xl relative overflow-hidden group hover:bg-white/[0.05] transition-colors border-white/10 text-left rtl:text-right">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-5xl text-primary">hub</span>
                        </div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">{t('home.metrics.activeNodes')}</p>
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-3xl font-black text-white">1.2M+</h3>
                            <span className="text-primary text-sm font-bold">+12%</span>
                        </div>
                        <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-3/4 rounded-full shadow-[0_0_10px_rgba(19,236,164,0.5)]"></div>
                        </div>
                    </div>
                    <div className="glass p-8 rounded-2xl relative overflow-hidden group hover:bg-white/[0.05] transition-colors border-white/10 text-left rtl:text-right">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-primary">bolt</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">{t('home.metrics.latency')}</p>
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-4xl font-black text-white">&lt; 2ms</h3>
                            <span className="text-rose-500 text-sm font-bold">-5%</span>
                        </div>
                        <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-full rounded-full shadow-[0_0_10px_rgba(19,236,164,0.5)]"></div>
                        </div>
                    </div>
                    <div className="glass p-8 rounded-2xl relative overflow-hidden group hover:bg-white/[0.05] transition-colors border-white/10 text-left rtl:text-right">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-primary">shield</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">{t('home.metrics.encryption')}</p>
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-4xl font-black text-white">{t('home.metrics.military')}</h3>
                            <span className="text-slate-500 text-sm font-bold">v256-bit</span>
                        </div>
                        <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-5/6 rounded-full shadow-[0_0_10px_rgba(19,236,164,0.5)]"></div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Features Matrix */}
            <section className="px-6 lg:px-20 pb-24">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-end justify-between mb-10">
                        <div className="text-left rtl:text-right">
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">{t('home.features.title')}</h2>
                            <p className="text-slate-400">{t('home.features.subtitle')}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden group cursor-default">
                            <div className="absolute inset-0 bg-background-dark/80 group-hover:bg-background-dark/60 transition-colors duration-500"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(19,236,164,0.2),transparent)]"></div>
                            <div className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-primary/30 transition-colors"></div>
                            <div className="absolute bottom-0 left-0 rtl:left-auto rtl:right-0 p-8 transform group-hover:-translate-y-2 transition-transform duration-500 text-left rtl:text-right">
                                <span className="material-symbols-outlined text-primary text-4xl mb-6 shadow-sm">psychology</span>
                                <h3 className="text-xl font-bold text-white mb-2">{t('home.features.neural.title')}</h3>
                                <p className="text-slate-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">{t('home.features.neural.description')}</p>
                            </div>
                        </div>
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden group cursor-default">
                            <div className="absolute inset-0 bg-background-dark/80 group-hover:bg-background-dark/60 transition-colors duration-500"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(19,236,164,0.2),transparent)]"></div>
                            <div className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-primary/30 transition-colors"></div>
                            <div className="absolute bottom-0 left-0 rtl:left-auto rtl:right-0 p-8 transform group-hover:-translate-y-2 transition-transform duration-500 text-left rtl:text-right">
                                <span className="material-symbols-outlined text-primary text-4xl mb-6 shadow-sm">enhanced_encryption</span>
                                <h3 className="text-xl font-bold text-white mb-2">{t('home.features.quantum.title')}</h3>
                                <p className="text-slate-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">{t('home.features.quantum.description')}</p>
                            </div>
                        </div>
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden group cursor-default">
                            <div className="absolute inset-0 bg-background-dark/80 group-hover:bg-background-dark/60 transition-colors duration-500"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent)]"></div>
                            <div className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-sky-400/30 transition-colors"></div>
                            <div className="absolute bottom-0 left-0 rtl:left-auto rtl:right-0 p-8 transform group-hover:-translate-y-2 transition-transform duration-500 text-left rtl:text-right">
                                <span className="material-symbols-outlined text-sky-400 text-4xl mb-6 shadow-sm">all_out</span>
                                <h3 className="text-xl font-bold text-white mb-2">{t('home.features.scalability.title')}</h3>
                                <p className="text-slate-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">{t('home.features.scalability.description')}</p>
                            </div>
                        </div>
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden group cursor-default">
                            <div className="absolute inset-0 bg-background-dark/80 group-hover:bg-background-dark/60 transition-colors duration-500"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(167,139,250,0.2),transparent)]"></div>
                            <div className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-purple-400/30 transition-colors"></div>
                            <div className="absolute bottom-0 left-0 rtl:left-auto rtl:right-0 p-8 transform group-hover:-translate-y-2 transition-transform duration-500 text-left rtl:text-right">
                                <span className="material-symbols-outlined text-purple-400 text-4xl mb-6 shadow-sm">stream</span>
                                <h3 className="text-xl font-bold text-white mb-2">{t('home.features.ui.title')}</h3>
                                <p className="text-slate-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">{t('home.features.ui.description')}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Usage Protocol & Archive */}
            <section className="px-6 lg:px-20 pb-32">
                <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="glass rounded-3xl p-10 border-white/10 text-left rtl:text-right">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">gavel</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">{t('home.protocol.title')}</h2>
                        </div>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <span className="text-primary font-mono pt-1 text-lg">01</span>
                                <div>
                                    <h4 className="text-slate-100 font-bold mb-1">{t('home.protocol.p1.title')}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">{t('home.protocol.p1.description')}</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-primary font-mono pt-1 text-lg">02</span>
                                <div>
                                    <h4 className="text-slate-100 font-bold mb-1">{t('home.protocol.p2.title')}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">{t('home.protocol.p2.description')}</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="text-primary font-mono pt-1 text-lg">03</span>
                                <div>
                                    <h4 className="text-slate-100 font-bold mb-1">{t('home.protocol.p3.title')}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">{t('home.protocol.p3.description')}</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="glass rounded-3xl p-10 border-white/10 flex flex-col text-left rtl:text-right">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">history</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white">{t('home.archive.title')}</h2>
                            </div>
                            <span className="text-sm font-bold text-slate-500">{t('home.archive.buildsAvailable', { count: olderVersions.length })}</span>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: '300px' }}>
                            {olderVersions.map((v) => (
                                <a
                                    key={v.id}
                                    href={v.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all cursor-pointer group"
                                >
                                    <div className="text-left rtl:text-right">
                                        <p className="text-white font-bold group-hover:text-primary transition-colors">v{v.version}</p>
                                        <p className="text-slate-500 text-xs mt-1">
                                            {t('home.archive.released', { date: v.releaseDate ? format(new Date(v.releaseDate), 'MMM dd, yyyy') : 'Unknown' })}
                                        </p>
                                    </div>

                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">download</span>
                                </a>
                            ))}
                            {olderVersions.length === 0 && (
                                <div className="text-slate-500 text-sm flex items-center gap-2 pt-4">
                                    <span className="material-symbols-outlined">info</span>
                                    {t('home.archive.noArchive')}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
