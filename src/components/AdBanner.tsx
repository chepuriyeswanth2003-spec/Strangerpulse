import React, { useState, useEffect, useRef } from 'react';

interface AdBannerProps {
  format?: 'banner' | 'rectangle' | 'inline' | 'sidebar';
  adClient?: string;
  adSlot?: string;
  refreshIntervalMs?: number;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  format = 'inline',
  adClient = ((import.meta as any).env?.VITE_ADSENSE_CLIENT as string) || 'ca-pub-8087434803774295',
  adSlot = ((import.meta as any).env?.VITE_ADSENSE_SLOT as string) || '3740316875',
  refreshIntervalMs = 45000,
  className = '',
}) => {
  const [adSenseFailed, setAdSenseFailed] = useState(false);
  const [isUnfilled, setIsUnfilled] = useState(false);
  const [adKey, setAdKey] = useState(0);
  const insRef = useRef<HTMLModElement | null>(null);

  const isValidAdSense = Boolean(adClient && adSlot && !adClient.includes('XXXX'));

  // Dynamically load Google AdSense script tag
  useEffect(() => {
    if (!isValidAdSense) return;

    const scriptId = 'adsense-js-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onerror = () => setAdSenseFailed(true);
      document.head.appendChild(script);
    }
  }, [adClient, isValidAdSense]);

  // Push new ad unit on mount & observe unfilled attribute
  useEffect(() => {
    if (!isValidAdSense || adSenseFailed) return;

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn('AdSense initialization error:', err);
      setAdSenseFailed(true);
    }

    // Observer to detect if Google AdSense marks ins as unfilled
    const checkUnfilled = () => {
      if (insRef.current) {
        const status = insRef.current.getAttribute('data-ad-status');
        if (status === 'unfilled') {
          setIsUnfilled(true);
        }
      }
    };

    const timer = setTimeout(checkUnfilled, 2000);

    const observer = new MutationObserver(() => {
      checkUnfilled();
    });

    if (insRef.current) {
      observer.observe(insRef.current, { attributes: true, attributeFilter: ['data-ad-status'] });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [adKey, isValidAdSense, adSenseFailed]);

  // Periodic Auto-Refresh Timer
  useEffect(() => {
    if (!isValidAdSense || adSenseFailed || isUnfilled || !refreshIntervalMs) return;

    const timer = setInterval(() => {
      setAdKey((prev) => prev + 1);
    }, refreshIntervalMs);

    return () => clearInterval(timer);
  }, [isValidAdSense, adSenseFailed, isUnfilled, refreshIntervalMs]);

  // Hide the block entirely when no ad is returned to prevent blank spacing
  if (!isValidAdSense || adSenseFailed || isUnfilled) {
    return null;
  }

  return (
    <div className={`overflow-hidden text-center my-1 ${className}`}>
      <span className="block text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">
        Advertisement
      </span>
      <ins
        ref={insRef}
        key={adKey}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format === 'banner' ? 'horizontal' : format === 'sidebar' ? 'vertical' : 'auto'}
        data-full-width-responsive="true"
      />
    </div>
  );
};
