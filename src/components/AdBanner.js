'use client';

import { useEffect } from 'react';

export default function AdBanner({ slot, format = 'auto', responsive = 'true', style = { display: 'block' } }) {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e.message);
        }
    }, [slot]);

    return (
        <div style={{ padding: '20px 0', textAlign: 'center', width: '100%', overflow: 'hidden' }}>
            <ins className="adsbygoogle"
                style={style}
                data-ad-client="ca-pub-8940400388075870"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}></ins>
        </div>
    );
}
