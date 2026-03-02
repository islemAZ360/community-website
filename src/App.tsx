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
            <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans">
                {/* Navbar */}
                <header className="h-16 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40 flex items-center px-6 justify-between transition-all">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                            Interview Coder
                        </Link>

                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
                            <Link to="/" className="hover:text-white transition-colors flex items-center gap-2">
                                <HomeIcon size={16} /> Home
                            </Link>
                            <Link to="/community" className="hover:text-white transition-colors flex items-center gap-2">
                                <Users size={16} /> Community
                            </Link>
                            <Link to="/news" className="hover:text-white transition-colors flex items-center gap-2">
                                <Newspaper size={16} /> News
                            </Link>
                            {user && (
                                <Link to="/invitations" className="hover:text-white transition-colors flex items-center gap-2">
                                    <Mail size={16} /> Inbox
                                </Link>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/support" className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors text-sm font-medium text-zinc-300">
                            <LifeBuoy size={16} className="text-emerald-400" />
                            Support
                        </Link>
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-zinc-300 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                    <UserIcon size={14} className="text-indigo-400" />
                                    <span className="font-medium text-white">{userData?.nickname || 'User'}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-zinc-400 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/5"
                                    title="Sign Out"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 text-sm"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1">
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
