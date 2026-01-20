/**
 * newsFetcher.js
 * Frontend interface to fetch the Daily Economy Report.
 * Now calls a secure server-side API (/api/ai-report) for AI analysis.
 */

export async function fetchDailyEconomyReport(isRefresh = false) {
    try {
        const geminiKey = localStorage.getItem('2days_gemini_key') || "";
        const openaiKey = localStorage.getItem('2days_openai_key') || "";

        // 1. Fetch AI Summarized News & Real-time Market Data from Server
        const response = await fetch(`/api/ai-report${isRefresh ? '?refresh=true' : ''}`, {
            headers: {
                'x-gemini-key': geminiKey,
                'x-openai-key': openaiKey
            }
        });
        if (!response.ok) throw new Error('Server AI Error');
        const aiData = await response.json();

        const now = new Date();
        const isAM = now.getHours() < 12;

        // Match backend slides and ensure cover is there
        let slides = aiData.slides || [];
        if (!slides.some(s => s.type === 'cover')) {
            slides = [
                {
                    type: 'cover',
                    title: '투데이즈 경제 뉴스',
                    date: aiData.date,
                    subtitle: 'AI가 실시간으로 분석한 주요 경제 브리핑'
                },
                ...slides
            ];
        }

        return {
            id: aiData.id || `report-${Date.now()}`,
            date: aiData.date,
            time: aiData.time || (isAM ? "08:00 AM" : "08:00 PM"),
            type: isAM ? 'AM' : 'PM',
            slides: aiData.slides,
            isAIFilled: aiData.isAIFilled
        };
    } catch (error) {
        console.error("Failed to fetch economy report:", error);
        throw error;
    }
}
