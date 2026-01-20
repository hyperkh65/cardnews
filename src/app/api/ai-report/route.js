import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Server-side API to fetch RSS and summarize with Gemini AI
 */

let cachedReport = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Return cache if it's still valid and not a forced refresh
    if (!forceRefresh && cachedReport && (Date.now() - lastFetchTime < CACHE_DURATION)) {
        return NextResponse.json(cachedReport);
    }
    const apiKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();

    if (!apiKey) {
        return NextResponse.json({ error: 'AI API Key is missing on server' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Function to generate content with automatic retries for Rate Limits
    async function generateWithRetry(modelRef, prompt, retries = 2) {
        for (let i = 0; i <= retries; i++) {
            try {
                const result = await modelRef.generateContent(prompt);
                return await result.response;
            } catch (err) {
                if (err.message?.includes('429') && i < retries) {
                    console.log(`Rate limit hit, retrying in ${2 * (i + 1)}s...`);
                    await new Promise(res => setTimeout(res, 2000 * (i + 1)));
                    continue;
                }
                throw err;
            }
        }
    }

    try {
        // 1. Fetch RSS from MK
        const rssRes = await fetch('https://www.mk.co.kr/rss/30100041/', {
            next: { revalidate: 300 }, // Cache for 5 mins
            signal: AbortSignal.timeout(10000) // 10s timeout for RSS
        });
        const xmlText = await rssRes.text();

        // Robust XML parsing with safer regex
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xmlText)) !== null && items.length < 6) {
            const content = match[1];

            // Safer title/desc extraction
            const titleMatch = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/);
            const descMatch = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || content.match(/<description>([\s\S]*?)<\/description>/);

            items.push({
                title: titleMatch ? titleMatch[1] : "기사 제목 없음",
                description: (descMatch ? descMatch[1] : "내용 없음").replace(/<[^>]*>/g, '').trim()
            });
        }

        if (items.length === 0) throw new Error('No news items');

        // 2. AI Request with Retry & Fallback
        const bulkPrompt = `
        경제 뉴스 ${items.length}건을 인스타그램 카드뉴스용으로 요약해줘.
        ${items.map((n, i) => `뉴스 ${i + 1}: [제목: ${n.title}] [내용: ${n.description.substring(0, 300)}]`).join('\n\n')}

        질문/사족 생략, 오직 JSON 배열만 출력. 
        형식: [{"summary": "한두문장 요약", "insight": "전략적 인사이트"}, ...]
        한국어로 뉴스 개수에 맞춰 정확히 ${items.length}개를 작성해라.
        `;

        let aiResults = [];
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Stable model
            const response = await generateWithRetry(model, bulkPrompt);
            const text = response.text();
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) aiResults = JSON.parse(jsonMatch[0]);
        } catch (apiError) {
            console.error("AI failed after retries, using Smart Fallback:", apiError.message);
            // Smart Fallback summary from text
            aiResults = items.map(item => ({
                summary: item.description.length > 80 ? item.description.substring(0, 80) + "..." : item.description,
                insight: "주요 경제 흐름을 면밀히 분석하고 대응할 필요가 있습니다."
            }));
        }

        // 3. Structure Final Data
        const newsItems = items.map((item, idx) => {
            const aiData = aiResults[idx] || {
                summary: item.description.substring(0, 100),
                insight: "추가적인 시장 변화를 예의주시해야 합니다."
            };
            return {
                id: idx + 1,
                title: item.title.replace(/\[.*?\]/g, '').replace(/<[^>]*>/g, '').trim(),
                bullets: [aiData.summary],
                insight: aiData.insight
            };
        });

        const newsSlides = [];
        for (let i = 0; i < newsItems.length; i += 2) {
            newsSlides.push({ type: 'news', items: newsItems.slice(i, i + 2) });
        }

        const reportData = {
            date: new Date().toISOString().split('T')[0].split('-').join('.'),
            slides: newsSlides
        };

        // Update cache
        cachedReport = reportData;
        lastFetchTime = Date.now();

        return NextResponse.json(reportData);

    } catch (error) {
        console.error('Final API Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
