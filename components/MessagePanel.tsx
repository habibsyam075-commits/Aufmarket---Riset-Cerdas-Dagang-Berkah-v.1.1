import React, { useState, useEffect, useRef } from 'react';
import { Lead } from './ResultsDisplay';

interface MessagePanelProps {
  lead: Lead | null;
  onClose: () => void;
}

export const MessagePanel: React.FC<MessagePanelProps> = ({ lead, onClose }) => {
  const [message, setMessage] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lead) {
      let cleanNumber = lead.contact.replace(/\D/g, '');
      if (cleanNumber.startsWith('0')) cleanNumber = '62' + cleanNumber.substring(1);
      setTargetNumber(cleanNumber || lead.contact);
      
      const savedTemplate = localStorage.getItem('fontee_template');
      const senderName = localStorage.getItem('fontee_sender_name') || '';
      const LEADS_DEFAULT = 'Halo Kak {name} 👋,\n\nSalam kenal ya. Saya lihat bisnis Kakak di {location} menarik banget.\n\nKebetulan saya ada info/produk yang cocok buat Kakak karena {reason}.\n\nBoleh saya share detailnya sebentar Kak? Makasih sebelumnya 🙏\n\n~ {sender}';
      
      let msg = savedTemplate || LEADS_DEFAULT;
      msg = msg.replace(/{name}/g, lead.name).replace(/{location}/g, lead.location).replace(/{reason}/g, lead.reason.length > 50 ? "potensi pasar di area tersebut" : lead.reason);
      if (senderName) msg = msg.replace(/{sender}/g, senderName);
      else msg = msg.replace(/~ {sender}|{sender}/g, '');
      setMessage(msg);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [lead]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSend = async () => {
    const token = localStorage.getItem('fontee_token');
    if (!token) { alert("Token API Fonnte belum dikonfigurasi. Silakan atur di menu utama."); return; }
    
    if (!targetNumber || targetNumber.length < 5) {
       alert("Nomor target tidak valid.");
       return;
    }

    setSending(true);
    const formData = new FormData();
    formData.append('target', targetNumber);
    formData.append('message', message);
    if (imageFile) formData.append('file', imageFile, imageFile.name);

    try {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': token },
        body: formData
      });
      const data = await response.json();
      if (data.status) alert("Pesan Berhasil Terkirim!");
      else alert(`Gagal: ${data.reason}`);
    } catch (error) {
      console.error(error);
      alert("Gagal Terkirim. Jika error Network, pastikan Anda menggunakan ekstensi 'Allow CORS' di browser untuk testing localhost, atau jalankan di server HTTPS.");
    } finally {
      setSending(false);
    }
  };

  if (!lead) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-primary-700 px-6 py-6 text-white flex justify-between items-center shrink-0 shadow-md z-10">
        <div>
           <h2 className="font-bold text-lg">Kirim Pesan WA</h2>
           <p className="text-xs text-primary-200 opacity-90 uppercase tracking-widest">Via Fonnte Gateway</p>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
         
         {/* Target Info */}
         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="mb-3 pb-3 border-b border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Penerima</span>
                <p className="font-bold text-slate-800 text-lg leading-tight">{lead.name}</p>
                <p className="text-xs text-slate-500 mt-1">{lead.location}</p>
            </div>
            <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nomor WhatsApp</span>
                <input 
                  type="text" 
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm text-slate-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                />
            </div>
         </div>

         {/* Message Input */}
         <div>
            <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Isi Pesan</label>
                <span className="text-[10px] text-slate-400">{message.length} Karakter</span>
            </div>
            <textarea 
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               className="w-full h-64 p-4 bg-white border-2 border-slate-100 rounded-xl text-sm leading-relaxed text-slate-900 resize-none focus:border-primary-500 focus:ring-0 outline-none transition-all shadow-sm"
               placeholder="Tulis pesan anda..."
            />
         </div>

         {/* Image Upload */}
         <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Lampiran Gambar (Opsional)</label>
            <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${imagePreview ? 'border-primary-300 bg-primary-50' : 'border-slate-200 hover:border-primary-400 hover:bg-slate-50'}`}
            >
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {imagePreview ? (
                    <div className="relative">
                        <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                        <button 
                           onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                           className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ) : (
                    <div className="py-4">
                        <svg className="w-8 h-8 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs text-slate-500">Klik untuk upload gambar</p>
                    </div>
                )}
            </div>
         </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
         <button 
            onClick={handleSend}
            disabled={sending}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${sending ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-500 active:scale-[0.98]'}`}
         >
            {sending ? (
                <>
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   <span>Mengirim...</span>
                </>
            ) : (
                <>
                   <span>Kirim Pesan Sekarang</span>
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                   </svg>
                </>
            )}
         </button>
      </div>
    </div>
  );
};
