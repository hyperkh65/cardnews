import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

let cachedReport = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const rawKeys = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);

    // 1. Fetch Basic Data (Fast)
    async function fetchRealMarketData() {
        const marketData = { exchange: [], global: [], crypto: [], commodities: [], updatedAt: new Date().toLocaleTimeString('ko-KR') };

        async function getNaverIndex(code) {
            try {
                const res = await fetch(`https://m.stock.naver.com/api/index/${code}/basic`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(3000)
                });
                const data = await res.json();
                return {
                    name: code === 'KOSPI' ? '코스피' : '코스닥',
                    value: data.closePrice,
                    change: `${data.fluctuationsRatio}%`,
                    status: (data.compareToPreviousPrice.code === '2' || data.compareToPreviousPrice.code === '3') ? 'up' : 'down'
                };
            } catch (e) { return null; }
        }

        async function getYahooData(name, sym) {
            try {
                const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(3000)
                });
                const data = await res.json();
                const meta = data.chart.result[0].meta;
                const price = meta.regularMarketPrice;
                const prevClose = meta.previousClose;
                if (!price) return null;
                const changePct = (((price - prevClose) / (prevClose || 1)) * 100).toFixed(2);
                let displayValue = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                if (['비트코인', '이더리움'].includes(name)) displayValue = Math.floor(price).toLocaleString();
                return { name, value: displayValue, change: `${price >= prevClose ? '+' : ''}${changePct}%`, status: price >= prevClose ? 'up' : 'down' };
            } catch (e) { return null; }
        }

        const results = await Promise.all([
            getNaverIndex('KOSPI'), getNaverIndex('KOSDAQ'), getYahooData('환율 (USD/KRW)', 'USDKRW=X'),
            getYahooData('S&P 500', '^GSPC'), getYahooData('NASDAQ', '^IXIC'),
            getYahooData('금 (Gold)', 'GC=F'), getYahooData('은 (Silver)', 'SI=F'), getYahooData('구리 (Copper)', 'HG=F'), getYahooData('알루미늄', 'ALI=F'),
            getYahooData('비트코인', 'BTC-USD'), getYahooData('이더리움', 'ETH-USD')
        ]);

        marketData.exchange = results.slice(0, 3).filter(Boolean);
        marketData.global = results.slice(3, 5).filter(Boolean);
        marketData.commodities = results.slice(5, 9).filter(Boolean);
        marketData.crypto = results.slice(9, 11).filter(Boolean);
        return marketData;
    }

    try {
        const [rssRes, marketInfo] = await Promise.all([
            fetch('https://www.mk.co.kr/rss/30100041/', { next: { revalidate: 60 } }),
            fetchRealMarketData()
        ]);
        const xmlText = await rssRes.text();
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xmlText)) !== null && items.length < 6) {
            const content = match[1];
            const titleMatch = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/);
            const descMatch = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || content.match(/<description>([\s\S]*?)<\/description>/);
            items.push({
                title: (titleMatch ? titleMatch[1] : "경제 뉴스").replace(/<[^>]*>/g, '').trim(),
                description: (descMatch ? descMatch[1] : "내용 생략").replace(/<[^>]*>/g, '').trim()
            });
        }

        // Return Cache if not forced
        if (!forceRefresh && cachedReport && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            return NextResponse.json({ ...cachedReport, isAIFilled: true, isPartial: false });
        }

        const buildSlides = (newsData, mInfo) => {
            const newsSlides = [];
            for (let i = 0; i < newsData.length; i += 2) {
                newsSlides.push({ type: 'news', items: newsData.slice(i, i + 2) });
            }
            return [
                ...newsSlides,
                { type: 'market', title: '국내외 증시 지표', items: [...(mInfo?.exchange || []), ...(mInfo?.global || [])] },
                { type: 'market', title: '원자재 및 가상자산', items: [...(mInfo?.commodities || []), ...(mInfo?.crypto || [])] }
            ];
        };

        // Try AI with a strict timeout to avoid long waits
        let aiResults = null;
        let isAIFilled = false;

        if (keyPool.length > 0) {
            try {
                // Racing AI with a timeout (optional, but let's try rotation first)
                const genAI = new GoogleGenerativeAI(keyPool[0]);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await Promise.race([
                    model.generateContent(`뉴스 요약 JSON:[${items.map(i => i.title).join(',')}]`),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
                ]);
                const text = result.response.text();
                const jsonMatch = text.match(/\[.*\]/s);
                if (jsonMatch) {
                    aiResults = JSON.parse(jsonMatch[0]);
                    isAIFilled = true;
                }
            } catch (e) {
                console.log("AI Fast analysis failed or timeout. Returning partial data.");
            }
        }

        const newsItems = items.map((it, idx) => ({
            id: idx + 1,
            title: it.title,
            bullets: [aiResults?.[idx]?.summary || it.description.substring(0, 80)],
            insight: aiResults?.[idx]?.insight || null // Mark as null if no AI
        }));

        const reportData = {
            id: `report-${Date.now()}`,
            date: new Date().toISOString().split('T')[0].split('-').join('.'),
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            slides: buildSlides(newsItems, marketInfo),
            isAIFilled
        };

        if (isAIFilled) {
            cachedReport = reportData;
            lastFetchTime = Date.now();
            supabaseAdmin.from('news_reports').insert([{ content: reportData, content_hash: items.map(i => i.title).join('|') }]).then();
        }

        return NextResponse.json(reportData);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
