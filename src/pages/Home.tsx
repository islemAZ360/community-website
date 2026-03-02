import { useEffect, useState } from 'react';
import { Download, CheckCircle2, Star, Sparkles, Rocket, ArrowRight, Shield, Zap, Globe } from 'lucide-react';
import { format } from 'date-fns';

interface AppVersion {
    id: string;
    version: string;
    releaseNotes: string;
    downloadUrl: string;
    releaseDate: string | Date;
    isLatest: boolean;
}

export function Home() {
    const [latestVersion, setLatestVersion] = useState<AppVersion | null>(null);
    const [olderVersions, setOlderVersions] = useState<AppVersion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const response = await fetch('https://api.github.com/repos/islemAZ360/DODI-Releases/releases');
                if (!response.ok) throw new Error('Failed to fetch releases');
                const data = await response.json();

                const versions: AppVersion[] = data.map((release: any) => ({
                    id: release.id.toString(),
                    version: release.tag_name || release.name,
                    releaseNotes: release.body || 'No release notes provided.',
                    downloadUrl: release.assets?.find((a: any) => a.name.endsWith('.exe'))?.browser_download_url || release.html_url,
                    releaseDate: new Date(release.published_at),
                    isLatest: false
                }));

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
        <div className="max-w-7xl mx-auto px-6 py-20 space-y-32">
            {/* Hero Section */}
            <section className="relative text-center space-y-12 py-12">
                <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-4 duration-1000">
                    <Sparkles size={14} className="animate-pulse" />
                    <span>The Future of Interview Prep</span>
                </div>

                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase">
                        Master Your <br />
                        <span className="holographic-text">Coding Craft.</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
                        Elevate your performance with the most advanced companion app for developers. Join a global community of elite engineers.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                    {loading ? (
                        <div className="h-16 w-72 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
                    ) : latestVersion ? (
                        <div className="space-y-6">
                            <a
                                href={latestVersion.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="premium-button premium-button-primary text-sm uppercase tracking-[0.2em] px-12 py-5 shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)]"
                            >
                                <Download size={20} />
                                Download V{latestVersion.version}
                            </a>
                            <div className="flex items-center justify-center gap-6 text-[11px] font-black uppercase tracking-widest text-white/30">
                                <span className="flex items-center gap-2">
                                    <Shield size={14} className="text-emerald-500/50" /> Secure Build
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="flex items-center gap-2">
                                    <Zap size={14} className="text-indigo-500/50" /> Instant Setup
                                </span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="flex items-center gap-2">
                                    <Globe size={14} className="text-emerald-500/50" /> Windows 10/11
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-8 rounded-3xl border-dashed border-zinc-800">
                            <Rocket className="mx-auto text-zinc-600 mb-4" size={40} />
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">New release landing soon</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Features Matrix */}
            <section className="grid md:grid-cols-3 gap-8">
                {[
                    {
                        title: "Elite Community",
                        desc: "Engage with a network of high-performing developers. Exchange insights, peer-review code, and excel together.",
                        icon: Star,
                        gradient: "from-emerald-400 to-emerald-600"
                    },
                    {
                        title: "Real-time Intelligence",
                        desc: "Get immediate support and tracking for your coding sessions. Built-in diagnostics ensure peak performance.",
                        icon: Zap,
                        gradient: "from-indigo-400 to-indigo-600"
                    },
                    {
                        title: "Automated Updates",
                        desc: "Our zero-day update system ensures you're always running the latest features without manual intervention.",
                        icon: Rocket,
                        gradient: "from-cyan-400 to-cyan-600"
                    },
                ].map((feat, i) => (
                    <div key={i} className="glass-panel p-10 rounded-[32px] group hover:bg-white/[0.05] transition-all duration-500 border-white/[0.03] hover:translate-y-[-8px]">
                        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feat.gradient} text-white flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                            <feat.icon size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">{feat.title}</h3>
                        <p className="text-zinc-400 leading-relaxed font-medium">{feat.desc}</p>
                        <div className="mt-8 pt-8 border-t border-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
                                Learn More <ArrowRight size={12} />
                            </span>
                        </div>
                    </div>
                ))}
            </section>

            {/* Repository Timeline */}
            {olderVersions.length > 0 && (
                <section className="space-y-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                            Release Archive
                            <span className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-black tracking-widest text-white/40 border border-white/5">
                                {olderVersions.length} Builds
                            </span>
                        </h2>
                    </div>

                    <div className="grid gap-4">
                        {olderVersions.map(v => (
                            <div key={v.id} className="glass-panel p-6 rounded-2xl flex items-center justify-between group hover:bg-white/[0.03] transition-all border-white/[0.02]">
                                <div className="flex items-center gap-8">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-emerald-400 transition-colors">
                                        <div className="text-xs font-black">V{v.version.split('.').pop()}</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-4 mb-1">
                                            <h4 className="text-lg font-bold text-white">Version {v.version}</h4>
                                            <span className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">
                                                {v.releaseDate ? format(new Date(v.releaseDate), 'MMMM dd, yyyy') : ''}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-500 font-medium line-clamp-1 max-w-xl italic">"{v.releaseNotes}"</p>
                                    </div>
                                </div>
                                <a
                                    href={v.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-4 text-zinc-600 hover:text-white hover:bg-white/5 rounded-2xl transition-all active:scale-90"
                                    title="Download Setup"
                                >
                                    <Download size={22} />
                                </a>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
