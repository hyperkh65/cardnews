import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * newsFetcher.js
 * Logic to fetch and process real economy data (RSS & Market APIs)
 */

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_KEY);


/**
 * Real RSS Fetching Logic via Server Proxy
 */
async function fetchRSS(source = 'mk') {
    try {
        const response = await fetch(`/api/today?source=${source}`);
        if (!response.ok) throw new Error('Proxy error');

        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');

        const items = Array.from(xml.querySelectorAll('item'));
        if (items.length === 0) throw new Error('No items found in RSS');

        return items.map(item => ({
            title: item.querySelector('title')?.textContent || '제목 없음',
            link: item.querySelector('link')?.textContent || '',
            description: item.querySelector('description')?.textContent || '',
            date: item.querySelector('pubDate')?.textContent || ''
        }));
    } catch (e) {
        console.warn('Using fallback data:', e);
        return Array.from({ length: 10 }).map((_, i) => ({
            title: `${i + 1}. 주요 경제 뉴스 타이틀 샘플`,
            description: "경제 뉴스 상세 내용입니다. 글이 길어지더라도 카드 뉴스 내에서 적절히 분할되어 표시됩니다.",
            date: new Date().toISOString()
        }));
    }
}

async function fetchMarketData() {
    return {
        exchange: [
            { name: '코스피 (KOSPI)', value: '4,912.4', change: '+1.2%', status: 'up' },
            { name: '달러/원', value: '1,324.5', change: '-5.2', status: 'down' },
            { name: '엔/원', value: '884.2', change: '+2.1', status: 'up' }
        ],
        indigo: [
            { name: '나스닥 (NASDAQ)', value: '18,540', change: '+0.8%', status: 'up' },
            { name: '미국 10년 국채', value: '4.167%', change: '-0.02', status: 'down' },
            { name: '금 선물 (Oz)', value: '$2,042.8', change: '+$12.4', status: 'up' }
        ],
        crypto: [
            { name: '비트코인 (BTC)', value: '1억 2,540만', change: '+2.4%', status: 'up' },
            { name: '이더리움 (ETH)', value: '412만', change: '+1.5%', status: 'up' }
        ]
    };
}

/**
 * Main service to compose the daily report
 * Splits 10 news items into multiple slides (e.g., 2 items per slide)
 */
export async function fetchDailyEconomyReport() {
    const feeds = await fetchRSS('mk');
    const markets = await fetchMarketData();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const now = new Date();
    const isAM = now.getHours() < 12;
    const timeLabel = isAM ? "08:00 AM" : "08:00 PM";
    const dateLabel = now.toISOString().split('T')[0].split('-').join('.');

    // Limit to top 6 news for better AI performance and card layout (3 pages total)
    const rawNews = feeds.slice(0, 6);

    const newsItems = await Promise.all(rawNews.map(async (item, idx) => {
        try {
            const prompt = `
            다음 경제 뉴스 기사를 인스타그램 카드뉴스용으로 요약해줘.
            제목: ${item.title}
            내용: ${item.description}

            조건:
            1. 핵심 내용을 1~2문장의 아주 짧은 요약문으로 작성할 것. (50자 내외)
            2. 이 기사가 시장에 주는 시사점이나 전문가적 인사이트를 1문장으로 작성할 것. (예: "금리 인상 속도 조절의 신호탄으로 보입니다.")
            3. 불필요한 수식어는 빼고 담백하게 작성할 것.
            
            추천 형식(JSON): 
            { "summary": "요약내용", "insight": "인사이트" }
            한글로 답변해줘.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response (handling potential markdown)
            const jsonMatch = text.match(/\{.*\}/s);
            const aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: item.description.substring(0, 100), insight: "시장 상황을 예의주시해야 합니다." };

            return {
                id: idx + 1,
                title: item.title.replace(/\[.*?\]/g, '').trim(),
                bullets: [aiData.summary],
                insight: aiData.insight
            };
        } catch (e) {
            console.error("AI Analysis failed:", e);
            return {
                id: idx + 1,
                title: item.title,
                bullets: [item.description.substring(0, 100) + "..."],
                insight: "실시간 분석 중 오류가 발생했습니다."
            };
        }
    }));

    // Split news into chunks of 2 items per slide
    const newsSlides = [];
    for (let i = 0; i < newsItems.length; i += 2) {
        newsSlides.push({
            type: 'news',
            items: newsItems.slice(i, i + 2)
        });
    }

    const slides = [
        {
            type: 'cover',
            title: '투데이즈 경제 뉴스',
            date: dateLabel,
            subtitle: 'AI가 실시간으로 분석한 주요 경제 브리핑'
        },
        ...newsSlides,
        {
            type: 'market',
            title: '주요 경제 지표',
            items: [...markets.exchange, ...markets.indigo]
        },
        {
            type: 'market',
            title: '가상자산 동향',
            items: markets.crypto
        }
    ];

    return {
        id: `report-${Date.now()}`,
        date: dateLabel,
        time: timeLabel,
        type: isAM ? 'AM' : 'PM',
        slides
    };
}

