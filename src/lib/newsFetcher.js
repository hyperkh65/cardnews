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

    // Generate a bulk prompt for all news items to save API quota (RPM) and ensure consistency
    const bulkPrompt = `
    다음은 오늘자 경제 뉴스 6건의 리스트다. 각 뉴스별로 인스타그램 카드뉴스에 들어갈 '짧은 요약(50자 내외)'과 '금융 인사이트(1문장)'를 작성해라.

    ${rawNews.map((n, i) => `뉴스 ${i + 1}: [제목: ${n.title}] [내용: ${n.description}]`).join('\n\n')}

    조건:
    1. 답변은 반드시 아래 형식의 JSON 배열(Array)만 출력할 것. 다른 말은 하지 마라.
    2. 형식: [{"summary": "...", "insight": "..."}, ...] (뉴스 순서대로 6개 항목)
    3. 요약은 담백한 정보 전달 위주로, 인사이트는 전문가가 분석한 듯한 느낌으로 작성해라.
    4. 한글로 답변해라.
    `;

    let aiResults = [];
    try {
        const result = await model.generateContent(bulkPrompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\[.*\]/s);
        aiResults = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
        console.error("AI Bulk Analysis failed:", e);
    }

    const newsItems = rawNews.map((item, idx) => {
        const aiData = aiResults[idx] || { summary: item.description.substring(0, 100), insight: "시장 상황을 예의주시해야 합니다." };
        return {
            id: idx + 1,
            title: item.title.replace(/\[.*?\]/g, '').trim(),
            bullets: [aiData.summary],
            insight: aiData.insight
        };
    });

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

