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
        // 1. Fetch RSS first to compare content
        const rssRes = await fetch('https://www.mk.co.kr/rss/30100041/', {
            next: { revalidate: 60 }, // Check RSS every minute
            signal: AbortSignal.timeout(10000)
        });
        const xmlText = await rssRes.text();

        // Parse items to check for changes
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

        // Check if content is actually different from cache
        const currentTitles = items.map(i => i.title).join('|');
        const cachedTitles = cachedReport?.slides.flatMap(s => s.items || []).map(i => i.title).join('|');
        const isSameContent = currentTitles === cachedTitles;

        // Smart Return: Use cache if not forceRefresh AND content is same
        if (!forceRefresh && cachedReport && (Date.now() - lastFetchTime < CACHE_DURATION || isSameContent)) {
            console.log("Serving cached report.");
            return NextResponse.json(cachedReport);
        }

        if (items.length === 0) throw new Error('No news items');

        // 2. AI Request with Retry
        const bulkPrompt = `
        경제 뉴스 ${items.length}건을 인스타그램 카드뉴스용으로 요약해줘.
        ${items.map((n, i) => `뉴스 ${i + 1}: [제목: ${n.title}] [내용: ${n.description.substring(0, 300)}]`).join('\n\n')}

        질문/사족 생략, 오직 JSON 배열만 출력. 
        형식: [{"summary": "한두문장 요약", "insight": "핵심 인사이트 (최대한 구체적이고 전문적으로)"}, ...]
        한국어로 뉴스 개수에 맞춰 정확히 ${items.length}개를 작성해라.
        `;

        let aiResults = [];
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const response = await generateWithRetry(model, bulkPrompt);
            const text = response.text();
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) aiResults = JSON.parse(jsonMatch[0]);
        } catch (apiError) {
            console.error("AI failed after retries:", apiError.message);
            // Throw error to UI so user knows it's a quota issue. 
            // The UI will handle this and show the "try again later" message.
            throw new Error('AI 분석 한도가 초과되었습니다. 잠시 후 다시 시도해 주세요.');
        }

        // 3. Structure Final Data
        const newsItems = items.map((item, idx) => {
            const aiData = aiResults[idx] || {
                summary: item.description.substring(0, 100),
                insight: "시장 지표 분석 지연 중"
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
        return NextResponse.json({
            error: error.message,
            isQuotaExceeded: error.message.includes('한도') || error.message.includes('429')
        }, { status: 500 });
    }
}
