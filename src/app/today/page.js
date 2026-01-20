'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    Calendar,
    Clock,
    Download,
    RefreshCcw,
    TrendingUp,
    Globe,
    Newspaper,
    Check,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import styles from './today.module.css';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { fetchDailyEconomyReport } from '@/lib/newsFetcher';

export default function TodaysMenuPage() {
    const [reports, setReports] = useState([]);
    const [activeReportId, setActiveReportId] = useState(null);
    const [activeSlideIdx, setActiveSlideIdx] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const cardRef = useRef(null);
    const hiddenContainerRef = useRef(null);

    useEffect(() => {
        async function init() {
            try {
                const latest = await fetchDailyEconomyReport();
                setReports([latest]);
                setActiveReportId(latest.id);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("AI 분석 한도(Day Limit)가 초과되었거나 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
            } finally {
                setIsLoading(false);
            }
        }
        init();
    }, []);

    const activeReport = reports.find(r => r.id === activeReportId);
    const activeSlide = activeReport?.slides[activeSlideIdx];

    const handleSync = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const newReport = await fetchDailyEconomyReport(true); // Force refresh AI
            setReports(prev => [newReport, ...prev]);
            setActiveReportId(newReport.id);
            setActiveSlideIdx(0);
        } catch (err) {
            setError("데이터 동기화에 실패했습니다. (API 할당량 초과 등)");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadAll = async () => {
        if (!activeReport || !hiddenContainerRef.current) return;
        const zip = new JSZip();
        const folder = zip.folder(`2days-${activeReport.date}-${activeReport.type}`);
        const slideElements = hiddenContainerRef.current.children;

        for (let i = 0; i < slideElements.length; i++) {
            const canvas = await html2canvas(slideElements[i], { scale: 2 });
            const dataUrl = canvas.toDataURL('image/png');
            const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
            folder.file(`slide-${idxToName(i)}.png`, base64Data, { base64: true });
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `2days-report-${activeReport.date}.zip`;
        link.click();
    };

    const idxToName = (i) => {
        if (i === 0) return '0-cover';
        return `slide-${i}`;
    };

    const renderSlideContent = (slide, report) => {
        if (!slide) return null;

        const day = report.date.split('.')[2].replace(/^0/, '');
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthIndex = parseInt(report.date.split('.')[1]) - 1;
        const month = monthNames[monthIndex] || "JANUARY";

        return (
            <>
                {/* Date Badge (Safe Area Top) */}
                <div className={styles.cardDate}>
                    <span className={styles.cardDateMonth}>{month}</span>
                    <span className={styles.cardDateDay}>{day}</span>
                </div>

                <div className={styles.cardContentWrapper}>
                    {slide.type === 'cover' && (
                        <div>
                            <div className={styles.coverBadge}>TRIANGLE ECONOMY</div>
                            <h1 className={styles.coverTitle}>투데이즈<br />{report.date.split('.').slice(1).join('.')} 뉴스</h1>
                            <p className={styles.coverSubtitle}>{slide.subtitle}</p>
                        </div>
                    )}

                    {slide.type === 'news' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            {slide.items.map((item, idx) => (
                                <div key={idx} className={styles.newsItem}>
                                    <h2 className={styles.newsTitle}>{item.id}. {item.title}</h2>
                                    <div className={styles.bulletList}>
                                        {item.bullets.map((bullet, blIdx) => (
                                            <p key={blIdx} className={styles.bulletItem}>{bullet}</p>
                                        ))}
                                        {item.insight && (
                                            <span className={styles.aiInsight}>투데이즈 인사이트: {item.insight}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {slide.type === 'market' && (
                        <div className={styles.marketSection}>
                            <h1 className={styles.marketTitle}>{slide.title}</h1>
                            {slide.items.map((item, idx) => (
                                <div key={idx} className={styles.marketRow}>
                                    <span className={styles.marketName}>{item.name}</span>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className={styles.marketValue}>{item.value}</div>
                                        <div className={styles.marketChange} style={{ color: item.status === 'up' ? '#ff3b30' : '#30b0c7' }}>
                                            {item.change}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </>
        );
    };

    if (isLoading) {
        return (
            <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCcw className="animate-spin text-blue-500" size={48} />
                <p style={{ marginTop: 20, color: '#71717a', fontSize: '18px', fontWeight: 'bold' }}>AI가 오늘의 실시간 경제 정보를 분석 중입니다...</p>
                <p style={{ marginTop: 8, color: '#a1a1aa' }}>잠시만 기다려 주세요 (약 10~20초 소요)</p>
            </div>
        );
    }

    if (error || !activeReport) {
        return (
            <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ textAlign: 'center', maxWidth: '400px', background: '#1e293b', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: 'white' }}>AI 분석 한도 초과 및 지연</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '15px', lineHeight: '1.6' }}>
                        현재 AI 서비스 이용자가 많아 분석이 지연되고 있습니다.<br />
                        잠시 후 다시 시도해 주시거나,<br />
                        왼쪽 히스토리에서 이전 리포트를 확인해 주세요.
                    </p>
                    <button onClick={handleSync} className={styles.viewBtnActive} style={{ padding: '12px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', width: '100%' }}>
                        다시 시도하기
                    </button>
                    <Link href="/" style={{ display: 'block', marginTop: '16px', color: '#64748b', fontSize: '14px' }}>홈으로 이동</Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.backButton}><ChevronLeft size={20} /></Link>
                    <div className={styles.title}><span className={styles.titleAccent}>2Days</span> 투데이즈</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button onClick={handleSync} className={styles.viewBtn} style={{ borderColor: '#0066ff', color: '#0066ff' }}>
                        <RefreshCcw size={14} style={{ marginRight: 6 }} /> 실시간 분석
                    </button>
                    <div style={{ fontSize: 13, color: '#71717a' }}>{activeReport.time} 업데이트 완료</div>
                </div>
            </header>

            <div className={styles.main}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.sidebarTitle}><Calendar size={16} /> 히스토리</div>
                    </div>
                    <div className={styles.historyList}>
                        {reports.map(report => (
                            <div
                                key={report.id}
                                className={`${styles.historyItem} ${activeReportId === report.id ? styles.historyItemActive : ''}`}
                                onClick={() => { setActiveReportId(report.id); setActiveSlideIdx(0); }}
                            >
                                <span className={styles.historyDate}>{report.date}</span>
                                <div className={styles.historyTime}>{report.type} 업데이트</div>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className={styles.contentArea}>
                    <div className={styles.viewControls}>
                        {activeReport.slides.map((slide, idx) => {
                            let label = `P${idx}`;
                            if (slide.type === 'cover') label = '표지';
                            else if (slide.type === 'news') label = `뉴스 ${idx}`;
                            else if (slide.type === 'market') label = '지표';

                            return (
                                <button
                                    key={idx}
                                    className={`${styles.viewBtn} ${activeSlideIdx === idx ? styles.viewBtnActive : ''}`}
                                    onClick={() => setActiveSlideIdx(idx)}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className={styles.cardScaleWrapper}>
                        <div className={styles.cardContainer} ref={cardRef}>
                            {renderSlideContent(activeSlide, activeReport)}
                        </div>
                    </div>

                    <div className={styles.downloadBar}>
                        <button className={styles.actionBtn} onClick={handleDownloadAll}>
                            <Download size={18} /> 전체 이미지 저장 (Zip)
                        </button>
                    </div>
                </main>
            </div>

            {/* Hidden Export Container */}
            <div ref={hiddenContainerRef} style={{ position: 'fixed', top: -10000, left: -10000 }}>
                {activeReport.slides.map((slide, sIdx) => (
                    <div key={sIdx} className={styles.cardContainer}>
                        {renderSlideContent(slide, activeReport)}
                    </div>
                ))}
            </div>
        </div>
    );
}
