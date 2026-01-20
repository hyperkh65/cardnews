'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    Globe,
    LogOut,
    Lock,
    Settings,
    X,
    Key
} from 'lucide-react';
import styles from './page.module.css';
import { supabase } from '@/lib/supabase';
import AdBanner from '@/components/AdBanner';

export default function LandingPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [userKeys, setUserKeys] = useState({ gemini: '', openai: '' });

    useEffect(() => {
        // Check current session
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        // Load keys from local storage
        const savedGemini = localStorage.getItem('2days_gemini_key') || '';
        const savedOpenAI = localStorage.getItem('2days_openai_key') || '';
        setUserKeys({ gemini: savedGemini, openai: savedOpenAI });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    const handleServiceClick = (e, path) => {
        if (!user) {
            e.preventDefault();
            alert('이 서비스는 회원가입 후 이용 가능합니다. 회원가입 페이지로 이동합니다.');
            router.push('/signup');
        }
    };

    const saveSettings = () => {
        localStorage.setItem('2days_gemini_key', userKeys.gemini);
        localStorage.setItem('2days_openai_key', userKeys.openai);
        setIsSettingsOpen(false);
        alert('설정이 저장되었습니다. 모든 AI 서비스에 적용됩니다.');
    };

    return (
        <div className={styles.container}>
            {/* Background Gradients */}
            <div className={styles.bgGradientTop} />
            <div className={styles.bgOrb} />

            {/* Navbar */}
            <nav className={styles.nav}>
                <div className={styles.logoGroup}>
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

                {!loading && (
                    <div className={styles.navButtons}>
                        {user ? (
                            <div className={styles.userInfo}>
                                <button onClick={() => setIsSettingsOpen(true)} className={styles.iconBtn} style={{ marginRight: 8 }} title="AI 설정">
                                    <Settings size={20} />
                                </button>
                                <span className={styles.userEmail}>{user.email.split('@')[0]}님</span>
                                <button onClick={handleLogout} className={styles.loginBtn} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <LogOut size={14} /> 로그아웃
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link href="/login" className={styles.loginBtn}>로그인</Link>
                                <Link href="/signup" className={styles.startBtn}>시작하기</Link>
                            </>
                        )}
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <main className={mainStyle(styles)}>

                {/* Brand Badge */}
                <div className={styles.badge}>
                    <span className={styles.badgeIcon}>T</span>
                    <span className={styles.badgeText}>TRIANGLE</span>
                    <span className={styles.badgePro}>PRO</span>
                </div>

                {/* Title */}
                <h1 className={styles.title}>
                    <span className={styles.titleLine1}>인스타그램 카드뉴스,</span>
                    <span className={styles.titleLine2}>3초만에 만들기</span>
                </h1>

                <p className={styles.description}>
                    디자인 경험 없이도 전문가 수준의 카드뉴스를 만들 수 있습니다.<br />
                    내용만 입력하면 디자인은 자동으로!
                </p>

                {/* Ad Placement 1: Top Billboard */}
                <AdBanner slot="4966757696" />

                {/* Features Cards Grid */}
                <div className={styles.grid}>

                    {/* Card 1: Triangle Express */}
                    <Link href="/maker" onClick={(e) => handleServiceClick(e, '/maker')} className={`${styles.cardLink} ${styles.makerCard}`}>
                        {!user && <div className={styles.lockOverlay}><Lock size={20} /></div>}
                        <div className={styles.makerBadge}>추천</div>
                        <div className={`${styles.cardContent} ${styles.makerContent}`}>
                            <div className={styles.makerBgBlur}></div>
                            <div className={`${styles.cardIconBox} ${styles.makerIconBox}`} style={{ background: '#3b82f6' }}>
                                <Zap size={24} color="white" fill="currentColor" />
                            </div>
                            <h3 className={styles.cardTitle}>Triangle Express</h3>
                            <p className={styles.cardDesc}>구조 선택 → 내용 입력 → 테마 적용<br />6장 세트를 한 번에 완성!</p>
                            <ul className={styles.cardList}>
                                {['10가지 검증된 구조 템플릿', 'AI 제목 추천', '테마 팩 미리보기'].map((item, i) => (
                                    <li key={i} className={styles.listItem}><div className={styles.checkIcon}><Check size={10} color="#60a5fa" /></div>{item}</li>
                                ))}
                            </ul>
                            <div className={`${styles.cardFooter} ${styles.makerFooter}`}>시작하기 <ChevronRight size={16} /></div>
                        </div>
                    </Link>

                    {/* Card 2: AI Story Creator */}
                    <Link href="/story" onClick={(e) => handleServiceClick(e, '/story')} className={`${styles.cardLink} ${styles.editorCard}`} style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                        {!user && <div className={styles.lockOverlay}><Lock size={20} /></div>}
                        <div className={`${styles.cardContent} ${styles.editorContent}`}>
                            <div className={`${styles.cardIconBox}`} style={{ background: 'linear-gradient(135deg, #161616 0%, #1e293b 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <Bot size={24} color="#60a5fa" />
                            </div>
                            <h3 className={styles.cardTitle} style={{ color: '#93c5fd' }}>AI Story Creator</h3>
                            <p className={styles.cardDesc}>블로그 링크만 넣으세요.<br />AI가 요약하고 이미지까지 자동 생성!</p>
                            <ul className={styles.cardList}>
                                {['블로그 링크 자동 분석', '이미지 자동 추출', '감성 캡션 생성'].map((item, i) => (
                                    <li key={i} className={styles.listItem}><div className={styles.checkIcon}><Check size={10} color="#60a5fa" /></div>{item}</li>
                                ))}
                            </ul>
                            <div className={`${styles.cardFooter} ${styles.editorFooter}`} style={{ color: '#93c5fd' }}>체험하기 <ChevronRight size={16} /></div>
                        </div>
                    </Link>

                    {/* Card 3: Triangle Studio */}
                    <Link href="/editor" onClick={(e) => handleServiceClick(e, '/editor')} className={`${styles.cardLink} ${styles.editorCard}`}>
                        {!user && <div className={styles.lockOverlay}><Lock size={20} /></div>}
                        <div className={`${styles.cardContent} ${styles.editorContent}`}>
                            <div className={`${styles.cardIconBox} ${styles.editorIconBox}`}><PenTool size={24} color="#d1d5db" /></div>
                            <h3 className={styles.cardTitle}>Triangle Studio</h3>
                            <p className={styles.cardDesc}>자유도 100% 캔버스<br />포토샵급 정밀 편집 도구</p>
                            <ul className={styles.cardList}>
                                {['레이어 편집', '다양한 도형 & 스티커', '디테일한 속성 제어'].map((item, i) => (
                                    <li key={i} className={styles.listItem}><div className={styles.checkIcon}><Check size={10} color="#d1d5db" /></div>{item}</li>
                                ))}
                            </ul>
                            <div className={`${styles.cardFooter} ${styles.editorFooter}`}>에디터 열기 <ChevronRight size={16} /></div>
                        </div>
                    </Link>

                    {/* Card 4: 2Days Economy News */}
                    <Link href="/today" onClick={(e) => handleServiceClick(e, '/today')} className={`${styles.cardLink}`} style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                        {!user && <div className={styles.lockOverlay}><Lock size={20} /></div>}
                        <div className={`${styles.cardContent}`} style={{ background: 'rgba(10, 10, 20, 0.8)' }}>
                            <div className={styles.makerBadge} style={{ background: '#3b82f6', color: 'white' }}>NEW</div>
                            <div className={`${styles.cardIconBox}`} style={{ background: '#1e3a8a' }}><Globe size={24} color="white" /></div>
                            <h3 className={styles.cardTitle}>2Days Economy</h3>
                            <p className={styles.cardDesc}>매일 8시 정기 업데이트<br />AI가 직접 엄선한 경제 뉴스 & 지수</p>
                            <ul className={styles.cardList}>
                                {['실시간 RSS 분석', '주요 지표 자동 요약', '정기 히스토리 보관'].map((item, i) => (
                                    <li key={i} className={styles.listItem}><div className={styles.checkIcon}><Check size={10} color="#3b82f6" /></div>{item}</li>
                                ))}
                            </ul>
                            <div className={styles.cardFooter} style={{ color: '#60a5fa' }}>오늘 뉴스 보기 <ChevronRight size={16} /></div>
                        </div>
                    </Link>

                </div>

                {/* Ad Placement 2: Mid-grid Ad */}
                <AdBanner slot="3106703198" />

                {/* Footer Features */}
                <div className={styles.features}>
                    <div className={styles.featureItem}>
                        <div className={styles.featureIconBox} style={{ background: 'rgba(250, 204, 21, 0.2)' }}><Palette size={20} color="#facc15" /></div>
                        <span className={styles.featureText}>10+ 테마 팩</span>
                    </div>
                    <div className={styles.featureItem} style={{ transform: 'scale(1.05)', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                        <div className={styles.featureIconBox} style={{ background: 'white' }}><Layout size={20} color="black" /></div>
                        <span className={styles.featureText}>자동 레이아웃</span>
                    </div>
                    <div className={styles.featureItem}>
                        <div className={styles.featureIconBox} style={{ background: 'rgba(96, 165, 250, 0.2)' }}><Smartphone size={20} color="#60a5fa" /></div>
                        <span className={styles.featureText}>고해상도</span>
                    </div>
                </div>
            </main>

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3><Key size={18} /> 통합 AI 설정 (전체 서비스 적용)</h3>
                            <button onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
                        </div>
                        <div className={styles.modalBody}>
                            <p className={styles.modalDesc}>본인의 API 키를 등록하면 모든 AI 도구(리포트, 스토리, 편집기 등)에서 제한 없이 고성능 분석을 이용할 수 있습니다.</p>

                            <div className={styles.inputGroup}>
                                <label>Gemini API Key</label>
                                <input
                                    type="password"
                                    placeholder="AIzaSy..."
                                    value={userKeys.gemini}
                                    onChange={(e) => setUserKeys({ ...userKeys, gemini: e.target.value })}
                                />
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">키 발급받기 ↗</a>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>OpenAI API Key</label>
                                <input
                                    type="password"
                                    placeholder="sk-..."
                                    value={userKeys.openai}
                                    onChange={(e) => setUserKeys({ ...userKeys, openai: e.target.value })}
                                />
                                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">키 발급받기 ↗</a>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button onClick={saveSettings} className={styles.saveBtn}>저장하기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function mainStyle(styles) {
    return styles.main;
}
