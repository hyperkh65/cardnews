'use client';

import { useState } from 'react';
import { templates } from '@/lib/templates';
import { useEditor } from '@/context/EditorContext';
import ImageUpload from '@/components/assets/ImageUpload';
import EmojiPicker from '@/components/assets/EmojiPicker';
import ShapeLibrary from '@/components/assets/ShapeLibrary';
import TextLibrary from '@/components/assets/TextLibrary';
import {
    LayoutTemplate,
    Type,
    Image as ImageIcon,
    Sparkles,
    Settings,
    ChevronRight,
    Search
} from 'lucide-react';

// 대비되는 색상 계산 (텍스트/아이콘용)
function getContrastColor(hexColor) {
    if (!hexColor || typeof hexColor !== 'string') return '#000000';
    if (!hexColor.startsWith('#')) return '#000000';
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
}

export default function Sidebar() {
    const { loadTemplate } = useEditor();
    const [activeMenu, setActiveMenu] = useState('templates');

    const menuItems = [
        { id: 'templates', label: '디자인', icon: LayoutTemplate },
        { id: 'text', label: '텍스트', icon: Type },
        { id: 'assets', label: '요소', icon: ImageIcon },
        { id: 'ai', label: 'AI 도구', icon: Sparkles },
    ];

    return (
        <div className="flex bg-bg-primary select-none h-full z-20 shadow-xl border-r border-border-primary shrink-0">
            {/* Tool Rail (아이콘 메뉴) - 72px 고정 */}
            <nav className="w-[72px] flex flex-col items-center py-md gap-lg bg-bg-panel z-30 h-full border-r border-border-primary">
                <div className="flex flex-col w-full gap-sm px-xs">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeMenu === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveMenu(item.id)}
                                className={`group flex flex-col items-center justify-center w-full aspect-square rounded-xl transition-all duration-200 relative ${isActive
                                        ? 'bg-gradient-to-br from-accent-primary to-accent-secondary text-white shadow-lg scale-100'
                                        : 'text-text-secondary hover:bg-bg-hover hover:text-white'
                                    }`}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium mt-1">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Tool Drawer (상세 패널) - 340px 고정 */}
            <aside className="w-[340px] bg-bg-secondary flex flex-col h-full border-r border-border-primary">
                {/* Drawer Header */}
                <div className="p-lg border-b border-border-primary bg-bg-secondary sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-sm mb-xs">
                        {menuItems.find(m => m.id === activeMenu)?.label}
                    </h2>
                    {activeMenu === 'templates' && (
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                            <input
                                type="text"
                                placeholder="템플릿 검색..."
                                className="w-full bg-bg-tertiary border border-border-primary rounded-lg pl-8 pr-3 py-2 text-xs focus:border-accent-primary transition-colors text-white"
                            />
                        </div>
                    )}
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-lg custom-scrollbar">
                    {activeMenu === 'templates' && (
                        <div className="flex flex-col gap-lg animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="grid grid-cols-2 gap-md">
                                {templates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => loadTemplate(template.pageData)}
                                        className="group relative w-full aspect-[4/5] rounded-lg overflow-hidden border border-border-primary hover:border-accent-primary transition-all hover:shadow-premium bg-white flex flex-col"
                                        title={template.name}
                                    >
                                        {/* 썸네일: 디자인을 추상화하여 보여줌 (Abstract Preview) - 안전한 방식 */}
                                        <div
                                            className="flex-1 w-full relative p-3 flex flex-col gap-2"
                                            style={{ background: template.pageData.background.value }}
                                        >
                                            {/* 요소들을 추상화해서 보여줌 */}
                                            {(() => {
                                                const bgColor = template.pageData.background.value || '#ffffff';
                                                const isDark = bgColor.startsWith('#') && parseInt(bgColor.replace('#', ''), 16) < 0xffffff / 2;
                                                const overlayColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)';

                                                return (
                                                    <>
                                                        {/* 제목 줄 */}
                                                        <div className="w-3/4 h-2 rounded-sm" style={{ background: overlayColor }} />
                                                        {/* 부제목 줄 */}
                                                        <div className="w-1/2 h-1.5 rounded-sm" style={{ background: overlayColor }} />

                                                        {/* 본문 줄들 (약간 아래쪽에) */}
                                                        <div className="mt-auto flex flex-col gap-1">
                                                            <div className="w-full h-1 rounded-sm" style={{ background: overlayColor }} />
                                                            <div className="w-5/6 h-1 rounded-sm" style={{ background: overlayColor }} />
                                                        </div>

                                                        {/* 포인트 도형이나 이미지 있으면 원형으로 표시 */}
                                                        {template.pageData.elements.some(el => el.type === 'shape' || el.type === 'image') && (
                                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-md opacity-50 backdrop-blur-sm"
                                                                style={{ background: overlayColor, border: `1px solid ${overlayColor}` }}
                                                            />
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {/* 하단 정보 */}
                                        <div className="h-8 shrink-0 bg-bg-panel border-t border-border-primary flex items-center justify-between px-2 w-full">
                                            <span className="text-[10px] font-bold text-text-secondary truncate max-w-[70px]">{template.name}</span>
                                            <span className="text-[8px] text-text-tertiary bg-bg-tertiary px-1 rounded opacity-70">
                                                {template.category.split('/')[0]}
                                            </span>
                                        </div>

                                        {/* 호버 시 오버레이 */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <span className="text-white text-xs font-bold border border-white px-2 py-1 rounded-md">적용</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeMenu === 'text' && (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <TextLibrary />
                        </div>
                    )}

                    {activeMenu === 'assets' && (
                        <div className="flex flex-col gap-xl animate-in fade-in slide-in-from-left-4 duration-300">
                            <Section title="이미지 업로드">
                                <ImageUpload />
                            </Section>
                            <div className="h-px bg-border-primary" />
                            <Section title="이모티콘">
                                <EmojiPicker />
                            </Section>
                            <div className="h-px bg-border-primary" />
                            <Section title="도형">
                                <ShapeLibrary />
                            </Section>
                        </div>
                    )}

                    {activeMenu === 'ai' && (
                        <div className="flex flex-col h-full items-center justify-center text-center gap-lg animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-gradient-to-tr from-accent-primary to-accent-secondary rounded-full blur-2xl opacity-20 absolute" />
                            <Sparkles size={64} className="text-accent-primary mb-md relative z-10" />
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-sm">
                                    AI Magic Maker
                                </h3>
                                <p className="text-sm text-text-secondary leading-relaxed max-w-[240px] mx-auto">
                                    키워드만 입력하면<br />
                                    AI가 멋진 카드뉴스를 자동으로 디자인합니다.
                                </p>
                            </div>
                            <button className="btn btn-primary w-full max-w-[200px] mt-lg">
                                <span>체험하기 (Premium)</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="flex flex-col gap-md">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center justify-between group cursor-pointer">
                {title}
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            {children}
        </div>
    )
}
