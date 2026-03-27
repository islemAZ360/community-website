import React, { useState, useRef, useEffect } from 'react';
import { X, Mail, Camera, Save, CheckCircle2, ShieldCheck, Copy, Check, Activity, Globe, Zap, Cpu, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db, storage } from '../lib/firebase';
import { doc, updateDoc, collection, query, where, onSnapshot, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, userData, fetchUserData } = useAuthStore();
    const [isSaving, setIsSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
    const [copiedKey, setCopiedKey] = useState(false);
    const [licenseData, setLicenseData] = useState<any>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync initial state and fetch payments when modal opens
    useEffect(() => {
        if (isOpen && user) {
            if (!userData) {
                fetchUserData(user.uid);
            }
            setPreviewImage(userData?.profilePicture || null);
            setError(null);
            setSuccess(false);

            // Fetch payment history (Removed orderBy to avoid missing index errors)
            const q = query(
                collection(db, 'payment_requests'),
                where('userId', '==', user.uid)
            );

            const unsubscribePayments = onSnapshot(q, (snapshot) => {
                const requests = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort locally instead of relying on Firestore index
                requests.sort((a: any, b: any) => {
                    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
                    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
                    return dateB - dateA;
                });
                setPaymentRequests(requests);
            });

            // Real-time user data sync (for license key approval)
            const userRef = doc(db, 'users', user.uid);
            const unsubscribeUser = onSnapshot(userRef, async (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    useAuthStore.setState({ userData: data as any });
                    
                    if (data.licenseKey) {
                        try {
                            const keySnap = await getDoc(doc(db, 'license_keys', data.licenseKey));
                            if (keySnap.exists()) {
                                setLicenseData(keySnap.data());
                            }
                        } catch (e) {
                            console.error("Failed to load license details");
                        }
                    }
                }
            });

            return () => {
                unsubscribePayments();
                unsubscribeUser();
            };
        }
    }, [isOpen, user]);

    // Timer logic
    useEffect(() => {
        if (!licenseData) return;
        
        const updateTimer = () => {
             if (licenseData.durationDays === null) {
                 setTimeRemaining("ETERNAL ACCESS");
                 return;
             }
             const activatedAt = new Date(licenseData.activatedAt || licenseData.createdAt).getTime();
             const durationMs = licenseData.durationDays * 24 * 60 * 60 * 1000;
             const expiresAt = activatedAt + durationMs;
             const now = new Date().getTime();
             const diff = expiresAt - now;

             if (diff <= 0) {
                 setTimeRemaining("EXPIRED");
             } else {
                 const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                 const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                 const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                 const s = Math.floor((diff % (1000 * 60)) / 1000);
                 setTimeRemaining(`${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
             }
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [licenseData]);

    if (!isOpen || !user) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError("Payload too large. Max allowed size is 2MB.");
                return;
            }

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const userRef = doc(db, 'users', user.uid);
            let imageUrl = previewImage;

            // Upload to Firebase Storage if a new file was selected
            if (selectedFile) {
                const storageRef = ref(storage, `profile_pictures/${user.uid}`);
                await uploadBytes(storageRef, selectedFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(userRef, {
                profilePicture: imageUrl
            });
            await fetchUserData(user.uid);
            setSelectedFile(null);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
            }, 2000);
        } catch (err) {
            console.error("Error updating profile:", err);
            setError("Connection failed. Unable to sync identity.");
        } finally {
            setIsSaving(false);
        }
    };

    const isUnchanged = previewImage === (userData?.profilePicture || null);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#020503]/90 backdrop-blur-3xl animate-in fade-in duration-500">
            <style>
                {`
                @keyframes scan-beam {
                    0% { top: -10%; opacity: 0; }
                    20% { opacity: 0.5; }
                    80% { opacity: 0.5; }
                    100% { top: 110%; opacity: 0; }
                }
                .scan-line {
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #13eca4;
                    box-shadow: 0 0 15px #13eca4;
                    animation: scan-beam 3s linear infinite;
                    z-index: 20;
                    pointer-events: none;
                }
                `}
            </style>

            {/* Main Container */}
            <div className="bg-[#05150d] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#05150d]/80 to-[#020503] border border-[#13eca4]/20 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_150px_rgba(19,236,164,0.15)] relative animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
                
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#13eca4]/60 to-transparent shadow-[0_0_20px_#13eca4]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#13eca4]/10 blur-[90px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="relative p-7 border-b border-[#13eca4]/10 flex justify-between items-center bg-[#13eca4]/[0.02]">
                    <div className="flex items-center gap-5">
                        <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-[#13eca4] border border-[#13eca4]/30 shadow-[0_0_30px_rgba(19,236,164,0.2)]">
                            <Cpu size={24} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-[#13eca4] uppercase italic leading-none drop-shadow-md">
                                Elite Profile
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="size-1.5 bg-[#13eca4] rounded-full animate-pulse shadow-[0_0_8px_#13eca4]" />
                                <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em]">
                                    SECURE_TERMINAL_01
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-11 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 transition-all active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Sub-Header / Avatar Overlay Section */}
                <div className="relative overflow-y-auto custom-scrollbar flex-1">
                    <div className="p-8 space-y-8">
                        
                        {/* Avatar & Identity Section */}
                        <div className="flex flex-col md:flex-row items-center gap-8 md:items-start text-center md:text-left">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                {/* Animated Borders */}
                                <div className="absolute -inset-1 bg-gradient-to-br from-[#13eca4] via-[#13eca4]/20 to-indigo-500/50 rounded-[2.5rem] opacity-70 blur-md group-hover:opacity-100 group-hover:blur-xl transition duration-700 animate-pulse" />
                                
                                <div className="w-36 h-36 md:w-40 md:h-40 rounded-[2.5rem] bg-[#020503] border border-[#13eca4]/30 flex items-center justify-center overflow-hidden relative z-10 shadow-[0_0_40px_rgba(19,236,164,0.2)] transition-transform duration-500 group-hover:scale-105">
                                    <div className="scan-line" />
                                    {previewImage ? (
                                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="text-7xl font-black text-[#13eca4]/10 uppercase italic drop-shadow-lg">
                                            {(userData?.nickname || user.email || 'X').charAt(0)}
                                        </div>
                                    )}

                                    {/* Action Hover */}
                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all duration-500 backdrop-blur-sm">
                                        <Camera size={32} className="mb-2 text-[#13eca4]" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#13eca4]/80 text-shadow-glow">Update DNA</span>
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                            </div>

                            <div className="flex-1 py-4 space-y-4">
                                <div className="space-y-1">
                                    <h4 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                        {userData?.nickname || 'Unknown Agent'}
                                    </h4>
                                    <div className="flex items-center justify-center md:justify-start gap-2.5 mt-2">
                                        <Activity size={14} className="text-[#13eca4] animate-bounce" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#13eca4]">
                                            Network Access: {userData?.licenseKey ? 'Premium' : 'Standard'}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <div className="bg-[#13eca4]/5 border border-[#13eca4]/20 p-4 rounded-2xl flex flex-col items-start gap-1 shadow-[inset_0_0_20px_rgba(19,236,164,0.02)] group/stat hover:border-[#13eca4]/50 hover:bg-[#13eca4]/10 transition-all">
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Status</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${userData?.status === 'approved' ? 'text-[#13eca4]' : 'text-amber-500'}`}>
                                            <span className={`size-1.5 rounded-full animate-pulse ${userData?.status === 'approved' ? 'bg-[#13eca4]' : 'bg-amber-500'}`} />
                                            {userData?.status === 'approved' ? 'Active Link' : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="bg-[#13eca4]/5 border border-[#13eca4]/20 p-4 rounded-2xl flex flex-col items-start gap-1 hover:border-[#13eca4]/50 hover:bg-[#13eca4]/10 transition-all shadow-[inset_0_0_20px_rgba(19,236,164,0.02)]">
                                        <span className="text-[8px] font-black text-[#13eca4]/60 uppercase tracking-[0.3em]">Missions</span>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{paymentRequests.length} Deployed</span>
                                    </div>
                                    <div className="bg-[#13eca4]/5 border border-[#13eca4]/20 p-4 rounded-2xl flex flex-col items-start gap-1 hover:border-[#13eca4]/50 hover:bg-[#13eca4]/10 transition-all shadow-[inset_0_0_20px_rgba(19,236,164,0.02)]">
                                        <span className="text-[8px] font-black text-[#13eca4]/60 uppercase tracking-[0.3em]">Security</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${userData?.licenseKey ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'text-white/50'}`}>
                                            {userData?.licenseKey ? 'Enhanced' : 'Standard'}
                                        </span>
                                    </div>
                                    <div className="bg-[#13eca4]/5 border border-[#13eca4]/20 p-4 rounded-2xl flex flex-col items-start gap-1 hover:border-[#13eca4]/50 hover:bg-[#13eca4]/10 transition-all shadow-[inset_0_0_20px_rgba(19,236,164,0.02)]">
                                        <span className="text-[8px] font-black text-[#13eca4]/60 uppercase tracking-[0.3em]">Authority</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest drop-shadow-[0_0_8px_currentColor] ${userData?.role === 'admin' ? 'text-rose-400' : (userData?.licenseKey ? 'text-[#13eca4]' : 'text-white/50')}`}>
                                            {userData?.role === 'admin' ? 'L5 Command' : (userData?.licenseKey ? 'L3 Clear' : 'L1 Guest')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* License Module */}
                        {userData?.licenseKey && (
                            <div className="relative group animate-in slide-in-from-bottom-6 duration-700">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#13eca4] via-[#13eca4]/50 to-indigo-500 rounded-[2.5rem] blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 animate-pulse" />
                                <div className="relative p-7 rounded-[2.5rem] bg-[#020503]/80 backdrop-blur-md border-[2px] border-[#13eca4]/40 space-y-6 shadow-[0_0_50px_rgba(19,236,164,0.15)] overflow-hidden">
                                    <div className="absolute inset-0 bg-[#13eca4]/10 blur-[50px] mix-blend-screen pointer-events-none" />
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTksMjM2LDE2NCwwLjEpIi8+PC9zdmc+')] opacity-50" />
                                    
                                    <div className="relative flex items-center gap-5">
                                        <div className="size-14 rounded-2xl bg-[#13eca4]/20 flex items-center justify-center text-[#13eca4] shadow-[0_0_30px_rgba(19,236,164,0.4)] border border-[#13eca4]/40 backdrop-blur-md shrink-0">
                                            <ShieldCheck size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="text-[13px] font-black text-white uppercase tracking-[0.25em] drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">API Gateway Identity</h5>
                                            <p className="text-[10px] text-[#13eca4] font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(19,236,164,0.5)]">
                                                <span className="size-1.5 bg-[#13eca4] rounded-full animate-ping" /> Encrypted Stream Active
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="relative flex flex-col gap-4">
                                        {/* Status row */}
                                        <div className="flex justify-between items-center bg-black/60 p-5 rounded-2xl border border-[#13eca4]/20 shadow-inner backdrop-blur-sm relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#13eca4]/5 to-transparent animate-[scan-beam_2s_linear_infinite]" />
                                            <div className="flex items-center gap-3 text-[#13eca4]/80 text-[11px] uppercase font-black tracking-widest relative z-10">
                                                <Clock size={18} className="text-[#13eca4] animate-pulse"/> SYSTEM TTL (TIME TO LIVE)
                                            </div>
                                            <div className={`font-mono text-base font-black tracking-widest relative z-10 ${timeRemaining === 'EXPIRED' ? 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'text-[#13eca4] drop-shadow-[0_0_15px_rgba(19,236,164,1)]'}`}>
                                                {timeRemaining || 'CALCULATING...'}
                                            </div>
                                        </div>

                                        {/* Key block */}
                                        <div className="relative bg-black/90 px-6 py-5 rounded-2xl border border-[#13eca4]/30 text-center shadow-[inset_0_0_30px_rgba(19,236,164,0.1)] group/keybox hover:border-[#13eca4]/60 transition-all flex justify-between items-center hover:shadow-[inset_0_0_50px_rgba(19,236,164,0.2)]">
                                            <div className="font-mono text-xl sm:text-3xl text-white font-black tracking-[0.25em] drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                                {userData.licenseKey}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(userData.licenseKey!);
                                                    setCopiedKey(true);
                                                    setTimeout(() => setCopiedKey(false), 2000);
                                                }}
                                                className={`size-12 rounded-xl border-2 flex items-center justify-center transition-all ${copiedKey ? 'bg-[#13eca4] border-[#13eca4] text-black scale-110 shadow-[0_0_30px_rgba(19,236,164,0.8)]' : 'bg-[#13eca4]/10 border-[#13eca4]/30 hover:bg-[#13eca4]/30 text-[#13eca4] hover:shadow-[0_0_20px_rgba(19,236,164,0.4)] hover:scale-105'}`}
                                            >
                                                {copiedKey ? <Check size={20} /> : <Copy size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detail Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#13eca4]/[0.02] border border-[#13eca4]/10 rounded-[1.5rem] p-5 flex items-center gap-5 hover:bg-[#13eca4]/[0.05] hover:border-[#13eca4]/30 shadow-[0_0_20px_rgba(19,236,164,0.02)] transition-all group">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center group-hover:bg-[#13eca4]/20 group-hover:shadow-[0_0_20px_rgba(19,236,164,0.3)] transition-all">
                                    <Mail size={20} className="text-white/20 group-hover:text-[#13eca4]" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <span className="text-[9px] font-black text-[#13eca4]/40 uppercase tracking-[0.2em] block mb-1">Encrypted Relay</span>
                                    <span className="text-xs text-white/90 font-mono truncate block group-hover:text-white transition-colors">
                                        {userData?.email || user.email}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-[#13eca4]/[0.02] border border-[#13eca4]/10 rounded-[1.5rem] p-5 flex items-center gap-5 hover:bg-[#13eca4]/[0.05] hover:border-[#13eca4]/30 shadow-[0_0_20px_rgba(19,236,164,0.02)] transition-all group">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
                                    <Globe size={20} className="text-white/20 group-hover:text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[9px] font-black text-[#13eca4]/40 uppercase tracking-[0.2em] block mb-1">Grid Location</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#13eca4] drop-shadow-[0_0_5px_rgba(19,236,164,0.5)]">Connection Stable</span>
                                </div>
                            </div>
                        </div>

                        {/* Mission Log history */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between px-2 pt-4 border-t border-white/[0.03]">
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Tactical Feed_</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-white/10">{paymentRequests.length} ENTRIES FOUND</span>
                                    <div className="size-1.5 bg-[#13eca4]/20 rounded-full" />
                                </div>
                            </div>
                            
                            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-3 custom-scrollbar">
                                {paymentRequests.length === 0 ? (
                                    <div className="text-center py-12 border border-dashed border-white/[0.03] rounded-3xl">
                                        <Zap size={24} className="mx-auto mb-3 text-white/[0.03]" />
                                        <p className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">Awaiting first mission deployment</p>
                                    </div>
                                ) : (
                                    paymentRequests.map((req) => (
                                        <div key={req.id} className="p-5 rounded-3xl bg-white/[0.01] border border-white/[0.03] hover:border-white/10 hover:bg-white/[0.02] transition-all group/item">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase tracking-wider group-hover/item:text-[#13eca4] transition-colors">{req.planName}</p>
                                                    <p className="text-[9px] font-mono text-white/20 mt-1 uppercase tracking-widest">ID: {req.transactionId}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                                    req.status === 'approved' ? 'bg-[#13eca4]/10 border-[#13eca4]/20 text-[#13eca4] shadow-[0_0_15px_rgba(19,236,164,0.1)]' :
                                                    req.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            {req.status === 'rejected' && req.rejectionReason && (
                                                <div className="p-3 rounded-xl bg-rose-500/[0.03] border border-rose-500/10">
                                                    <p className="text-[10px] text-rose-400/70 leading-relaxed italic">
                                                        <span className="font-black uppercase tracking-[0.2em] mr-2 not-italic text-rose-500/40">ANOMALY:</span>
                                                        "{req.rejectionReason}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Redesign */}
                <div className="p-7 bg-[#020503] border-t border-[#13eca4]/20 relative">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#13eca4]/50 to-transparent" />
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isUnchanged}
                        className={`w-full h-16 border text-[13px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 group relative overflow-hidden ${success
                                ? 'bg-[#13eca4] border-[#13eca4] text-[#05150d] shadow-[0_0_50px_rgba(19,236,164,0.6)]'
                                : isUnchanged
                                    ? 'bg-white/[0.02] border-[#13eca4]/10 text-[#13eca4]/30 cursor-not-allowed'
                                    : 'bg-[#13eca4] hover:bg-[#13eca4] border-transparent text-[#05150d] shadow-[0_0_40px_rgba(19,236,164,0.3)] hover:shadow-[0_0_60px_rgba(19,236,164,0.5)] active:scale-[0.98]'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-6 h-6 border-2 border-[#05150d]/20 border-t-[#05150d] rounded-full animate-spin" />
                                <span>SYNCING_PROTOCOLS...</span>
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle2 size={22} />
                                <span>PROTOCOL_SYNCED</span>
                            </>
                        ) : (
                            <>
                                <Save size={22} className="group-hover:rotate-12 transition-transform duration-500" />
                                <span>UPDATE_CREDENTIALS</span>
                            </>
                        )}
                        
                        {/* Shine Effect */}
                        {!isUnchanged && !isSaving && !success && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-1000 ease-out" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};