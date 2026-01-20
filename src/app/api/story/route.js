import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI API for AI Story Creator
 * Now with Enhanced Image Support: Parsing & AI Generation
 */
export async function POST(request) {
    try {
        const { url } = await request.json();

        // Support Custom Keys
        const userGeminiKey = request.headers.get('x-gemini-key');
        const userOpenAIKey = request.headers.get('x-openai-key');
        const apiKey = (userGeminiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();

        if (!apiKey && !userOpenAIKey) {
            return NextResponse.json({ error: 'AI 분석을 위한 API 키가 설정되지 않았습니다.' }, { status: 500 });
        }

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // 1. Try to fetch the blog content & extract images
        let blogImages = [];
        let blogTitle = "";
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = await res.text();

            // Basic OG Image extraction
            const ogMatch = html.match(/<meta property="og:image" content="(.*?)"/);
            if (ogMatch) blogImages.push(ogMatch[1]);

            const titleMatch = html.match(/<title>(.*?)<\/title>/);
            if (titleMatch) blogTitle = titleMatch[1];

            // Extract more images
            const imgRegex = /<img.*?src="(.*?)"/g;
            let match;
            while ((match = imgRegex.exec(html)) !== null && blogImages.length < 5) {
                if (match[1].startsWith('http')) blogImages.push(match[1]);
            }
        } catch (e) {
            console.error("Scraping failed, falling back to AI imagination:", e.message);
        }

        const prompt = `
        다음 링크의 내용을 분석하거나, 제목을 바탕으로 인스타그램 카드뉴스(4장) 스타일의 스토리를 만들어줘.
        링크: "${url}"
        참고된 제목: "${blogTitle}"
        
        데이터 형식: 반드시 아래 구조의 JSON 배열만 반환해.
        [{"type":"cover", "text":"...", "subText":"...", "imageKeyword": "영어 키워드", "dallePrompt": "DALL-E용 상세 영어 묘사"}]
        (총 4개)
        
        지침:
        - 대한민국 감성에 맞는 친절하고 감성적인 어조.
        - dallePrompt는 사진 같이 사실적이고 세련된 스타일로 작성.
        `;

        let textResult = "";
        if (userOpenAIKey) {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userOpenAIKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" }
                })
            });
            const data = await res.json();
            textResult = data.choices[0].message.content;
        } else {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            textResult = result.response.text();
        }

        const jsonMatch = textResult.match(/\[.*\]/s);
        if (!jsonMatch) throw new Error("Invalid AI content format");
        const slidesData = JSON.parse(jsonMatch[0]);

        // 2. Resolve Images for each slide
        const finalSlides = slidesData.map((s, idx) => {
            let bgImage = "";

            // Strategy 1: Use specific blog images if found
            if (blogImages.length > idx) {
                bgImage = blogImages[idx];
            }
            // Strategy 2: Fallback to high quality keyword-based images
            else {
                // LoremFlickr is very reliable for keyword based images
                bgImage = `https://loremflickr.com/1080/1350/${s.imageKeyword.replace(/\s/g, ',')}/all`;
            }

            return {
                id: idx + 1,
                ...s,
                bgImage
            };
        });

        return NextResponse.json(finalSlides);
    } catch (error) {
        console.error('Story AI Error:', error);
        return NextResponse.json({ error: 'AI 분석 실패: ' + error.message }, { status: 500 });
    }
}
