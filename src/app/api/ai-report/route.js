import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Server-side API to fetch RSS and summarize with Gemini AI
 * This is more secure and reliable than client-side calls.
 */
export async function GET(request) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'AI API Key is missing on server' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        // 1. Fetch RSS from MK
        const rssRes = await fetch('https://www.mk.co.kr/rss/30100041/', {
            next: { revalidate: 300 } // Cache for 5 mins
        });
        const xmlText = await rssRes.text();

        // Simple XML parsing on server (regex based to avoid heavy libraries)
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xmlText)) !== null && items.length < 6) {
            const content = match[1];
            const title = (content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/))[1];
            const description = (content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || content.match(/<description>([\s\S]*?)<\/description>/))[1];
            items.push({ title, description });
        }

        // 2. AI Bulk Summary Request
        const bulkPrompt = `
        다음 경제 뉴스 6건을 인스타그램 카드뉴스용으로 요약해줘.
        ${items.map((n, i) => `뉴스 ${i + 1}: [제목: ${n.title}] [내용: ${n.description}]`).join('\n\n')}

        조건:
        1. 답변은 반드시 아래 형식의 JSON 배열(Array)만 출력할 것.
        2. 형식: [{"summary": "한두문장 요약", "insight": "전문가 인사이트"}, ...]
        3. 한글로 작성해라.
        `;

        const result = await model.generateContent(bulkPrompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\[.*\]/s);
        const aiResults = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        // 3. Structure Final Data
        const newsItems = items.map((item, idx) => {
            const aiData = aiResults[idx] || { summary: item.description.substring(0, 100), insight: "시장 상황을 예의주시해야 합니다." };
            return {
                id: idx + 1,
                title: item.title.replace(/\[.*?\]/g, '').trim(),
                bullets: [aiData.summary],
                insight: aiData.insight
            };
        });

        const newsSlides = [];
        for (let i = 0; i < newsItems.length; i += 2) {
            newsSlides.push({ type: 'news', items: newsItems.slice(i, i + 2) });
        }

        return NextResponse.json({
            date: new Date().toISOString().split('T')[0].split('-').join('.'),
            slides: newsSlides
        });

    } catch (error) {
        console.error('AI Report API Error:', error);
        return NextResponse.json({ error: 'Failed to generate AI report' }, { status: 500 });
    }
}
