import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import communityLogo from './public/community.png';
import { AuthModal } from './components/AuthModal';
import { Home } from './pages/Home';
import { Community } from './pages/Community';
import { Room } from './pages/Room';
import { Invitations } from './pages/Invitations';
import { News } from './pages/News';
import { Support } from './pages/Support';
import { ProfileModal } from './components/ProfileModal';
import { Megaphone, Terminal, Menu, X, Globe, ShieldAlert, LogOut, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StarfieldBackground } from './components/StarfieldBackground';

function App() {
    const { user, userData, setUser, fetchUserData, setLoading } = useAuthStore();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t, i18n } = useTranslation();
    const [systemAlert, setSystemAlert] = useState<string>('');

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsMobileMenuOpen(false);
    };

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
        setIsMobileMenuOpen(false);
    };

    // Clean timer logic
    const formatRemainingTime = () => {
        if (!licenseInfo?.expiresAt) return null;
        const expiry = licenseInfo.expiresAt.toDate ? licenseInfo.expiresAt.toDate() : new Date(licenseInfo.expiresAt);
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) return 'EXPIRED';

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        return `${d}D ${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M ${s.toString().padStart(2, '0')}S`;
    };

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `relative px-1 py-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 ${isActive ? 'text-primary' : 'text-white/40 hover:text-white'
        } after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-primary after:transition-transform after:duration-300 ${isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-50'
        }`;

    return (
        <Router>
            <StarfieldBackground>
                <div className="min-h-screen text-zinc-50 flex flex-col font-sans relative">

                    {/* Global System Alert */}
                    {systemAlert && (
                        <div className="sticky top-0 left-0 right-0 z-[100] bg-amber-500/10 backdrop-blur-md text-amber-400 py-2 overflow-hidden border-b border-amber-500/20 shadow-[0_5px_30px_rgba(245,158,11,0.15)]">
                            <div className="flex items-center gap-10 whitespace-nowrap animate-marquee-fast px-4">
                                <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shrink-0">
                                    <Megaphone size={14} className="animate-pulse text-amber-500" />
                                    Tactical Broadcast:
                                </div>
                                <span className="font-bold text-xs uppercase tracking-[0.2em] italic">
                                    {systemAlert}
                                </span>
                                <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shrink-0 opacity-50">
                                    <Terminal size={14} /> SYSTEM_BROADCAST_ACTIVE
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navbar */}
                    <header className="sticky top-0 z-50 w-full bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5 px-4 lg:px-10 py-4 transition-all duration-300">
                        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">

                            {/* Logo & Desktop Nav */}
                            <div className="flex items-center gap-10">
                                <Link to="/" className="flex items-center gap-3 group relative z-10">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="size-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 p-1.5 shadow-xl relative z-10 group-hover:border-primary/50 transition-colors">
                                        <img src={communityLogo} alt="OUR-FIX" className="size-full object-contain" />
                                    </div>
                                    <h2 className="text-xl font-black italic tracking-tighter text-white uppercase group-hover:text-primary transition-colors hidden sm:block">
                                        our-Fix
                                    </h2>
                                </Link>

                                <nav className="hidden lg:flex items-center gap-8">
                                    <NavLink to="/" className={navLinkClass}>{t('nav.home')}</NavLink>
                                    <NavLink to="/community" className={navLinkClass}>{t('nav.community')}</NavLink>
                                    <NavLink to="/news" className={navLinkClass}>{t('nav.news')}</NavLink>
                                    <NavLink to="/support" className={navLinkClass}>{t('nav.support')}</NavLink>
                                </nav>
                            </div>

                            {/* Actions Right Side */}
                            <div className="flex items-center gap-4 lg:gap-6">

                                {/* Desktop Search */}
                                <div className="hidden md:flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 py-2 gap-3 transition-all focus-within:border-primary/50 focus-within:bg-primary/5 group">
                                    <Search size={14} className="text-white/30 group-focus-within:text-primary transition-colors" />
                                    <input
                                        className="bg-transparent border-none focus:ring-0 text-[11px] font-bold text-slate-200 placeholder:text-white/20 w-32 lg:w-48 outline-none font-mono"
                                        placeholder={t('nav.search', 'SEARCH NET...')}
                                        type="text"
                                    />
                                </div>

                                {/* Desktop License HUD */}
                                {user && licenseInfo && (
                                    <div className="hidden xl:flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                                        <div className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-[0.2em] border ${licenseInfo.keyType === 'eternal' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                licenseInfo.keyType === 'custom' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    'bg-primary/10 text-primary border-primary/20'
                                            }`}>
                                            {licenseInfo.keyType} PROT
                                        </div>
                                        {licenseInfo.expiresAt && (
                                            <div className="text-[10px] font-mono font-bold text-white/60 flex items-center gap-2 pr-1">
                                                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                                                {formatRemainingTime()}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Lang Select Desktop */}
                                <div className="relative group hidden sm:block">
                                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white/70 text-[10px] font-black uppercase tracking-widest">
                                        <Globe size={14} />
                                        <span>{i18n.language.substring(0, 2)}</span>
                                    </button>
                                    <div className="absolute top-full right-0 mt-2 w-36 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl z-[100] transform origin-top-right scale-95 group-hover:scale-100">
                                        {['en', 'ar', 'ru'].map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => changeLanguage(lang)}
                                                className="w-full px-4 py-3 text-left text-[10px] font-black hover:bg-white/5 text-white/60 hover:text-white transition-colors border-b last:border-0 border-white/5 uppercase tracking-[0.2em] flex items-center justify-between"
                                            >
                                                {t(`common.${lang.toUpperCase()}`)}
                                                {i18n.language === lang && <div className="size-1.5 rounded-full bg-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="hidden sm:block h-6 w-[1px] bg-white/10 mx-1"></div>

                                {/* Auth / Profile */}
                                {user ? (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsProfileOpen(true)}
                                            className="flex items-center gap-2.5 p-1 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group active:scale-95"
                                        >
                                            <div className="size-8 rounded-full bg-black border border-white/10 overflow-hidden relative">
                                                {userData?.profilePicture ? (
                                                    <img src={userData.profilePicture} alt="Avatar" className="size-full object-cover" />
                                                ) : (
                                                    <div className="size-full flex items-center justify-center text-primary/50 text-xs font-black uppercase">
                                                        {(userData?.nickname || user.email || 'A')[0]}
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 rounded-full border border-primary/20 group-hover:border-primary/50 transition-colors" />
                                            </div>
                                            <span className="hidden md:block text-[10px] font-black uppercase tracking-[0.1em] text-white/70 group-hover:text-white max-w-[80px] truncate">
                                                {userData?.nickname || 'AGENT'}
                                            </span>
                                        </button>

                                        <button
                                            onClick={handleLogout}
                                            className="size-10 flex items-center justify-center text-white/40 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all rounded-full active:scale-95"
                                            title="Sign Out"
                                        >
                                            <LogOut size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="btn-premium px-6 h-10 rounded-xl text-background-dark font-black text-[10px] shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all uppercase tracking-[0.2em]"
                                    >
                                        {t('auth.signIn', 'ACCESS HUB')}
                                    </button>
                                )}

                                {/* Mobile Menu Toggle */}
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="lg:hidden size-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white/70 hover:text-white transition-colors"
                                >
                                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Mobile Menu Overlay */}
                    {isMobileMenuOpen && (
                        <div className="fixed inset-0 top-[73px] z-40 bg-black/95 backdrop-blur-2xl lg:hidden animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">

                                <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 gap-3">
                                    <Search size={16} className="text-white/40" />
                                    <input
                                        className="bg-transparent border-none focus:ring-0 text-xs font-bold text-white placeholder:text-white/30 w-full outline-none font-mono"
                                        placeholder={t('nav.search', 'Search network...')}
                                        type="text"
                                    />
                                </div>

                                <nav className="flex flex-col gap-2">
                                    <Link onClick={() => setIsMobileMenuOpen(false)} to="/" className="p-4 rounded-2xl bg-white/5 text-xs font-black uppercase tracking-[0.2em] text-white/70 hover:text-primary hover:bg-white/10 transition-colors">{t('nav.home')}</Link>
                                    <Link onClick={() => setIsMobileMenuOpen(false)} to="/community" className="p-4 rounded-2xl bg-white/5 text-xs font-black uppercase tracking-[0.2em] text-white/70 hover:text-primary hover:bg-white/10 transition-colors">{t('nav.community')}</Link>
                                    <Link onClick={() => setIsMobileMenuOpen(false)} to="/news" className="p-4 rounded-2xl bg-white/5 text-xs font-black uppercase tracking-[0.2em] text-white/70 hover:text-primary hover:bg-white/10 transition-colors">{t('nav.news')}</Link>
                                    <Link onClick={() => setIsMobileMenuOpen(false)} to="/support" className="p-4 rounded-2xl bg-white/5 text-xs font-black uppercase tracking-[0.2em] text-white/70 hover:text-primary hover:bg-white/10 transition-colors">{t('nav.support')}</Link>
                                </nav>

                                <div className="mt-auto flex flex-col gap-4 border-t border-white/10 pt-6">
                                    <div className="grid grid-cols-3 gap-2">
                                        {['en', 'ar', 'ru'].map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => changeLanguage(lang)}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border ${i18n.language === lang
                                                        ? 'bg-primary/20 border-primary/30 text-primary'
                                                        : 'bg-white/5 border-white/10 text-white/50'
                                                    }`}
                                            >
                                                {lang}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <main className="flex-1 relative z-10">
                        {userData?.isBanned ? (
                            <div className="min-h-[80vh] flex items-center justify-center p-6">
                                <div className="max-w-2xl w-full bg-[#0a0000]/80 backdrop-blur-xl rounded-[2.5rem] p-10 md:p-14 text-center space-y-8 animate-in zoom-in-95 duration-700 border border-red-500/30 shadow-[0_0_100px_rgba(239,68,68,0.15)] relative overflow-hidden">
                                    {/* Background Grid & Glitch */}
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50" />
                                    <div className="absolute top-0 inset-x-0 h-1 bg-red-500/50 animate-pulse" />

                                    <div className="relative inline-flex mb-2">
                                        <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse" />
                                        <div className="size-28 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center text-red-500 border border-red-500/30 relative z-10 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                            <ShieldAlert size={50} />
                                        </div>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">
                                            Connection <span className="text-red-500">Terminated</span>
                                        </h1>
                                        <p className="text-red-400/80 font-mono font-bold uppercase tracking-[0.2em] text-[11px] bg-red-500/10 inline-block px-4 py-1.5 rounded-lg border border-red-500/20">
                                            Error Code: ERR_GOV_RESTRICTION
                                        </p>
                                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-red-500/50 to-transparent mx-auto my-8" />
                                        <p className="text-slate-300 font-medium leading-relaxed max-w-lg mx-auto text-sm md:text-base">
                                            Your access to the network mesh has been permanently revoked. All core frequencies and identity modules are now restricted for your local node.
                                        </p>
                                    </div>

                                    <div className="pt-8 relative z-10">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500 border border-red-500 text-red-500 hover:text-black text-xs font-black uppercase tracking-[0.2em] px-12 py-5 rounded-2xl transition-all duration-300 group"
                                        >
                                            <span className="flex items-center justify-center gap-3">
                                                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                                                Initialize De-authentication
                                            </span>
                                        </button>
                                    </div>
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
                </div>

                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                />

                <ProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                />
            </StarfieldBackground>
        </Router>
    );
}

export default App;