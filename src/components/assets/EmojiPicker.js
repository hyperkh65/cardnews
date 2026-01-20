'use client';

import { useState } from 'react';
import { useEditor } from '@/context/EditorContext';
import { emojiCategories } from '@/lib/emojis';

export default function EmojiPicker() {
    const { addElement } = useEditor();
    const [selectedCategory, setSelectedCategory] = useState(0);

    const handleEmojiClick = (emoji) => {
        addElement({
            type: 'emoji',
            content: emoji,
            position: { x: 500, y: 600 }, // 인스타그램 비율 중심
            size: { width: 80, height: 80 }, // 더 작은 크기
        });
    };

    return (
        <div className="flex flex-col gap-md">
            <h3 className="text-sm font-bold">이모지</h3>

            {/* 카테고리 탭 */}
            <div className="flex gap-xs" style={{ overflowX: 'auto' }}>
                {emojiCategories.map((category, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedCategory(index)}
                        className={`btn btn-sm ${selectedCategory === index ? 'btn-primary' : 'btn-ghost'
                            }`}
                        style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            {/* 이모지 그리드 */}
            <div
                className="grid gap-xs"
                style={{
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    maxHeight: '400px',
                    overflowY: 'auto',
                }}
            >
                {emojiCategories[selectedCategory].emojis.map((emoji, index) => (
                    <button
                        key={index}
                        onClick={() => handleEmojiClick(emoji)}
                        className="hover-lift"
                        style={{
                            fontSize: '24px',
                            padding: 'var(--spacing-sm)',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-base)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            aspectRatio: '1',
                        }}
                        title={`${emoji} 추가`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
