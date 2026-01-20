import { NextResponse } from 'next/server';

/**
 * API Route to proxy RSS feeds and avoid CORS issues.
 * This runs on the server side, which is not restricted by browser CORS policies.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'mk';

    const RSS_URLS = {
        mk: 'https://www.mk.co.kr/rss/30100041/', // Maeil Business Economy
        hk: 'https://www.hankyung.com/feed/economy' // Hankyung Economy
    };

    const targetUrl = RSS_URLS[source] || RSS_URLS.mk;

    try {
        const response = await fetch(targetUrl, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch RSS: ${response.statusText}`);
        }

        const xmlString = await response.text();

        // Return the raw XML to the client, or we could parse it here.
        // For simplicity and to reuse the DOMParser logic, we return as text/xml or application/xml.
        return new NextResponse(xmlString, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 's-maxage=3600, stale-while-revalidate'
            }
        });
    } catch (error) {
        console.error('RSS Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
