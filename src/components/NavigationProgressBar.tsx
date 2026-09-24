import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsFetching } from '@tanstack/react-query';

export const NavigationProgressBar: React.FC = () => {
  const location = useLocation();
  const isFetching = useIsFetching();

  const [progress, setProgress] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navStartTimeRef = useRef<number>(0);

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startLoading = () => {
    clearAllTimers();
    navStartTimeRef.current = Date.now();
    setIsFinishing(false);
    setIsVisible(true);
    setProgress(18);

    // Natural multi-stage acceleration
    const t1 = setTimeout(() => setProgress(38), 70);
    const t2 = setTimeout(() => setProgress(62), 180);
    const t3 = setTimeout(() => setProgress(82), 340);

    timersRef.current.push(t1, t2, t3);

    // Gentle trickle while waiting for async queries
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 88) return prev + 2;
        if (prev < 94) return prev + 0.6;
        return prev;
      });
    }, 250);
  };

  const finishLoading = () => {
    clearAllTimers();
    setIsFinishing(true);
    setProgress(100);

    // Hold at 100% briefly, then fade out smoothly
    const t1 = setTimeout(() => {
      setIsVisible(false);
      const t2 = setTimeout(() => {
        setProgress(0);
        setIsFinishing(false);
      }, 300);
      timersRef.current.push(t2);
    }, 180);

    timersRef.current.push(t1);
  };

  // Trigger loading animation on every page navigation
  useEffect(() => {
    startLoading();

    // Ensure a minimum duration so the animation is always fluid and noticeable
    const minTimer = setTimeout(() => {
      if (isFetching === 0) {
        finishLoading();
      }
    }, 450);

    timersRef.current.push(minTimer);

    return () => {
      clearAllTimers();
    };
  }, [location.pathname, location.search]);

  // React to queries fetching status
  useEffect(() => {
    if (isFetching > 0 && !isVisible) {
      startLoading();
    } else if (isFetching === 0 && isVisible) {
      const elapsed = Date.now() - navStartTimeRef.current;
      const minDuration = 450;
      if (elapsed < minDuration) {
        const remaining = minDuration - elapsed;
        const delayTimer = setTimeout(() => {
          finishLoading();
        }, remaining);
        timersRef.current.push(delayTimer);
      } else {
        finishLoading();
      }
    }
  }, [isFetching]);

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  if (!isVisible && progress === 0) {
    return null;
  }

  const isRtl = typeof document !== 'undefined' ? document.documentElement.dir === 'rtl' : true;

  return (
    <div
      className="absolute bottom-0 inset-x-0 h-[2.5px] pointer-events-none z-30 overflow-hidden"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 250ms ease-out',
      }}
      aria-hidden="true"
    >
      {/* Background glowing line */}
      <div
        className="h-full relative"
        style={{
          [isRtl ? 'right' : 'left']: 0,
          width: `${progress}%`,
          transition: isFinishing
            ? 'width 180ms ease-out'
            : 'width 280ms cubic-bezier(0.2, 0.8, 0.4, 1)',
          background: isRtl
            ? 'linear-gradient(to left, var(--color-primary-dark, #2563eb), var(--color-primary, #3b82f6), #60a5fa)'
            : 'linear-gradient(to right, var(--color-primary-dark, #2563eb), var(--color-primary, #3b82f6), #60a5fa)',
          boxShadow: '0 0 10px var(--color-primary, #3b82f6), 0 0 4px var(--color-primary, #3b82f6)',
        }}
      >
        {/* Animated highlight shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />

        {/* Glowing Head at leading tip */}
        <div
          className="absolute top-0 bottom-0 w-8 pointer-events-none"
          style={{
            [isRtl ? 'left' : 'right']: 0,
            background: isRtl
              ? 'radial-gradient(ellipse at left, #ffffff 0%, rgba(255,255,255,0.7) 40%, transparent 100%)'
              : 'radial-gradient(ellipse at right, #ffffff 0%, rgba(255,255,255,0.7) 40%, transparent 100%)',
            boxShadow: '0 0 10px #ffffff, 0 0 16px var(--color-primary, #3b82f6)',
            borderRadius: '9999px',
          }}
        />
      </div>
    </div>
  );
};

export default NavigationProgressBar;
