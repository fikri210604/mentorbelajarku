'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay sebelum animasi dimulai (ms). Berguna untuk stagger manual. */
  delay?: number;
  /** Arah masuk elemen. Default: 'up'. */
  direction?: RevealDirection;
  /** Jarak pergeseran awal dalam px. Default: 24. */
  distance?: number;
  /** Durasi transisi (ms). Default: 700. */
  duration?: number;
  once?: boolean;
}

const directionTransform: Record<RevealDirection, (d: number) => string> = {
  up: (d) => `translate3d(0, ${d}px, 0)`,
  down: (d) => `translate3d(0, -${d}px, 0)`,
  left: (d) => `translate3d(${d}px, 0, 0)`,
  right: (d) => `translate3d(-${d}px, 0, 0)`,
  none: () => 'none',
};

/**
 * Scroll-reveal ringan berbasis IntersectionObserver (tanpa dependency tambahan).
 * Elemen masuk viewport → fade + slide halus. Aman untuk SSR (initial state hidden via inline style).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  direction = 'up',
  distance = 24,
  duration = 700,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Hormati preferensi reduced motion: langsung tampilkan.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : directionTransform[direction](distance),
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    transitionDelay: `${delay}ms`,
    willChange: visible ? 'auto' : 'opacity, transform',
  };

  return (
    <div ref={ref} className={cn(className)} style={style}>
      {children}
    </div>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  /** Jarak antar item (ms). Default: 90. */
  stagger?: number;
  direction?: RevealDirection;
  duration?: number;
}

/**
 * Membungkus banyak item agar muncul berurutan (stagger) saat grup masuk viewport.
 */
export function RevealGroup({
  children,
  className,
  stagger = 90,
  direction = 'up',
  duration = 650,
}: RevealGroupProps) {
  const items = Array.isArray(children) ? children : [children];

  return (
    <div className={cn('contents', className)}>
      {items.map((child, i) => (
        <Reveal key={i} delay={i * stagger} direction={direction} duration={duration}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
