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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Dark Overlay Backdrop - No Blur for Performance */}
            <div className="fixed inset-0 bg-black/90" onClick={onClose} />

            {/* Main Container - Minimal Layout */}
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden relative flex flex-col max-h-[90vh] z-[201] shadow-xl">
                
                {/* Minimal Background Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

                {/* Header */}
                <div className="relative p-6 border-b border-white/5 flex justify-between items-center bg-[#111111]">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                            <Cpu size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight leading-none">
                                Elite Profile
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="size-1.5 bg-emerald-500 rounded-full" />
                                <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                                    Account Settings
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
                        <div className="flex flex-col md:flex-row items-center gap-6 md:items-start text-center md:text-left">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden relative z-10 transition-all duration-300 group-hover:border-emerald-500/50">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-5xl font-bold text-white/10">
                                            {(userData?.nickname || user.email || 'X').charAt(0)}
                                        </div>
                                    )}
                                    {/* Action Hover */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-300">
                                        <Camera size={24} className="mb-1 text-emerald-400" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">Update Photo</span>
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                            </div>

                            <div className="flex-1 py-2 space-y-3">
                                <div className="space-y-1">
                                    <h4 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                        {userData?.nickname || 'Unknown Agent'}
                                    </h4>
                                    <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                        <Activity size={12} className="text-emerald-400" />
                                        <span className="text-[11px] font-medium text-emerald-400/80 uppercase tracking-wider">
                                            {userData?.licenseKey ? 'Premium Member' : 'Standard Member'}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="bg-zinc-900 border border-white/5 p-3 rounded-xl hover:border-white/10 transition-all">
                                        <span className="text-[9px] font-medium text-white/30 uppercase tracking-widest block mb-1">Status</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`size-1.5 rounded-full ${userData?.status === 'approved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${userData?.status === 'approved' ? 'text-emerald-400' : 'text-amber-500'}`}>
                                                {userData?.status === 'approved' ? 'Active' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900 border border-white/5 p-3 rounded-xl hover:border-white/10 transition-all">
                                        <span className="text-[9px] font-medium text-white/30 uppercase tracking-widest block mb-1">History</span>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{paymentRequests.length} Requests</span>
                                    </div>
                                    <div className="bg-zinc-900 border border-white/5 p-3 rounded-xl hover:border-white/10 transition-all">
                                        <span className="text-[9px] font-medium text-white/30 uppercase tracking-widest block mb-1">Security</span>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{userData?.licenseKey ? 'High' : 'Basic'}</span>
                                    </div>
                                    <div className="bg-zinc-900 border border-white/5 p-3 rounded-xl hover:border-white/10 transition-all">
                                        <span className="text-[9px] font-medium text-white/30 uppercase tracking-widest block mb-1">Role</span>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{userData?.role || 'User'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* License Module */}
                        {userData?.licenseKey && (
                            <div className="space-y-4">
                                <div className="p-6 rounded-2xl bg-zinc-900 border border-emerald-500/20 space-y-5">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-bold text-white uppercase tracking-wider">License Identity</h5>
                                            <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-widest mt-0.5">
                                                Active Subscription
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-black/40 px-4 py-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-bold tracking-wider">
                                                <Clock size={14}/> Time Remaining
                                            </div>
                                            <div className={`font-mono text-sm font-bold ${timeRemaining === 'EXPIRED' ? 'text-rose-500' : 'text-emerald-400'}`}>
                                                {timeRemaining || 'Loading...'}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center bg-black px-4 py-3 rounded-xl border border-white/10 group/key">
                                            <div className="font-mono text-lg text-white font-bold tracking-widest">
                                                {userData.licenseKey}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(userData.licenseKey!);
                                                    setCopiedKey(true);
                                                    setTimeout(() => setCopiedKey(false), 2000);
                                                }}
                                                className={`size-10 rounded-lg flex items-center justify-center transition-all ${copiedKey ? 'bg-emerald-500 text-black' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'}`}
                                            >
                                                {copiedKey ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detail Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-all">
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
                                    <Mail size={18} className="text-white/40" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <span className="text-[9px] font-medium text-white/30 uppercase tracking-widest block mb-0.5">Email Relay</span>
                                    <span className="text-xs text-white/80 font-mono truncate block">
                                        {userData?.email || user.email}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-all">
                                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
                                    <Globe size={18} className="text-white/40" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[9px] font-medium text-white/30 uppercase tracking-widest block mb-0.5">Location</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Stable Connection</span>
                                </div>
                            </div>
                        </div>

                        {/* History section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Request History</h4>
                                <span className="text-[9px] font-mono text-white/10">{paymentRequests.length} ITEMS</span>
                            </div>
                            
                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                {paymentRequests.length === 0 ? (
                                    <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl">
                                        <Zap size={20} className="mx-auto mb-2 text-white/5" />
                                        <p className="text-[10px] font-medium text-white/20 uppercase tracking-wider">No requests found</p>
                                    </div>
                                ) : (
                                    paymentRequests.map((req) => (
                                        <div key={req.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-white uppercase tracking-wider">{req.planName}</p>
                                                    <p className="text-[9px] font-mono text-white/20 mt-0.5">ID: {req.transactionId}</p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                                                    req.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                    req.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            {req.status === 'rejected' && req.rejectionReason && (
                                                <div className="mt-2 p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-400/70 italic">
                                                    Reason: "{req.rejectionReason}"
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#0a0a0a] border-t border-white/5">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isUnchanged}
                        className={`w-full h-14 text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${success
                                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                : isUnchanged
                                    ? 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/10 active:scale-[0.98]'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                <span>Saving Changes...</span>
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle2 size={20} />
                                <span>Profile Saved</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Update Profile</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};