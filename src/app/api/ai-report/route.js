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

    // 1. Get Keys
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
            const jsonMatch = content.match(/\[.*\]/s);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : (JSON.parse(content).results || JSON.parse(content).items);
        } catch (e) { throw e; }
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
                return { name: code === 'KOSPI' ? '코스피' : '코스닥', value: data.closePrice, change: `${data.fluctuationsRatio}%`, status: (data.compareToPreviousPrice.code === '2' || data.compareToPreviousPrice.code === '3') ? 'up' : 'down' };
            } catch (e) { return null; }
        }
        async function getYahooData(name, sym) {
            try {
                const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3000) });
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
        // 2. Multi-Source News Selection
        let allItems = [];
        const feeds = ['https://www.mk.co.kr/rss/30100041/', 'https://www.mk.co.kr/rss/30000001/'];
        for (const feedUrl of feeds) {
            try {
                const rssRes = await fetch(feedUrl, { signal: AbortSignal.timeout(5000) });
                const xmlText = await rssRes.text();
                const itemRegex = /<item>([\s\S]*?)<\/item>/g;
                let match;
                while ((match = itemRegex.exec(xmlText)) !== null && allItems.length < 30) {
                    const content = match[1];
                    const titleMatch = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/);
                    const descMatch = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || content.match(/<description>([\s\S]*?)<\/description>/);
                    if (titleMatch) {
                        const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
                        const description = (descMatch ? descMatch[1] : "").replace(/<[^>]*>/g, '').trim();

                        // Filter out photo/table or very short/empty articles
                        if (title.includes('[포토]') || title.includes('[표]') || description.includes('내용 생략')) continue;

                        allItems.push({ title, description });
                    }
                }
            } catch (e) { }
        }

        if (!forceRefresh && !userGeminiKey && !userOpenAIKey && cachedReport && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            return NextResponse.json({ ...cachedReport, isAIFilled: true });
        }

        const marketInfo = await fetchRealMarketData();
        let selectedItems = allItems.slice(0, 10);
        let aiResults = null;
        let isAIFilled = false;

        const smartPrompt = `
        다음 ${allItems.length}개의 뉴스 제목 중에서 오늘 가장 중요하고 파급력이 큰 실시간 경제/산업/금융 뉴스 10개를 선정하고, 각각을 요약(summary)하고 통찰(insight)을 작성해줘.
        선정 기준: 시장 영향력, 정책 변화, 대기업 동향 등 의미 있는 뉴스. 
        절대 제외: 단순 사건사고, [포토], [표], [본문 내용 요약], 내용이 빈약한 단신 기사.
        
        데이터 형식: 반드시 아래 구조의 JSON 배열만 반환해.
        [{"originalIdx": 0, "title": "뉴스제목", "summary": "내용요약", "insight": "투자포인트/전망"}] 
        (총 10개)
        
        뉴스 리스트:
        ${allItems.map((it, idx) => `[${idx}] ${it.title}`).join('\n')}
        `;

        try {
            if (userOpenAIKey) {
                aiResults = await analyzeWithOpenAI(smartPrompt, userOpenAIKey);
            } else if (geminiPool.length > 0) {
                aiResults = await analyzeWithGemini(smartPrompt, geminiPool[0]);
            }
            if (aiResults && aiResults.length >= 10) {
                selectedItems = aiResults.slice(0, 10).map(res => ({
                    title: res.title,
                    summary: res.summary,
                    insight: res.insight
                }));
                isAIFilled = true;
            }
        } catch (e) {
            console.error("Smart Analysis Failed:", e.message);
        }

        const buildSlides = (newsData, mInfo) => {
            const slides = [{ type: 'cover', title: '투데이즈 경제 뉴스', subtitle: 'AI가 직접 엄선한 오늘의 주요 경제 브리핑' }];
            for (let i = 0; i < newsData.length; i += 2) {
                slides.push({ type: 'news', title: '오늘의 주요 경제 기사', items: newsData.slice(i, i + 2) });
            }
            slides.push({ type: 'market', title: '국내외 주요 증시 지표', items: [...(mInfo?.exchange || []), ...(mInfo?.global || [])] });
            slides.push({ type: 'market', title: '원자재 현황', items: mInfo?.commodities || [] });
            slides.push({ type: 'market', title: '가상자산 시세', items: mInfo?.crypto || [] });
            return slides;
        };

        const newsItems = selectedItems.map((it, idx) => ({
            id: idx + 1,
            title: it.title,
            bullets: [it.summary || (allItems[idx]?.description?.substring(0, 80) || "내용 생략")],
            insight: it.insight || null
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
            supabaseAdmin.from('news_reports').insert([{ content: finalReport, content_hash: allItems.slice(0, 10).map(i => i.title).join('|') }]).then();
        }

        return NextResponse.json(finalReport);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
