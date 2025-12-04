import React, { useState, useEffect } from 'react';
import { SearchRequest } from '../types';

interface SearchInputProps {
  onSearch: (request: SearchRequest) => void;
  isLoading: boolean;
  onTestMessage: () => void;
  initialMode?: 'leads' | 'suppliers';
}

export const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isLoading, onTestMessage, initialMode = 'leads' }) => {
  const [mode, setMode] = useState<'leads' | 'suppliers'>(initialMode || 'leads');
  const [product, setProduct] = useState('');
  const [location, setLocation] = useState('');
  const [useCurrentLoc, setUseCurrentLoc] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [fonteeToken, setFonteeToken] = useState('');
  const [fonteeTemplate, setFonteeTemplate] = useState('');
  const [fonteeSenderName, setFonteeSenderName] = useState('');

  useEffect(() => {
    setFonteeToken(localStorage.getItem('fontee_token') || '');
    setFonteeSenderName(localStorage.getItem('fontee_sender_name') || '');
    const savedTemplate = localStorage.getItem('fontee_template');
    if (savedTemplate) setFonteeTemplate(savedTemplate);
  }, []);

  useEffect(() => {
    const savedTemplate = localStorage.getItem('fontee_template');
    
    const LEADS_DEFAULT = 'Halo Kak {name} 👋,\n\nSalam kenal ya. Saya lihat bisnis Kakak di {location} menarik banget.\n\nKebetulan saya ada info/produk yang cocok buat Kakak karena {reason}.\n\nBoleh saya share detailnya sebentar Kak? Makasih sebelumnya 🙏\n\n~ {sender}';
    
    const SUPPLIER_DEFAULT = 'Halo Kak Admin {name} 👋,\n\nSaya dapat info tokonya di {location}.\n\nSaya tertarik banget mau ikut jualin produknya (Dropship/Reseller). Boleh minta info pricelist grosir atau katalognya Kak?\n\nRencananya mau saya pasarkan kembali, siap order rutin kalau cocok.\n\nMakasih banyak Kak 🙏\n\n~ {sender}';

    const isLeadsText = (text: string) => text.includes('penawaran menarik') || text.includes('bisnis kakak') || text.includes('bisnis Kakak');
    const isOldStyle = (text: string) => text.includes('Salam,\n{sender}');

    if (mode === 'leads') {
      if (!savedTemplate || isSupplierText(savedTemplate) || isOldStyle(savedTemplate)) {
         setFonteeTemplate(LEADS_DEFAULT);
         localStorage.setItem('fontee_template', LEADS_DEFAULT);
      }
    } else {
      if (!savedTemplate || isLeadsText(savedTemplate) || (savedTemplate && !savedTemplate.includes('Dropship')) || isOldStyle(savedTemplate)) {
         setFonteeTemplate(SUPPLIER_DEFAULT);
         localStorage.setItem('fontee_template', SUPPLIER_DEFAULT);
      }
    }
  }, [mode]);

  const isSupplierText = (text: string) => text.includes('Dropship') || text.includes('Reseller') || text.includes('kulakan');

  const handleSaveSettings = () => {
    localStorage.setItem('fontee_token', fonteeToken);
    localStorage.setItem('fontee_template', fonteeTemplate);
    localStorage.setItem('fontee_sender_name', fonteeSenderName);
    alert("Konfigurasi Tersimpan!");
    setShowSettings(false);
  };

  const handleLocationClick = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setUseCurrentLoc(true);
          setLocation("Lokasi Saat Ini (GPS Aktif)");
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Gagal mendeteksi lokasi. Pastikan GPS aktif.");
        }
      );
    } else {
      alert("Geolocation tidak didukung browser ini.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.trim()) return;
    if (!location.trim() && !coords) return;

    onSearch({
      mode,
      product,
      location: useCurrentLoc ? "lokasi saya saat ini" : location,
      lat: coords?.lat,
      lng: coords?.lng
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      
      {/* Search Console Card */}
      <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
        
        {/* Tab Switcher - Pill Style */}
        <div className="flex justify-center mb-10">
           <div className="bg-slate-100 p-1.5 rounded-full inline-flex relative">
              <div 
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-sm border border-slate-200/50 transition-all duration-300 ease-out ${mode === 'leads' ? 'left-1.5' : 'left-[calc(50%+4px)]'}`}
              ></div>
              <button
                onClick={() => setMode('leads')}
                className={`relative z-10 px-8 py-2.5 text-sm font-bold rounded-full transition-colors flex items-center gap-2 ${mode === 'leads' ? 'text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className={`w-2 h-2 rounded-full ${mode === 'leads' ? 'bg-primary-500' : 'bg-slate-300'}`}></span>
                Jual Produk (Leads)
              </button>
              <button
                onClick={() => setMode('suppliers')}
                className={`relative z-10 px-8 py-2.5 text-sm font-bold rounded-full transition-colors flex items-center gap-2 ${mode === 'suppliers' ? 'text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className={`w-2 h-2 rounded-full ${mode === 'suppliers' ? 'bg-primary-500' : 'bg-slate-300'}`}></span>
                Cari Barang (Supplier)
              </button>
           </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Product Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {mode === 'leads' ? 'Produk Anda' : 'Barang Dicari'}
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder={mode === 'leads' ? "Contoh: Kopi Robusta, Jasa Web..." : "Contoh: Kain Katun, Sparepart Motor..."}
                  className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 font-medium px-4 py-4 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-0 transition-colors placeholder-slate-400 outline-none"
                  required
                />
              </div>
            </div>

            {/* Location Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Target Area
              </label>
              <div className="relative group flex items-stretch">
                <div className="relative flex-1">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setUseCurrentLoc(false);
                        setCoords(undefined);
                      }}
                      placeholder="Kota / Kecamatan..."
                      className={`w-full bg-slate-50 border-2 border-r-0 border-slate-100 rounded-l-xl px-4 py-4 pr-10 focus:bg-white focus:border-primary-500 focus:ring-0 transition-colors outline-none font-medium ${useCurrentLoc ? 'text-primary-600' : 'text-slate-900'}`}
                      required={!useCurrentLoc}
                    />
                    
                    {location && (
                        <button
                            type="button"
                            onClick={() => {
                                setLocation('');
                                setUseCurrentLoc(false);
                                setCoords(undefined);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </button>
                    )}
                </div>

                <button
                  type="button"
                  onClick={handleLocationClick}
                  className={`px-5 border-2 border-l-0 rounded-r-xl transition-all flex items-center justify-center ${useCurrentLoc ? 'bg-primary-50 border-primary-500 text-primary-600' : 'bg-slate-100 border-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  title="Gunakan GPS"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Settings Toggle */}
          <div className="flex justify-end mb-6">
             <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs font-bold text-slate-400 hover:text-primary-600 flex items-center gap-1 transition-colors uppercase tracking-wider"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
               {showSettings ? 'Tutup Konfigurasi' : 'Konfigurasi API & Pesan'}
             </button>
          </div>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showSettings ? 'max-h-[600px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
             <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fonnte API Token</label>
                    <input type="password" value={fonteeToken} onChange={(e) => setFonteeToken(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900" placeholder="Masukkan token Fonnte..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Pengirim / Signature</label>
                    <input type="text" value={fonteeSenderName} onChange={(e) => setFonteeSenderName(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900" placeholder="Nama Anda / Bisnis" />
                  </div>
                </div>
                <div className="mb-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Template Pesan WhatsApp</label>
                    <textarea value={fonteeTemplate} onChange={(e) => setFonteeTemplate(e.target.value)} className="w-full h-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm resize-none text-slate-900" />
                </div>
                <div className="flex justify-end gap-3">
                   <button type="button" onClick={onTestMessage} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50">Simulasi Pesan</button>
                   <button type="button" onClick={handleSaveSettings} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900">Simpan Konfigurasi</button>
                </div>
             </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg relative overflow-hidden group transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${isLoading ? 'bg-slate-400' : 'bg-primary-600 hover:bg-primary-500'}`}
          >
            {/* Glossy effect */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20"></div>
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/10 to-transparent"></div>
            
            <span className="relative flex items-center justify-center gap-3">
              {isLoading ? (
                 <span>Memproses Data...</span>
              ) : (
                <>
                  <span>Mulai Analisis Pasar</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};