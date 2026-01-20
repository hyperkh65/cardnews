'use client';

import { useEditor } from '@/context/EditorContext';

export default function TextLibrary() {
    const { addElement } = useEditor();

    const textPresets = [
        {
            name: '제목 추가',
            style: {
                fontSize: 80,
                fontWeight: 800,
                textAlign: 'center',
            },
            content: '제목을 입력하세요',
        },
        {
            name: '부제목 추가',
            style: {
                fontSize: 40,
                fontWeight: 600,
                textAlign: 'center',
            },
            content: '부제목을 입력하세요',
        },
        {
            name: '본문 텍스트 추가',
            style: {
                fontSize: 24,
                fontWeight: 400,
                textAlign: 'center',
            },
            content: '여기에 본문 내용을 입력하세요.',
        },
    ];

    const handleAddText = (preset) => {
        addElement({
            type: 'text',
            content: preset.content,
            position: { x: 140, y: 600 },
            size: { width: 800, height: preset.style.fontSize * 1.5 },
            style: {
                ...preset.style,
                fontFamily: 'Pretendard',
                color: '#000000',
                lineHeight: 1.4,
            },
        });
    };

    return (
        <div className="flex flex-col gap-md">
            <h3 className="text-md font-bold text-primary">텍스트</h3>
            <div className="flex flex-col gap-sm">
                {textPresets.map((preset, index) => (
                    <button
                        key={index}
                        onClick={() => handleAddText(preset)}
                        className="btn btn-secondary w-full"
                        style={{
                            justifyContent: 'flex-start',
                            padding: '16px',
                            fontSize: index === 0 ? '18px' : index === 1 ? '16px' : '14px',
                            fontWeight: index === 0 ? '800' : index === 1 ? '600' : '400'
                        }}
                    >
                        {preset.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
