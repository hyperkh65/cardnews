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

    // 1. Get Keys (Priority: Header User Key > System Env Key)
    const userGeminiKey = request.headers.get('x-gemini-key');
    const userOpenAIKey = request.headers.get('x-openai-key');

    const systemKeys = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").split(',').map(k => k.trim()).filter(Boolean);
    const geminiPool = userGeminiKey ? [userGeminiKey, ...systemKeys] : systemKeys;

    async function analyzeWithOpenAI(prompt, apiKey) {
        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" }
                })
            });
            const data = await res.json();
            const content = data.choices[0].message.content;
            // The prompt asks for an array, GPT might wrap it in an object if told json_object
            const jsonMatch = content.match(/\[.*\]/s);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content).results;
        } catch (e) {
            console.error("OpenAI Analysis Fail:", e.message);
            throw e;
        }
    }

    async function analyzeWithGemini(prompt, apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[.*\]/s);
        if (!jsonMatch) throw new Error("JSON Format Error");
        return JSON.parse(jsonMatch[0]);
    }

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
                if (['비트코인', '이더리움', '솔라나', '리플'].includes(name)) displayValue = Math.floor(price).toLocaleString();
                return { name, value: displayValue, change: `${price >= prevClose ? '+' : ''}${changePct}%`, status: price >= prevClose ? 'up' : 'down' };
            } catch (e) { return null; }
        }

        const results = await Promise.all([
            getNaverIndex('KOSPI'), getNaverIndex('KOSDAQ'), getYahooData('환율 (USD/KRW)', 'USDKRW=X'),
            getYahooData('S&P 500', '^GSPC'), getYahooData('NASDAQ', '^IXIC'),
            getYahooData('금 (Gold)', 'GC=F'), getYahooData('은 (Silver)', 'SI=F'), getYahooData('구리 (Copper)', 'HG=F'), getYahooData('알루미늄', 'ALI=F'),
            getYahooData('비트코인', 'BTC-USD'), getYahooData('이더리움', 'ETH-USD'), getYahooData('솔라나', 'SOL-USD'), getYahooData('리플', 'XRP-USD')
        ]);

        marketData.exchange = results.slice(0, 3).filter(Boolean);
        marketData.global = results.slice(3, 5).filter(Boolean);
        marketData.commodities = results.slice(5, 9).filter(Boolean);
        marketData.crypto = results.slice(9, 13).filter(Boolean);
        return marketData;
    }

    try {
        let items = [];
        const rssRes = await fetch('https://www.mk.co.kr/rss/30100041/', { signal: AbortSignal.timeout(5000) });
        const xmlText = await rssRes.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xmlText)) !== null && items.length < 10) {
            const content = match[1];
            const titleMatch = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/);
            const descMatch = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || content.match(/<description>([\s\S]*?)<\/description>/);
            items.push({
                title: (titleMatch ? titleMatch[1] : "경제 뉴스").replace(/<[^>]*>/g, '').trim(),
                description: (descMatch ? descMatch[1] : "내용 생략").replace(/<[^>]*>/g, '').trim()
            });
        }

        // Only use cache if no user keys provided (user keys should always trigger fresh analysis if refresh requested)
        if (!forceRefresh && !userGeminiKey && !userOpenAIKey && cachedReport && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            return NextResponse.json({ ...cachedReport, isAIFilled: true });
        }

        const marketInfo = await fetchRealMarketData();

        const buildSlides = (newsData, mInfo) => {
            const slides = [{ type: 'cover', title: '투데이즈 경제 뉴스', subtitle: 'AI가 실시간으로 분석한 오늘의 주요 경제 브리핑' }];
            for (let i = 0; i < newsData.length; i += 2) {
                slides.push({ type: 'news', title: '오늘의 주요 경제 기사', items: newsData.slice(i, i + 2) });
            }
            slides.push({ type: 'market', title: '국내외 주요 증시 지표', items: [...(mInfo?.exchange || []), ...(mInfo?.global || [])] });
            slides.push({ type: 'market', title: '원자재 현황', items: mInfo?.commodities || [] });
            slides.push({ type: 'market', title: '가상자산 시세', items: mInfo?.crypto || [] });
            return slides;
        };

        let aiResults = null;
        let isAIFilled = false;

        const prompt = `주어진 뉴스 10개를 각각 요약(summary)하고 통찰(insight)을 JSON 배열 형식으로 출력해줘. [{"summary": "...", "insight": "..."}] 순서대로 10개. 뉴스 제목들: [${items.map(i => i.title).join(',')}]`;

        // Strategy: User OpenAI > User Gemini > System Gemini Pool
        try {
            if (userOpenAIKey) {
                aiResults = await analyzeWithOpenAI(prompt, userOpenAIKey);
            } else if (geminiPool.length > 0) {
                aiResults = await analyzeWithGemini(prompt, geminiPool[0]);
            }
            if (aiResults) isAIFilled = true;
        } catch (e) {
            console.error("AI First Attempt Failed, trying next in pool if available.");
            if (!userOpenAIKey && geminiPool.length > 1) {
                try {
                    aiResults = await analyzeWithGemini(prompt, geminiPool[1]);
                    isAIFilled = true;
                } catch (e2) { }
            }
        }

        const newsItems = items.map((it, idx) => ({
            id: idx + 1,
            title: it.title,
            bullets: [aiResults?.[idx]?.summary || it.description.substring(0, 80)],
            insight: aiResults?.[idx]?.insight || null
        }));

        const finalReport = {
            id: `report-${Date.now()}`,
            date: new Date().toISOString().split('T')[0].split('-').join('.'),
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            slides: buildSlides(newsItems, marketInfo),
            isAIFilled
        };

        if (isAIFilled && !userGeminiKey && !userOpenAIKey) {
            cachedReport = finalReport;
            lastFetchTime = Date.now();
            supabaseAdmin.from('news_reports').insert([{ content: finalReport, content_hash: items.map(i => i.title).join('|') }]).then();
        }

        return NextResponse.json(finalReport);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
