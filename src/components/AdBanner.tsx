import React, { useState, useEffect } from 'react';

interface AdBannerProps {
  format?: 'banner' | 'rectangle' | 'inline' | 'sidebar';
  adClient?: string; // e.g. "ca-pub-1234567890"
  adSlot?: string;   // e.g. "1234567890"
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  format = 'inline',
  adClient = ((import.meta as any).env?.VITE_ADSENSE_CLIENT as string) || 'ca-pub-8087434803774295',
  adSlot = ((import.meta as any).env?.VITE_ADSENSE_SLOT as string) || '3740316875',
  className = '',
}) => {
  const [adSenseFailed, setAdSenseFailed] = useState(false);

  const isValidAdSense = Boolean(adClient && adSlot && !adClient.includes('XXXX'));

  // Dynamically load Google AdSense script tag and push ad unit
  useEffect(() => {
    if (!isValidAdSense) return;

    // Inject Google AdSense script into head if not already loaded
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

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense initialization error:', err);
      setAdSenseFailed(true);
    }
  }, [adClient, adSlot, isValidAdSense]);

  const showRealAdSense = isValidAdSense && !adSenseFailed;

  // If real AdSense credentials are configured and valid, render real Google AdSense container
  if (showRealAdSense) {
    return (
      <div className={`overflow-hidden text-center my-2 ${className}`}>
        <span className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Advertisement</span>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format={format === 'banner' ? 'horizontal' : format === 'sidebar' ? 'vertical' : 'auto'}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // All fallback ads have been removed per configuration. Return null when AdSense is not configured or fails.
  return null;
};

