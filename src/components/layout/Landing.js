'use client';

import { Zap, PenTool, LayoutTemplate, Palette, Sparkles, MonitorPlay } from 'lucide-react';

export default function Landing({ onStart }) {
    return (
        <div className="min-h-screen bg-bg-darker flex flex-col items-center justify-center relative overflow-hidden select-none">

            {/* 배경 데코레이션 */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

            {/* 메인 콘텐츠 컨테이너 */}
            <div className="z-10 flex flex-col items-center w-full max-w-5xl px-6 animate-in fade-in zoom-in-95 duration-700">

                {/* 헤더/타이틀 영역 */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-6 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                        <span className="text-xs font-bold text-white tracking-wide">InstaFlow v2.0</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
                        인스타그램 카드뉴스,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-blue-400">
                            3초만에 만들기
                        </span>
                    </h1>
                    <p className="text-text-secondary text-lg max-w-2xl mx-auto font-medium">
                        디자인 경험 없이도 전문가 수준의 카드뉴스를 만들 수 있습니다.<br />
                        내용만 입력하면 디자인은 자동으로 완성됩니다.
                    </p>
                </div>

                {/* 선택 카드 영역 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">

                    {/* 1. 원클릭 메이커 (자동) */}
                    <button
                        onClick={() => onStart('auto')}
                        className="group relative flex flex-col items-start p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-accent-primary/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(124,58,237,0.3)] hover:-translate-y-1 text-left"
                    >
                        <div className="absolute inset-0 bg-accent-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />

                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-primary to-fuchsia-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Zap size={28} className="text-white fill-white" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-accent-primary transition-colors">
                            원클릭 메이커
                        </h3>
                        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                            구조 선택 → 내용 입력 → 테마 적용<br />
                            6장 세트를 한 번에 완성하세요!
                        </p>

                        <div className="space-y-2 w-full">
                            <CheckItem text="10가지 검증된 구조 템플릿" />
                            <CheckItem text="AI 제목 추천 (Gemini 연동)" />
                            <CheckItem text="테마 팩 실시간 미리보기" />
                        </div>

                        <div className="mt-8 flex items-center gap-2 text-sm font-bold text-accent-primary opacity-80 group-hover:opacity-100">
                            시작하기 <MonitorPlay size={16} />
                        </div>
                    </button>


                    {/* 2. 클래식 에디터 (수동) */}
                    <button
                        onClick={() => onStart('classic')}
                        className="group relative flex flex-col items-start p-8 rounded-3xl bg-bg-panel/50 border border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:-translate-y-1 text-left"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />

                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <PenTool size={28} className="text-white" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
                            클래식 에디터
                        </h3>
                        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
                            드래그 앤 드롭으로 자유롭게 작성<br />
                            기존 사용자를 위한 프리스타일 에디터
                        </p>

                        <div className="space-y-2 w-full">
                            <CheckItem text="자유로운 레이아웃 배치" iconColor="text-green-500" />
                            <CheckItem text="8가지 테마 선택" iconColor="text-green-500" />
                            <CheckItem text="30+ 디자인 템플릿" iconColor="text-green-500" />
                        </div>

                        <div className="mt-8 flex items-center gap-2 text-sm font-bold text-green-400 opacity-80 group-hover:opacity-100">
                            에디터 열기 <MonitorPlay size={16} />
                        </div>
                    </button>
                </div>

                {/* 하단 푸터 (장식용) */}
                <div className="mt-20 flex gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="flex flex-col items-center gap-2">
                        <LayoutTemplate size={24} className="text-white" />
                        <span className="text-[10px] text-white">Templates</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Palette size={24} className="text-white" />
                        <span className="text-[10px] text-white">Colors</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Sparkles size={24} className="text-white" />
                        <span className="text-[10px] text-white">AI Magic</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

function CheckItem({ text, iconColor = "text-accent-primary" }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full bg-white/10 flex items-center justify-center ${iconColor}`}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 4 7 9 1" />
                </svg>
            </div>
            <span className="text-text-secondary text-xs">{text}</span>
        </div>
    )
}
