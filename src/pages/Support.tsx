import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { LifeBuoy, Send, Loader2, CheckCircle2 } from 'lucide-react';

export function Support() {
    const { user, userData } = useAuthStore();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userData) {
            setError("You must be logged in to submit a ticket.");
            return;
        }

        if (!subject.trim() || !message.trim()) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            await addDoc(collection(db, 'support_tickets'), {
                userId: user.uid,
                userNickname: userData.nickname,
                subject: subject.trim(),
                message: message.trim(),
                status: 'open',
                createdAt: serverTimestamp()
            });

            setSuccess(true);
            setSubject('');
            setMessage('');
        } catch (err: any) {
            console.error("Support ticket error:", err);
            setError("Failed to submit ticket. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-xl mx-auto mt-20 p-8 glass-panel rounded-2xl text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white">Ticket Submitted!</h2>
                <p className="text-zinc-400">
                    Thank you for reaching out. The site administrator has received your message and will review it shortly.
                </p>
                <button
                    onClick={() => setSuccess(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl transition-colors mt-4"
                >
                    Submit Another Ticket
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
            <header className="flex items-center gap-4 glass-panel p-6 rounded-2xl border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <div className="h-16 w-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                    <LifeBuoy size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Support Center</h1>
                    <p className="text-zinc-400 mt-1">
                        Send a message or complaint directly to the site administrator.
                    </p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 ml-1">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Briefly describe your issue..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 ml-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Please provide details about your issue or complaint..."
                            className="w-full h-48 bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                            required
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading || !subject.trim() || !message.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        {loading ? 'Submitting...' : 'Send Message'}
                    </button>
                    <p className="text-center text-xs text-zinc-500 mt-4">
                        Your message will be securely sent to the administration team.
                    </p>
                </div>
            </form>
        </div>
    );
}
