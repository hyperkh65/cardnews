'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    Settings,
    RotateCcw,
    Zap,
    Image as ImageIcon,
    Type,
    LayoutTemplate,
    CheckCircle,
    Download,
    Wand2,
    Palette,
    Eye,
    Monitor,
    Move
} from 'lucide-react';
import styles from './maker.module.css';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import AdBanner from '@/components/AdBanner';
import ProcessingModal from '@/components/ProcessingModal';

// Default Card Data Structure
const DEFAULT_SLIDES = [
    { id: 0, type: 'cover', title: '에어팟 프로 2 솔직 리뷰', subtitle: '3개월 사용 후기', bgImage: null, overlayImage: null, textPos: { x: 0, y: 0 } },
    { id: 1, type: 'intro', text: '첫인상은 "와, 노이즈 캔슬링 진짜 좋아졌다!" 전작 대비 확실히 개선됨', bgImage: null, overlayImage: null, textPos: { x: 0, y: 0 } },
    { id: 2, type: 'point', title: '강력한 노이즈 캔슬링', text: '지하철에서도 음악에만 집중할 수 있어요.', bgImage: null, overlayImage: null, textPos: { x: 0, y: 0 } },
    { id: 3, type: 'point', title: '편안한 착용감', text: '이어팁 사이즈가 다양해져서 귀가 아프지 않아요.', bgImage: null, overlayImage: null, textPos: { x: 0, y: 0 } },
    { id: 4, type: 'point', title: '오디오 공간 음향', text: '마치 콘서트장에 온 듯한 생생한 현장감!', bgImage: null, overlayImage: null, textPos: { x: 0, y: 0 } },
    { id: 5, type: 'outro', title: '총평', subtitle: '가격 값 하는 최고의 무선 이어폰', text: '고민하고 있다면 지금 당장 구매하세요!', bgImage: null, overlayImage: null, textPos: { x: 0, y: 0 } },
];

// Themes Configuration (remains same)
const THEMES = {
    'modern-blue': {
        name: 'Modern Blue',
        bg: 'white',
        primary: '#3b82f6',
        secondary: '#1e40af',
        text: '#1f2937',
        subText: '#4b5563',
        accent: '#f3f4f6',
        decoration: 'blob'
    },
    'simple-blue': {
        name: 'Simple Blue',
        bg: '#eff6ff',
        primary: '#3b82f6',
        secondary: '#60a5fa',
        text: '#1e3a8a',
        subText: '#1d4ed8',
        accent: '#dbeafe',
        decoration: 'minimal'
    },
    'warm-orange': {
        name: 'Warm Orange',
        bg: '#fff7ed',
        primary: '#f59e0b',
        secondary: '#fbbf24',
        text: '#78350f',
        subText: '#92400e',
        accent: '#ffedd5',
        decoration: 'circle'
    },
    'dark-neon': {
        name: 'Dark Neon',
        bg: '#18181b',
        primary: '#3b82f6',
        secondary: '#06b6d4',
        text: '#f4f4f5',
        subText: '#a1a1aa',
        accent: '#27272a',
        decoration: 'neon'
    },
    'soft-green': {
        name: 'Soft Green',
        bg: '#f0fdf4',
        primary: '#22c55e',
        secondary: '#4ade80',
        text: '#064e3b',
        subText: '#166534',
        accent: '#dcfce7',
        decoration: 'leaf'
    }
};

export default function OneClickMakerPage() {
    const [activeTheme, setActiveTheme] = useState('modern-blue');
    const [activePage, setActivePage] = useState(0);
    const [slides, setSlides] = useState(DEFAULT_SLIDES);
    const [subject, setSubject] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Dragging State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const previewRef = useRef(null);
    const fileInputRef = useRef(null);
    const overlayInputRef = useRef(null);
    const [activeImageType, setActiveImageType] = useState(null); // 'bg' or 'overlay'

    // Handle Input Changes
    const handleInputChange = (id, field, value) => {
        setSlides(prev => prev.map(slide =>
            slide.id === id ? { ...slide, [field]: value } : slide
        ));
        if (activePage !== id) setActivePage(id);
    };

    // Image Upload Handling
    const triggerImageUpload = (type) => { // type: 'bg' or 'overlay'
        setActiveImageType(type);
        if (type === 'bg') fileInputRef.current?.click();
        else overlayInputRef.current?.click();
    };

    const handleImageFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            handleInputChange(activePage, type === 'bg' ? 'bgImage' : 'overlayImage', reader.result);
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    };

    // Drag Logic for Text
    const handleMouseDown = (e) => {
        // Only allow dragging if clicking specifically on the text container
        // But for better UX, maybe a handle or strict target check?
        // For now, assume if the user clicks the text block (which has cursor-move), start drag.
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        const currentPos = slides[activePage].textPos || { x: 0, y: 0 };
        const newPos = { x: currentPos.x + dx, y: currentPos.y + dy };

        // Update slide position
        setSlides(prev => prev.map(slide =>
            slide.id === activePage ? { ...slide, textPos: newPos } : slide
        ));

        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);


    // Real AI Generation
    const handleAIGenerate = async () => {
        if (!subject) return alert('주제를 입력해주세요!');

        setIsProcessing(true);

        try {
            const geminiKey = localStorage.getItem('2days_gemini_key') || "";
            const openaiKey = localStorage.getItem('2days_openai_key') || "";

            const res = await fetch('/api/maker', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-gemini-key': geminiKey,
                    'x-openai-key': openaiKey
                },
                body: JSON.stringify({ subject })
            });

            if (!res.ok) throw new Error('AI 요청 실패');
            const newSlides = await res.json();

            setSlides(newSlides);
            setActivePage(0);
            alert('AI가 전문적인 카드뉴스를 생성했습니다!');
        } catch (err) {
            console.error(err);
            alert('AI 생성 중 오류가 발생했습니다. 할당량을 확인해주세요.');
        } finally {
            setIsProcessing(false);
        }
    };

    // State and Refs setup done above

    const currentTheme = THEMES[activeTheme];
    const theme = currentTheme; // Alias for convenience if used in renderSlide


    // Refs for export
    const exportRefs = useRef([]);

    const handleDownload = async () => {
        const zip = new JSZip();
        let count = 0;

        try {
            // Check if we are capturing just the active one or all. User asked for "multiple at once".
            // Let's assume the button means "Download All" now, or we provide option.
            // But typical UX for "Card News" is downloading the set.
            // Let's capture ALL slides from the hidden export container.

            for (let i = 0; i < slides.length; i++) {
                const element = exportRefs.current[i];
                if (!element) continue;

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: null
                });

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                zip.file(`card-news-${i + 1}.png`, blob);
                count++;
            }

            if (count > 0) {
                const content = await zip.generateAsync({ type: 'blob' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = `card-news-set-${Date.now()}.zip`;
                link.click();
            } else {
                alert('다운로드할 슬라이드가 없습니다.');
            }

        } catch (err) {
            console.error('Download failed:', err);
            alert('다운로드 중 오류가 발생했습니다.');
        }
    };

    // Wrapper for Image Inputs UI
    const ImageInputGroup = () => (
        <div className={styles.iconInputContainer}>
            <div className={styles.iconInputWrapper} onClick={() => triggerImageUpload('bg')}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2e2e48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={16} color={slides[activePage].bgImage ? '#a855f7' : '#71717a'} />
                </div>
                <span className={styles.iconInputLabel} style={{ color: slides[activePage].bgImage ? '#a855f7' : '' }}>
                    {slides[activePage].bgImage ? '변경' : '배경 이미지'}
                </span>
            </div>
            <div className={styles.iconInputWrapper} onClick={() => triggerImageUpload('overlay')}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2e2e48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Monitor size={16} color={slides[activePage].overlayImage ? '#a855f7' : '#71717a'} />
                </div>
                <span className={styles.iconInputLabel} style={{ color: slides[activePage].overlayImage ? '#a855f7' : '' }}>
                    {slides[activePage].overlayImage ? '변경' : '오버레이'}
                </span>
            </div>
        </div>
    );

    // Render Card Content
    const renderCardContent = (slide) => {
        const theme = currentTheme;
        const pos = slide.textPos || { x: 0, y: 0 };

        // Moveable Style
        const contentStyle = {
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            position: 'relative', // Ensure relative for z-index within container
            // Add a subtle border when dragging or hovering could be nice, but keeping clean for now
        };

        const ContentWrapper = ({ children }) => (
            <div
                style={contentStyle}
                onMouseDown={handleMouseDown}
                title="드래그하여 위치 이동"
                className="hover:ring-1 hover:ring-purple-400/30 rounded-lg p-4 transition-all" // simple hover hint
            >
                {/* Drag Handle Icon Hint */}
                <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', opacity: 0.5, pointerEvents: 'none' }}>
                    <Move size={12} color={theme.subText} />
                </div>
                {children}
            </div>
        );

        switch (slide.type) {
            case 'cover':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8 w-full">
                        <ContentWrapper>
                            <h1 style={{ fontSize: '32px', fontWeight: 800, color: theme.text, marginBottom: '16px', lineHeight: 1.3 }}>
                                {slide.title}
                            </h1>
                            <div style={{ width: '40px', height: '4px', background: theme.primary, margin: '16px auto' }}></div>
                            <p style={{ fontSize: '18px', color: theme.subText, fontWeight: 600 }}>
                                {slide.subtitle}
                            </p>
                        </ContentWrapper>
                    </div>
                );
            case 'intro':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8 w-full">
                        <ContentWrapper>
                            <div style={{ fontSize: '48px', color: theme.primary, marginBottom: '24px' }}>❝</div>
                            <p style={{ fontSize: '20px', color: theme.text, fontWeight: 700, lineHeight: 1.6, wordBreak: 'keep-all' }}>
                                {slide.text}
                            </p>
                            <div style={{ fontSize: '48px', color: theme.primary, marginTop: '24px' }}>❞</div>
                        </ContentWrapper>
                    </div>
                );
            case 'point':
                return (
                    <div className="flex flex-col items-start justify-center h-full px-8 w-full">
                        <ContentWrapper>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div style={{
                                    background: theme.primary,
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    marginBottom: '16px'
                                }}>
                                    POINT {slide.id - 1}
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: 800, color: theme.text, marginBottom: '12px', textAlign: 'left' }}>
                                    {slide.title}
                                </h2>
                                <p style={{ fontSize: '16px', color: theme.subText, lineHeight: 1.6, textAlign: 'left' }}>
                                    {slide.text}
                                </p>
                            </div>
                        </ContentWrapper>
                    </div>
                );
            case 'outro':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8 w-full">
                        <ContentWrapper>
                            <h2 style={{ fontSize: '28px', fontWeight: 800, color: theme.text, marginBottom: '8px' }}>
                                {slide.title}
                            </h2>
                            <p style={{ fontSize: '16px', color: theme.primary, fontWeight: 600, marginBottom: '24px' }}>
                                {slide.subtitle}
                            </p>
                            <div style={{ background: theme.accent, padding: '16px', borderRadius: '12px', width: '100%' }}>
                                <p style={{ fontSize: '14px', color: theme.subText }}>{slide.text}</p>
                            </div>
                        </ContentWrapper>
                    </div>
                );
            default:
                return null;
        }
    };

    // Helper to render a single slide (reused for preview and export)
    const renderSlide = (slide, index, isExport = false) => {
        // Correctly handle decorations
        const Decoration = () => {
            const blobStyle = { position: 'absolute', borderRadius: '50%', filter: 'blur(60px)', opacity: 0.15 };
            switch (currentTheme.decoration) {
                case 'blob':
                    return (
                        <>
                            <div style={{ ...blobStyle, top: -50, right: -50, width: 250, height: 250, background: currentTheme.primary }}></div>
                            <div style={{ ...blobStyle, bottom: -50, left: -50, width: 200, height: 200, background: currentTheme.secondary }}></div>
                            <div style={{ position: 'absolute', top: 40, right: 30, width: 16, height: 16, border: `2px solid ${currentTheme.accent}`, borderRadius: '50%' }}></div>
                            <div style={{ position: 'absolute', bottom: 40, left: 30, width: 30, height: 30, background: currentTheme.accent, borderRadius: '50%', opacity: 0.5 }}></div>
                        </>
                    );
                case 'neon':
                    return <div style={{ position: 'absolute', inset: 0, border: `2px solid ${currentTheme.primary}`, opacity: 0.3, margin: '20px' }}></div>;
                case 'minimal':
                    return <div style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '8px', background: currentTheme.primary }}></div>;
                case 'circle':
                    return <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', border: `1px solid ${currentTheme.primary}`, borderRadius: '50%', opacity: 0.2 }}></div>;
                default: return null;
            }
        };

        return (
            <div
                style={{
                    width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
                    backgroundColor: currentTheme.bg,
                    transition: 'background-color 0.3s ease'
                }}
            >
                {/* Background Image Layer */}
                {slide.bgImage && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundImage: `url(${slide.bgImage})`,
                        backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0
                    }} />
                )}

                {/* Overlay Image Layer */}
                {slide.overlayImage && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: '80%', height: '80%',
                        zIndex: 5,
                        backgroundImage: `url(${slide.overlayImage})`,
                        backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center'
                    }} />
                )}

                {/* Theme Decorations */}
                {!slide.bgImage && <Decoration />}

                {/* Content Layer */}
                <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>
                    {renderCardContent(slide)}
                </div>

                <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', fontSize: 10, color: slide.bgImage ? 'white' : '#9ca3af', zIndex: 20 }}>
                    TRIANGLE
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Hidden Export Container */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '0', height: '0', overflow: 'hidden' }}>
                {slides.map((slide, i) => (
                    <div
                        key={i}
                        ref={el => exportRefs.current[i] = el}
                        style={{
                            width: 540, height: 675, // Fixed export resolution base (will be scaled 2x)
                            padding: 0
                        }}
                    >
                        {renderSlide(slide, i, true)}
                    </div>
                ))}
            </div>

            {/* Hidden File Inputs */}
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => handleImageFileChange(e, 'bg')} />
            <input type="file" ref={overlayInputRef} hidden accept="image/*" onChange={(e) => handleImageFileChange(e, 'overlay')} />

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.backButton}>
                        <ChevronLeft size={20} />
                    </Link>
                    <div className={styles.title}>
                        <div className={styles.titleIcon}>
                            <Zap size={14} color="white" fill="currentColor" />
                        </div>
                        Triangle Express
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <div className={styles.ratioToggle}>
                        <button className={styles.ratioButton}>1:1</button>
                        <button className={`${styles.ratioButton} ${styles.ratioButtonActive}`}>4:5</button>
                    </div>
                    <button className={styles.downloadButton} onClick={handleDownload}>
                        <Download size={14} /> 전체 다운로드
                    </button>
                </div>
            </header>

            <div className={styles.main}>
                {/* Left Sidebar: Content Inputs */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.sidebarTitle}>
                            <Type size={16} className="text-blue-400" />
                            내용 입력
                        </div>
                        <span className={styles.changeStructureLink}>&lt; 구조 변경</span>
                    </div>

                    <div className={styles.inputScrollArea}>
                        {/* Main Subject Input */}
                        <div className={styles.promptContainer}>
                            <input
                                type="text"
                                className={styles.promptInput}
                                placeholder="주제 입력 (예: 다이어트 꿀팁)"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                            <button className={styles.aiButton} onClick={handleAIGenerate}>AI</button>
                        </div>

                        {/* Slide Inputs Mapping */}
                        {slides.map((slide, idx) => (
                            <div key={slide.id} className={`${styles.sectionGroup} ${activePage === idx ? 'ring-2 ring-blue-600' : ''}`} onClick={() => setActivePage(idx)}>
                                <div className={styles.sectionHeader}>
                                    <div className={styles.sectionNumber}>{idx + 1}</div>
                                    <div className={styles.sectionTitle}>
                                        {slide.type === 'cover' ? '표지' : slide.type === 'outro' ? '마무리' : `포인트 ${idx}`}
                                    </div>
                                </div>
                                {slide.type === 'cover' && (
                                    <>
                                        <input type="text" className={styles.formInput} value={slide.title} onChange={(e) => handleInputChange(idx, 'title', e.target.value)} placeholder="제목 입력" />
                                        <input type="text" className={styles.formInput} value={slide.subtitle} onChange={(e) => handleInputChange(idx, 'subtitle', e.target.value)} placeholder="소제목 입력" />
                                    </>
                                )}
                                {(slide.type === 'intro' || slide.type === 'point' || slide.type === 'outro') && slide.text !== undefined && (
                                    <textarea className={styles.formInput} rows={3} value={slide.text} onChange={(e) => handleInputChange(idx, 'text', e.target.value)} placeholder="내용 입력" />
                                )}
                                {slide.type === 'point' && slide.title !== undefined && (
                                    <input type="text" className={styles.formInput} value={slide.title} onChange={(e) => handleInputChange(idx, 'title', e.target.value)} placeholder="제목 입력" />
                                )}
                                {slide.type === 'outro' && slide.title !== undefined && (
                                    <input type="text" className={styles.formInput} value={slide.title} onChange={(e) => handleInputChange(idx, 'title', e.target.value)} placeholder="제목 입력" />
                                )}
                                <ImageInputGroup />
                            </div>
                        ))}

                        <div style={{ marginTop: '20px' }}>
                            <AdBanner slot="3106703198" />
                        </div>
                    </div>
                </aside>

                {/* Right Panel */}
                <div className={styles.rightPanel}>
                    {/* Theme Selector */}
                    <div className={styles.themePanel}>
                        <div className={styles.themeHeader}>
                            <div className={styles.themeTitle}><Palette size={16} className="text-pink-500" />테마 스타일</div>
                        </div>
                        <div className={styles.themeList}>
                            {Object.entries(THEMES).map(([key, theme]) => (
                                <div key={key} className={`${styles.themeCard} ${activeTheme === key ? styles.themeCardActive : ''}`} onClick={() => setActiveTheme(key)}>
                                    <div className={styles.themePreview} style={{ background: key === 'modern-purple' ? 'white' : theme.bg }}>
                                        <div style={{ width: 30, height: 30, background: theme.primary, borderRadius: 8 }}></div>
                                    </div>
                                    {activeTheme === key && (<div className={styles.themeChecked}><CheckCircle size={10} /></div>)}
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <AdBanner slot="1637908585" />
                        </div>
                    </div>

                    {/* Canvas Preview */}
                    <div className={styles.previewArea}>
                        <div className={styles.previewLabel}><Eye size={14} /> {activePage + 1}번째 장 미리보기</div>
                        <div className={styles.previewCanvasWrapper} ref={previewRef}>
                            {renderSlide(slides[activePage], activePage)}
                        </div>

                        {/* Pagination */}
                        <div className={styles.pagination}>
                            <button onClick={() => setActivePage(Math.max(0, activePage - 1))} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                            {slides.map((_, idx) => (
                                <div key={idx} className={`${styles.pageThumb} ${activePage === idx ? styles.pageThumbActive : ''}`} onClick={() => setActivePage(idx)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: activePage === idx ? '#8b5cf6' : '#71717a', fontWeight: 'bold' }}>
                                    {idx + 1}
                                </div>
                            ))}
                            <button onClick={() => setActivePage(Math.min(slides.length - 1, activePage + 1))} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}><ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} /></button>
                        </div>
                    </div>
                </div>
            </div>

            <ProcessingModal isOpen={isProcessing} message="AI가 고품격 카드뉴스 대본을 작성하고 있습니다..." />
        </div>
    );
}
