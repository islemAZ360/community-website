import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AuthModal } from './components/AuthModal';
import { Home } from './pages/Home';
import { Community } from './pages/Community';
import { Room } from './pages/Room';
import { Invitations } from './pages/Invitations';
import { News } from './pages/News';
import { Support } from './pages/Support';
import { LogOut, User as UserIcon, Home as HomeIcon, Users, Newspaper, Mail, LifeBuoy } from 'lucide-react';

function App() {
    const { user, userData, setUser, fetchUserData, setLoading } = useAuthStore();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await fetchUserData(currentUser.uid);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <Router>
            <div className="min-h-screen bg-[#070708] text-zinc-50 flex flex-col font-sans relative overflow-hidden">
                {/* Holographic Background Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Navbar */}
                <header className="h-20 border-b border-white/[0.03] bg-zinc-900/40 backdrop-blur-3xl sticky top-0 z-50 flex items-center px-8 justify-between transition-all">
                    <div className="flex items-center gap-12">
                        <Link to="/" className="group flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <Rocket size={20} className="text-white" />
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

                        {user ? (
                            <div className="flex items-center gap-5">
                                <div className="flex items-center gap-3 text-xs text-zinc-300 bg-white/[0.03] px-4 py-2 rounded-xl border border-white/[0.05] shadow-inner font-bold">
                                    <UserIcon size={14} className="text-indigo-400" />
                                    <span className="text-white">{userData?.nickname || 'Explorer'}</span>
                                </div>
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
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/room/:roomId" element={<Room />} />
                        <Route path="/invitations" element={<Invitations />} />
                        <Route path="/news" element={<News />} />
                        <Route path="/support" element={<Support />} />
                    </Routes>
                </main>

                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                />
            </div>
        </Router>
    );
}

export default App;
