import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { GlobalNavigationProgress } from "@/components/shared/global-navigation-progress";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mentor Belajarku - Sistem Manajemen & Presensi Bimbel",
  description: "Platform manajemen bimbingan belajar, absensi tutor dan murid, jadwal pembelajaran, dan payroll terpadu.",
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={cn("h-full", "antialiased", inter.variable, geistMono.variable, plusJakartaSans.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <NextTopLoader
          color="#00A86B"
          height={3}
          showSpinner={true}
          shadow="0 0 10px #00A86B,0 0 5px #00A86B"
          easing="ease"
          speed={200}
          zIndex={99999}
        />
        <Suspense fallback={null}>
          <GlobalNavigationProgress />
        </Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
