'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { buttonVariants } from '@/components/ui/button';
import { buildWaLink } from '@/lib/whatsapp';
import { MessageCircle, Menu, X, Sparkles } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const waNavUrl = buildWaLink('navbar');
  const waPromoUrl = buildWaLink('promo-100k');

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Tentang Kami', href: '#tentang' },
    { label: 'Program', href: '#program' },
    { label: 'Keunggulan', href: '#keunggulan' },
    { label: 'Testimoni', href: '#testimoni' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="sticky top-0 z-40 w-full shadow-xs">
      {/* 1. Top Announcement Bar (Style Mirip Referensi Alfa) */}
      <div className="bg-primary text-white py-2 px-4 text-xs sm:text-sm font-medium">
        <div className="container mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-center">
          <Link
            href={waPromoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border-2 border-dashed border-white/80 rounded-full px-3 py-0.5 font-bold hover:bg-white/10 transition-colors text-xs"
          >
            <span>Click to Chat WA !</span>
            <span>👆</span>
          </Link>

          <span className="font-bold text-white text-xs sm:text-sm">
            Dapatkan Diskon Pendaftaran 100,000,-
          </span>

          <span className="inline-flex items-center gap-1 bg-[#FBBF24] text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
            <Sparkles className="h-3 w-3" /> PROMO HEMAT
          </span>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <header className="w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white border border-border shadow-xs p-1 flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src="/logo.jpg"
                alt="Mentor Belajarku Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl text-foreground leading-tight font-heading">
                Mentor Belajarku
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-wide">
                Bimbel & Les Privat Lampung
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-foreground/85">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Button: Pill KONSULTASI */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href={waNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6B00] hover:bg-[#E55F00] text-white font-black text-xs sm:text-sm px-6 py-2.5 shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
            >
              <MessageCircle className="h-4 w-4" />
              <span>KONSULTASI</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center p-2 rounded-xl text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card px-4 py-5 space-y-3">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-foreground hover:bg-accent hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="pt-3 border-t border-border">
              <Link
                href={waNavUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6B00] hover:bg-[#E55F00] text-white font-bold text-sm h-11 shadow-md uppercase tracking-wider"
              >
                <MessageCircle className="h-4 w-4" />
                <span>KONSULTASI VIA WHATSAPP</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
