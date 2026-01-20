/**
 * newsFetcher.js
 * Frontend interface to fetch the Daily Economy Report.
 * Now calls a secure server-side API (/api/ai-report) for AI analysis.
 */

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

export async function fetchDailyEconomyReport(isRefresh = false) {
    try {
        // 1. Fetch AI Summarized News from our Server (with optional cache bypass)
        const response = await fetch(`/api/ai-report${isRefresh ? '?refresh=true' : ''}`);
        if (!response.ok) throw new Error('Server AI Error');
        const aiData = await response.json();

        // 2. Fetch Market Data (Client-side is fine for mock/fixed data)
        const markets = await fetchMarketData();

        const now = new Date();
        const isAM = now.getHours() < 12;

        const slides = [
            {
                type: 'cover',
                title: '투데이즈 경제 뉴스',
                date: aiData.date,
                subtitle: 'AI가 실시간으로 분석한 주요 경제 브리핑'
            },
            ...aiData.slides,
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
            date: aiData.date,
            time: isAM ? "08:00 AM" : "08:00 PM",
            type: isAM ? 'AM' : 'PM',
            slides
        };
    } catch (error) {
        console.error("Failed to fetch economy report:", error);
        // Fallback or re-throw
        throw error;
    }
}
