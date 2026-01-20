'use client';

import { useEditor } from '@/context/EditorContext';
import { googleFonts, loadFont } from '@/lib/fonts';
import {
    Trash2,
    Layers,
    ArrowUp,
    ArrowDown,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type,
    Maximize,
    RotateCw,
    Palette,
    Sun
} from 'lucide-react';
import { ImageStyleEditor, EmojiStyleEditor, ShapeStyleEditor } from '@/components/editor/StyleEditors';

export default function PropertyPanel() {
    const {
        selectedElementId,
        currentPage,
        updateElement,
        updateBackground,
        deleteElement,
        bringToFront,
        sendToBack,
        bringForward,
        sendBackward
    } = useEditor();

    const selectedElement = currentPage.elements.find((el) => el.id === selectedElementId);

    const handleDelete = () => {
        if (confirm('이 요소를 삭제하시겠습니까?')) {
            deleteElement(selectedElementId);
        }
    };

    return (
        <aside className="tool-drawer" style={{ width: 'var(--property-panel-width)', right: 0, position: 'absolute', height: '100%', zIndex: 90, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border-primary)' }}>
            <div className="flex items-center justify-between mb-lg sticky top-0 bg-panel z-10 py-sm border-b border-border-primary">
                <h2 className="text-md font-bold text-primary flex items-center gap-sm">
                    {selectedElement ? (
                        <>
                            {selectedElement.type === 'text' && <Type size={18} />}
                            {selectedElement.type === 'image' && <Maximize size={18} />}
                            {selectedElement.type === 'emoji' && <span style={{ fontSize: 18 }}>😊</span>}
                            <span>속성 편집</span>
                        </>
                    ) : (
                        <>
                            <Palette size={18} />
                            <span>페이지 설정</span>
                        </>
                    )}
                </h2>
                {selectedElementId && (
                    <button
                        onClick={handleDelete}
                        className="btn btn-icon hover:bg-red-500/20 hover:text-red-500"
                        title="삭제"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-lg pb-xl">
                {!selectedElementId ? (
                    <BackgroundEditor
                        background={currentPage.background}
                        onUpdate={updateBackground}
                    />
                ) : (
                    <>
                        {/* 공통: 배치 및 레이어 */}
                        <div className="flex flex-col gap-sm">
                            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-xs flex items-center gap-xs">
                                <Layers size={14} /> 레이어 & 배치
                            </h3>
                            <div className="grid grid-cols-4 gap-xs">
                                <button onClick={() => bringToFront(selectedElementId)} className="btn btn-secondary p-xs" title="맨 앞으로">
                                    <ArrowUp size={14} strokeWidth={3} />
                                </button>
                                <button onClick={() => bringForward(selectedElementId)} className="btn btn-secondary p-xs" title="앞으로">
                                    <ArrowUp size={14} />
                                </button>
                                <button onClick={() => sendBackward(selectedElementId)} className="btn btn-secondary p-xs" title="뒤로">
                                    <ArrowDown size={14} />
                                </button>
                                <button onClick={() => sendToBack(selectedElementId)} className="btn btn-secondary p-xs" title="맨 뒤로">
                                    <ArrowDown size={14} strokeWidth={3} />
                                </button>
                            </div>

                            {/* 불투명도 슬라이더 (공통) */}
                            <div className="flex flex-col gap-xs mt-sm">
                                <div className="flex justify-between">
                                    <label className="text-xs text-secondary">불투명도</label>
                                    <span className="text-xs text-secondary">{Math.round((selectedElement.style.opacity || 1) * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={selectedElement.style.opacity || 1}
                                    onChange={(e) => updateElement(selectedElementId, { style: { opacity: parseFloat(e.target.value) } })}
                                    className="w-full accent-accent-primary h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-border-primary my-xs" />

                        {selectedElement.type === 'text' && (
                            <TextStyleEditor element={selectedElement} onUpdate={updateElement} />
                        )}
                        {/* 이미지/이모지/도형 편집기는 기존 스타일(또는 여기 병합) 유지하며 업그레이드 필요. 일단 인라인 구현 */}
                        {selectedElement.type !== 'text' && (
                            <CommonStyleEditor element={selectedElement} onUpdate={updateElement} />
                        )}
                    </>
                )}
            </div>
        </aside>
    );
}

// 텍스트 전용 에디터
function TextStyleEditor({ element, onUpdate }) {
    const handleStyleChange = (key, value) => {
        onUpdate(element.id, {
            style: { [key]: value },
        });
    };

    return (
        <div className="flex flex-col gap-lg">
            {/* 내용 수정 */}
            <div>
                <label className="text-xs text-secondary mb-xs block">텍스트 내용</label>
                <textarea
                    value={element.content}
                    onChange={(e) => onUpdate(element.id, { content: e.target.value })}
                    rows={3}
                    className="w-full bg-bg-tertiary border border-border-primary rounded-md p-sm text-sm focus:border-accent-primary text-white"
                />
            </div>

            {/* 폰트 설정 */}
            <div className="flex flex-col gap-sm">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">타이포그래피</h3>

                <select
                    value={element.style.fontFamily}
                    onChange={(e) => {
                        const fontName = e.target.value;
                        const font = googleFonts.find(f => f.name === fontName);
                        if (font) loadFont(font);
                        handleStyleChange('fontFamily', fontName);
                    }}
                    className="w-full bg-bg-tertiary border border-border-primary rounded-md p-xs text-sm"
                >
                    {googleFonts.map((font) => (
                        <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                            {font.name}
                        </option>
                    ))}
                </select>

                <div className="grid grid-cols-2 gap-sm">
                    <div>
                        <label className="text-xs text-secondary mb-xs block">크기 (px)</label>
                        <input
                            type="number"
                            value={element.style.fontSize}
                            onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                            className="w-full bg-bg-tertiary border border-border-primary rounded-md p-xs text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-secondary mb-xs block">굵기</label>
                        <select
                            value={element.style.fontWeight}
                            onChange={(e) => handleStyleChange('fontWeight', parseInt(e.target.value))}
                            className="w-full bg-bg-tertiary border border-border-primary rounded-md p-xs text-sm"
                        >
                            <option value={100}>Thin (100)</option>
                            <option value={300}>Light (300)</option>
                            <option value={400}>Regular (400)</option>
                            <option value={500}>Medium (500)</option>
                            <option value={600}>SemiBold (600)</option>
                            <option value={700}>Bold (700)</option>
                            <option value={800}>ExtraBold (800)</option>
                            <option value={900}>Black (900)</option>
                        </select>
                    </div>
                </div>

                {/* 정렬 */}
                <div>
                    <label className="text-xs text-secondary mb-xs block">정렬</label>
                    <div className="flex bg-bg-tertiary rounded-md p-1 border border-border-primary">
                        {['left', 'center', 'right'].map((align) => (
                            <button
                                key={align}
                                onClick={() => handleStyleChange('textAlign', align)}
                                className={`flex-1 p-xs rounded flex justify-center ${element.style.textAlign === align ? 'bg-bg-hover text-accent-primary' : 'text-text-secondary hover:text-white'}`}
                            >
                                {align === 'left' && <AlignLeft size={16} />}
                                {align === 'center' && <AlignCenter size={16} />}
                                {align === 'right' && <AlignRight size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 컬러 */}
                <div>
                    <label className="text-xs text-secondary mb-xs block">글자 색상</label>
                    <div className="flex gap-sm">
                        <input
                            type="color"
                            value={element.style.color}
                            onChange={(e) => handleStyleChange('color', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-none p-0 overflow-hidden"
                        />
                        <input
                            type="text"
                            value={element.style.color}
                            onChange={(e) => handleStyleChange('color', e.target.value)}
                            className="flex-1 bg-bg-tertiary border border-border-primary rounded-md px-sm text-sm"
                        />
                    </div>
                </div>

                {/* 고급 텍스트 옵션: 자간, 행간 */}
                <div className="grid grid-cols-2 gap-sm pt-sm border-t border-border-primary">
                    <div>
                        <label className="text-xs text-secondary mb-xs block">자간 (Letter)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={element.style.letterSpacing || 0}
                            onChange={(e) => handleStyleChange('letterSpacing', parseFloat(e.target.value))}
                            className="w-full bg-bg-tertiary border border-border-primary rounded-md p-xs text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-secondary mb-xs block">행간 (Line)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={element.style.lineHeight || 1.4}
                            onChange={(e) => handleStyleChange('lineHeight', parseFloat(e.target.value))}
                            className="w-full bg-bg-tertiary border border-border-primary rounded-md p-xs text-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// 이미지/도형 등 공통 에디터
function CommonStyleEditor({ element, onUpdate }) {
    const handleStyleChange = (key, value) => {
        onUpdate(element.id, {
            style: { [key]: value },
        });
    };

    return (
        <div className="flex flex-col gap-lg">
            {/* 둥근 모서리 */}
            <div>
                <div className="flex justify-between mb-xs">
                    <label className="text-xs text-secondary">둥근 모서리 (Radius)</label>
                    <span className="text-xs text-secondary">{element.style.borderRadius || 0}px</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={element.style.borderRadius || 0}
                    onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value))}
                    className="w-full accent-accent-primary h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            {/* 테두리 (간이) - 추후 Border Width/Color 분리 가능 */}
            {/* 그림자 (간이) */}
            <div className="flex items-center gap-sm">
                <input
                    type="checkbox"
                    id="shadow-check"
                    checked={!!element.style.boxShadow && element.style.boxShadow !== 'none'}
                    onChange={(e) => handleStyleChange('boxShadow', e.target.checked ? '0 4px 10px rgba(0,0,0,0.3)' : 'none')}
                    className="w-4 h-4 accent-accent-primary"
                />
                <label htmlFor="shadow-check" className="text-sm cursor-pointer select-none">그림자 효과 적용</label>
            </div>
        </div>
    )
}

function BackgroundEditor({ background, onUpdate }) {
    const { currentPage, updateCanvasSize } = useEditor();

    const handleColorChange = (e) => {
        onUpdate({
            type: 'color',
            value: e.target.value,
        });
    };

    const sizePresets = [
        { name: 'Instagram Square', width: 1080, height: 1080, icon: '🔲' },
        { name: 'Instagram Portrait', width: 1080, height: 1350, icon: '📱' },
        { name: 'Instagram Story', width: 1080, height: 1920, icon: '🤳' },
    ];

    return (
        <div className="flex flex-col gap-lg">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-lg rounded-xl text-white mb-md shadow-lg">
                <h3 className="text-lg font-bold mb-xs">디자인 설정</h3>
                <p className="text-xs opacity-80">캔버스 크기와 배경을 설정하세요.</p>
            </div>

            <div className="flex flex-col gap-sm">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-xs flex items-center gap-xs">
                    <Palette size={14} /> 배경 색상
                </h3>
                <div className="flex gap-sm">
                    <input
                        type="color"
                        value={background.type === 'color' ? background.value : '#ffffff'}
                        onChange={handleColorChange}
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border-primary p-0 overflow-hidden shadow-sm hover:scale-105 transition-transform"
                    />
                    <div className="flex flex-col justify-center gap-xs flex-1">
                        <label className="text-xs text-secondary">HEX Code</label>
                        <input
                            type="text"
                            value={background.value}
                            onChange={handleColorChange}
                            className="w-full bg-bg-tertiary border border-border-primary rounded px-sm py-xs text-sm font-mono uppercase"
                        />
                    </div>
                </div>
            </div>

            <div className="h-px bg-border-primary my-xs" />

            <div className="flex flex-col gap-sm">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-xs flex items-center gap-xs">
                    <Maximize size={14} /> 캔버스 크기
                </h3>
                <div className="grid gap-sm">
                    {sizePresets.map((preset, index) => (
                        <button
                            key={index}
                            onClick={() => updateCanvasSize({ width: preset.width, height: preset.height })}
                            className={`btn w-full text-left flex items-center justify-between transition-all ${currentPage.size.width === preset.width && currentPage.size.height === preset.height
                                    ? 'bg-accent-primary/20 border-accent-primary text-white'
                                    : 'bg-bg-tertiary border-border-primary hover:bg-bg-hover'
                                }`}
                            style={{ padding: '12px', border: currentPage.size.width === preset.width && currentPage.size.height === preset.height ? '1px solid var(--accent-primary)' : '1px solid var(--border-primary)' }}
                        >
                            <div className="flex items-center gap-sm">
                                <span className="text-lg">{preset.icon}</span>
                                <span className="text-sm font-medium">{preset.name}</span>
                            </div>
                            <span className="text-xs text-secondary font-mono bg-black/20 px-xs py-0.5 rounded">{preset.width}x{preset.height}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

