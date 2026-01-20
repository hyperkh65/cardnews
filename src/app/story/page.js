'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    Bot,
    Sparkles,
    Image as ImageIcon,
    Type,
    ArrowRight,
    RefreshCw,
    Download,
    Edit3
} from 'lucide-react';
import styles from './story.module.css';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { useRef } from 'react';

// Mock Data Generator
const MOCK_IMAGES = [
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80', // Dark moody
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80', // Neon vibe
    'https://images.unsplash.com/photo-1542385311-7a71a911732e?w=800&q=80', // Blue tone
    'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=800&q=80', // Abstract
];

export default function StoryCreatorPage() {
    const [step, setStep] = useState('input'); // input, processing, result
    const [url, setUrl] = useState('');
    const [loadingText, setLoadingText] = useState('');
    const [slides, setSlides] = useState([]);

    // Add refs
    const exportRefs = useRef([]);

    const handleDownload = async () => {
        if (slides.length === 0) return;

        const zip = new JSZip();
        let count = 0;

        try {
            for (let i = 0; i < slides.length; i++) {
                const element = exportRefs.current[i];
                if (!element) continue;

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: null
                });

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                zip.file(`story-slide-${i + 1}.png`, blob);
                count++;
            }

            if (count > 0) {
                const content = await zip.generateAsync({ type: 'blob' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = `story-set-${Date.now()}.zip`;
                link.click();
            }
        } catch (e) {
            console.error(e);
            alert('다운로드 중 오류가 발생했습니다.');
        }
    };

    const handleGenerate = async () => {
        if (!url) return alert('블로그 또는 기사 링크를 입력해주세요.');

        setStep('processing');

        try {
            // Start real-time AI processing
            setLoadingText('블로그 콘텐츠 분석 중...');

            const res = await fetch('/api/story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!res.ok) throw new Error('AI 분석 실패');

            setLoadingText('디자인 및 캡션 최적화 중...');
            const aiSlides = await res.json();

            // Artificial delay for smooth UX transition
            setTimeout(() => {
                setSlides(aiSlides);
                setStep('result');
            }, 1000);

        } catch (err) {
            console.error(err);
            alert('AI 분석 중 오류가 발생했습니다. 할당량을 확인해주세요.');
            setStep('input');
        }
    };

    return (
        <div className={styles.container}>
            {/* Hidden Export Container for High Res Capture */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '0', height: '0', overflow: 'hidden' }}>
                {slides.map((slide, i) => (
                    <div
                        key={i}
                        ref={el => exportRefs.current[i] = el}
                        style={{
                            width: 540, height: 675, // Base size (will be 2x)
                            position: 'relative',
                            backgroundColor: '#000', // Default dark
                            overflow: 'hidden'
                        }}
                    >
                        {/* Replicate Card Design for Export */}
                        {slide.bgImage && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                backgroundImage: `url(${slide.bgImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'brightness(0.6)'
                            }} />
                        )}
                        <div style={{
                            position: 'absolute', inset: 0, padding: 40,
                            display: 'flex', flexDirection: 'column',
                            color: 'white',
                            alignItems: slide.type === 'cover' ? 'center' : 'flex-start',
                            textAlign: slide.type === 'cover' ? 'center' : 'left',
                            justifyContent: slide.type === 'cover' ? 'center' : 'flex-end'
                        }}>
                            <h2 style={{
                                fontSize: slide.type === 'cover' ? 42 : 32, // Larger font for export
                                fontWeight: 800,
                                marginBottom: 24,
                                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                                whiteSpace: 'pre-line'
                            }}>
                                {slide.text}
                            </h2>
                            <p style={{
                                fontSize: 20, // Larger font
                                opacity: 0.9,
                                fontWeight: 400,
                                lineHeight: 1.5,
                                whiteSpace: 'pre-line'
                            }}>
                                {slide.subText}
                            </p>
                        </div>

                        <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                            TRIANGLE
                        </div>
                    </div>
                ))}
            </div>

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.backButton}>
                        <ChevronLeft size={20} />
                    </Link>
                    <div className={styles.title}>
                        <div className={styles.titleIcon}>
                            <Bot size={14} />
                        </div>
                        AI Story Creator
                    </div>
                </div>
                {step === 'result' && (
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className={styles.backButton} onClick={() => setStep('input')} title="다시 만들기">
                            <RefreshCw size={18} />
                        </button>
                        <button className={styles.generateButton} style={{ fontSize: 13, padding: '0 20px', height: 36 }} onClick={handleDownload}>
                            <Download size={16} /> 전체 다운로드
                        </button>
                    </div>
                )}
            </header>

            {/* Content Area */}
            {step === 'input' && (
                <main className={styles.inputSection}>
                    <div>
                        <h1 className={styles.heroTitle}>블로그 글을 인스타로 변신</h1>
                        <p className={styles.heroDesc}>
                            복잡한 과정 없이 링크만 넣으세요.<br />
                            AI가 내용을 요약하고 어울리는 이미지를 찾아 카드뉴스로 만들어드립니다.
                        </p>
                    </div>

                    <div className={styles.urlInputBox}>
                        <input
                            type="text"
                            className={styles.urlInput}
                            placeholder="블로그나 브런치 아티클 주소를 붙여넣으세요 (예: https://blog.naver.com/...)"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <button className={styles.generateButton} onClick={handleGenerate}>
                            <Sparkles size={18} />
                            자동 생성
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 12, opacity: 0.5 }}>
                        {/* Examples */}
                        <span style={{ fontSize: 13, color: '#71717a' }}>예시 링크 사용해보기:</span>
                        <button onClick={() => setUrl('https://example.com/morning-routine')} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                            아침 루틴 가이드
                        </button>
                    </div>
                </main>
            )}

            {step === 'processing' && (
                <main className={styles.loadingSection}>
                    <div className={styles.spinner}></div>
                    <div className={styles.loadingText}>{loadingText}</div>
                    <div style={{ width: 200, height: 4, background: '#1f1f2e', borderRadius: 2, overflow: 'hidden', marginTop: 12 }}>
                        <div style={{ height: '100%', width: '60%', background: '#3b82f6', animation: 'progress 2s infinite ease-in-out' }}></div>
                    </div>
                    {/* Add keyframes for progress inline or in CSS. CSS is simpler but for now just visual. */}
                </main>
            )}

            {step === 'result' && (
                <div className={styles.resultContainer}>
                    <div className={styles.previewArea}>
                        {/* Card Carousel */}
                        <div className={styles.carousel}>
                            {slides.map((slide, idx) => (
                                <div key={slide.id} className={styles.cardWrapper}>
                                    {/* Background Image */}
                                    {slide.bgImage && (
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            backgroundImage: `url(${slide.bgImage})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            filter: 'brightness(0.6)' // "Insta vibe" dark filter automatically applied
                                        }} />
                                    )}

                                    {/* Content */}
                                    <div className={styles.cardContent} style={{ alignItems: slide.type === 'cover' ? 'center' : 'flex-start', textAlign: slide.type === 'cover' ? 'center' : 'left', justifyContent: slide.type === 'cover' ? 'center' : 'flex-end' }}>
                                        <h2 style={{
                                            fontSize: slide.type === 'cover' ? 32 : 24,
                                            fontWeight: 800,
                                            marginBottom: 16,
                                            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                                            whiteSpace: 'pre-line'
                                        }}>
                                            {slide.text}
                                        </h2>
                                        <p style={{
                                            fontSize: 16,
                                            opacity: 0.9,
                                            fontWeight: 400,
                                            lineHeight: 1.5,
                                            whiteSpace: 'pre-line'
                                        }}>
                                            {slide.subText}
                                        </p>
                                    </div>

                                    {/* Quick Edit Overlay */}
                                    <div className={styles.editTrigger} onClick={() => alert('편집 기능은 준비 중입니다! (Mock)')}>
                                        <Edit3 size={12} /> 편집
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary / Sidebar */}
                    <aside className={styles.storySidebar}>
                        <h3 className={styles.stepTitle}>AI 요약 리포트</h3>
                        <div className={styles.generatedSummary}>
                            <p style={{ marginBottom: 12 }}><strong>분석된 주제:</strong> {url.includes('morning') ? '자기계발 / 루틴' : '일반'}</p>
                            <p>입력하신 블로그 글에서 핵심 키워드 4가지를 추출했습니다. 인스타그램 감성을 위해 이미지는 약간 어둡게 처리하고 텍스트를 강조하는 레이아웃을 자동 적용했습니다.</p>
                        </div>

                        <h3 className={styles.stepTitle}>스타일 옵션</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {['모던 다크', '감성 베이지', '비비드', '미니멀'].map(style => (
                                <button key={style} style={{ padding: 12, borderRadius: 8, background: '#27272a', border: '1px solid #3f3f46', color: '#d4d4d8', cursor: 'pointer', fontSize: 13 }}>
                                    {style}
                                </button>
                            ))}
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
