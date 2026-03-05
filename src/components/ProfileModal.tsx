import React, { useState, useRef } from 'react';
import { X, User, Mail, Camera, Save, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, userData, fetchUserData } = useAuthStore();
    const [isSaving, setIsSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(userData?.profilePicture || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen || !user || !userData) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check size (limit to 1MB)
            if (file.size > 1024 * 1024) {
                alert("Image too large. Please select an image under 1MB.");
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
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                profilePicture: previewImage
            });
            await fetchUserData(user.uid);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight text-white uppercase italic">TACTICAL PROFILE</h3>
                            <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em] mt-0.5">Manage identity credentials</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-white/20 hover:text-white transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border-2 border-white/5 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-indigo-500/40 transition-all duration-500 relative">
                                {previewImage ? (
                                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-4xl font-black text-white/10">{userData.nickname.charAt(0).toUpperCase()}</div>
                                )}

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all duration-300 backdrop-blur-sm"
                                >
                                    <Camera size={24} className="mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Update Feed</span>
                                </button>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <h4 className="mt-4 text-sm font-black text-white uppercase tracking-tight">{userData.nickname}</h4>
                        <p className="text-[10px] text-indigo-400/60 font-black uppercase tracking-[0.15em] mt-1">
                            {userData.licenseKey ? 'Authorized Agent' : 'Guest Explorer'}
                        </p>
                    </div>

                    {/* Info Section */}
                    <div className="space-y-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                            <Mail size={18} className="text-zinc-600" />
                            <div className="flex-1 overflow-hidden">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1">Electronic Mail</span>
                                <span className="text-xs text-white/60 font-medium truncate block">{userData.email}</span>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                            <CheckCircle2 size={18} className="text-emerald-500/50" />
                            <div className="flex-1">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1">Status</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Connection Stable</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || previewImage === userData.profilePicture}
                            className={`flex-1 ${success ? 'bg-emerald-500' : 'bg-white/5 hover:bg-white/10'} border border-white/5 text-xs font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-30`}
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : success ? (
                                <CheckCircle2 size={16} className="text-black" />
                            ) : (
                                <Save size={16} />
                            )}
                            <span className={success ? 'text-black' : 'text-white/70'}>
                                {success ? 'Identity Sync' : 'Update Credentials'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
