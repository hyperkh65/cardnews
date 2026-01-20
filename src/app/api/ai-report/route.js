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
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'AI API Key is missing on server' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

            const title = titleMatch ? titleMatch[1] : "기사 제목 없음";
            const description = descMatch ? descMatch[1] : "내용 없음";

            items.push({ title, description });
        }

        if (items.length === 0) {
            throw new Error('No news items found in RSS');
        }

        // 2. AI Bulk Summary Request with Timeout
        const bulkPrompt = `
        다음 경제 뉴스 ${items.length}건을 인스타그램 카드뉴스용으로 요약해줘.
        ${items.map((n, i) => `뉴스 ${i + 1}: [제목: ${n.title}] [내용: ${n.description}]`).join('\n\n')}

        조건:
        1. 답변은 반드시 아래 형식의 JSON 배열(Array)만 출력할 것.
        2. 형식: [{"summary": "한두문장 요약", "insight": "전문가 인사이트"}, ...]
        3. 한글로 작성해라. 뉴스 순서대로 총 ${items.length}개를 작성해라.
        `;

        // Set a timeout for Gemini (30 seconds)
        const aiPromise = model.generateContent(bulkPrompt);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timeout')), 30000));

        const result = await Promise.race([aiPromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\[.*\]/s);
        const aiResults = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        // 3. Structure Final Data with Fallbacks
        const newsItems = items.map((item, idx) => {
            const aiData = aiResults[idx] || { summary: item.description.substring(0, 100).replace(/<[^>]*>/g, ''), insight: "시장 추이를 지속 파악할 필요가 있습니다." };
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
        console.error('AI Report API Error:', error);
        return NextResponse.json({ error: 'Failed to generate AI report' }, { status: 500 });
    }
}
