'use client';

import { useState, useEffect, useRef } from 'react';

interface StatCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  label?: string;
  duration?: number;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export function StatCounter({
  target,
  suffix = '',
  prefix = '',
  label,
  duration = 2000,
  className = '',
  valueClassName = '',
  labelClassName = '',
}: StatCounterProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentCount = Math.floor(easeProgress * target);

            setCount(currentCount);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.15 }
    );

    const currentElem = elementRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      if (currentElem) {
        observer.unobserve(currentElem);
      }
    };
  }, [target, duration, hasAnimated]);

  return (
    <div ref={elementRef} className={className || 'flex flex-col items-center justify-center text-center'}>
      <div className={valueClassName || 'text-2xl sm:text-3xl font-extrabold font-heading text-white'}>
        {prefix}
        {count}
        {suffix}
      </div>
      {label && (
        <div className={labelClassName || 'text-xs sm:text-sm text-white/85 font-medium mt-0.5'}>
          {label}
        </div>
      )}
    </div>
  );
}
