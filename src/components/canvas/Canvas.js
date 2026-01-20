'use client';

import { forwardRef, useRef, useEffect, useState } from 'react';
import { useEditor } from '@/context/EditorContext';
import Moveable from 'react-moveable';
import * as Shapes from '@/lib/shapes';

const Canvas = forwardRef((props, ref) => {
    const { currentPage, selectedElementId, setSelectedElementId, updateElement } = useEditor();
    const [target, setTarget] = useState(null);
    const containerRef = useRef(null);
    const wrapperRef = useRef(null);

    // 캔버스 클릭 시 선택 해제
    const handleCanvasClick = (e) => {
        // 배경이나 wrapper 클릭 시 선택 해제
        if (e.target === containerRef.current || e.target === wrapperRef.current) {
            setSelectedElementId(null);
            setTarget(null);
        }
    };

    useEffect(() => {
        if (selectedElementId) {
            const element = document.getElementById(selectedElementId);
            setTarget(element);
        } else {
            setTarget(null);
        }
    }, [selectedElementId, currentPage.elements]);

    return (
        <div
            ref={wrapperRef}
            className="flex-1 flex overflow-auto w-full h-full relative custom-scrollbar bg-bg-darker p-xl"
            onClick={handleCanvasClick}
        >
            <div
                className="m-auto relative shadow-2xl transition-all duration-200"
            >
                <div
                    id="canvas-container"
                    ref={containerRef}
                    className="relative bg-white origin-top-left"
                    style={{
                        width: `${currentPage.size.width}px`,
                        height: `${currentPage.size.height}px`,
                        background: currentPage.background.value,
                    }}
                >
                    {currentPage.elements.map((element) => (
                        <CanvasElement
                            key={element.id}
                            element={element}
                            onClick={() => setSelectedElementId(element.id)}
                        />
                    ))}

                    {/* Moveable Controller */}
                    <Moveable
                        target={target}
                        container={containerRef.current}

                        draggable={true}
                        resizable={true}
                        rotatable={true}
                        snappable={true}

                        throttleDrag={0}
                        onDrag={({ target, left, top }) => {
                            target.style.left = `${left}px`;
                            target.style.top = `${top}px`;
                        }}
                        onDragEnd={({ target, isDrag }) => {
                            if (isDrag) {
                                updateElement(target.id, {
                                    position: {
                                        x: parseFloat(target.style.left),
                                        y: parseFloat(target.style.top),
                                    }
                                });
                            }
                        }}

                        throttleResize={0}
                        keepRatio={false}
                        onResize={({ target, width, height, drag }) => {
                            target.style.width = `${width}px`;
                            target.style.height = `${height}px`;
                            target.style.left = `${drag.left}px`;
                            target.style.top = `${drag.top}px`;
                        }}
                        onResizeEnd={({ target, isDrag }) => {
                            if (isDrag) {
                                updateElement(target.id, {
                                    size: {
                                        width: parseFloat(target.style.width),
                                        height: parseFloat(target.style.height),
                                    },
                                    position: {
                                        x: parseFloat(target.style.left),
                                        y: parseFloat(target.style.top),
                                    }
                                });
                            }
                        }}

                        throttleRotate={0}
                        onRotate={({ target, rotate }) => {
                            target.style.transform = `rotate(${rotate}deg)`;
                        }}
                        onRotateEnd={({ target, isDrag }) => {
                            if (isDrag) {
                                const rotationMatch = target.style.transform.match(/rotate\(([-\d.]+)deg\)/);
                                const newRotation = rotationMatch ? parseFloat(rotationMatch[1]) : 0;
                                updateElement(target.id, { rotation: newRotation });
                            }
                        }}

                        snapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
                        elementGuidelines={currentPage.elements.map(el => document.getElementById(el.id)).filter(el => el && el !== target)}
                        bounds={{ left: 0, top: 0, right: currentPage.size.width, bottom: currentPage.size.height }}
                    />
                </div>
            </div>
        </div>
    );
});

Canvas.displayName = 'Canvas';

// CanvasElement: 안전하게 분리
function CanvasElement({ element, onClick }) {
    const { type, size, rotation, style, content, src, shapeType, position } = element;

    const commonStyle = {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: `rotate(${rotation || 0}deg)`,
        cursor: 'pointer',
        boxSizing: 'border-box',
    };

    if (type === 'text') {
        return (
            <div
                id={element.id}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                style={{
                    ...commonStyle,
                    fontSize: `${style.fontSize}px`,
                    fontFamily: style.fontFamily,
                    fontWeight: style.fontWeight,
                    color: style.color,
                    textAlign: style.textAlign,
                    lineHeight: style.lineHeight,
                    padding: '8px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    letterSpacing: `${style.letterSpacing || 0}px`,
                    textShadow: style.textShadow,
                    opacity: style.opacity,
                }}
            >
                {content}
            </div>
        );
    }

    if (type === 'image') {
        return (
            <div
                id={element.id}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                style={{
                    ...commonStyle,
                    opacity: style.opacity,
                    borderRadius: `${style.borderRadius}px`,
                    overflow: 'hidden',
                    border: style.border || 'none',
                    boxShadow: style.boxShadow || 'none',
                }}
            >
                <img
                    src={src}
                    alt="element"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        pointerEvents: 'none',
                    }}
                />
            </div>
        );
    }

    if (type === 'emoji') {
        return (
            <div
                id={element.id}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                style={{
                    ...commonStyle,
                    fontSize: `${size.width * 0.8}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
                    lineHeight: 1,
                    opacity: style.opacity,
                }}
            >
                {content}
            </div>
        );
    }

    if (type === 'shape') {
        const ShapeComponent = Shapes[shapeType.charAt(0).toUpperCase() + shapeType.slice(1)];
        return (
            <div
                id={element.id}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                style={{ ...commonStyle, opacity: style.opacity }}
            >
                {ShapeComponent && (
                    <ShapeComponent
                        width={size.width}   // 중요: NaN 에러 방지 (숫자 전달)
                        height={size.height} // 중요: NaN 에러 방지
                        fill={style.fill}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth || 0}
                    />
                )}
            </div>
        )
    }
    return null;
}

export default Canvas;
