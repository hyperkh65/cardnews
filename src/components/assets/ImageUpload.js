'use client';

import { useState } from 'react';
import { useEditor } from '@/context/EditorContext';

export default function ImageUpload() {
    const { addElement } = useEditor();
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        handleFiles(files);
    };

    const handleChange = (e) => {
        const files = e.target.files;
        handleFiles(files);
    };

    const handleFiles = (files) => {
        if (files && files[0]) {
            const file = files[0];

            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드할 수 있습니다.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // 이미지 비율 유지하면서 최대 400px로 조정
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 400;

                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = (height / width) * maxSize;
                            width = maxSize;
                        } else {
                            width = (width / height) * maxSize;
                            height = maxSize;
                        }
                    }

                    addElement({
                        type: 'image',
                        src: e.target.result,
                        position: { x: 340, y: 475 }, // 인스타그램 비율 중심
                        size: { width: Math.round(width), height: Math.round(height) },
                        style: {
                            opacity: 1,
                            rotation: 0,
                            borderRadius: 0,
                        },
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col gap-md">
            <h3 className="text-sm font-bold">이미지 업로드</h3>

            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-lg text-center ${dragActive ? 'border-accent-primary bg-accent-light' : 'border-border-primary'
                    }`}
            >
                <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleChange}
                    style={{ display: 'none' }}
                />

                <label
                    htmlFor="image-upload"
                    style={{ cursor: 'pointer', display: 'block' }}
                >
                    <div className="text-lg" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        📁
                    </div>
                    <p className="text-sm text-secondary">
                        {dragActive
                            ? '여기에 놓으세요'
                            : '클릭하거나 드래그하여 이미지 업로드'}
                    </p>
                    <p className="text-xs text-tertiary" style={{ marginTop: 'var(--spacing-xs)' }}>
                        PNG, JPG, GIF 지원
                    </p>
                </label>
            </div>
        </div>
    );
}
