
// 이미지 속성 편집기
function ImageStyleEditor({ element, onUpdate }) {
    const handleSizeChange = (key, value) => {
        onUpdate(element.id, {
            size: {
                ...element.size,
                [key]: parseInt(value),
            },
        });
    };

    const handleStyleChange = (key, value) => {
        onUpdate(element.id, {
            style: {
                ...element.style,
                [key]: value,
            },
        });
    };

    return (
        <div className="flex flex-col gap-lg">
            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">너비</label>
                <input
                    type="number"
                    value={element.size.width}
                    onChange={(e) => handleSizeChange('width', e.target.value)}
                    min="50"
                    max="1080"
                />
            </div>

            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">높이</label>
                <input
                    type="number"
                    value={element.size.height}
                    onChange={(e) => handleSizeChange('height', e.target.value)}
                    min="50"
                    max="1080"
                />
            </div>

            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">투명도</label>
                <input
                    type="range"
                    value={element.style.opacity}
                    onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
                    min="0"
                    max="1"
                    step="0.1"
                />
                <span className="text-xs text-tertiary">{Math.round(element.style.opacity * 100)}%</span>
            </div>

            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">모서리 둥글기</label>
                <input
                    type="range"
                    value={element.style.borderRadius}
                    onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value))}
                    min="0"
                    max="50"
                />
                <span className="text-xs text-tertiary">{element.style.borderRadius}px</span>
            </div>
        </div>
    );
}

// 이모지 속성 편집기
function EmojiStyleEditor({ element, onUpdate }) {
    const handleSizeChange = (value) => {
        const size = parseInt(value);
        onUpdate(element.id, {
            size: { width: size, height: size },
        });
    };

    return (
        <div className="flex flex-col gap-lg">
            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">이모지</label>
                <div
                    style={{
                        fontSize: '48px',
                        textAlign: 'center',
                        padding: 'var(--spacing-md)',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                    }}
                >
                    {element.content}
                </div>
            </div>

            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">크기</label>
                <input
                    type="range"
                    value={element.size.width}
                    onChange={(e) => handleSizeChange(e.target.value)}
                    min="50"
                    max="300"
                />
                <span className="text-xs text-tertiary">{element.size.width}px</span>
            </div>
        </div>
    );
}

// 도형 속성 편집기
function ShapeStyleEditor({ element, onUpdate }) {
    const handleSizeChange = (key, value) => {
        onUpdate(element.id, {
            size: {
                ...element.size,
                [key]: parseInt(value),
            },
        });
    };

    const handleStyleChange = (key, value) => {
        onUpdate(element.id, {
            style: {
                ...element.style,
                [key]: value,
            },
        });
    };

    return (
        <div className="flex flex-col gap-lg">
            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">도형 타입</label>
                <div style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-sm)' }}>
                    {element.shapeType === 'rectangle' && '사각형'}
                    {element.shapeType === 'circle' && '원'}
                    {element.shapeType === 'star' && '별'}
                    {element.shapeType === 'triangle' && '삼각형'}
                    {element.shapeType === 'heart' && '하트'}
                    {element.shapeType === 'arrow' && '화살표'}
                </div>
            </div>

            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">너비</label>
                <input
                    type="number"
                    value={element.size.width}
                    onChange={(e) => handleSizeChange('width', e.target.value)}
                    min="50"
                    max="500"
                />
            </div>

            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">높이</label>
                <input
                    type="number"
                    value={element.size.height}
                    onChange={(e) => handleSizeChange('height', e.target.value)}
                    min="50"
                    max="500"
                />
            </div>

            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">채우기 색상</label>
                <input
                    type="color"
                    value={element.style.fill}
                    onChange={(e) => handleStyleChange('fill', e.target.value)}
                    style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
            </div>

            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">테두리 색상</label>
                <input
                    type="color"
                    value={element.style.stroke}
                    onChange={(e) => handleStyleChange('stroke', e.target.value)}
                    style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
            </div>

            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">테두리 두께</label>
                <input
                    type="range"
                    value={element.style.strokeWidth}
                    onChange={(e) => handleStyleChange('strokeWidth', parseInt(e.target.value))}
                    min="0"
                    max="10"
                />
                <span className="text-xs text-tertiary">{element.style.strokeWidth}px</span>
            </div>

            <div className="flex flex-col gap-sm">
                <label className="text-xs text-secondary">투명도</label>
                <input
                    type="range"
                    value={element.style.opacity}
                    onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
                    min="0"
                    max="1"
                    step="0.1"
                />
                <span className="text-xs text-tertiary">{Math.round(element.style.opacity * 100)}%</span>
            </div>
        </div>
    );
}

export { ImageStyleEditor, EmojiStyleEditor, ShapeStyleEditor };
