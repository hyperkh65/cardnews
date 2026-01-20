import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI API for AI Story Creator
 * Fetches or imagines content from a URL and creates an Instagram Story script.
 */
export async function POST(request) {
    const { url } = await request.json();
    const apiKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Since we can't always scrape, we ask Gemini to "imagine" what's at the URL if it can't access it,
    // or provide it with the URL as a context. Many blog posts are in its training data or it can deduce from the URL path.
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

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\[.*\]/s);

        if (!jsonMatch) throw new Error("Invalid format");
        const slidesData = JSON.parse(jsonMatch[0]);

        // Map to include Unsplash images based on keywords
        const slides = slidesData.map((s, idx) => ({
            id: idx + 1,
            ...s,
            bgImage: `https://images.unsplash.com/photo-15500000000?${s.imageKeyword.replace(/\s/g, '+')}&w=800&q=80`
            // Replace with a dynamic placeholder if keyword is specific, 
            // or just use a varied set from Unsplash source for better visuals
        }));

        // Better image handling: Use a set of high-quality abstract economic/lifestyle images if keyword search fails
        const fallbackImages = [
            'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80',
            'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80',
            'https://images.unsplash.com/photo-1542385311-7a71a911732e?w=800&q=80',
            'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=800&q=80',
        ];

        const finalSlides = slides.map((s, i) => ({
            ...s,
            bgImage: `https://source.unsplash.com/featured/?${s.imageKeyword.replace(/\s/g, ',')}` || fallbackImages[i % 4]
        }));

        return NextResponse.json(finalSlides);
    } catch (error) {
        console.error('Story AI Error:', error);
        return NextResponse.json({ error: 'AI 분석 실패' }, { status: 500 });
    }
}
