'use client';

import { useEditor } from '@/context/EditorContext';
import { shapes } from '@/lib/shapes';

export default function ShapeLibrary() {
    const { addElement } = useEditor();

    const handleShapeClick = (shapeId) => {
        addElement({
            type: 'shape',
            shapeType: shapeId,
            position: { x: 480, y: 600 }, // 인스타그램 비율 중심
            size: { width: 120, height: 120 }, // 작은 크기로 조정
            style: {
                fill: '#6366f1',
                stroke: '#4f46e5',
                strokeWidth: 2,
                opacity: 1,
            },
        });
    };

    return (
        <div className="flex flex-col gap-md">
            <h3 className="text-sm font-bold">도형</h3>

            <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {shapes.map((shape) => (
                    <button
                        key={shape.id}
                        onClick={() => handleShapeClick(shape.id)}
                        className="card hover-lift"
                        style={{
                            padding: 'var(--spacing-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                        }}
                    >
                        <div style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <shape.component
                                size={50}
                                width={50}
                                height={50}
                                fill="#6366f1"
                                stroke="#4f46e5"
                                strokeWidth={2}
                            />
                        </div>
                        <span className="text-xs">{shape.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
