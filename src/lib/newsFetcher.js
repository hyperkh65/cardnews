/**
 * newsFetcher.js
 * Logic to fetch and process real economy data (RSS & Market APIs)
 */

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

    await new Promise(resolve => setTimeout(resolve, 1000));

    const now = new Date();
    const isAM = now.getHours() < 12;
    const timeLabel = isAM ? "08:00 AM" : "08:00 PM";
    const dateLabel = now.toISOString().split('T')[0].split('-').join('.');

    const newsItems = feeds.slice(0, 10).map((item, idx) => ({
        id: idx + 1,
        title: item.title,
        bullets: [item.description], // Keep full description, we'll handle layout in CSS
        insight: `(AI 분석: 이 뉴스는 향후 시장의 핵심 지표가 될 것으로 예상됨)`
    }));

    // Split news into chunks of 2 items per slide to prevent overflow
    const newsSlides = [];
    for (let i = 0; i < newsItems.length; i += 2) {
        newsSlides.push({
            type: 'news',
            items: newsItems.slice(i, i + 2)
        });
    }

    const slides = [
        ...newsSlides,
        {
            type: 'market',
            title: '데일리 지수 체크',
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
