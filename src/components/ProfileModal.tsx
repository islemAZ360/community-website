import React, { useState, useRef, useEffect } from 'react';
import { X, User, Mail, Camera, Save, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, userData, fetchUserData } = useAuthStore();
    const [isSaving, setIsSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
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

            // Fetch payment history
            const q = query(
                collection(db, 'payment_requests'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const requests = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setPaymentRequests(requests);
            });

            return () => unsubscribe();
        }
    }, [isOpen, user, userData, fetchUserData]);

    if (!isOpen || !user) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (file) {
            // Check size (Limit to 500KB because Base64 encoding increases size by ~33%, and Firestore limit is 1MB)
            if (file.size > 500 * 1024) {
                setError("Payload too large. Max allowed size is 500KB.");
                return;
            }

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
            await updateDoc(userRef, {
                profilePicture: previewImage
            });
            await fetchUserData(user.uid);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose(); // Optional: Close modal after success
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Modal Container */}
            <div className="bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.15)] relative animate-in zoom-in-95 duration-300">

                {/* Top Background Glow */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="relative p-6 sm:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tighter text-white uppercase italic leading-tight">
                                Tactical Profile
                            </h3>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-0.5">
                                Identity Module
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 space-y-8 relative">

                    {/* Error Banner */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 animate-in slide-in-from-top-2">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">{error}</p>
                        </div>
                    )}

                    {/* Avatar Section */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {/* Animated Ring */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-[2.5rem] opacity-20 group-hover:opacity-50 blur transition duration-500" />

                            <div className="w-32 h-32 rounded-[2.5rem] bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden relative z-10 transition-transform duration-300 group-hover:scale-[1.02]">
                                {previewImage ? (
                                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-5xl font-black text-white/10 uppercase">
                                        {(userData?.nickname || user.email || 'X').charAt(0)}
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all duration-300 backdrop-blur-[2px]">
                                    <Camera size={26} className="mb-2 text-indigo-400" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-100">Update Scan</span>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                className="hidden"
                                accept="image/jpeg, image/png, image/webp"
                            />
                        </div>

                        <div className="mt-5 space-y-1">
                            <h4 className="text-lg font-black text-white uppercase tracking-tight">
                                {userData?.nickname || 'Anonymous Agent'}
                            </h4>
                            <div className="flex items-center justify-center gap-1.5 text-indigo-400">
                                <ShieldCheck size={14} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                    {userData?.licenseKey ? 'Authorized Agent' : 'Guest Explorer'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="space-y-3">
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-white/10 transition-colors">
                            <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                <Mail size={18} className="text-zinc-400" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] block mb-1">Encrypted Comm</span>
                                <span className="text-xs text-white/80 font-mono truncate block">
                                    {userData?.email || user.email}
                                </span>
                            </div>
                        </div>

                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:border-white/10 transition-colors">
                            <div className="size-10 rounded-xl bg-emerald-500/5 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={18} className="text-emerald-500/70" />
                            </div>
                            <div className="flex-1">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] block mb-1">Network Status</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Connection Stable</span>
                            </div>
                        </div>
                    </div>

                    {/* Mission History (Payment Requests) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Mission History</h4>
                            <span className="text-[8px] font-mono text-white/20 uppercase">{paymentRequests.length} LOGS</span>
                        </div>
                        
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {paymentRequests.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl">
                                    <p className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">No missions deployed yet</p>
                                </div>
                            ) : (
                                paymentRequests.map((req) => (
                                    <div key={req.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-tight">{req.planName}</p>
                                                <p className="text-[8px] font-mono text-white/30">ID: {req.transactionId}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                                req.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                req.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        {req.status === 'rejected' && req.rejectionReason && (
                                            <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                                <p className="text-[9px] text-red-400/80 leading-relaxed italic">
                                                    <span className="font-black uppercase tracking-widest mr-1 not-italic">Intel:</span>
                                                    "{req.rejectionReason}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isUnchanged}
                            className={`w-full h-14 border text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group ${success
                                    ? 'bg-emerald-500 border-emerald-400 text-black'
                                    : isUnchanged
                                        ? 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                                        : 'bg-indigo-500 hover:bg-indigo-400 border-indigo-400 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]'
                                }`}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Syncing...</span>
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle2 size={18} className="text-black" />
                                    <span>Identity Synced</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} className={isUnchanged ? 'text-white/30' : 'text-indigo-100'} />
                                    <span>Update Credentials</span>
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};