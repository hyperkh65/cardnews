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
            // Try 1.5 first, then 2.0 if needed
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

    try {
        // 2. Fetch RSS
        const rssRes = await fetch('https://www.mk.co.kr/rss/30100041/', {
            next: { revalidate: 60 },
            signal: AbortSignal.timeout(10000)
        });
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
                description: (descMatch ? descMatch[1] : "상세 내용은 클릭하여 확인하세요.").replace(/<[^>]*>/g, '').trim()
            });
        }

        const currentTitlesHash = items.map(i => i.title).join('|');

        // 3. Smart Return: Cache
        if (!forceRefresh && cachedReport && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            return NextResponse.json(cachedReport);
        }

        // 4. Try AI Analysis
        const bulkPrompt = `경제 뉴스 ${items.length}건 요약 및 인사이트 생성.\n${items.map((n, i) => `뉴스 ${i + 1}: ${n.title} - ${n.description.substring(0, 200)}`).join('\n')}\nJSON 배열만 반환: [{"summary": "요약", "insight": "뉴스통찰"}]`;

        let aiResults;
        try {
            aiResults = await analyzeWithRotation(bulkPrompt);
        } catch (aiError) {
            console.error("AI failed, trying DB fallback...");
            const { data: dbReport } = await supabaseAdmin
                .from('news_reports')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (dbReport) return NextResponse.json(dbReport.content);

            // Final Emergency: Fake AI from RSS text
            console.log("Everything failed, using RSS-based fallback report.");
            aiResults = items.map(item => ({
                summary: item.description.length > 80 ? item.description.substring(0, 80) + "..." : item.description,
                insight: "주요 경제 지표와 뉴스의 연관성을 예의주시할 필요가 있습니다."
            }));
        }

        // 5. Structure Final Data
        const newsItems = items.map((item, idx) => ({
            id: idx + 1,
            title: item.title.replace(/\[.*?\]/g, '').replace(/<[^>]*>/g, '').trim(),
            bullets: [aiResults[idx]?.summary || item.description.substring(0, 80)],
            insight: aiResults[idx]?.insight || "지표 데이터 연동 중"
        }));

        const newsSlides = [];
        for (let i = 0; i < newsItems.length; i += 2) {
            newsSlides.push({ type: 'news', items: newsItems.slice(i, i + 2) });
        }

        const reportData = {
            date: new Date().toISOString().split('T')[0].split('-').join('.'),
            slides: newsSlides
        };

        // 6. Save to DB for history
        supabaseAdmin.from('news_reports').insert([
            { content: reportData, content_hash: currentTitlesHash }
        ]).then(() => console.log("Report saved to history."));

        cachedReport = reportData;
        lastFetchTime = Date.now();
        return NextResponse.json(reportData);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
