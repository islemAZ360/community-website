import React, { useState, useRef, useEffect } from 'react';
import { X, Mail, Camera, Save, CheckCircle2, ShieldCheck, Copy, Check, Activity, Globe, Zap, Cpu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db, storage } from '../lib/firebase';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
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
            const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    useAuthStore.setState({ userData: snapshot.data() as any });
                }
            });

            return () => {
                unsubscribePayments();
                unsubscribeUser();
            };
        }
    }, [isOpen, user]);

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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-500">
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
            <div className="bg-[#030303] border border-white/5 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(19,236,164,0.07)] relative animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
                
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#13eca4]/30 to-transparent" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-[#13eca4]/5 blur-[70px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="relative p-7 border-b border-white/[0.03] flex justify-between items-center bg-white/[0.01]">
                    <div className="flex items-center gap-5">
                        <div className="size-12 bg-[#13eca4]/10 rounded-2xl flex items-center justify-center text-[#13eca4] border border-[#13eca4]/20 shadow-[0_0_20px_rgba(19,236,164,0.1)]">
                            <Cpu size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-widest text-white uppercase italic leading-none">
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
                        className="size-11 flex items-center justify-center bg-white/5 hover:bg-rose-500/20 rounded-xl text-white/30 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 transition-all active:scale-95"
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
                                <div className="absolute -inset-1 bg-gradient-to-br from-[#13eca4]/20 via-transparent to-[#6366f1]/20 rounded-[2.5rem] opacity-50 blur-sm group-hover:opacity-100 transition duration-700" />
                                
                                <div className="w-36 h-36 rounded-[2.5rem] bg-[#080808] border border-white/[0.05] flex items-center justify-center overflow-hidden relative z-10 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                                    <div className="scan-line" />
                                    {previewImage ? (
                                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="text-6xl font-black text-white/[0.03] uppercase italic">
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
                                    <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">
                                        {userData?.nickname || 'Unknown Agent'}
                                    </h4>
                                    <div className="flex items-center justify-center md:justify-start gap-2.5">
                                        <Activity size={12} className="text-[#13eca4]" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#13eca4]/60">
                                            Network Access: {userData?.licenseKey ? 'Premium' : 'Standard'}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl flex flex-col items-start gap-1 group/stat hover:border-[#13eca4]/20 transition-colors">
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Status</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${userData?.status === 'approved' ? 'text-[#13eca4]' : 'text-amber-500'}`}>
                                            <span className={`size-1.5 rounded-full animate-pulse ${userData?.status === 'approved' ? 'bg-[#13eca4]' : 'bg-amber-500'}`} />
                                            {userData?.status === 'approved' ? 'Active Link' : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl flex flex-col items-start gap-1 hover:border-white/10 transition-colors">
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Missions</span>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{paymentRequests.length} Deployed</span>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl flex flex-col items-start gap-1 hover:border-white/10 transition-colors">
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Security</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${userData?.licenseKey ? 'text-indigo-400' : 'text-white/50'}`}>
                                            {userData?.licenseKey ? 'Enhanced' : 'Standard'}
                                        </span>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl flex flex-col items-start gap-1 hover:border-white/10 transition-colors">
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Authority</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${userData?.role === 'admin' ? 'text-rose-400' : (userData?.licenseKey ? 'text-emerald-400' : 'text-white/50')}`}>
                                            {userData?.role === 'admin' ? 'L5 Command' : (userData?.licenseKey ? 'L3 Clear' : 'L1 Guest')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* License Module */}
                        {userData?.licenseKey && (
                            <div className="relative group animate-in slide-in-from-bottom-6 duration-700">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#13eca4]/20 to-[#6366f1]/20 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                                <div className="relative p-6 rounded-[2.5rem] bg-gradient-to-br from-[#13eca4]/[0.03] to-transparent border border-[#13eca4]/10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-[#13eca4]/10 flex items-center justify-center text-[#13eca4]">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div>
                                                <h5 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Operational Access Key</h5>
                                                <p className="text-[8px] text-white/30 font-bold uppercase tracking-[0.3em] mt-0.5">Encrypted Stream Active</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(userData.licenseKey!);
                                                setCopiedKey(true);
                                                setTimeout(() => setCopiedKey(false), 2000);
                                            }}
                                            className={`h-11 px-4 rounded-xl border transition-all flex items-center gap-3 active:scale-95 ${copiedKey ? 'bg-[#13eca4] border-transparent text-[#030303]' : 'bg-white/5 border-white/10 text-white/60 hover:border-[#13eca4]/50 hover:text-white'}`}
                                        >
                                            {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                                            <span className="text-[10px] font-black uppercase tracking-widest">{copiedKey ? 'INJECTED' : 'COPY KEY'}</span>
                                        </button>
                                    </div>
                                    
                                    <div className="font-mono text-xl sm:text-2xl text-white font-black tracking-[0.25em] bg-black/60 p-5 rounded-2xl border border-white/[0.03] text-center shadow-inner group-hover:border-[#13eca4]/20 transition-all">
                                        {userData.licenseKey}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detail Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/[0.01] border border-white/[0.03] rounded-[1.5rem] p-5 flex items-center gap-5 hover:bg-white/[0.03] transition-all group">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center group-hover:bg-[#13eca4]/10 transition-colors">
                                    <Mail size={20} className="text-white/20 group-hover:text-[#13eca4]" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block mb-1">Encrypted Relay</span>
                                    <span className="text-xs text-white/70 font-mono truncate block group-hover:text-white transition-colors">
                                        {userData?.email || user.email}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/[0.01] border border-white/[0.03] rounded-[1.5rem] p-5 flex items-center gap-5 hover:bg-white/[0.03] transition-all group">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                                    <Globe size={20} className="text-white/20 group-hover:text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] block mb-1">Grid Location</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#13eca4]">Connection Stable</span>
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
                <div className="p-7 bg-white/[0.01] border-t border-white/[0.03]">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isUnchanged}
                        className={`w-full h-14 border text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 group relative overflow-hidden ${success
                                ? 'bg-[#13eca4] border-transparent text-[#030303] shadow-[0_0_40px_rgba(19,236,164,0.3)]'
                                : isUnchanged
                                    ? 'bg-white/[0.02] border-white/5 text-white/10 cursor-not-allowed'
                                    : 'bg-[#13eca4]/90 hover:bg-[#13eca4] border-transparent text-[#030303] shadow-[0_0_30px_rgba(19,236,164,0.15)] hover:shadow-[0_0_40px_rgba(19,236,164,0.25)] active:scale-[0.98]'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-[#030303]/20 border-t-[#030303] rounded-full animate-spin" />
                                <span>SYNCING_PROTOCOLS...</span>
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle2 size={18} />
                                <span>PROTOCOL_SYNCED</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} className="group-hover:rotate-12 transition-transform duration-500" />
                                <span>UPDATE_CREDENTIALS</span>
                            </>
                        )}
                        
                        {/* Shine Effect */}
                        {!isUnchanged && !isSaving && !success && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-1000 ease-out" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};