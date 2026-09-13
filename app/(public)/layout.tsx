import { Navbar } from '@/components/sections/navbar';
import { Footer } from '@/components/sections/footer';
import { FloatingWhatsAppButton } from '@/components/sections/floating-whatsapp-button';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Sticky Navbar */}
      <Navbar />

      {/* Main Single-Page Content */}
      <main className="flex-1">{children}</main>

      {/* Comprehensive Slate Charcoal Footer */}
      <Footer />

      {/* Persistent Floating WhatsApp Button */}
      <FloatingWhatsAppButton />
    </div>
  );
}
