'use client';

import Link from 'next/link';
import {
    Zap,
    PenTool,
    Check,
    ChevronRight,
    Palette,
    Layout,
    Smartphone,
    Bot,
    Triangle,
    Globe
} from 'lucide-react';
import styles from './page.module.css';

export default function LandingPage() {
    return (
        <div className={styles.container}>
            {/* Background Gradients */}
            <div className={styles.bgGradientTop} />
            <div className={styles.bgOrb} />

            {/* Navbar */}
            <nav className={styles.nav}>
                <div className={styles.logoGroup}>
                    {/* Logo: Triangle */}
                    <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Triangle size={24} fill="url(#paint0_linear)" color="url(#paint0_linear)" />
                        <svg width="0" height="0">
                            <defs>
                                <linearGradient id="paint0_linear" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#3b82f6" />
                                    <stop offset="1" stopColor="#60a5fa" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className={styles.logoText}>TRIANGLE</span>
                </div>
                <div className={styles.navButtons}>
                    <Link href="/login" className={styles.loginBtn}>로그인</Link>
                    <Link href="/signup" className={styles.startBtn}>
                        시작하기
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className={styles.main}>

                {/* Brand Badge */}
                <div className={styles.badge}>
                    <span className={styles.badgeIcon}>T</span>
                    <span className={styles.badgeText}>TRIANGLE</span>
                    <span className={styles.badgePro}>PRO</span>
                </div>

                {/* Title */}
                <h1 className={styles.title}>
                    <span className={styles.titleLine1}>인스타그램 카드뉴스,</span>
                    <span className={styles.titleLine2}>
                        3초만에 만들기
                    </span>
                </h1>

                <p className={styles.description}>
                    디자인 경험 없이도 전문가 수준의 카드뉴스를 만들 수 있습니다.<br />
                    내용만 입력하면 디자인은 자동으로!
                </p>

                {/* Features Cards Grid */}
                <div className={styles.grid}>

                    {/* Card 1: Triangle Express (One-Click) */}
                    <Link href="/maker" className={`${styles.cardLink} ${styles.makerCard}`}>
                        <div className={styles.makerBadge}>
                            추천
                        </div>
                        <div className={`${styles.cardContent} ${styles.makerContent}`}>
                            <div className={styles.makerBgBlur}></div>

                            <div className={`${styles.cardIconBox} ${styles.makerIconBox}`} style={{ background: '#3b82f6' }}>
                                <Zap size={24} color="white" fill="currentColor" />
                            </div>

                            <h3 className={styles.cardTitle}>Triangle Express</h3>
                            <p className={styles.cardDesc}>
                                구조 선택 → 내용 입력 → 테마 적용<br />
                                6장 세트를 한 번에 완성!
                            </p>

                            <ul className={styles.cardList}>
                                {[
                                    '10가지 검증된 구조 템플릿',
                                    'AI 제목 추천',
                                    '테마 팩 실시간 미리보기'
                                ].map((item, i) => (
                                    <li key={i} className={styles.listItem}>
                                        <div className={styles.checkIcon} style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                                            <Check size={10} color="#60a5fa" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className={`${styles.cardFooter} ${styles.makerFooter}`}>
                                시작하기 <ChevronRight size={16} />
                            </div>
                        </div>
                    </Link>

                    {/* Card 2: AI Story Creator (Story Architect?) */}
                    <Link href="/story" className={`${styles.cardLink} ${styles.editorCard}`} style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                        <div className={`${styles.cardContent} ${styles.editorContent}`}>

                            <div className={`${styles.cardIconBox}`} style={{ background: 'linear-gradient(135deg, #161616 0%, #1e293b 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <Bot size={24} color="#60a5fa" />
                            </div>

                            <h3 className={styles.cardTitle} style={{ color: '#93c5fd' }}>AI Story Creator</h3>
                            <p className={styles.cardDesc}>
                                블로그 링크만 넣으세요.<br />
                                AI가 요약하고 이미지까지 자동 생성!
                            </p>

                            <ul className={styles.cardList}>
                                {[
                                    '블로그/기사 링크 자동 분석',
                                    '이미지 자동 추출 & 필터',
                                    '인스타 감성 캡션 생성'
                                ].map((item, i) => (
                                    <li key={i} className={styles.listItem}>
                                        <div className={styles.checkIcon} style={{ background: 'rgba(59, 130, 246, 0.2)', width: 16, height: 16 }}>
                                            <span style={{ fontSize: 10, color: '#60a5fa' }}>v</span>
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className={`${styles.cardFooter} ${styles.editorFooter}`} style={{ color: '#93c5fd' }}>
                                체험하기 <ChevronRight size={16} />
                            </div>
                        </div>
                    </Link>


                    {/* Card 3: Triangle Studio (Classic Editor) */}
                    <Link href="/editor" className={`${styles.cardLink} ${styles.editorCard}`}>
                        <div className={`${styles.cardContent} ${styles.editorContent}`}>

                            <div className={`${styles.cardIconBox} ${styles.editorIconBox}`}>
                                <PenTool size={24} color="#d1d5db" />
                            </div>

                            <h3 className={styles.cardTitle}>Triangle Studio</h3>
                            <p className={styles.cardDesc}>
                                자유도 100% 캔버스<br />
                                포토샵급 정밀 편집 도구
                            </p>

                            <ul className={styles.cardList}>
                                {[
                                    '레이어 / 드래그 & 드롭',
                                    '다양한 도형 & 스티커',
                                    '디테일한 속성 제어'
                                ].map((item, i) => (
                                    <li key={i} className={styles.listItem}>
                                        <div className={styles.checkIcon} style={{ background: 'rgba(75, 85, 99, 0.5)', width: 16, height: 16 }}>
                                            <span style={{ fontSize: 10, color: '#d1d5db' }}>v</span>
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className={`${styles.cardFooter} ${styles.editorFooter}`}>
                                에디터 열기 <ChevronRight size={16} />
                            </div>
                        </div>
                    </Link>

                    {/* Card 4: 2Days Economy News (Automated) */}
                    <Link href="/today" className={`${styles.cardLink}`} style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                        <div className={`${styles.cardContent}`} style={{ background: 'rgba(10, 10, 20, 0.8)' }}>
                            <div className={styles.makerBadge} style={{ background: '#3b82f6', color: 'white' }}>NEW</div>

                            <div className={`${styles.cardIconBox}`} style={{ background: '#1e3a8a' }}>
                                <Globe size={24} color="white" />
                            </div>

                            <h3 className={styles.cardTitle}>2Days Economy</h3>
                            <p className={styles.cardDesc}>
                                매일 8시 정기 업데이트<br />
                                AI가 정제한 경제 뉴스 & 지수
                            </p>

                            <ul className={styles.cardList}>
                                {[
                                    '매경/한경 RSS 실시간 분석',
                                    '주요 지수(환율/코인) 자동 요약',
                                    '정기 업데이트 히스토리 보관'
                                ].map((item, i) => (
                                    <li key={i} className={styles.listItem}>
                                        <div className={styles.checkIcon} style={{ background: 'rgba(59, 130, 246, 0.2)', width: 16, height: 16 }}>
                                            <span style={{ fontSize: 10, color: '#3b82f6' }}>v</span>
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className={styles.cardFooter} style={{ color: '#60a5fa' }}>
                                오늘 뉴스 보기 <ChevronRight size={16} />
                            </div>
                        </div>
                    </Link>

                </div>

                {/* Footer Features */}
                <div className={styles.features}>
                    <div className={styles.featureItem}>
                        <div className={styles.featureIconBox} style={{ background: 'rgba(250, 204, 21, 0.2)' }}>
                            <Palette size={20} color="#facc15" />
                        </div>
                        <span className={styles.featureText}>10+ 테마 팩</span>
                    </div>
                    <div className={styles.featureItem} style={{ transform: 'scale(1.05)', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                        <div className={styles.featureIconBox} style={{ background: 'white' }}>
                            <Layout size={20} color="black" />
                        </div>
                        <span className={styles.featureText}>자동 레이아웃</span>
                    </div>
                    <div className={styles.featureItem}>
                        <div className={styles.featureIconBox} style={{ background: 'rgba(96, 165, 250, 0.2)' }}>
                            <Smartphone size={20} color="#60a5fa" />
                        </div>
                        <span className={styles.featureText}>고해상도</span>
                    </div>
                </div>

            </main>
        </div>
    );
}
