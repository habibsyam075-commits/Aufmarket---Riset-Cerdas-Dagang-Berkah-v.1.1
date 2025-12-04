import { GoogleGenAI } from "@google/genai";
import { SearchRequest, SearchResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const findLeads = async (request: SearchRequest): Promise<SearchResponse> => {
  const modelId = "gemini-2.5-flash"; 

  const isExpansion = request.expandRadius || false;
  
  // Create a clean list of exclusions to prevent token overflow or confusion
  const cleanExcludes = request.excludeNames 
    ? request.excludeNames.filter(n => n && n.length > 2).slice(0, 40) 
    : [];

  const excludeContext = cleanExcludes.length > 0
    ? `\n\nCATATAN PENTING - FILTER DUPLIKASI:\nJANGAN sertakan bisnis berikut karena sudah ada di hasil sebelumnya: ${cleanExcludes.join(", ")}.\nCarilah nama bisnis LAIN yang belum disebutkan.`
    : "";
  
  // Logic to handle GPS vs Manual Location strictly, with Expansion Mode support
  let locationPrompt = "";

  if (request.lat && request.lng) {
    // GPS Mode
    locationPrompt = `di sekitar koordinat lat: ${request.lat}, long: ${request.lng}`;
    if (isExpansion) locationPrompt += " (Silakan cari radius yang lebih luas hingga ke kecamatan/kota sebelah)";
  } else {
    // Manual Mode
    locationPrompt = `di area "${request.location}"`;
    if (isExpansion) locationPrompt += " (Silakan cari radius yang lebih luas hingga ke area sekitarnya)";
  }

  let systemInstruction = "";
  let prompt = "";

  if (request.mode === 'leads') {
      systemInstruction = `Anda adalah asisten riset pasar 'Aufmarket'. Tugas anda adalah mencari target market (leads) potensial untuk pengguna yang menjual produk tertentu. 
      Fokus pada bisnis/toko/instansi yang valid dan ada di Google Maps. Gunakan tool googleMaps dan googleSearch untuk memverifikasi keberadaan bisnis tersebut.`;
      
      prompt = `Saya menjual produk: "${request.product}". 
      Tolong carikan daftar prospek/calon pembeli potensial (bisnis/toko/instansi) yang berlokasi ${locationPrompt}.
      
      Kriteria pencarian:
      1. Target harus relevan dan mungkin membutuhkan produk tersebut.
      2. Berikan alasan spesifik kenapa mereka butuh.
      3. ${isExpansion ? "Perluas pencarian radius jika di titik pusat sudah habis." : "Fokus di area tersebut."}
      ${excludeContext}

      Format output WAJIB berupa Tabel Markdown dengan kolom:
      | Nama Bisnis | Kontak (Telp/WA) | Alamat Lengkap | Alasan Prospek |
      
      Pastikan menyertakan minimal 5-10 hasil yang valid dan benar-benar ada di Maps.`;
  } else {
      systemInstruction = `Anda adalah asisten riset pasar 'Aufmarket'. Tugas anda adalah mencari Supplier/Grosir/Distributor tangan pertama untuk pengguna yang ingin kulakan barang.
      Fokus pada supplier yang valid, tangan pertama, atau distributor resmi di Google Maps. Gunakan tool googleMaps dan googleSearch untuk memverifikasi.`;

      prompt = `Saya ingin mencari barang/kulakan: "${request.product}".
      Tolong carikan daftar Supplier/Grosir/Distributor/Pabrik yang berlokasi ${locationPrompt}.
      
      Kriteria pencarian:
      1. Prioritaskan tangan pertama, distributor resmi, atau grosir besar.
      2. Hindari pengecer kecil jika memungkinkan.
      3. ${isExpansion ? "Cari hingga ke kota sebelah jika tidak ada di lokasi spesifik." : "Fokus di area tersebut."}
      ${excludeContext}
      
      Format output WAJIB berupa Tabel Markdown dengan kolom:
      | Nama Supplier | Kontak (Telp/WA) | Alamat Lengkap | Kategori/Catatan |
      
      Pastikan menyertakan minimal 5-10 hasil yang valid dan benar-benar ada di Maps.`;
  }

  // Tool Config - Combine tools for better compatibility
  const tools: any[] = [{ googleSearch: {}, googleMaps: {} }];
  
  let toolConfig: any = undefined;

  // If GPS is provided, hint Google Maps tool to center there
  if (request.lat && request.lng) {
      toolConfig = {
          retrievalConfig: {
              latLng: {
                  latitude: request.lat,
                  longitude: request.lng
              }
          }
      };
  }

  try {
    const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            tools: tools,
            toolConfig: toolConfig,
            temperature: 0.7, 
        }
    });

    // Handle extraction
    const text = response.text || "Maaf, tidak ditemukan data yang sesuai saat ini.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
        markdownText: text,
        groundingChunks: chunks
    };

  } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw new Error(`Gagal mengambil data: ${error.message || "Koneksi bermasalah"}`);
  }
};