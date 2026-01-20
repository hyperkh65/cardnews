// Google Fonts 목록 (한글 지원 우선)

export const googleFonts = [
    // 한글 지원 폰트
    {
        name: 'Pretendard',
        value: 'Pretendard',
        url: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css',
        korean: true,
    },
    {
        name: 'Noto Sans KR',
        value: "'Noto Sans KR'",
        url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap',
        korean: true,
    },
    {
        name: 'Noto Serif KR',
        value: "'Noto Serif KR'",
        url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;700;900&display=swap',
        korean: true,
    },
    {
        name: 'Black Han Sans',
        value: "'Black Han Sans'",
        url: 'https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap',
        korean: true,
    },
    {
        name: 'Jua',
        value: "'Jua'",
        url: 'https://fonts.googleapis.com/css2?family=Jua&display=swap',
        korean: true,
    },
    {
        name: 'Sunflower',
        value: "'Sunflower'",
        url: 'https://fonts.googleapis.com/css2?family=Sunflower:wght@300;500;700&display=swap',
        korean: true,
    },
    {
        name: 'Do Hyeon',
        value: "'Do Hyeon'",
        url: 'https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap',
        korean: true,
    },
    {
        name: 'Gamja Flower',
        value: "'Gamja Flower'",
        url: 'https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap',
        korean: true,
    },
    {
        name: 'Stylish',
        value: "'Stylish'",
        url: 'https://fonts.googleapis.com/css2?family=Stylish&display=swap',
        korean: true,
    },
    {
        name: 'Poor Story',
        value: "'Poor Story'",
        url: 'https://fonts.googleapis.com/css2?family=Poor+Story&display=swap',
        korean: true,
    },

    // 영문 폰트
    {
        name: 'Montserrat',
        value: "'Montserrat'",
        url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;700;900&display=swap',
        korean: false,
    },
    {
        name: 'Roboto',
        value: "'Roboto'",
        url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap',
        korean: false,
    },
    {
        name: 'Playfair Display',
        value: "'Playfair Display'",
        url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700;900&display=swap',
        korean: false,
    },
    {
        name: 'Poppins',
        value: "'Poppins'",
        url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;700;900&display=swap',
        korean: false,
    },
    {
        name: 'Inter',
        value: "'Inter'",
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;900&display=swap',
        korean: false,
    },
];

// 폰트를 동적으로 로드
export function loadFont(fontUrl) {
    // 이미 로드된 폰트인지 확인
    const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
    if (existingLink) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontUrl;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load font: ${fontUrl}`));
        document.head.appendChild(link);
    });
}
