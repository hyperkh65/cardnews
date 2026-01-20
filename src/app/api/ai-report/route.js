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

    // Attempting 2.5-flash first, then 1.5-flash as fallback
    let model;
    try {
        model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    } catch (e) {
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
                description: descMatch ? descMatch[1] : "내용 없음"
            });
        }

        if (items.length === 0) throw new Error('No news items');

        // 2. AI Bulk Summary Request
        const bulkPrompt = `
        다음 경제 뉴스 ${items.length}건을 인스타그램 카드뉴스용으로 요약해줘.
        ${items.map((n, i) => `뉴스 ${i + 1}: [제목: ${n.title}] [내용: ${n.description}]`).join('\n\n')}

        질문이나 사족은 생략하고 오직 JSON 배열만 출력해라.
        형식: [{"summary": "한두문장 요약", "insight": "전략적 인사이트"}, ...]
        한국어로 작성해라. 뉴스 개수에 맞춰 정확히 ${items.length}개를 작성해라.
        `;

        let response;
        try {
            const result = await model.generateContent(bulkPrompt);
            response = await result.response;
        } catch (apiError) {
            console.warn("AI content generation failed with current model, retrying with gemini-1.5-flash...", apiError.message);
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await fallbackModel.generateContent(bulkPrompt);
            response = await result.response;
        }

        const text = response.text();

        // Sanitize response to find JSON
        const jsonMatch = text.match(/\[.*\]/s);
        if (!jsonMatch) throw new Error("AI returned invalid format");

        const aiResults = JSON.parse(jsonMatch[0]);

        // 3. Structure Final Data with Fallbacks
        const newsItems = items.map((item, idx) => {
            const aiData = aiResults[idx] || {
                summary: item.description.substring(0, 100).replace(/<[^>]*>/g, ''),
                insight: "시장 변동성을 예의주시하며 대응해야 합니다."
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
        console.error('AI Report API Error:', error.message);
        return NextResponse.json({
            error: error.message || 'AI 분석 중 오류가 발생했습니다.',
            details: error.stack
        }, { status: 500 });
    }
}
