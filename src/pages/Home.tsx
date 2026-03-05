import { useEffect, useState } from 'react';
import { Download, Star, Sparkles, Rocket, ArrowRight, Shield, Zap, Globe, Cpu, Code2, User as UserIcon, Terminal, Monitor, Key, Info, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';


interface AppVersion {
    id: string;
    version: string;
    releaseNotes: string;
    downloadUrl: string;
    releaseDate: string | Date;
    isLatest: boolean;
}

interface FeatureDetail {
    title: string;
    desc: string;
    icon: any;
    gradient: string;
    longDesc: string[];
}

export function Home() {
    const [latestVersion, setLatestVersion] = useState<AppVersion | null>(null);
    const [olderVersions, setOlderVersions] = useState<AppVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFeature, setSelectedFeature] = useState<number | null>(null);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    const instructionalVideos = [
        { src: "/system_core.mp4", title: "System Capabilities Showcase" },
        { src: "/system_core1.mp4", title: "How to Use iDIDDY" },
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

    const features: FeatureDetail[] = [
        {
            title: "Elite Community",
            desc: "Join a network of high-performing developers pushing the boundaries of coding efficiency.",
            icon: Star,
            gradient: "from-emerald-400 to-emerald-600",
            longDesc: [
                "Exclusive access to private development hubs and collaboration rooms.",
                "Peer-reviewed logic sharing for advanced algorithmic challenges.",
                "Direct networking with the creator and top-tier power users.",
                "Community-driven feature requests and beta testing opportunities."
            ]
        },
        {
            title: "Proprietary Architecture",
            desc: "Built from the ground up for stability, security, and maximum developer empowerment.",
            icon: Cpu,
            gradient: "from-cyan-400 to-cyan-600",
            longDesc: [
                "Custom-built IPC (Inter-Process Communication) layer for lightning-fast speeds.",
                "Secure license management system with encrypted key validation.",
                "Dynamic PWA support for instant access across multiple devices.",
                "Modular code structure allowing for rapid feature expansion and iteration."
            ]
        },
        {
            title: "Global Neural Bridge",
            desc: "Seamlessly integrate with world-class intelligence providers for real-time problem solving.",
            icon: Globe,
            gradient: "from-indigo-400 to-indigo-600",
            longDesc: [
                "Multi-provider support including Google, OpenAI, Anthropic, and more.",
                "Redundant neural node failover for uninterrupted interview support.",
                "Intelligent context-aware RAG memory for consistent technical answers.",
                "Encrypted API vault for high-security credential management."
            ]
        },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-16">
            {/* Compact High-Performance Hero Section */}
            <section className="relative min-h-[50vh] flex flex-col items-center justify-center text-center py-10 px-4 overflow-hidden -mx-4 rounded-[2rem] border border-white/[0.02] bg-[#050505]">

                {/* Lightweight Static Backgrounds */}
                <div className="absolute inset-0 bg-grid-moving opacity-10"></div>

                {/* Simplified Lightweight Glows (No Pulse, Lower Blur) */}
                <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-3xl mx-auto space-y-6">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                        <Zap size={12} className="text-emerald-500" />
                        <span>The Ultimate Developer Vanguard</span>
                    </div>

                    {/* Compact Typography */}
                    <div className="space-y-3">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none uppercase italic text-white drop-shadow-md">
                            OWN THE <br />
                            <span className="holographic-text inline-block pb-2">FLOW.</span>
                        </h1>
                        <p className="text-sm md:text-base text-zinc-400 max-w-xl mx-auto font-medium uppercase tracking-normal">
                            Revolutionizing the technical interview landscape. <span className="text-white">Built by developers, for the elite.</span>
                        </p>
                    </div>

                    {/* High-Impact CTA */}
                    <div className="pt-4 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700 relative z-20">
                        {loading ? (
                            <div className="h-14 w-64 bg-white/5 rounded-xl animate-pulse border border-white/10" />
                        ) : latestVersion ? (
                            <div className="space-y-6 flex flex-col items-center">
                                {/* Magnetic Glow Button - Resized */}
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-xl opacity-50 group-hover:opacity-100 blur-md group-hover:blur-lg transition-all duration-500"></div>
                                    <a
                                        href={latestVersion.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative flex items-center gap-2 bg-zinc-950 border border-emerald-500/50 text-white text-xs font-bold uppercase tracking-[0.2em] px-8 py-3 rounded-xl overflow-hidden button-sweep transform hover:-translate-y-1 hover:scale-105 transition-transform duration-300 shadow-md group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                                    >
                                        <Download size={16} className="text-emerald-400 group-hover:animate-bounce" />
                                        <span>GET LATEST <span className="text-emerald-400">V{latestVersion.version}</span></span>
                                    </a>
                                </div>

                                {/* Security Features Footer */}
                                <div className="glass-panel px-6 py-3 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[10px] font-bold uppercase tracking-wider text-zinc-400 rounded-full border-white/10">
                                    <span className="flex items-center gap-2 hover:text-white transition-colors">
                                        <div className="p-1 rounded-full bg-emerald-500/20"><Shield size={12} className="text-emerald-500" /></div> Encrypted Build
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="flex items-center gap-2 hover:text-white transition-colors">
                                        <div className="p-1 rounded-full bg-indigo-500/20"><Zap size={12} className="text-indigo-400" /></div> Fast Execution
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="flex items-center gap-2 hover:text-white transition-colors">
                                        <div className="p-1 rounded-full bg-cyan-500/20"><Globe size={12} className="text-cyan-400" /></div> Win 10/11 Native
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel p-6 rounded-2xl border-dashed border-zinc-800 flex flex-col items-center">
                                <Rocket className="text-zinc-600 mb-3 animate-bounce" size={32} />
                                <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Awaiting Build Deployment</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* The iDIDDY Advantage Section */}
            <section className="glass-panel p-6 md:p-10 rounded-[2rem] relative overflow-hidden border-white/5 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent)]">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none italic">
                                Why <span className="text-emerald-500">iDIDDY?</span>
                            </h2>
                            <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-bold uppercase tracking-normal">
                                This isn't just another tool. It's a comprehensive ecosystem designed to bridge the gap between human logic and machine-level speed during technical assessments.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {[
                                { title: "Real-time Transcription", desc: "Our proprietary audio engine captures system sound with 99.9% accuracy.", icon: Terminal },
                                { title: "Instant Logic Feedback", desc: "Get structural breakdowns of complex coding problems as they are described.", icon: Code2 },
                                { title: "Stealth Architecture", desc: "Minimal UI footprints ensure focus remains on the code, not the tool.", icon: Monitor }
                            ].map((adv, i) => (
                                <div key={i} className="flex gap-6 group">
                                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                        <adv.icon size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black uppercase tracking-widest text-sm mb-1">{adv.title}</h4>
                                        <p className="text-zinc-500 text-xs font-bold leading-relaxed">{adv.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative group perspective-1000 w-full mt-8 lg:mt-0">
                        {/* Removed blur for performance */}
                        <div
                            className="relative rounded-2xl border border-white/10 p-2 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#050505] transform transition-transform duration-300 ease-out w-full overflow-hidden hover:scale-[1.01]"
                        >
                            <div className="absolute inset-0 bg-grid-emerald/5 opacity-20"></div>

                            {/* Top Bar / Header */}
                            <div className="relative z-20 flex items-center justify-between mb-3 px-3 pt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <h3
                                        key={`title-${currentVideoIndex}`}
                                        className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider"
                                    >
                                        {instructionalVideos[currentVideoIndex].title}
                                    </h3>
                                </div>
                                <div className="flex gap-2">
                                    {instructionalVideos.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentVideoIndex(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-500 ease-spring-heavy ${idx === currentVideoIndex ? 'w-8 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'w-2 bg-white/10 hover:bg-white/30'}`}
                                            title={`Go to video ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Video Screen Container */}
                            <div className="relative z-10 w-full aspect-[16/9] rounded-xl bg-black border border-white/5 ring-1 ring-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)] group/screen overflow-hidden">

                                {/* Single Performant Video Element */}
                                <video
                                    controls
                                    preload="metadata"
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover bg-black"
                                    src={instructionalVideos[currentVideoIndex].src}
                                />

                                {/* Overlay Controls */}
                                <button
                                    onClick={prevVideo}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-white/10 text-white flex items-center justify-center hover:bg-emerald-500 hover:scale-110 hover:border-emerald-400 transition-all opacity-0 group-hover/screen:opacity-100 z-30 shadow-lg"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={nextVideo}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-white/10 text-white flex items-center justify-center hover:bg-emerald-500 hover:scale-110 hover:border-emerald-400 transition-all opacity-0 group-hover/screen:opacity-100 z-30 shadow-lg"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Matrix with Read More */}
            <section className="space-y-20">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">System <span className="text-white/40">Capabilities</span></h2>
                    <p className="text-zinc-500 uppercase tracking-widest text-[11px] font-black">Professional Toolset Breakdown</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feat, i) => (
                        <div
                            key={i}
                            onClick={() => setSelectedFeature(selectedFeature === i ? null : i)}
                            className={`glass-panel p-10 rounded-[32px] group transition-all duration-500 border-white/[0.03] cursor-pointer relative overflow-hidden ${selectedFeature === i ? 'bg-white/[0.08] ring-1 ring-emerald-500/40' : 'hover:bg-white/[0.05] hover:translate-y-[-8px]'}`}
                        >
                            <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feat.gradient} text-white flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                                <feat.icon size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">{feat.title}</h3>
                            <p className="text-zinc-400 leading-relaxed font-medium mb-6">{feat.desc}</p>

                            <div className={`space-y-4 overflow-hidden transition-all duration-1000 ease-in-out ${selectedFeature === i ? 'max-h-[800px] opacity-100 mb-8 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                {feat.longDesc.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-4 text-xs text-zinc-400 font-bold uppercase tracking-tight group/item">
                                        <div className="mt-1 h-3 w-3 flex-shrink-0">
                                            <CheckCircle2 size={12} className="text-emerald-500 group-hover/item:scale-125 transition-transform" />
                                        </div>
                                        <span className="leading-relaxed">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-white/[0.05]">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2">
                                    {selectedFeature === i ? 'Collapse Details' : 'Read Full Specs'} <ArrowRight size={12} className={selectedFeature === i ? '-rotate-90 transition-transform' : ''} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Expanded Usage Protocol */}
            <section className="space-y-20">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">Usage <span className="text-white/40">Protocol</span></h2>
                    <p className="text-zinc-500 uppercase tracking-widest text-[11px] font-black">Technical Integration Workflow</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {[
                        {
                            step: "01",
                            title: "Account Provisioning",
                            icon: UserIcon,
                            details: [
                                "Create a Hub Profile via the 'Sign In' portal to access the elite developer ecosystem.",
                                "Navigate to your Personal Profile and trigger the 'Request Access Key' protocol.",
                                "Authorized keys are typically provisioned within 24 hours after manual vetting.",
                                "Once approved, your unique encrypted hardware key will manifest in your dashboard."
                            ]
                        },
                        {
                            step: "02",
                            title: "Infrastructure Setup",
                            icon: Download,
                            details: [
                                "Download the latest native iDIDDY production build from the Release Archive.",
                                "Execute the installer to deploy the core engine and frontend assets locally.",
                                "Launch the application and authenticate using your Hub credentials to prime the system.",
                                "The engine will verify your hardware fingerprint against our secure blockchain-linked registry."
                            ]
                        },
                        {
                            step: "03",
                            title: "Neural Engine Calibration",
                            icon: Key,
                            details: [
                                "Configure your primary intelligence node in settings (Google Gemini or OpenAI recommended).",
                                "Insert your LLM API key into the local encrypted vault; credentials never leave your machine.",
                                "Run the 'Neural Bridge Diagnostic' to confirm connectivity and response latency.",
                                "Calibrate audio sensitivity thresholds for optimal system-level transcription accuracy."
                            ]
                        },
                        {
                            step: "04",
                            title: "Operational Mastery",
                            icon: Sparkles,
                            details: [
                                "Initiate your capture session; iDIDDY will autohijack system audio streams for processing.",
                                "Deploy the sidecar transcription window to monitor real-time node outputs silently.",
                                "Activate 'Stealth Mode' to minimize visual footprints while maintaining full cognitive support.",
                                "Use global shortcuts (Ctrl+H, Alt+S) to command the AI without breaking your coding flow."
                            ]
                        }
                    ].map((item, i) => (
                        <div key={i} className="glass-panel p-10 rounded-[40px] border-white/5 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-start gap-8">
                                <div className="h-20 w-20 flex-shrink-0 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white font-black text-3xl shadow-2xl">
                                    {item.step}
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                            <item.icon size={18} />
                                        </div>
                                        <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">{item.title}</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {item.details.map((point, pidx) => (
                                            <div key={pidx} className="flex gap-3 items-start group">
                                                <div className="h-1.5 w-1.5 rounded-full bg-white/20 mt-1.5 group-hover:bg-emerald-500 transition-colors"></div>
                                                <p className="text-[12px] text-zinc-500 font-bold leading-relaxed">{point}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="glass-panel p-12 rounded-[40px] bg-emerald-500/5 border-emerald-500/10 border-dashed text-center">
                    <div className="inline-flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        <Info size={14} /> Developer Tip
                    </div>
                    <p className="text-zinc-400 text-lg font-bold uppercase tracking-tight max-w-3xl mx-auto mb-8">
                        For the best results, ensure your system audio is set to "Stereo Mix" or use a virtual audio cable to pipe high-quality stream data into iDIDDY.
                    </p>
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
