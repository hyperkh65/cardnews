// Helper to create random Pastel Colors
const getRandomColor = () => {
    const letters = '89ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

// 1. Simple Typo Templates
const createTypoTemplates = (startId, count) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `tmpl_typo_${startId + i}`,
        name: `심플 타이포 ${i + 1}`,
        category: '심플',
        thumbnailBg: i % 2 === 0 ? '#ffffff' : '#111111',
        background: { type: 'color', value: i % 2 === 0 ? '#ffffff' : '#111111', bgImage: null, overlayImage: null },
        elements: [
            {
                id: 't1', type: 'text', content: '심플한\n제목 디자인',
                x: 40, y: 150, fontSize: 48, fontWeight: '800',
                color: i % 2 === 0 ? '#111111' : '#ffffff',
                align: 'left', width: 300, opacity: 1
            },
            {
                id: 't2', type: 'text', content: '여기에 부제를 입력하세요\n깔끔한 스타일입니다.',
                x: 40, y: 300, fontSize: 18, fontWeight: '400',
                color: i % 2 === 0 ? '#666666' : '#aaaaaa',
                align: 'left', width: 300, opacity: 1
            },
            {
                id: 's1', type: 'shape', shapeType: 'rect',
                x: 40, y: 120, width: 40, height: 4,
                color: '#3b82f6', opacity: 1
            }
        ]
    }));
};

// 2. Shape Deco Templates
const createShapeTemplates = (startId, count) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `tmpl_shape_${startId + i}`,
        name: `도형 스타일 ${i + 1}`,
        category: '도형',
        thumbnailBg: '#f3f4f6',
        background: { type: 'color', value: '#f3f4f6', bgImage: null, overlayImage: null },
        elements: [
            // Decorative Shapes
            { id: 'bg_c1', type: 'shape', shapeType: 'circle', x: 300, y: -50, width: 200, height: 200, color: getRandomColor(), opacity: 0.2 },
            { id: 'bg_t1', type: 'shape', shapeType: 'triangle', x: -50, y: 400, width: 150, height: 150, color: getRandomColor(), opacity: 0.2 },
            // Text
            { id: 't1', type: 'text', content: '도형과 함께하는\n디자인', x: 50, y: 200, fontSize: 40, fontWeight: '800', color: '#1f2937', align: 'center', width: 380, opacity: 1 }
        ]
    }));
};

// 3. Neon/Dark Templates
const createNeonTemplates = (startId, count) => {
    return Array.from({ length: count }).map((_, i) => {
        const neonColor = ['#3b82f6', '#2563eb', '#06b6d4', '#22c55e'][i % 4];
        return {
            id: `tmpl_neon_${startId + i}`,
            name: `네온 다크 ${i + 1}`,
            category: '네온',
            thumbnailBg: '#0f172a',
            background: { type: 'color', value: '#0f172a', bgImage: null, overlayImage: null },
            elements: [
                { id: 's1', type: 'shape', shapeType: 'rect', x: 20, y: 20, width: 440, height: 560, color: 'transparent', opacity: 1, border: `2px solid ${neonColor}` }, // Border mockup using shape
                { id: 't1', type: 'text', content: 'NEON\nNIGHT', x: 40, y: 200, fontSize: 64, fontWeight: '900', color: neonColor, align: 'center', width: 400, opacity: 1 },
                { id: 't2', type: 'text', content: '강렬한 인상을 주는 디자인', x: 60, y: 380, fontSize: 20, fontWeight: '500', color: '#ffffff', align: 'center', width: 360, opacity: 0.8 }
            ]
        };
    });
};

// 4. Quote Templates (명언)
const createQuoteTemplates = (startId, count) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `tmpl_quote_${startId + i}`,
        name: `감성 명언 ${i + 1}`,
        category: '감성',
        thumbnailBg: '#fff7ed',
        background: { type: 'color', value: '#fff7ed', bgImage: null, overlayImage: null },
        elements: [
            { id: 'q1', type: 'text', content: '“', x: 200, y: 100, fontSize: 60, fontWeight: 'bold', color: '#fdba74', align: 'center', width: 80, opacity: 1 },
            { id: 't1', type: 'text', content: '시작이 반이다\n늦었다고 생각할 때가\n가장 빠르다', x: 40, y: 200, fontSize: 24, fontWeight: '600', color: '#431407', align: 'center', width: 400, opacity: 1 },
            { id: 'q2', type: 'text', content: '”', x: 200, y: 350, fontSize: 60, fontWeight: 'bold', color: '#fdba74', align: 'center', width: 80, opacity: 1 },
        ]
    }));
};

// Combine all
export const TEMPLATES = [
    ...createTypoTemplates(1, 15),
    ...createShapeTemplates(16, 15),
    ...createNeonTemplates(31, 10),
    ...createQuoteTemplates(41, 10)
];

export const TEMPLATE_CATEGORIES = ['전체', '심플', '도형', '네온', '감성'];
