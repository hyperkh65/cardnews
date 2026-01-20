import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with Service Role Key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

let cachedReport = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. API Key Pool
    const rawKeys = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);

    if (keyPool.length === 0) {
        return NextResponse.json({ error: 'AI API Key missing' }, { status: 500 });
    }

    async function analyzeWithRotation(prompt) {
        for (let i = 0; i < keyPool.length; i++) {
            const currentKey = keyPool[i];
            const genAI = new GoogleGenerativeAI(currentKey);
            const modelNames = ["gemini-1.5-flash", "gemini-2.0-flash-exp"];

            for (const mName of modelNames) {
                try {
                    console.log(`Trying Key #${i + 1} with ${mName}...`);
                    const model = genAI.getGenerativeModel({ model: mName });
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();
                    const jsonMatch = text.match(/\[.*\]/s);
                    if (jsonMatch) return JSON.parse(jsonMatch[0]);
                } catch (err) {
                    console.error(`Key #${i + 1} ${mName} failed:`, err.message);
                    continue;
                }
            }
        }
        throw new Error("All AI Rotation failed");
    }

    async function fetchRealMarketData() {
        const marketData = { exchange: [], global: [], crypto: [], commodities: [], updatedAt: new Date().toLocaleTimeString('ko-KR') };

        async function getNaverIndex(code) {
            try {
                const res = await fetch(`https://m.stock.naver.com/api/index/${code}/basic`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/04.1' },
                    signal: AbortSignal.timeout(5000)
                });
                const data = await res.json();
                return {
                    name: code === 'KOSPI' ? '코스피' : '코스닥',
                    value: data.closePrice,
                    change: `${data.compareToPreviousPrice.code === '2' || data.compareToPreviousPrice.code === '3' ? '+' : ''}${data.fluctuationsRatio}%`,
                    status: (data.compareToPreviousPrice.code === '2' || data.compareToPreviousPrice.code === '3') ? 'up' : 'down'
                };
            } catch (e) { return null; }
        }

        async function getYahooData(name, sym) {
            try {
                const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    signal: AbortSignal.timeout(5000)
                });
                const data = await res.json();
                const meta = data.chart.result[0].meta;
                const price = meta.regularMarketPrice;
                const prevClose = meta.previousClose;
                if (!price || !prevClose) return null;
                const changeVal = price - prevClose;
                const changePct = ((changeVal / prevClose) * 100).toFixed(2);

                let displayValue = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                if (['비트코인', '이더리움'].includes(name)) displayValue = Math.floor(price).toLocaleString();

                return {
                    name,
                    value: displayValue,
                    change: `${changeVal > 0 ? '+' : ''}${changePct}%`,
                    status: changeVal >= 0 ? 'up' : 'down'
                };
            } catch (e) { return null; }
        }

        try {
            const [kospi, kosdaq, usd, snp, nasdaq, gold, silver, copper, aluminum, btc, eth] = await Promise.all([
                getNaverIndex('KOSPI'),
                getNaverIndex('KOSDAQ'),
                getYahooData('환율 (USD/KRW)', 'USDKRW=X'),
                getYahooData('S&P 500', '^GSPC'),
                getYahooData('NASDAQ', '^IXIC'),
                getYahooData('금 (Gold)', 'GC=F'),
                getYahooData('은 (Silver)', 'SI=F'),
                getYahooData('구리 (Copper)', 'HG=F'),
                getYahooData('알루미늄', 'ALI=F'),
                getYahooData('비트코인', 'BTC-USD'),
                getYahooData('이더리움', 'ETH-USD')
            ]);

            marketData.exchange = [kospi, kosdaq, usd].filter(Boolean);
            marketData.global = [snp, nasdaq].filter(Boolean);
            marketData.commodities = [gold, silver, copper, aluminum].filter(Boolean);
            marketData.crypto = [btc, eth].filter(Boolean);

            return marketData;
        } catch (err) { return null; }
    }

    try {
        // 2. Fetch News & Market Data Parallel
        const [rssRes, marketInfo] = await Promise.all([
            fetch('https://www.mk.co.kr/rss/30100041/', { next: { revalidate: 60 }, signal: AbortSignal.timeout(10000) }),
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
                title: titleMatch ? titleMatch[1] : "경제 뉴스",
                description: (descMatch ? descMatch[1] : "본문 내용을 확인해 주세요.").replace(/<[^>]*>/g, '').trim()
            });
        }

        if (!forceRefresh && cachedReport && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            return NextResponse.json(cachedReport);
        }

        const constructReport = (aiResults, mInfo) => {
            const newsItems = items.map((item, idx) => ({
                id: idx + 1,
                title: item.title.replace(/\[.*?\]/g, '').replace(/<[^>]*>/g, '').trim(),
                bullets: [aiResults[idx]?.summary || item.description.substring(0, 80)],
                insight: aiResults[idx]?.insight || "시장 분석 지연 중"
            }));

            return {
                date: new Date().toISOString().split('T')[0].split('-').join('.'),
                slides: [
                    { type: 'news', items: newsItems.slice(0, 2) },
                    { type: 'news', items: newsItems.slice(2, 4) },
                    { type: 'news', items: newsItems.slice(4, 6) },
                    {
                        type: 'market',
                        title: `국내외 주요 증시`,
                        items: [...(mInfo?.exchange || []), ...(mInfo?.global || [])]
                    },
                    {
                        type: 'market',
                        title: `원자재 및 가상자산`,
                        items: [...(mInfo?.commodities || []), ...(mInfo?.crypto || [])]
                    }
                ]
            };
        };

        const bulkPrompt = `경제 뉴스 ${items.length}건 요약 및 인사이트 생성.\n${items.map((n, i) => `뉴스 ${i + 1}: ${n.title} - ${n.description.substring(0, 200)}`).join('\n')}\nJSON 형식: [{"summary": "요약", "insight": "통찰"}]`;

        let aiResults;
        try {
            aiResults = await analyzeWithRotation(bulkPrompt);
            const reportData = constructReport(aiResults, marketInfo);

            // Save to DB
            supabaseAdmin.from('news_reports').insert([{ content: reportData, content_hash: items.map(i => i.title).join('|') }]).then(() => console.log("Report saved."));

            cachedReport = reportData;
            lastFetchTime = Date.now();
            return NextResponse.json(reportData);
        } catch (aiError) {
            console.error("AI Error, using fallback...");
            const { data: dbReport } = await supabaseAdmin.from('news_reports').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();

            if (dbReport) return NextResponse.json(dbReport.content);

            // Ultimate fallback (Emergency RSS-to-text)
            const fallbackResults = items.map(item => ({ summary: item.description.substring(0, 80) + "...", insight: "시장 추이를 지켜볼 필요가 있습니다." }));
            const fallbackReport = constructReport(fallbackResults, marketInfo);
            return NextResponse.json(fallbackReport);
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
