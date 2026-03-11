import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import communityLogo from '../../public/our-fix.png';
import { AuthModal } from './components/AuthModal';
import { Home } from './pages/Home';
import { Community } from './pages/Community';
import { Room } from './pages/Room';
import { Invitations } from './pages/Invitations';
import { News } from './pages/News';
import { Support } from './pages/Support';
import { ProfileModal } from './components/ProfileModal';
import { Megaphone, Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';


import { StarfieldBackground } from './components/StarfieldBackground';

function App() {
    const { user, userData, setUser, fetchUserData, setLoading } = useAuthStore();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { t, i18n } = useTranslation();
    const [systemAlert, setSystemAlert] = useState<string>('');

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
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
    };

    return (
        <Router>
            <StarfieldBackground>
                <div className="min-h-screen text-zinc-50 flex flex-col font-sans relative">
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

                    {/* Navbar */}
                    <header className="sticky top-0 z-50 w-full glass border-b border-white/5 px-6 lg:px-20 py-3">
                        <div className="max-w-7xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                                    <div className="size-12 flex items-center justify-center">
                                        <img src={communityLogo} alt="our-Fix" className="size-full object-contain" />
                                    </div>
                                    <h2 className="text-lg font-bold tracking-tight text-slate-100">our-Fix</h2>
                                </Link>

                                <nav className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-slate-400">
                                    <Link to="/" className="hover:text-primary transition-colors">{t('nav.home')}</Link>
                                    <Link to="/community" className="hover:text-primary transition-colors">{t('nav.community')}</Link>
                                    <Link to="/news" className="hover:text-primary transition-colors">{t('nav.news')}</Link>
                                    <Link to="/support" className="hover:text-primary transition-colors">{t('nav.support')}</Link>
                                    {user && (
                                        <Link to="/invitations" className="hover:text-primary transition-colors">{t('nav.inbox')}</Link>
                                    )}
                                </nav>
                            </div>


                            <div className="flex items-center gap-6">
                                <div className="hidden lg:flex items-center glass rounded-full px-4 py-1 gap-3 border-white/10">
                                    <span className="material-symbols-outlined text-slate-400 text-xs">search</span>
                                    <input className="bg-transparent border-none focus:ring-0 text-xs text-slate-200 placeholder:text-slate-500 w-40 outline-none" placeholder={t('nav.search')} type="text" />
                                </div>


                                <div className="flex items-center gap-3">
                                    {user && licenseInfo && (
                                        <div className="hidden xl:flex flex-col items-end gap-1 px-4 py-1.5 glass rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <div className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-[0.2em] border ${licenseInfo.keyType === 'eternal' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20' :
                                                    licenseInfo.keyType === 'custom' ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' :
                                                        'bg-primary/20 text-primary border-primary/20'
                                                    }`}>
                                                    {licenseInfo.keyType} Protocol
                                                </div>
                                            </div>
                                            {licenseInfo.expiresAt && (
                                                <div className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
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

                                    <div className="relative group hidden sm:block">
                                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full glass hover:bg-white/10 transition-all text-slate-200 text-xs font-bold border-white/10">
                                            <span className="material-symbols-outlined text-sm">language</span>
                                            <span className="uppercase">{i18n.language.substring(0, 2)}</span>
                                            <span className="material-symbols-outlined text-xs">expand_more</span>
                                        </button>
                                        <div className="absolute top-full right-0 mt-2 w-40 glass border border-white/10 rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl z-[100]">
                                            <button onClick={() => changeLanguage('en')} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-primary hover:text-background-dark transition-colors border-b border-white/5 uppercase tracking-widest flex items-center justify-between">
                                                {t('common.EN')}
                                                {i18n.language === 'en' && <span className="material-symbols-outlined text-sm">check</span>}
                                            </button>
                                            <button onClick={() => changeLanguage('ar')} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-primary hover:text-background-dark transition-colors border-b border-white/5 uppercase tracking-widest flex items-center justify-between">
                                                {t('common.AR')}
                                                {i18n.language === 'ar' && <span className="material-symbols-outlined text-sm">check</span>}
                                            </button>
                                            <button onClick={() => changeLanguage('ru')} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-primary hover:text-background-dark transition-colors uppercase tracking-widest flex items-center justify-between">
                                                {t('common.RU')}
                                                {i18n.language === 'ru' && <span className="material-symbols-outlined text-sm">check</span>}
                                            </button>
                                        </div>
                                    </div>


                                    <button className="size-10 hidden sm:flex items-center justify-center rounded-full glass hover:bg-white/10 transition-all text-slate-200">
                                        <span className="material-symbols-outlined text-xl">notifications</span>
                                    </button>

                                    <div className="hidden sm:block h-10 w-[1px] bg-white/10 mx-1"></div>

                                    {user ? (
                                        <>
                                            <div className="flex items-center gap-3 pl-1 cursor-pointer" onClick={() => setIsProfileOpen(true)}>
                                                <div className="size-9 rounded-full bg-gradient-to-tr from-primary to-emerald-700 p-[1px] hover:scale-105 transition-transform">
                                                    {userData?.profilePicture ? (
                                                        <img src={userData.profilePicture} alt="Avatar" className="size-full rounded-full object-cover" />
                                                    ) : (
                                                        <div className="size-full rounded-full bg-background-dark flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-primary text-sm">person</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="text-slate-400 hover:text-red-400 transition-all p-2 rounded-full hover:bg-white/5 active:scale-95"
                                                title="Sign Out"
                                            >
                                                <span className="material-symbols-outlined text-xl">logout</span>
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsAuthModalOpen(true)}
                                            className="btn-premium px-6 py-2 rounded-xl text-background-dark font-bold text-sm shadow-lg hover:scale-105 transition-transform uppercase tracking-widest"
                                        >
                                            {t('auth.signIn')}
                                        </button>

                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 relative z-10">
                        {userData?.isBanned ? (
                            <div className="max-w-4xl mx-auto mt-20 p-12 glass rounded-[2rem] text-center space-y-10 animate-in fade-in duration-1000 border border-red-500/20 shadow-[0_0_100px_rgba(239,68,68,0.1)] relative overflow-hidden">
                                <div className="relative inline-flex mb-4">
                                    <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse" />
                                    <div className="h-24 w-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 border border-red-500/20 relative z-10">
                                        <span className="material-symbols-outlined text-5xl">shield_alert</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Connection <span className="text-red-500">Terminated</span></h1>
                                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Security Protocol violation detected by Internal Governance</p>
                                    <div className="h-px w-20 bg-red-500/20 mx-auto my-6" />
                                    <p className="text-slate-400 font-medium leading-relaxed max-w-lg mx-auto italic">
                                        Your access to the mesh has been permanently revoked. All core frequencies are now restricted for your local node.
                                    </p>
                                </div>
                                <div className="pt-6 relative z-10">
                                    <button
                                        onClick={handleLogout}
                                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-[0.2em] px-10 py-4 rounded-xl transition-all"
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
