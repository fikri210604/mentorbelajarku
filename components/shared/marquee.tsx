import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Durasi satu putaran penuh (detik). Default: 30. */
  speed?: number;
  /** Balik arah gerak. Default: false (ke kiri). */
  reverse?: boolean;
  /** Pause saat di-hover. Default: true. */
  pauseOnHover?: boolean;
}

/**
 * Marquee infinite murni CSS (0 JS runtime).
 * Konten diduplikasi sekali untuk loop mulus; memakai keyframes `marquee-scroll`.
 */
export function Marquee({
  children,
  className,
  speed = 30,
  reverse = false,
  pauseOnHover = true,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        'group relative flex w-full overflow-hidden',
        '[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]',
        className
      )}
    >
      <div
        className={cn(
          'flex w-max shrink-0 items-center animate-marquee',
          reverse && '[animation-direction:reverse]',
          pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {/* Dua paruh identik tanpa gap antar-paruh agar pergeseran -50% mulus.
            Jarak antar item & antar paruh sama-sama diatur oleh gap+pr tiap paruh. */}
        <div className="flex items-center gap-4 pr-4">{children}</div>
        <div className="flex items-center gap-4 pr-4" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
