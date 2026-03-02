import { useEffect, useState } from 'react';
import { Download, CheckCircle2, Star, Sparkles, Rocket } from 'lucide-react';
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
                // Fetch from GitHub Releases API instead of Firebase
                const response = await fetch('https://api.github.com/repos/islemAZ360/DODI-Releases/releases');
                if (!response.ok) throw new Error('Failed to fetch releases');

                const data = await response.json();

                const versions: AppVersion[] = data.map((release: any) => ({
                    id: release.id.toString(),
                    version: release.tag_name || release.name,
                    releaseNotes: release.body || 'No release notes provided.',
                    downloadUrl: release.assets?.[0]?.browser_download_url || release.html_url,
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
        <div className="max-w-6xl mx-auto space-y-16 py-8">
            {/* Hero Section */}
            <section className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium">
                    <Sparkles size={16} />
                    <span>Welcome to the Official Community</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                    Code Smarter, <br />
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        Iterate Faster.
                    </span>
                </h1>

                <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                    Interview Coder is the ultimate companion app for your coding workflow. Join the community, chat with others, and download the latest builds.
                </p>

                {loading ? (
                    <div className="h-16 w-64 bg-white/5 rounded-2xl mx-auto animate-pulse flex border border-white/10" />
                ) : latestVersion ? (
                    <div className="flex flex-col items-center gap-4">
                        <a
                            href={latestVersion.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative inline-flex items-center justify-center gap-3 bg-indigo-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/25"
                        >
                            <Download size={24} className="group-hover:-translate-y-1 transition-transform" />
                            Download for Windows
                            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl z-[-1]" />
                        </a>
                        <p className="text-sm text-zinc-500 flex items-center justify-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            Latest Version {latestVersion.version} • Released {latestVersion.releaseDate ? format(new Date(latestVersion.releaseDate), 'MMM dd, yyyy') : 'Recently'}
                        </p>
                    </div>
                ) : (
                    <div className="glass-panel p-6 rounded-2xl max-w-md mx-auto border-dashed border-zinc-700">
                        <Rocket className="mx-auto text-zinc-500 mb-2" size={32} />
                        <p className="text-zinc-400">Downloads will be available soon.</p>
                    </div>
                )}
            </section>

            {/* Features Grid */}
            <section className="grid md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
                {[
                    { title: "Real-time Community", desc: "Chat with other developers in real-time. Share code, get help, and discuss the latest updates.", icon: Star },
                    { title: "Direct Support", desc: "Found a bug? Have a suggestion? Submit tickets directly to the developer and track their status.", icon: Sparkles },
                    { title: "Always Updated", desc: "Get notified immediately when a new version drops. Access historical builds whenever you need them.", icon: Rocket },
                ].map((feat, i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl hover:bg-white/[0.03] transition-colors border border-white/5 group">
                        <div className="h-12 w-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <feat.icon size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
                        <p className="text-zinc-400 leading-relaxed">{feat.desc}</p>
                    </div>
                ))}
            </section>

            {/* Older Versions */}
            {olderVersions.length > 0 && (
                <section className="pt-12 border-t border-white/5">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        Previous Versions
                    </h2>
                    <div className="grid gap-4">
                        {olderVersions.map(v => (
                            <div key={v.id} className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-semibold text-white">Version {v.version}</h4>
                                        <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md">
                                            {v.releaseDate ? format(new Date(v.releaseDate), 'MMM dd, yyyy') : ''}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-400 line-clamp-1">{v.releaseNotes}</p>
                                </div>
                                <a
                                    href={v.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                >
                                    <Download size={20} />
                                </a>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
