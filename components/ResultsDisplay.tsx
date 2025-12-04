import React from 'react';
import { SearchResponse } from '../types';

export interface Lead {
  name: string;
  contact: string;
  location: string;
  reason: string;
}

interface ResultsDisplayProps {
  data: SearchResponse;
  onSelectLead: (lead: Lead) => void;
  mode?: 'leads' | 'suppliers';
  onReset: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data, onSelectLead, mode = 'leads', onReset }) => {
  
  const downloadCSV = () => {
    if (!data.markdownText) return;
    const rows: string[][] = [];
    const lines = data.markdownText.split('\n');
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && trimmed.lastIndexOf('|') === trimmed.length - 1) {
             const content = trimmed.substring(1, trimmed.length - 1);
             const cols = content.split('|').map(c => c.trim());
             const isSeparator = cols.every(c => /^[-:\s]+$/.test(c));
             if (!isSeparator && cols.length > 1) {
                 const cleanCols = cols.map(col => {
                     let text = col.replace(/(\*\*|__)(.*?)\1/g, '$2').replace(/(\*|_)(.*?)\1/g, '$2');
                     text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
                     return `"${text.replace(/"/g, '""')}"`;
                 });
                 rows.push(cleanCols);
             }
        }
    });
    if (rows.length === 0) { alert("Data tidak ditemukan untuk di-export."); return; }
    const csvContent = "\uFEFF" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aufmarket_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let tableBuffer: string[][] = [];
    let inTable = false;

    const renderTable = (buffer: string[][], keyPrefix: number) => {
       if (buffer.length < 2) return null; 
       const header = buffer[0];
       const nameIndex = header.findIndex(h => h.toLowerCase().match(/nama|bisnis|supplier/));
       const contactIndex = header.findIndex(h => h.toLowerCase().match(/kontak|telp|wa/));
       const locationIndex = header.findIndex(h => h.toLowerCase().match(/lokasi|alamat/));
       const reasonIndex = header.findIndex(h => h.toLowerCase().match(/alasan|prospek|kelebihan|catatan/));
       const rows = buffer.slice(2);

       return (
         <div key={`table-${keyPrefix}`} className="my-8 animate-fade-in">
            {/* Added overflow-x-auto for horizontal scrolling */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {header.map((h, i) => (
                      <th key={i} className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-widest whitespace-nowrap text-slate-500">
                        {h.trim()}
                      </th>
                    ))}
                    <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {rows.map((row, ri) => {
                    const leadData: Lead = {
                      name: row[nameIndex]?.trim() || "Target",
                      contact: row[contactIndex]?.trim() || "-",
                      location: row[locationIndex]?.trim() || "-",
                      reason: row[reasonIndex]?.trim() || "-"
                    };
                    return (
                      <tr key={ri} className="group hover:bg-slate-50 transition-colors">
                        {row.map((cell, ci) => {
                          const headerText = header[ci]?.toLowerCase() || '';
                          const isMapColumn = headerText.match(/maps|koordinat|link/);
                          const cellText = cell.trim();
                          const isUrl = cellText.match(/^http|www|maps\./);
                          
                          let content: React.ReactNode = cellText;
                          if (isMapColumn && (isUrl || cellText.includes('http'))) {
                             const url = cellText.match(/\((.*?)\)/)?.[1] || cellText;
                             const cleanUrl = url.replace(/[^a-zA-Z0-9:/.?=&-_%]/g, '');
                             if (cleanUrl.startsWith('http')) {
                               content = (
                                    <a href={cleanUrl} target="_blank" rel="noopener" className="text-blue-600 hover:text-blue-800 font-bold underline decoration-2 decoration-blue-100 underline-offset-2 text-xs whitespace-nowrap">
                                      Buka Maps
                                    </a>
                               );
                             }
                          }
                          return (
                            <td key={ci} className={`px-5 py-4 text-sm text-slate-700 leading-relaxed min-w-[150px] ${ci === 0 ? 'font-bold text-slate-900' : 'font-mono text-xs'}`}>
                              {content}
                            </td>
                          );
                        })}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                           <button 
                             onClick={() => onSelectLead(leadData)}
                             className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 font-bold text-xs hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-200 hover:border-green-600"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 15.13C16.49 15.52 15.82 15.87 15.42 15.91C15.02 15.95 14.54 16.09 12.82 15.42C10.74 14.6 9.4 12.5 9.3 12.36C9.2 12.23 8.44 11.23 8.44 10.2C8.44 9.17 8.97 8.67 9.18 8.44C9.4 8.21 9.61 8.21 9.8 8.21C9.96 8.21 10.12 8.22 10.26 8.25C10.38 8.28 10.68 9.01 10.77 9.21C10.87 9.4 10.9 9.53 10.84 9.64C10.77 9.75 10.72 9.81 10.62 9.93C10.53 10.04 10.43 10.13 10.55 10.34C10.67 10.55 11.1 11.25 11.73 11.81C12.54 12.53 13.19 12.76 13.41 12.85C13.63 12.95 13.75 12.92 13.89 12.77C14.03 12.61 14.5 11.96 14.67 11.72C14.83 11.48 15 11.51 15.2 11.59C15.4 11.66 16.48 12.19 16.7 12.3C16.92 12.41 17.07 12.47 17.13 12.57C17.18 12.67 17.18 13.1 16.64 15.13Z" />
                             </svg>
                             Chat WA
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
         </div>
       );
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|')) {
        const cells = trimmed.split('|').filter((_, i, arr) => i !== 0 && i !== arr.length - 1);
        tableBuffer.push(cells);
        inTable = true;
        return; 
      } else if (inTable) {
        nodes.push(renderTable(tableBuffer, index));
        tableBuffer = [];
        inTable = false;
      }
      if (trimmed.startsWith('#')) {
        nodes.push(<h3 key={index} className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-primary-500 pl-4">{trimmed.replace(/#+\s*/, '')}</h3>);
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        nodes.push(<li key={index} className="ml-5 mb-2 text-slate-600 list-square text-sm">{trimmed.replace(/^[-*]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')}</li>);
      } else if (trimmed) {
        nodes.push(<p key={index} className="mb-4 text-slate-600 leading-relaxed text-sm">{trimmed.replace(/\*\*(.*?)\*\*/g, (m, p1) => p1)}</p>);
      }
    });
    if (inTable) nodes.push(renderTable(tableBuffer, lines.length));
    return nodes;
  };

  return (
    <div className="relative pb-10 animate-slide-up">
      {/* Static Toolbar (Replaced Floating Dock) */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <button 
           onClick={onReset} 
           className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-sm shadow-sm"
         >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Kembali Cari
         </button>
         
         <button 
            onClick={downloadCSV} 
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-primary-900/10"
         >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Excel
         </button>
      </div>

      <div className="max-w-6xl mx-auto glass-panel p-6 md:p-8 rounded-2xl">
          {renderContent(data.markdownText)}
      </div>
    </div>
  );
};