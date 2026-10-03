'use client';

import React from 'react';
import Image from 'next/image';

export function ReportBanner() {
  return (
    <div className="relative w-full overflow-hidden rounded-sm bg-gradient-to-r from-[#005a3c] via-[#00875a] to-[#019365] text-white p-3 sm:p-4 shadow-xs select-none">
      {/* Background Geometric Diamond Accents (Matching Google Sheet Template) */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-25 pointer-events-none">
        <div className="w-12 h-12 border-2 border-white rotate-45" />
        <div className="w-16 h-16 bg-white/20 rotate-45 -ml-6" />
        <div className="w-10 h-10 border-2 border-white rotate-45 -ml-4" />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Dual Logo (Semesta Abhana + Mentorbelajarku) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Semesta Abhana Tree Logo Badge */}
          <div className="bg-white/95 rounded-md p-1.5 shadow-xs flex flex-col items-center justify-center w-[72px] h-[64px] border border-white/20">
            <svg
              viewBox="0 0 100 100"
              className="w-8 h-8 text-emerald-700"
              fill="currentColor"
            >
              {/* Tree Canopy */}
              <circle cx="50" cy="35" r="22" fill="#0284c7" opacity="0.85" />
              <circle cx="36" cy="40" r="15" fill="#0369a1" opacity="0.9" />
              <circle cx="64" cy="40" r="15" fill="#0284c7" opacity="0.9" />
              <circle cx="50" cy="24" r="14" fill="#38bdf8" opacity="0.75" />
              {/* Tree Trunk */}
              <path d="M47 52 L53 52 L55 76 L45 76 Z" fill="#0369a1" />
              <path d="M42 76 L58 76 L55 72 L45 72 Z" fill="#0369a1" />
            </svg>
            <span className="text-[6.5px] font-black tracking-wider text-sky-800 uppercase leading-tight pt-0.5">
              SEMESTA
            </span>
            <span className="text-[5px] font-semibold text-slate-600 tracking-tighter leading-none">
              ABHANA INDONESIA
            </span>
          </div>

          {/* Mentorbelajarku Logo Badge */}
          <div className="bg-white/95 rounded-md p-1.5 shadow-xs flex flex-col items-center justify-center w-[72px] h-[64px] border border-white/20">
            <div className="relative w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xs shadow-inner">
              <span className="tracking-tighter font-serif italic text-white text-sm">mb</span>
            </div>
            <span className="text-[6.5px] font-black tracking-tight text-emerald-800 uppercase leading-tight pt-0.5">
              mentorbelajarku
            </span>
            <span className="text-[5px] font-semibold text-slate-500 tracking-tighter leading-none">
              Bimbel Berkualitas
            </span>
          </div>
        </div>

        {/* Center / Right: Brand Name & Contact Info */}
        <div className="flex-1 text-center md:text-left space-y-0.5">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-wide text-white drop-shadow-sm font-sans uppercase">
            Bimbel Mentorbelajarku
          </h1>
          <div className="text-[9.5px] sm:text-[11px] font-medium text-emerald-50/95 leading-relaxed tracking-tight">
            <p>
              <span className="font-semibold">HP :</span> 0821 7228 4061{' '}
              <span className="mx-1">•</span>
              <span className="font-semibold">Email :</span> mentorbelajarku1@gmail.com{' '}
              <span className="mx-1">•</span>
              <span className="font-semibold">IG :</span> @mentorbelajarku
            </p>
            <p className="text-emerald-100/90 text-[9px] sm:text-[10px]">
              @tpq.mentorbelajarku <span className="mx-0.5">•</span> @thementor <span className="mx-0.5">•</span> @sekolahmerdeka
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
