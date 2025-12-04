import React, { useState } from 'react';
import { SearchInput } from './components/SearchInput';
import { ResultsDisplay, Lead } from './components/ResultsDisplay';
import { MessagePanel } from './components/MessagePanel';
import { SearchRequest, SearchResponse, LoadingState } from './types';
import { findLeads } from './services/geminiService';

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<SearchRequest | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'leads' | 'suppliers'>('leads');
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleSearch = async (request: SearchRequest) => {
    setLoadingState(LoadingState.LOADING);
    setSearchMode(request.mode);
    setErrorMsg(null);
    setData(null);
    setSelectedLead(null);
    setLastRequest(request);

    try {
      const result = await findLeads(request);
      setData(result);
      setLoadingState(LoadingState.SUCCESS);
    } catch (err: any) {
      setLoadingState(LoadingState.ERROR);
      setErrorMsg(err.message || "Terjadi kesalahan saat mencari data.");
    }
  };

  const handleReset = () => {
    setLoadingState(LoadingState.IDLE);
    setData(null);
    setSelectedLead(null);
  };

  const handleLoadMore = async () => {
    if (!lastRequest || !data) return;
    
    // Set loading state but keep data visible
    setLoadingState(LoadingState.LOADING);
    
    // Improved Name Extraction Logic
    const names = new Set<string>();
    
    try {
        if (data.markdownText) {
          const lines = data.markdownText.split('\n');
          lines.forEach(line => {
             const trimmed = line.trim();
             // Check for table row format: | Cell | ...
             if (trimmed.startsWith('|')) {
                const parts = trimmed.split('|');
                // parts[0] is empty, parts[1] is the first cell
                if (parts.length > 2) {
                   const val = parts[1] ? parts[1].trim() : "";
                   // Exclude headers, separators, and known headers like "Nama"
                   if (val && !val.includes('---') && !val.toLowerCase().includes('nama') && !val.toLowerCase().includes('bisnis') && val.length > 1) {
                       // Sanitize the name to avoid passing markdown chars to the next prompt
                       const cleanVal = val.replace(/[\*\_\[\]]/g, '').trim();
                       if (cleanVal) names.add(cleanVal);
                   }
                }
             }
          });
        }
    } catch (e) {
        console.warn("Failed to extract existing names for exclusion", e);
    }

    const allExcludes = Array.from(names).slice(0, 40); // Limit to 40 to avoid context limits

    const nextRequest: SearchRequest = {
      ...lastRequest,
      excludeNames: allExcludes,
      expandRadius: true
    };

    try {
      const newResult = await findLeads(nextRequest);
      
      // If the result is too short, it's likely an apology message
      if (!newResult.markdownText || newResult.markdownText.length < 50) {
         throw new Error("Tidak ditemukan data tambahan yang valid di area sekitar.");
      }

      setData({
        markdownText: data.markdownText + "\n\n---\n\n### 🌍 Data Tambahan (Area Sekitar):\n" + newResult.markdownText,
        groundingChunks: [...(data.groundingChunks || []), ...(newResult.groundingChunks || [])]
      });
      setLoadingState(LoadingState.SUCCESS);
    } catch (err: any) {
      setLoadingState(LoadingState.ERROR);
      setErrorMsg(err.message || "Gagal memuat lebih banyak data.");
    }
  };

  const handleTestMessage = () => {
    setSelectedLead({
      name: "Customer/Supplier Tes",
      contact: "081234567890",
      location: "Lokasi Simulasi",
      reason: "Ini adalah simulasi leads untuk mengetes konfigurasi pengiriman pesan Fontee anda."
    });
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-800">
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-full overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${selectedLead ? 'mr-0 lg:mr-[420px]' : ''}`}>
        
        {/* Modern Navbar */}
        <header className="sticky top-0 z-40 px-6 py-4 pointer-events-none">
          <div className="max-w-7xl mx-auto pointer-events-auto">
             <div className="flex items-center justify-between">
                <div className="glass-panel px-5 py-2.5 rounded-full flex items-center gap-3 bg-white/80">
                  <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                      <path d="M16.5 12.75a.75.75 0 000-1.5h-4.5a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-3.75h3.75z" />
                    </svg>
                  </div>
                  <span className="font-bold text-lg tracking-tight text-slate-900">aufmarket<span className="text-primary-500">.</span></span>
                </div>
                
                {/* Powerful AI Status Indicator */}
                <div className="hidden md:flex glass-panel px-1 py-1 pr-4 rounded-full items-center gap-3 bg-white/80 border-primary-100/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all group cursor-default">
                   <div className="relative w-9 h-9 flex items-center justify-center">
                      {/* Rotating Ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin-slow"></div>
                      {/* Pulsing Core */}
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-power-pulse shadow-[0_0_10px_#10b981]"></div>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">System Status</span>
                      <span className="text-[11px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-emerald-400 uppercase tracking-wide leading-none group-hover:to-primary-400 transition-all">
                        AI Engine Connected
                      </span>
                   </div>
                </div>
             </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex flex-col">
          
          {/* Hero / Intro */}
          <div className={`transition-all duration-700 ease-in-out ${loadingState !== LoadingState.IDLE ? 'opacity-0 h-0 overflow-hidden py-0' : 'opacity-100 py-10'}`}>
            <div className="text-center max-w-4xl mx-auto mb-12">
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                Riset Pasar Cerdas, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-700 to-primary-500">
                  Dagang Lebih Berkah
                </span>
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Platform riset pasar modern ala Abdurrahman bin Auf. Temukan pembeli dan supplier tangan pertama dengan analisis AI.
              </p>
            </div>
          </div>

          {/* Search Input Container - Hide when searching initially, but stay hidden if results are shown unless reset */}
          <div className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${loadingState === LoadingState.IDLE ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 hidden'}`}>
            <SearchInput 
              onSearch={handleSearch} 
              isLoading={loadingState === LoadingState.LOADING} 
              onTestMessage={handleTestMessage}
              initialMode={searchMode}
            />
          </div>

          {/* Error Display - Only for Initial Search */}
          {loadingState === LoadingState.ERROR && !data && (
            <div className="max-w-lg mx-auto p-4 bg-white border-l-4 border-red-500 shadow-xl rounded-r-xl flex items-start gap-4 mt-8 animate-pop">
              <div className="text-red-500 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">Pencarian Terhenti</h3>
                <p className="text-sm text-slate-500 mt-1">{errorMsg}</p>
                <button onClick={handleReset} className="mt-3 text-xs font-bold text-primary-700 hover:text-primary-900 underline">Coba Lagi</button>
              </div>
            </div>
          )}

          {/* Loading Indicator - Only for Initial Search */}
          {loadingState === LoadingState.LOADING && !data && (
             <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="relative w-16 h-16 mb-8">
                   <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-75"></div>
                   <div className="absolute inset-0 bg-white rounded-full shadow-lg border-2 border-primary-50 flex items-center justify-center z-10">
                      <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                   </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Menganalisis Pasar...</h3>
                <p className="text-slate-500 mt-2 text-sm">Sedang mencari data {searchMode === 'leads' ? 'pembeli' : 'supplier'} valid.</p>
             </div>
          )}

          {/* Results Display - Always visible if data exists */}
          {data && (
            <div className="mt-4 transition-opacity duration-500 opacity-100">
               <ResultsDisplay 
                 data={data} 
                 onSelectLead={setSelectedLead}
                 mode={searchMode}
                 onReset={handleReset}
               />
               
               <div className="flex flex-col items-center pb-20 mt-12 gap-4">
                  {loadingState === LoadingState.LOADING ? (
                      <div className="flex flex-col items-center animate-pulse">
                         <div className="bg-white border border-primary-100 px-6 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                             <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                             <span className="text-primary-700 font-bold text-sm">Sedang mencari data tambahan di area sekitar...</span>
                         </div>
                      </div>
                  ) : (
                      <>
                        <button
                            onClick={handleLoadMore}
                            className="group relative px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 shadow-sm hover:border-primary-300 hover:text-primary-700 hover:shadow-md transition-all"
                        >
                            <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            Muat Lebih Banyak Data
                            </span>
                        </button>
                        
                        {/* Inline Error Message for Load More */}
                        {loadingState === LoadingState.ERROR && (
                           <div className="text-red-500 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                 <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                              </svg>
                              {errorMsg}
                           </div>
                        )}
                      </>
                  )}
               </div>
            </div>
          )}

          {/* Footer Signature */}
          <footer className="mt-auto pt-10 pb-8 text-center">
             <div className="flex flex-col items-center justify-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
                <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                  Created with 
                  <span className="text-red-500 animate-heartbeat text-xl inline-block">❤️</span> 
                  by
                </p>
                <h3 className="text-xl text-slate-800 font-extrabold tracking-tight">
                  Berkah Digital Islami
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  AUFMARKET &copy; 2025
                </p>
             </div>
          </footer>
        </main>
      </div>

      {/* Slide-over Message Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-[420px] bg-white shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] z-50 border-l border-slate-200 ${
          selectedLead ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <MessagePanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
      </div>

      {/* Overlay for mobile when panel is open */}
      {selectedLead && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSelectedLead(null)}
        ></div>
      )}

    </div>
  );
};

export default App;