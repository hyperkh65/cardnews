import html2canvas from 'html2canvas';

/**
 * 캔버스를 PNG 이미지로 내보내기
 * @param {HTMLElement} canvasElement - 캔버스 DOM 요소
 * @param {string} filename - 저장할 파일명
 */
export async function exportToPNG(canvasElement, filename = 'card-news.png') {
    try {
        const canvas = await html2canvas(canvasElement, {
            backgroundColor: null,
            scale: 2, // 고해상도
            width: 1080,
            height: 1080,
            logging: false,
        });

        // Canvas를 Blob으로 변환
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    } catch (error) {
        console.error('이미지 내보내기 실패:', error);
        throw error;
    }
}

/**
 * 여러 페이지를 ZIP으로 내보내기 (향후 구현)
 */
export async function exportToZIP(pages, filename = 'card-news.zip') {
    // Phase 2에서 구현
    console.log('ZIP 내보내기는 향후 버전에서 지원됩니다.');
}
