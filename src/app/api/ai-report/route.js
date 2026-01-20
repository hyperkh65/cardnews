import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

let cachedReport = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분으로 단축

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. API 키 준비
    const rawKeys = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    const keyPool = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);

    async function analyzeWithRotation(prompt) {
        if (keyPool.length === 0) throw new Error("No API Keys");
        for (let i = 0; i < keyPool.length; i++) {
            const genAI = new GoogleGenerativeAI(keyPool[i]);
            for (const mName of ["gemini-1.5-flash", "gemini-2.0-flash-exp"]) {
                try {
                    const model = genAI.getGenerativeModel({ model: mName });
                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
                    });
                    const text = (await result.response).text();
                    const jsonMatch = text.match(/\[.*\]/s);
                    if (jsonMatch) return JSON.parse(jsonMatch[0]);
                } catch (err) { console.error(`Key ${i} failed with ${mName}`); continue; }
            }
        }
        throw new Error("AI Rotation Fail");
    }

    async function fetchRealMarketData() {
        const marketData = { exchange: [], global: [], crypto: [], commodities: [], updatedAt: new Date().toLocaleTimeString('ko-KR') };

        async function getNaverIndex(code) {
            try {
                const res = await fetch(`https://m.stock.naver.com/api/index/${code}/basic`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13)' },
                    signal: AbortSignal.timeout(4000)
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
                    signal: AbortSignal.timeout(4000)
                });
                const data = await res.json();
                const meta = data.chart.result[0].meta;
                const price = meta.regularMarketPrice;
                const prevClose = meta.previousClose;
                if (!price) return null;
                const changePct = (((price - prevClose) / prevClose) * 100).toFixed(2);
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
        // RSS 데이터 가져오기 (절대 실패 방지용 기본값 설정)
        let items = [];
        try {
            const rssRes = await fetch('https://www.mk.co.kr/rss/30100041/', { signal: AbortSignal.timeout(5000) });
            const xmlText = await rssRes.text();
            const itemRegex = /<item>([\s\S]*?)<\/item>/g;
            let match;
            while ((match = itemRegex.exec(xmlText)) !== null && items.length < 6) {
                const content = match[1];
                const titleMatch = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/);
                const descMatch = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || content.match(/<description>([\s\S]*?)<\/description>/);
                items.push({
                    title: (titleMatch ? titleMatch[1] : "경제 뉴스").replace(/<[^>]*>/g, '').trim(),
                    description: (descMatch ? descMatch[1] : "상세 내용은 원문을 참조하세요.").replace(/<[^>]*>/g, '').trim()
                });
            }
        } catch (e) { console.error("RSS Fetch Fail"); }

        if (items.length === 0) items = [{ title: "코스피 상승세 지속", description: "주요 증권가 분석에 따르면 상승세가 이어지고 있습니다." }];

        // 캐시 체크
        if (!forceRefresh && cachedReport && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            return NextResponse.json(cachedReport);
        }

        const marketInfo = await fetchRealMarketData();

        const buildFinalSlides = (newsData, mInfo) => {
            const newsSlides = [];
            for (let i = 0; i < newsData.length; i += 2) {
                newsSlides.push({ type: 'news', items: newsData.slice(i, i + 2) });
            }
            return [
                ...newsSlides,
                { type: 'market', title: '국내외 주요 증시', items: [...(mInfo?.exchange || []), ...(mInfo?.global || [])] },
                { type: 'market', title: '원자재 및 가상자산', items: [...(mInfo?.commodities || []), ...(mInfo?.crypto || [])] }
            ];
        };

        let aiResults;
        let usedAI = true;
        try {
            aiResults = await analyzeWithRotation(`Summarize these news into JSON list with "summary" and "insight": ${items.map(i => i.title).join(',')}`);
        } catch (e) {
            console.log("All AI/Key failed. Using DB or Local Fallback.");
            usedAI = false;
            const { data: dbReport } = await supabaseAdmin.from('news_reports').order('created_at', { ascending: false }).limit(1).maybeSingle();

            if (dbReport && !forceRefresh) {
                // 과거 리포트에 지표가 없으면 강제 주입
                const slides = dbReport.content.slides || [];
                if (!slides.some(s => s.type === 'market')) {
                    const newsSlides = slides.filter(s => s.type === 'news');
                    dbReport.content.slides = [...newsSlides, ...buildFinalSlides([], marketInfo).filter(s => s.type === 'market')];
                }
                return NextResponse.json(dbReport.content);
            }
            // 최후의 보루: AI 없이 서버 자체 요약
            aiResults = items.map(i => ({ summary: i.description.substring(0, 80) + "...", insight: "시장 변동성에 주의가 필요한 시점입니다." }));
        }

        const newsItems = items.map((it, idx) => ({
            id: idx + 1, title: it.title, bullets: [aiResults[idx]?.summary || it.description.substring(0, 80)], insight: aiResults[idx]?.insight || "시장 분석 중"
        }));

        const finalReport = {
            id: `report-${Date.now()}`,
            date: new Date().toISOString().split('T')[0].split('-').join('.'),
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            slides: buildFinalSlides(newsItems, marketInfo)
        };

        if (usedAI) {
            supabaseAdmin.from('news_reports').insert([{ content: finalReport, content_hash: items.map(i => i.title).join('|') }]).then();
        }

        cachedReport = finalReport;
        lastFetchTime = Date.now();
        return NextResponse.json(finalReport);
    } catch (error) {
        console.error("Critical API Error:", error);
        // 어떤 에러가 발생해도 빈 화면 대신 기본 리포트라도 반환
        return NextResponse.json({
            date: "2026.01.20",
            slides: [{ type: 'cover', title: '시스템 점검 중', subtitle: '잠시 후 다시 이용해 주세요.' }]
        });
    }
}
