import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';

// شاشة تحميل النظام (Premium Cyberpunk Initial Loader)
// تظهر لحين اكتمال تحميل اللغات (i18n) والملفات الأساسية
const SystemLoader = () => (
    <div className="fixed inset-0 bg-[#0a0a0c] z-[9999] flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.03%22/%3E%3C/svg%3E')] pointer-events-none" />

        <div className="relative flex flex-col items-center justify-center">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-[#13eca4]/20 blur-[100px] rounded-full animate-pulse" />

            {/* Spinner */}
            <div className="size-16 md:size-20 border-4 border-white/5 border-t-[#13eca4] rounded-full animate-spin mb-10 relative z-10 shadow-[0_0_30px_rgba(19,236,164,0.2)]" />

            {/* Loading Text */}
            <div className="flex items-center gap-4 relative z-10 bg-black/40 px-6 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="size-2 bg-[#13eca4] rounded-full animate-pulse shadow-[0_0_10px_rgba(19,236,164,0.8)]" />
                <span className="text-[#13eca4] text-[10px] md:text-xs font-black uppercase tracking-[0.4em] animate-pulse">
                    Initializing System...
                </span>
            </div>
        </div>
    </div>
);

// تشغيل التطبيق (Bootstrap App)
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Suspense fallback={<SystemLoader />}>
            <App />
        </Suspense>
    </React.StrictMode>,
);

// رسالة تكتيكية للمطورين في الكونسول (Tactical Console Easter Egg)
console.log(
    '%c SYSTEM ONLINE \n%c SECURE CONNECTION ESTABLISHED. WELCOME AGENT.',
    'color: #13eca4; font-size: 28px; font-weight: 900; font-family: monospace; text-shadow: 0 0 15px rgba(19,236,164,0.6);',
    'color: #888; font-size: 11px; font-family: monospace; letter-spacing: 2px; padding-top: 5px;'
);

// تسجيل نظام تطبيق الويب التقدمي (Register Service Worker for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(() => {
                console.log(
                    '%c[PWA] Sub-routines Active & Background Sync Enabled.',
                    'color: #13eca4; font-weight: bold; font-family: monospace; font-size: 10px;'
                );
            })
            .catch(error => {
                console.error(
                    '%c[PWA] Initialization Failed. Operating in degraded mode.',
                    'color: #ef4444; font-weight: bold; font-family: monospace; font-size: 10px;',
                    error
                );
            });
    });
}