import { useEffect, useState } from 'react';
import { Download, Star, Sparkles, Rocket, ArrowRight, Shield, Zap, Globe, Cpu, BrainCircuit, Code2, Layers, User as UserIcon } from 'lucide-react';
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

                const versions: AppVersion[] = data.map((release: any) => {
                    const rawVersion = release.tag_name || release.name;
                    // Clean version to avoid "VV" bug
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
        <div className="max-w-7xl mx-auto px-6 py-20 space-y-40">
            {/* Hero Section */}
            <section className="relative text-center space-y-16 py-12">
                <div className="flex justify-center animate-in fade-in zoom-in duration-1000">
                    <div className="relative group">
                        <div className="absolute -inset-8 bg-emerald-500/20 rounded-full blur-[80px] opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>
                        <img
                            src="/community.png"
                            alt="iDIDDY Community"
                            className="relative w-40 h-40 md:w-56 md:h-56 object-cover rounded-[60px] border-2 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                </div>

                <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full border border-white/5 bg-white/[0.02] text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] animate-in fade-in slide-in-from-top-4 duration-1000">
                    <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                    <span>Next-Generation Development Hub</span>
                </div>

                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] uppercase italic">
                        Forge Your <br />
                        <span className="holographic-text">Legacy.</span>
                    </h1>
                    <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed font-bold uppercase tracking-tight">
                        The definitive ecosystem for engineered success. Join the global vanguard of elite software architects.
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

            {/* Core Intelligence Section (Gemini Studio API) */}
            <section className="glass-panel p-12 md:p-20 rounded-[60px] relative overflow-hidden border-white/[0.03]">
                <div className="absolute top-0 right-0 w-[40%] h-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                <BrainCircuit size={12} /> Neural Core
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight">
                                Powered by <br />
                                <span className="text-indigo-400">Gemini Studio API</span>
                            </h2>
                            <p className="text-zinc-400 text-lg leading-relaxed font-medium">
                                iDIDDY integrates the state-of-the-art <span className="text-white">Gemini 1.5 Pro</span> model directly into your workflow. By leveraging the low-latency Gemini Studio API, we provide deep contextual analysis of your coding challenges in real-time.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                                    <Code2 size={20} />
                                </div>
                                <h4 className="font-bold text-white uppercase tracking-tight">Contextual Insight</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed">Gemini analyzes your entire code block to provide solutions that are context-aware and optimized.</p>
                            </div>
                            <div className="space-y-3">
                                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 border border-white/5">
                                    <Layers size={20} />
                                </div>
                                <h4 className="font-bold text-white uppercase tracking-tight">Multi-Modal Logic</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed">Processing text, logic, and patterns simultaneously for high-accuracy interview performance.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 rounded-[40px] blur-3xl group-hover:blur-[100px] transition-all duration-1000 opacity-50" />
                        <div className="relative glass-panel rounded-[40px] p-8 border-white/10 shadow-2xl overflow-hidden aspect-video flex flex-col items-center justify-center gap-6">
                            <div className="h-24 w-24 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 animate-bounce duration-[3000ms]">
                                <Cpu size={48} className="text-indigo-400" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Processing Token...</p>
                                <div className="h-1.5 w-48 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-indigo-500 w-[65%] animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Matrix */}
            <section className="space-y-20">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">System <span className="text-white/40">Capabilities</span></h2>
                    <p className="text-zinc-500 uppercase tracking-widest text-[11px] font-black">Elite Features for Modern Engineers</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Elite Community",
                            desc: "Engage with a network of high-performing developers. Exchange insights, peer-review code, and excel together in private hubs.",
                            icon: Star,
                            gradient: "from-emerald-400 to-emerald-600"
                        },
                        {
                            title: "Real-time Intelligence",
                            desc: "Powered by Gemini Studio, get immediate support and tracking. Built-in diagnostics ensure peak performance during pressure.",
                            icon: Zap,
                            gradient: "from-indigo-400 to-indigo-600"
                        },
                        {
                            title: "Automated Updates",
                            desc: "Our zero-day update system ensures you're always running the latest features without manual intervention or data loss.",
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
                </div>
            </section>

            {/* How It Works (Usage Flow) */}
            <section className="space-y-20">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Usage <span className="text-white/40">Protocol</span></h2>
                    <p className="text-zinc-500 uppercase tracking-widest text-[11px] font-black">Step-by-Step Integration</p>
                </div>

                <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-white/[0.05] hidden lg:block -translate-y-1/2 z-0" />
                    <div className="grid lg:grid-cols-4 gap-12 relative z-10">
                        {[
                            { step: "01", title: "Registration", desc: "Create your agent profile on this hub and secure your encrypted key.", icon: UserIcon },
                            { step: "02", title: "App Launch", desc: "Download and install iDIDDY. Authenticate using your community credentials.", icon: Download },
                            { step: "03", title: "Studio Access", desc: "Input your Gemini Studio API key to activate the core intelligence layer.", icon: Cpu },
                            { step: "04", title: "Execute", desc: "Begin your session. Gemini will handle the heavy lifting while you dominate.", icon: Sparkles }
                        ].map((item, i) => (
                            <div key={i} className="space-y-6 text-center lg:text-left">
                                <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white font-black text-xl mx-auto lg:mx-0 shadow-xl group hover:border-emerald-500/30 transition-colors">
                                    {item.step}
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-bold text-white uppercase tracking-tight">{item.title}</h4>
                                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
