import React, { useState } from 'react';
import { X, QrCode, CreditCard, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { sendTelegramMessage } from '../lib/telegram';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: {
        name: string;
        price: string;
        key: string;
    } | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, plan }) => {
    const { user, userData } = useAuthStore();
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !plan || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transactionId.trim()) {
            setError('Please enter your Transaction ID');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Save to Firestore
            await addDoc(collection(db, 'payment_requests'), {
                userId: user.uid,
                userEmail: user.email,
                userName: userData?.nickname || 'Anonymous',
                planKey: plan.key,
                planName: plan.name,
                amount: plan.price,
                transactionId: transactionId,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            // 2. Notify Telegram
            const message = `
🚀 <b>New Payment Request!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>User:</b> ${userData?.nickname || 'Anonymous'}
📧 <b>Email:</b> ${user.email}
📦 <b>Plan:</b> ${plan.name} (${plan.price} RUB)
🆔 <b>Transaction:</b> <code>${transactionId}</code>
━━━━━━━━━━━━━━━━━━
<i>Verify the payment in your bank app and approve via the Admin Dashboard.</i>
            `;
            
            const replyMarkup = {
                inline_keyboard: [
                    [
                        { text: '🌐 Open Admin Dashboard', url: 'https://cod-admin.vercel.app/' }
                    ]
                ]
            };

            const ADMIN_CHAT_ID = '5071905656';
            await sendTelegramMessage(ADMIN_CHAT_ID, message.trim(), replyMarkup);

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setTransactionId('');
            }, 5000);
        } catch (err) {
            console.error('Payment submission error:', err);
            setError('Failed to submit. Please contact admin directly.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="bg-[#050505]/90 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(19,236,164,0.1)] relative animate-in zoom-in-95 duration-300">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all z-20">
                    <X size={20} />
                </button>

                {isSuccess ? (
                    <div className="p-12 text-center space-y-6">
                        <div className="size-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto border border-primary/30 shadow-[0_0_30px_rgba(19,236,164,0.3)]">
                            <CheckCircle2 size={48} className="text-primary animate-bounce" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Mission Transmitted</h3>
                        <p className="text-white/50 text-sm leading-relaxed max-w-sm mx-auto">
                            Your payment details are now being verified by the Tactical Hub. Activation will be complete within minutes.
                        </p>
                        <div className="pt-4">
                            <button onClick={onClose} className="px-8 py-3 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-xl">Acknowledged</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full max-h-[90vh]">
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                    <CreditCard size={20} />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Strategic Acquisition</h3>
                            </div>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] font-mono">Initializing Protocol: {plan.name}</p>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                            {/* Step 1: QR Code */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-6 bg-primary/20 rounded-md flex items-center justify-center text-primary font-black text-[10px]">01</div>
                                    <h4 className="text-xs font-black text-white/80 uppercase tracking-widest">Scan & Transfer</h4>
                                </div>
                                
                                <div className="glass p-6 rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 to-transparent flex flex-col items-center gap-6">
                                    <div className="relative group">
                                        <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                        <div className="relative bg-white p-3 rounded-2xl shadow-2xl overflow-hidden">
                                            <img 
                                                src="/QR_code.jpg" 
                                                alt="Payment QR" 
                                                className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <div className="flex items-center justify-center gap-2 text-2xl font-black text-white italic">
                                            <span>{plan.price}</span>
                                            <span className="text-primary tracking-tighter italic">RUB</span>
                                        </div>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
                                            Scan via your Banking App (SBP)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Transaction ID */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-6 bg-primary/20 rounded-md flex items-center justify-center text-primary font-black text-[10px]">02</div>
                                        <h4 className="text-xs font-black text-white/80 uppercase tracking-widest">Verify Transaction</h4>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-4">Terminal Reference (ID)</label>
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                placeholder="Enter Transaction ID from Bank..." 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-primary/40 focus:bg-white/[0.08] transition-all text-sm font-mono"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary/40 transition-colors">
                                                <QrCode size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400">
                                        <AlertCircle size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                                    </div>
                                ) }

                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(19,236,164,0.3)] hover:shadow-[0_0_50px_rgba(19,236,164,0.5)] transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Transmitting Signal...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                            <span>Transmit Proof of Payment</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
