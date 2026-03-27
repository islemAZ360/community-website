import os

path = r'c:\Users\1\OneDrive\Desktop\my own projects\interview-coder\New folder\community-website-main\src\components\ProfileModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_content = """    return (
        <div className="fixed inset-0 z-[300] flex bg-[#020503] animate-in fade-in duration-500 overflow-hidden text-slate-300">
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
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(19, 236, 164, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(19, 236, 164, 0.3); }
                `}
            </style>

            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#13eca4]/5 to-transparent pointer-events-none" />
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#13eca4]/[0.03] blur-[120px] rounded-full pointer-events-none" />

            {/* Sidebar (Identity & Actions) */}
            <div className="w-full md:w-[380px] h-full border-r border-[#13eca4]/10 bg-[#050b08]/80 backdrop-blur-xl flex flex-col relative z-10 shrink-0">
                
                <div className="p-8 flex items-center justify-between border-b border-[#13eca4]/10 bg-[#13eca4]/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-[#13eca4]/10 rounded-xl flex items-center justify-center text-[#13eca4] border border-[#13eca4]/30 shadow-[0_0_20px_rgba(19,236,164,0.15)]">
                            <Cpu size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-[#13eca4] uppercase italic drop-shadow-md leading-none">
                                Settings
                            </h3>
                            <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-1.5">
                                <span className="size-1.5 bg-[#13eca4] rounded-full animate-pulse shadow-[0_0_8px_#13eca4]" /> SECURE_TERMINAL
                            </p>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    <button onClick={onClose} className="md:hidden size-10 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/20 active:scale-95">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col items-center">
                    
                    {/* Interactive Avatar */}
                    <div className="relative group cursor-pointer w-48 h-48 mb-6" onClick={() => fileInputRef.current?.click()}>
                        <div className="absolute -inset-1 bg-gradient-to-br from-[#13eca4] via-[#13eca4]/20 to-indigo-500/50 rounded-[2.5rem] opacity-70 blur-lg group-hover:opacity-100 group-hover:blur-xl transition duration-700 animate-pulse" />
                        <div className="w-full h-full rounded-[2.5rem] bg-[#020503] border border-[#13eca4]/30 flex items-center justify-center overflow-hidden relative z-10 shadow-[0_0_40px_rgba(19,236,164,0.2)] transition-transform duration-500 group-hover:scale-105">
                            <div className="scan-line" />
                            {previewImage ? (
                                <img src={previewImage} alt="Profile" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="text-8xl font-black text-[#13eca4]/10 uppercase italic">
                                    {(userData?.nickname || user?.email || 'X').charAt(0)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all duration-500 backdrop-blur-sm">
                                <Camera size={36} className="mb-2 text-[#13eca4]" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#13eca4]/80">Update Photo</span>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    </div>

                    <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter w-full text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                        {userData?.nickname || 'Unknown'}
                    </h4>
                    <div className="flex items-center gap-2 mt-3 mb-10 bg-[#13eca4]/5 px-4 py-2 rounded-xl border border-[#13eca4]/20">
                        <Activity size={14} className="text-[#13eca4]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#13eca4]">
                            {userData?.licenseKey ? 'Premium Account' : 'Standard User'}
                        </span>
                    </div>

                    {/* Quick Stats Grid Sidebar */}
                    <div className="w-full grid grid-cols-2 gap-3 mb-8">
                        <div className="bg-[#13eca4]/[0.02] border border-[#13eca4]/10 p-4 rounded-xl flex flex-col items-center text-center shadow-[inset_0_0_20px_rgba(19,236,164,0.02)]">
                            <span className="text-[9px] font-black text-[#13eca4]/50 uppercase tracking-[0.2em] mb-1.5">Network</span>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#13eca4] drop-shadow-[0_0_5px_rgba(19,236,164,0.5)]">
                                {userData?.status === 'approved' ? 'Active' : 'Pending'}
                            </span>
                        </div>
                        <div className="bg-[#13eca4]/[0.02] border border-[#13eca4]/10 p-4 rounded-xl flex flex-col items-center text-center shadow-[inset_0_0_20px_rgba(19,236,164,0.02)]">
                            <span className="text-[9px] font-black text-[#13eca4]/50 uppercase tracking-[0.2em] mb-1.5">Authority</span>
                            <span className={`text-[11px] font-bold uppercase tracking-widest ${userData?.role === 'admin' ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]' : 'text-[#13eca4] drop-shadow-[0_0_5px_rgba(19,236,164,0.5)]'}`}>
                                {userData?.role === 'admin' ? 'LVL_5' : 'HACKER L3'}
                            </span>
                        </div>
                    </div>

                    {/* Save Action */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isUnchanged}
                        className={`w-full mt-auto h-16 border text-[13px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group ${success
                            ? 'bg-[#13eca4] border-[#13eca4] text-[#05150d] shadow-[0_0_40px_rgba(19,236,164,0.4)]'
                            : isUnchanged
                                ? 'bg-[#13eca4]/[0.02] border-[#13eca4]/10 text-[#13eca4]/30 cursor-not-allowed'
                                : 'bg-[#13eca4] border-[#13eca4] text-[#05150d] shadow-[0_0_30px_rgba(19,236,164,0.3)] hover:shadow-[0_0_50px_rgba(19,236,164,0.5)] active:scale-95'
                        }`}
                    >
                        {isSaving ? (
                            <><div className="w-6 h-6 border-2 border-[#05150d]/20 border-t-[#05150d] rounded-full animate-spin" /><span>SYNCING...</span></>
                        ) : success ? (
                            <><CheckCircle2 size={24} /><span>SAVED!</span></>
                        ) : (
                            <><Save size={24} className="group-hover:rotate-12 transition-transform" /><span>APPLY CHANGES</span></>
                        )}
                        {!isUnchanged && !isSaving && !success && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-700 ease-out" />
                        )}
                    </button>
                    {error && <p className="text-rose-500 text-[10px] mt-4 uppercase tracking-widest font-black text-center">{error}</p>}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 h-full overflow-y-auto custom-scrollbar relative">
                
                {/* Desktop Header */}
                <div className="sticky top-0 z-50 p-8 flex justify-end bg-gradient-to-b from-[#020503] via-[#020503]/80 to-transparent pointer-events-none">
                    <button
                        onClick={onClose}
                        className="hidden md:flex items-center gap-3 px-6 h-12 bg-[#020503] hover:bg-rose-500/10 rounded-xl text-white/50 hover:text-rose-400 border border-[#13eca4]/20 hover:border-rose-500/30 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md pointer-events-auto active:scale-95"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Close Terminal</span>
                        <X size={18} />
                    </button>
                </div>

                <div className="max-w-[800px] mx-auto px-8 pb-20 space-y-12">
                    
                    {/* Section: License Subscription */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-[#13eca4]/10 pb-4">
                            <ShieldCheck size={28} className="text-[#13eca4]" />
                            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white to-[#13eca4]/80">Subscription & Security</h2>
                        </div>

                        {userData?.licenseKey ? (
                            <div className="relative group animate-in slide-in-from-bottom-4 duration-700">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#13eca4] via-[#13eca4]/40 to-indigo-500 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-60 transition duration-1000" />
                                <div className="relative p-8 md:p-10 rounded-[2.5rem] bg-[#050b08]/90 backdrop-blur-xl border border-[#13eca4]/30 shadow-[0_0_80px_rgba(19,236,164,0.1)] overflow-hidden">
                                    <div className="absolute inset-0 bg-[#13eca4]/10 blur-[50px] mix-blend-screen pointer-events-none" />
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTksMjM2LDE2NCwwLjA1KSIvPjwvc3ZnPg==')] opacity-50 pointer-events-none" />
                                    
                                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
                                        
                                        {/* Timer Component */}
                                        <div className="bg-[#020503]/80 p-6 rounded-3xl border border-[#13eca4]/20 flex flex-col justify-center items-center md:items-start text-center md:text-left shadow-inner">
                                            <div className="flex items-center gap-2 text-[#13eca4]/60 text-[10px] uppercase font-black tracking-[0.3em] mb-4">
                                                <Clock size={16} className="animate-pulse" /> SYSTEM TTL
                                            </div>
                                            <div className={`font-mono text-xl sm:text-2xl font-black tracking-widest ${timeRemaining === 'EXPIRED' ? 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'text-[#13eca4] drop-shadow-[0_0_15px_rgba(19,236,164,1)]'}`}>
                                                {timeRemaining || 'CALCULATING...'}
                                            </div>
                                            <div className="mt-4 w-full h-1 bg-[#13eca4]/10 rounded-full overflow-hidden relative">
                                                <div className="absolute inset-0 bg-transparent before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[#13eca4]/10 before:to-transparent before:animate-[scan-beam_2s_linear_infinite]" />
                                                <div className="h-full bg-[#13eca4] w-[100%] animate-pulse shadow-[0_0_10px_#13eca4]" />
                                            </div>
                                        </div>

                                        {/* Key Display Component */}
                                        <div className="flex flex-col justify-center space-y-4">
                                            <p className="text-[10px] font-black text-[#13eca4]/60 uppercase tracking-[0.3em]">Encrypted Access Key</p>
                                            <div className="relative bg-[#020503]/80 px-6 py-5 rounded-2xl border border-[#13eca4]/30 shadow-inner flex justify-between items-center group/keybox hover:border-[#13eca4]/60 transition-all hover:shadow-[0_0_30px_rgba(19,236,164,0.2)]">
                                                <div className="font-mono text-lg sm:text-2xl text-white font-black tracking-[0.2em] truncate mr-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                                                    {userData.licenseKey}
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(userData.licenseKey!);
                                                        setCopiedKey(true);
                                                        setTimeout(() => setCopiedKey(false), 2000);
                                                    }}
                                                    className={`shrink-0 size-12 rounded-xl border flex items-center justify-center transition-all ${copiedKey ? 'bg-[#13eca4] border-[#13eca4] text-black shadow-[0_0_20px_rgba(19,236,164,0.8)] scale-110' : 'bg-[#13eca4]/10 border-[#13eca4]/30 text-[#13eca4] hover:bg-[#13eca4]/30 hover:scale-110 hover:shadow-[0_0_15px_rgba(19,236,164,0.5)]'}`}
                                                >
                                                    {copiedKey ? <Check size={20} /> : <Copy size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 rounded-[2.5rem] bg-gradient-to-tr from-[#020503] to-[#13eca4]/5 border border-[#13eca4]/10 text-center flex flex-col items-center justify-center space-y-4 shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 bg-[#13eca4]/5 blur-[60px] pointer-events-none" />
                                <div className="size-20 rounded-full bg-[#13eca4]/10 border border-[#13eca4]/20 flex items-center justify-center text-[#13eca4]/50 shadow-[0_0_30px_rgba(19,236,164,0.1)] relative z-10">
                                    <ShieldCheck size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-white/70 uppercase tracking-widest relative z-10">No Active License</h3>
                                <p className="text-sm text-[#13eca4]/40 font-bold max-w-sm uppercase tracking-[0.2em] relative z-10">You need to purchase a premium license key to unlock elite features.</p>
                            </div>
                        )}
                    </section>

                    {/* Section: Account Data */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-[#13eca4]/10 pb-4">
                            <Globe size={28} className="text-[#13eca4]" />
                            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white to-[#13eca4]/80">System Diagnostics</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-[#13eca4]/[0.05] to-transparent border border-[#13eca4]/20 rounded-3xl p-6 flex flex-col justify-center gap-2 hover:border-[#13eca4]/40 hover:bg-[#13eca4]/10 transition-all shadow-[inset_0_0_20px_rgba(19,236,164,0.02)] group hover:shadow-[0_0_25px_rgba(19,236,164,0.15)]">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-[#13eca4]/10 rounded-2xl text-[#13eca4] border border-[#13eca4]/20 shrink-0 shadow-[0_0_15px_rgba(19,236,164,0.2)]"><Mail size={24} /></div>
                                    <div className="overflow-hidden">
                                        <span className="text-[9px] font-black text-[#13eca4]/60 uppercase tracking-[0.2em] block mb-1">Encrypted Relay</span>
                                        <span className="text-sm text-white font-mono truncate block drop-shadow-sm">{userData?.email || user?.email}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-500/[0.05] to-transparent border border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-center gap-2 hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all shadow-[inset_0_0_20px_rgba(99,102,241,0.02)] group hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]"><Globe size={24} /></div>
                                    <div>
                                        <span className="text-[9px] font-black text-indigo-400/60 uppercase tracking-[0.2em] block mb-1">Server Region</span>
                                        <span className="text-[12px] font-black text-indigo-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">Global CDN Stable</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Transaction Feed */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-[#13eca4]/10 pb-4">
                            <div className="flex items-center gap-4">
                                <Activity size={28} className="text-[#13eca4]" />
                                <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white to-[#13eca4]/80">Mission History</h2>
                            </div>
                            <span className="text-[10px] bg-[#13eca4]/10 text-[#13eca4] px-4 py-2 rounded-xl border border-[#13eca4]/30 font-black tracking-widest shadow-[0_0_15px_rgba(19,236,164,0.1)]">
                                {paymentRequests.length} LOGS
                            </span>
                        </div>
                        
                        <div className="space-y-4">
                            {paymentRequests.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-[#13eca4]/20 rounded-[2.5rem] bg-gradient-to-b from-[#13eca4]/[0.02] to-transparent">
                                    <Zap size={40} className="mx-auto mb-4 text-[#13eca4]/30 animate-pulse" />
                                    <h3 className="text-xl font-black text-white/50 uppercase tracking-widest mb-2">No Records Found</h3>
                                    <p className="text-[12px] font-bold text-[#13eca4]/40 uppercase tracking-[0.2em]">Deploy a mission to initiate logging</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {paymentRequests.map((req) => (
                                        <div key={req.id} className="p-6 rounded-[2rem] bg-[#020503]/80 border border-[#13eca4]/20 hover:border-[#13eca4]/40 hover:bg-[#13eca4]/[0.02] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-inner hover:shadow-[0_0_25px_rgba(19,236,164,0.1)] group/item">
                                            <div>
                                                <p className="text-base font-black text-white uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] group-hover/item:text-[#13eca4] transition-colors">{req.planName}</p>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className="text-[10px] font-mono text-[#13eca4]/70 p-1.5 px-3 bg-[#13eca4]/10 border border-[#13eca4]/20 rounded-lg shadow-inner">ID: {req.transactionId}</span>
                                                    <span className="text-[10px] font-black text-[#13eca4]/40 uppercase tracking-widest">{new Date(req.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                                <span className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${
                                                    req.status === 'approved' ? 'bg-[#13eca4]/10 border-[#13eca4]/40 text-[#13eca4] shadow-[0_0_15px_rgba(19,236,164,0.2)]' :
                                                    req.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' :
                                                    'bg-amber-500/10 border-amber-500/40 text-amber-500 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                                }`}>
                                                    {req.status}
                                                </span>
                                                {req.status === 'rejected' && req.rejectionReason && (
                                                    <p className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 max-w-[250px] truncate shadow-inner">
                                                        ANOMALY: {req.rejectionReason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
"""

lines = lines[:167]
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
    f.write(new_content)
    f.write("};\nexport default ProfileModal;")
