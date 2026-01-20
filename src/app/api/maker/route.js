import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI API for Triangle Express (Maker)
 * Generates 6-card news content based on a subject.
 */
export async function POST(request) {
    const { subject } = await request.json();
    const apiKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    if (!subject) {
        return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    주제: "${subject}"
    이 주제로 인스타그램 카드뉴스 6장 분량의 가독성 좋은 대본을 작성해줘.
    
    데이터 형식: 반드시 아래 구조의 JSON 배열만 반환해.
    각 슬라이드 타입: 'cover', 'intro', 'point', 'point', 'point', 'outro' 순서대로 총 6개.
    
    항목 상세:
    1. type: 'cover' -> title (메인 제목), subtitle (설명)
    2. type: 'intro' -> text (공감 유도 문구)
    3. type: 'point' -> title (소제목), text (세부 내용)
    4. type: 'outro' -> title (마무리 문구), subtitle (강조), text (행동 유도)

    예시: [{"type":"cover", "title":"...", "subtitle":"..."}, ...]
    한국어로 작성하고, MZ세대가 좋아할만한 트렌디하고 간결한 문체를 사용해.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\[.*\]/s);

        if (!jsonMatch) throw new Error("Invalid AI response format");
        const slides = JSON.parse(jsonMatch[0]);

        // Map IDs
        const formattedSlides = slides.map((s, idx) => ({
            id: idx,
            ...s,
            bgImage: null,
            overlayImage: null,
            textPos: { x: 0, y: 0 }
        }));

        return NextResponse.json(formattedSlides);
    } catch (error) {
        console.error('Maker AI Error:', error);
        return NextResponse.json({ error: 'AI 생성 실패' }, { status: 500 });
    }
}
