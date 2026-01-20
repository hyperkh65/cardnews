'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    Calendar,
    Clock,
    Download,
    Share2,
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

    const cardRef = useRef(null);
    const hiddenContainerRef = useRef(null);

    // Initial Data Fetch/Sync
    useEffect(() => {
        async function init() {
            // In a real app, we'd fetch from an API that has stored history
            // Here we simulate getting the latest and having some history
            const latest = await fetchDailyEconomyReport();

            // Create some fake history for demonstration
            const historyReport1 = {
                ...latest,
                id: 'h-prev-1',
                date: '2026.01.19',
                time: '08:00 PM',
                type: 'PM'
            };
            const historyReport2 = {
                ...latest,
                id: 'h-prev-2',
                date: '2026.01.19',
                time: '08:00 AM',
                type: 'AM'
            };

            setReports([latest, historyReport1, historyReport2]);
            setActiveReportId(latest.id);
            setIsLoading(false);
        }
        init();
    }, []);

    const activeReport = reports.find(r => r.id === activeReportId);
    const activeSlide = activeReport?.slides[activeSlideIdx];

    const handleSync = async () => {
        setIsLoading(true);
        const newReport = await fetchDailyEconomyReport();
        setReports(prev => [newReport, ...prev]);
        setActiveReportId(newReport.id);
        setActiveSlideIdx(0);
        setIsLoading(false);
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
            folder.file(`slide-${i + 1}.png`, base64Data, { base64: true });
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `2days-report-${activeReport.date}.zip`;
        link.click();
    };

    if (isLoading) {
        return (
            <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCcw className="animate-spin text-blue-500" size={48} />
                <p style={{ marginTop: 20, color: '#71717a' }}>금융 데이터 동기화 중...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.backButton}>
                        <ChevronLeft size={20} />
                    </Link>
                    <div className={styles.title}>
                        <span className={styles.titleAccent}>2Days</span> 투데이즈
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button onClick={handleSync} className={styles.viewBtn} style={{ borderColor: '#3b82f6', color: '#60a5fa' }}>
                        <RefreshCcw size={14} style={{ marginRight: 6 }} /> 데이터 동기화
                    </button>
                    <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500 }}>
                        차기 업데이트: {activeReport.type === 'AM' ? 'PM 08:00' : '내일 AM 08:00'}
                    </div>
                </div>
            </header>

            <div className={styles.main}>
                {/* Sidebar: History */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.sidebarTitle}>
                            <Calendar size={16} style={{ color: '#3b82f6' }} />
                            업데이트 히스토리
                        </div>
                    </div>
                    <div className={styles.historyList}>
                        {reports.map(report => (
                            <div
                                key={report.id}
                                className={`${styles.historyItem} ${activeReportId === report.id ? styles.historyItemActive : ''}`}
                                onClick={() => {
                                    setActiveReportId(report.id);
                                    setActiveSlideIdx(0);
                                }}
                            >
                                <span className={styles.historyDate}>{report.date}</span>
                                <div className={styles.historyTime}>
                                    <span className={styles.timeBadge}>{report.type}</span>
                                    <Clock size={12} />
                                    {report.time} 정기 업데이트
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Content */}
                <main className={styles.contentArea}>
                    {/* Slide Selector Strip */}
                    <div className={styles.viewControls}>
                        {activeReport.slides.map((slide, idx) => (
                            <button
                                key={idx}
                                className={`${styles.viewBtn} ${activeSlideIdx === idx ? styles.viewBtnActive : ''}`}
                                onClick={() => setActiveSlideIdx(idx)}
                            >
                                슬라이드 {idx + 1}
                            </button>
                        ))}
                    </div>

                    {/* Active Slide Rendering */}
                    <div className={styles.cardContainer} ref={cardRef}>
                        {activeSlide.type === 'news' ? (
                            <div style={{ flex: 1 }}>
                                {activeSlideIdx === 0 && <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 32, color: '#3b82f6' }}>오늘의 주요 경제 뉴스</h1>}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: activeSlideIdx === 0 ? 'flex-start' : 'center',
                                    flex: 1
                                }}>
                                    {activeSlide.items.map((item, idx) => (
                                        <div key={idx} className={styles.newsItem} style={{ marginBottom: 0 }}>
                                            <h2 className={styles.newsTitle} style={{ fontSize: 26, marginBottom: 20 }}>{item.id}. {item.title}</h2>
                                            <ul className={styles.bulletList}>
                                                {item.bullets.map((bullet, blIdx) => (
                                                    <li key={blIdx} className={styles.bulletItem}>{bullet}</li>
                                                ))}
                                                {item.insight && (
                                                    <li key="insight" className={styles.bulletItem} style={{ listStyleType: 'none', marginLeft: 0 }}>
                                                        <span className={styles.aiInsight}>{item.insight}</span>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.marketSection}>
                                <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>{activeSlide.title}</h1>
                                {activeSlide.items.map((item, idx) => (
                                    <div key={idx} className={styles.marketRow}>

                                        <span className={styles.marketName}>{item.name}: {item.value}</span>
                                        <span className={styles.marketChange} style={{ color: item.status === 'up' ? '#ef4444' : '#3b82f6' }}>
                                            ({item.change})
                                        </span>
                                    </div>
                                ))}

                            </div>
                        )}

                        {/* Calendar Icon (Violet) */}
                        <div className={styles.cardDate}>
                            <span className={styles.cardDateMonth}>JANUARY</span>
                            <span className={styles.cardDateDay}>{activeReport.date.split('.')[2].replace(/^0/, '')}</span>
                        </div>
                    </div>

                    <div className={styles.downloadBar}>
                        <button className={styles.actionBtn} onClick={handleDownloadAll}>
                            <Download size={18} /> 전용 이미지 (Zip) 다운로드
                        </button>
                    </div>

                    <div style={{ marginTop: 24, fontSize: 12, color: '#71717a', textAlign: 'center', lineHeight: 1.6 }}>
                        RSS 피드에서 {activeReport.slides.length}개의 슬라이드가 생성되었습니다.<br />
                        AI 요약 및 시장 지표 자동 정제 완료.
                    </div>
                </main>
            </div>

            {/* Hidden Container for Exporting All Slides */}
            <div ref={hiddenContainerRef} style={{ position: 'fixed', top: -10000, left: -10000 }}>
                {activeReport.slides.map((slide, sIdx) => (
                    <div key={sIdx} className={styles.cardContainer} style={{ marginBottom: 40 }}>
                        {slide.type === 'news' ? (
                            <div style={{ flex: 1 }}>
                                {sIdx === 0 && <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 32, color: '#3b82f6' }}>오늘의 주요 경제 뉴스</h1>}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: sIdx === 0 ? 'flex-start' : 'center',
                                    flex: 1
                                }}>
                                    {slide.items.map((item, idx) => (
                                        <div key={idx} className={styles.newsItem} style={{ marginBottom: 0 }}>
                                            <h2 className={styles.newsTitle} style={{ fontSize: 26, marginBottom: 20 }}>{item.id}. {item.title}</h2>
                                            <ul className={styles.bulletList}>
                                                {item.bullets.map((bullet, blIdx) => (
                                                    <li key={blIdx} className={styles.bulletItem}>{bullet}</li>
                                                ))}
                                                {item.insight && (
                                                    <li key="insight" className={styles.bulletItem} style={{ listStyleType: 'none', marginLeft: 0 }}>
                                                        <span className={styles.aiInsight}>{item.insight}</span>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.marketSection}>
                                <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>{slide.title}</h1>
                                {slide.items.map((item, idx) => (
                                    <div key={idx} className={styles.marketRow}>

                                        <span className={styles.marketName}>{item.name}: {item.value}</span>
                                        <span className={styles.marketChange} style={{ color: item.status === 'up' ? '#ef4444' : '#3b82f6' }}>
                                            ({item.change})
                                        </span>
                                    </div>
                                ))}

                            </div>
                        )}
                        <div className={styles.cardDate}>
                            <span className={styles.cardDateMonth}>JANUARY</span>
                            <span className={styles.cardDateDay}>{activeReport.date.split('.')[2].replace(/^0/, '')}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
