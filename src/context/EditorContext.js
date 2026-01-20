'use client';

import { createContext, useContext, useState } from 'react';

const EditorContext = createContext();

export function EditorProvider({ children }) {
    // 현재 페이지 데이터
    const [pages, setPages] = useState([
        {
            id: 'page-1',
            size: { width: 1080, height: 1350 },
            background: {
                type: 'color',
                value: '#ffffff',
            },
            elements: [],
        },
    ]);

    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [selectedElementId, setSelectedElementId] = useState(null);

    const currentPage = pages[currentPageIndex];

    // 페이지 업데이트 헬퍼
    const updatePage = (pageIndex, updates) => {
        setPages((prev) =>
            prev.map((page, idx) =>
                idx === pageIndex ? { ...page, ...updates } : page
            )
        );
    };

    // 요소 추가
    const addElement = (element) => {
        const newElement = {
            id: `element-${Date.now()}`,
            position: { x: 0, y: 0 }, // 기본값
            size: { width: 100, height: 100 }, // 기본값
            rotation: 0, // 회전 각도 (단위: deg)
            ...element,
            // 스타일 기본값 보장
            style: {
                opacity: 1,
                ...element.style,
            }
        };

        // 중앙 배치 계산 (만약 위치가 명시되지 않았다면)
        if (!element.position) {
            newElement.position = {
                x: (currentPage.size.width - newElement.size.width) / 2,
                y: (currentPage.size.height - newElement.size.height) / 2,
            };
        }

        updatePage(currentPageIndex, {
            elements: [...currentPage.elements, newElement],
        });
        setSelectedElementId(newElement.id);
    };

    // 요소 속성 업데이트 (최상위 속성 + 스타일 딥 머지)
    const updateElement = (elementId, updates) => {
        updatePage(currentPageIndex, {
            elements: currentPage.elements.map((el) => {
                if (el.id !== elementId) return el;

                // 스타일이 업데이트 목록에 있다면 병합
                const newStyle = updates.style
                    ? { ...el.style, ...updates.style }
                    : el.style;

                return {
                    ...el,
                    ...updates,
                    style: newStyle,
                };
            }),
        });
    };

    // 요소 삭제
    const deleteElement = (elementId) => {
        updatePage(currentPageIndex, {
            elements: currentPage.elements.filter((el) => el.id !== elementId),
        });
        if (selectedElementId === elementId) {
            setSelectedElementId(null);
        }
    };

    // 레이어 순서: 요소 순서 변경이 곧 Z-index 변경
    const reorderElement = (elementId, direction) => {
        const currentIndex = currentPage.elements.findIndex(el => el.id === elementId);
        if (currentIndex === -1) return;

        const newElements = [...currentPage.elements];
        const [element] = newElements.splice(currentIndex, 1);

        if (direction === 'front') {
            newElements.push(element);
        } else if (direction === 'back') {
            newElements.unshift(element);
        } else if (direction === 'forward') {
            const newIndex = Math.min(newElements.length, currentIndex + 1);
            newElements.splice(newIndex, 0, element);
        } else if (direction === 'backward') {
            const newIndex = Math.max(0, currentIndex - 1);
            newElements.splice(newIndex, 0, element);
        }

        updatePage(currentPageIndex, { elements: newElements });
    };

    const bringToFront = (id) => reorderElement(id, 'front');
    const sendToBack = (id) => reorderElement(id, 'back');
    const bringForward = (id) => reorderElement(id, 'forward');
    const sendBackward = (id) => reorderElement(id, 'backward');

    // 배경 업데이트
    const updateBackground = (background) => {
        updatePage(currentPageIndex, { background });
    };

    // 캔버스 사이즈 업데이트
    const updateCanvasSize = (size) => {
        updatePage(currentPageIndex, { size });
    };

    // 템플릿 로드
    const loadTemplate = (templateData) => {
        updatePage(currentPageIndex, {
            ...templateData,
            id: currentPage.id,
        });
        setSelectedElementId(null);
    };

    const value = {
        pages,
        currentPageIndex,
        setCurrentPageIndex,
        currentPage,
        selectedElementId,
        setSelectedElementId,
        addElement,
        updateElement,
        deleteElement,
        bringToFront,
        sendToBack,
        bringForward,
        sendBackward,
        updateBackground,
        updateCanvasSize,
        loadTemplate,
    };

    return (
        <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
    );
}

export function useEditor() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within EditorProvider');
    }
    return context;
}
