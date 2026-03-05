import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AuthModal } from './components/AuthModal';
import { Home } from './pages/Home';
import { Community } from './pages/Community';
import { Room } from './pages/Room';
import { Invitations } from './pages/Invitations';
import { News } from './pages/News';
import { Support } from './pages/Support';
import { ProfileModal } from './components/ProfileModal';
import { LogOut, User as UserIcon, Home as HomeIcon, Users, Newspaper, Mail, LifeBuoy, ShieldAlert, Megaphone, Terminal } from 'lucide-react';
import communityLogo from './public/community.png';

function App() {
    const { user, userData, setUser, fetchUserData, setLoading } = useAuthStore();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [systemAlert, setSystemAlert] = useState<string>('');
    const [licenseInfo, setLicenseInfo] = useState<any>(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await fetchUserData(currentUser.uid);
            }
            setLoading(false);
        });

        const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (snapshot) => {
            if (snapshot.exists()) {
                setSystemAlert(snapshot.data().globalAlert || '');
            }
        });

        return () => {
            unsubscribe();
            unsubConfig();
        };
    }, []);

    useEffect(() => {
        if (!user || !userData?.licenseKey) {
            setLicenseInfo(null);
            return;
        }

        const unsubLicense = onSnapshot(doc(db, 'license_keys', userData.licenseKey), (snapshot) => {
            if (snapshot.exists()) {
                setLicenseInfo(snapshot.data());
            } else {
                setLicenseInfo(null);
            }
        });

        return () => unsubLicense();
    }, [user, userData?.licenseKey]);

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <Router>
            <div className="min-h-screen bg-[#070708] text-zinc-50 flex flex-col font-sans relative overflow-hidden">
                {/* Global System Alert */}
                {systemAlert && (
                    <div className="sticky top-0 left-0 right-0 z-[100] bg-amber-500 text-black py-2.5 overflow-hidden border-b border-amber-600 shadow-[0_5px_30px_rgba(245,158,11,0.4)]">
                        <div className="flex items-center gap-10 whitespace-nowrap animate-marquee-fast px-4">
                            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shrink-0">
                                <Megaphone size={14} className="animate-bounce" />
                                Tactical Broadcast:
                            </div>
                            <span className="font-extrabold text-xs uppercase tracking-wider">
                                {systemAlert}
                            </span>
                            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shrink-0 opacity-50">
                                <Terminal size={14} /> SYSTEM_LEVEL_RESTRICTION_ACTIVE
                            </div>
                            {/* Duplicate for seamless loop */}
                            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shrink-0">
                                <Megaphone size={14} />
                                Tactical Broadcast:
                            </div>
                            <span className="font-extrabold text-xs uppercase tracking-wider">
                                {systemAlert}
                            </span>
                        </div>
                    </div>
                )}

                {/* Holographic Background Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Navbar */}
                <header className="h-20 border-b border-white/[0.03] bg-zinc-900/40 backdrop-blur-3xl sticky top-0 z-50 flex items-center px-8 justify-between transition-all">
                    <div className="flex items-center gap-12">
                        <Link to="/" className="group flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <img src={communityLogo} alt="iDIDDY" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xl font-black uppercase tracking-tighter holographic-text">
                                iDIDDY <span className="text-white/40 font-light">Hub</span>
                            </span>
                        </Link>

                        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-bold uppercase tracking-widest text-white/40">
                            <Link to="/" className="hover:text-emerald-400 transition-colors flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.03]">
                                <HomeIcon size={16} /> Home
                            </Link>
                            <Link to="/community" className="hover:text-emerald-400 transition-colors flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.03]">
                                <Users size={16} /> Community
                            </Link>
                            <Link to="/news" className="hover:text-emerald-400 transition-colors flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.03]">
                                <Newspaper size={16} /> News
                            </Link>
                            {user && (
                                <Link to="/invitations" className="hover:text-emerald-400 transition-colors flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.03]">
                                    <Mail size={16} /> Inbox
                                </Link>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="/support" className="hidden md:flex items-center gap-2.5 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] rounded-xl transition-all text-xs font-black uppercase tracking-widest text-zinc-300 active:scale-95">
                            <LifeBuoy size={16} className="text-emerald-400" />
                            Support
                        </Link>

                        {user && licenseInfo && (
                            <div className="hidden xl:flex flex-col items-end gap-1 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                    <div className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] border ${licenseInfo.keyType === 'eternal' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20' :
                                        licenseInfo.keyType === 'custom' ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' :
                                            'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                        {licenseInfo.keyType} Protocol
                                    </div>
                                </div>
                                {licenseInfo.expiresAt && (
                                    <div className="text-[10px] font-mono font-bold text-white/40 flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                        {(() => {
                                            const expiry = licenseInfo.expiresAt?.toDate ? licenseInfo.expiresAt.toDate() : new Date(licenseInfo.expiresAt);
                                            const diff = expiry.getTime() - now.getTime();
                                            if (diff <= 0) return 'EXPIRED';
                                            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                                            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                            const s = Math.floor((diff % (1000 * 60)) / 1000);
                                            return `${d}D ${h}H ${m}M ${s}S`;
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {user ? (
                            <div className="flex items-center gap-5">
                                <button
                                    onClick={() => setIsProfileOpen(true)}
                                    className="flex items-center gap-3 text-xs text-zinc-300 bg-white/[0.03] px-4 py-2 rounded-xl border border-white/[0.05] shadow-inner font-bold hover:bg-white/5 transition-all group"
                                >
                                    {userData?.profilePicture ? (
                                        <img src={userData.profilePicture} alt="Avatar" className="w-5 h-5 rounded-md object-cover border border-white/10" />
                                    ) : (
                                        <UserIcon size={14} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                    )}
                                    <span className="text-white group-hover:text-indigo-400 transition-colors">
                                        {userData?.nickname || 'Explorer'}
                                    </span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="text-white/30 hover:text-red-400 transition-all p-2.5 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 active:scale-90"
                                    title="Sign Out"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="premium-button premium-button-primary text-xs uppercase tracking-[0.2em] px-8"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 relative z-10">
                    {userData?.isBanned ? (
                        <div className="max-w-4xl mx-auto mt-20 p-12 glass-panel rounded-[40px] text-center space-y-10 animate-in fade-in zoom-in duration-1000 border-red-500/20 shadow-[0_0_100px_rgba(239,68,68,0.1)]">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse" />
                                <div className="h-24 w-24 bg-red-500/10 rounded-[32px] flex items-center justify-center mx-auto text-red-500 border border-red-500/20 relative z-10">
                                    <ShieldAlert size={48} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-[40px] font-black text-white uppercase tracking-tighter leading-none italic">Connection <span className="text-red-500">Terminated</span></h1>
                                <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">Security Protocol violation detected by Internal Governance</p>
                                <div className="h-px w-20 bg-red-500/20 mx-auto my-6" />
                                <p className="text-zinc-400 font-medium leading-relaxed max-w-lg mx-auto italic">
                                    Your access to the mesh has been permanently revoked. All core frequencies are now restricted for your local node.
                                </p>
                            </div>
                            <div className="pt-6">
                                <button
                                    onClick={handleLogout}
                                    className="premium-button bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-500 text-[10px] uppercase tracking-[0.3em] px-12 py-5"
                                >
                                    Initialize De-authentication
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/community" element={<Community />} />
                            <Route path="/room/:roomId" element={<Room />} />
                            <Route path="/invitations" element={<Invitations />} />
                            <Route path="/news" element={<News />} />
                            <Route path="/support" element={<Support />} />
                        </Routes>
                    )}
                </main>

                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                />

                <ProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                />
            </div>
        </Router>
    );
}

export default App;
