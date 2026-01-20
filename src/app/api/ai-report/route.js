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
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                const jsonMatch = text.match(/\[.*\]/s);
                if (!jsonMatch) throw new Error("Format Error");
                return JSON.parse(jsonMatch[0]);
            } catch (err) {
                if ((err.message?.includes('429') || err.message?.includes('503')) && i < keyPool.length - 1) continue;
                throw err;
            }
        }
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
                title: titleMatch ? titleMatch[1] : "기사 제목 없음",
                description: (descMatch ? descMatch[1] : "내용 없음").replace(/<[^>]*>/g, '').trim()
            });
        }

        const currentTitlesHash = items.map(i => i.title).join('|');

        // 3. Smart Return: Cache
        if (!forceRefresh && cachedReport && (Date.now() - lastFetchTime < CACHE_DURATION)) {
            return NextResponse.json(cachedReport);
        }

        // 4. Try AI Analysis
        const bulkPrompt = `경제 뉴스 ${items.length}건을 요약해줘.\n${items.map((n, i) => `뉴스 ${i + 1}: [제목: ${n.title}] [내용: ${n.description.substring(0, 300)}]`).join('\n\n')}\n오직 JSON 배열 반환. 형식: [{"summary": "한두문장 요약", "insight": "전문 인사이트"}, ...]`;

        let aiResults;
        try {
            aiResults = await analyzeWithRotation(bulkPrompt);
        } catch (aiError) {
            console.error("AI Service exhausted, trying to fetch from DB...");
            const { data: dbReport } = await supabaseAdmin
                .from('news_reports')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (dbReport) return NextResponse.json(dbReport.content);
            throw new Error('AI 분석 한도 초과 및 저장된 데이터 없음');
        }

        // 5. Structure Final Data
        const newsItems = items.map((item, idx) => ({
            id: idx + 1,
            title: item.title.replace(/\[.*?\]/g, '').replace(/<[^>]*>/g, '').trim(),
            bullets: [aiResults[idx]?.summary || item.description.substring(0, 80)],
            insight: aiResults[idx]?.insight || "시장 지표 데이터 분석 지연 중"
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
