import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI API for AI Story Creator
 * Fetches or imagines content from a URL and creates an Instagram Story script.
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

        const prompt = `
        다음 링크의 내용을 분석해서 인스타그램 카드뉴스(4장) 스타일의 스토리를 만들어줘.
        링크: "${url}"
        
        데이터 형식: 반드시 아래 구조의 JSON 배열만 반환해.
        총 4개의 객체를 가진 배열.
        
        항목 상세:
        - type: 'cover' (제목 장), 'content' (내용 장), 'outro' (마무리)
        - text: 핵심이 되는 큰 제목
        - subText: 보충 설명 또는 감성적인 캡션
        - imageKeyword: 이 슬라이드에 어울리는 이미지 검색 키워드 (영어)

        예시: [{"type":"cover", "text":"...", "subText":"...", "imageKeyword": "morning coffee"}, ...]
        한국어로 작성하고, 인스타그램 특유의 감성적이고 친절한 어조를 사용해.
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
                    messages: [{ role: "user", content: prompt }]
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
        if (!jsonMatch) throw new Error("Invalid format");
        const slidesData = JSON.parse(jsonMatch[0]);

        // Map to include Unsplash images based on keywords
        const slides = slidesData.map((s, idx) => ({
            id: idx + 1,
            ...s,
            bgImage: `https://source.unsplash.com/featured/?${s.imageKeyword.replace(/\s/g, ',')}`
        }));

        return NextResponse.json(slides);
    } catch (error) {
        console.error('Story AI Error:', error);
        return NextResponse.json({ error: 'AI 분석 실패' }, { status: 500 });
    }
}
