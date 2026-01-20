'use client';

import { exportToPNG } from '@/lib/canvas/exporter';

export default function Header() {
    const handleExport = async () => {
        const canvasElement = document.getElementById('canvas-container');
        if (canvasElement) {
            try {
                await exportToPNG(canvasElement, 'card-news');
            } catch (error) {
                console.error('Export failed:', error);
                alert('내보내기 실패: ' + error.message);
            }
        } else {
            alert('캔버스를 찾을 수 없습니다.');
        }
    };

    return (
        <header
            className="border-b flex items-center justify-between px-lg glass"
            style={{ height: 'var(--header-height)', zIndex: 200 }}
        >
            <div className="flex items-center gap-md">
                <div
                    style={{
                        width: '32px',
                        height: '32px',
                        background: 'var(--gradient-premium)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '18px'
                    }}
                >
                    I
                </div>
                <h1 className="text-md font-bold tracking-tight">
                    Insta<span style={{ color: 'var(--accent-primary)' }}>Flow</span>
                </h1>
            </div>

            <div className="flex gap-md items-center">
                <span className="text-xs text-secondary font-medium px-sm py-xs border rounded-full">
                    Free Version
                </span>
                <button
                    onClick={handleExport}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', fontSize: '14px' }}
                >
                    📥 내보내기
                </button>
            </div>
        </header>
    );
}
