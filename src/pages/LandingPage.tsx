import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GraduationCap, Sparkles, ChevronRight, Globe, ChevronDown, Link2, Scale, Swords } from 'lucide-react';
import { useUIStore } from '@/store';
import { audioManager } from '@/lib/audioManager';

// ─── Chain Link Decoration ────────────────────────────────────
function ChainLinks({ className }: { className?: string }) {
    return (
        <div className={`flex items-center gap-1 opacity-40 ${className}`}>
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="w-5 h-3 rounded-full border-2 border-[#c9a227]"
                    style={{ transform: i % 2 === 0 ? 'rotate(0deg)' : 'rotate(90deg)' }}
                />
            ))}
        </div>
    );
}

// ─── Floating Coin ────────────────────────────────────────────
function FloatingCoin({ style }: { style: React.CSSProperties }) {
    return (
        <div
            className="absolute rounded-full border border-[#c9a227]/40"
            style={{
                background: 'radial-gradient(circle at 35% 35%, #ffd700, #b8860b)',
                boxShadow: '0 0 8px rgba(201,162,39,0.5)',
                animation: `particle-float ${4 + Math.random() * 3}s ease-in-out infinite`,
                ...style,
            }}
        />
    );
}

// ─── Glowing Orb (imprisoned sage) ───────────────────────────
function SageOrb({
    index, name, color,
}: {
    index: number; name: string; color: string;
}) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.15, type: 'spring', stiffness: 180 }}
            className="flex flex-col items-center gap-2 group cursor-default"
        >
            <div
                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                style={{
                    background: `radial-gradient(circle at 40% 35%, ${color}33, ${color}11)`,
                    border: `1.5px solid ${color}55`,
                    boxShadow: `0 0 18px ${color}44, inset 0 0 12px ${color}22`,
                    animation: `float ${3.5 + index * 0.3}s ease-in-out infinite`,
                    animationDelay: `${index * 0.4}s`,
                }}
            >
                {/* Blindfold bar */}
                <div
                    className="absolute w-9 h-2 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}99, ${color}cc, ${color}99)` }}
                />
                <span className="text-xl relative z-10">😶</span>
            </div>
            <span className="text-[10px] sm:text-xs text-center leading-tight"
                style={{ color: `${color}99` }}>
                {name}
            </span>
        </motion.div>
    );
}

// ─── Phase Card ───────────────────────────────────────────────
function PhaseCard({
    phase, name, desc, color, emoji, delay,
}: {
    phase: number; name: string; desc: string;
    color: string; emoji: string; delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true }}
            className="relative rounded-2xl p-6 overflow-hidden group cursor-default"
            style={{
                background: `linear-gradient(135deg, ${color}0d, ${color}05)`,
                border: `1px solid ${color}22`,
            }}
        >
            {/* Glow on hover */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 40px ${color}15` }}
            />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{emoji}</span>
                    <span
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: `${color}22`, color, border: `1px solid ${color}40` }}
                    >
                        Phase {phase}
                    </span>
                </div>
                <h3 className="font-black text-lg mb-2 text-white">{name}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(180,170,210,0.8)' }}>{desc}</p>
            </div>
        </motion.div>
    );
}

// ─── Main ─────────────────────────────────────────────────────
export default function LandingPage() {
    const navigate = useNavigate();
    const { setLanguage, language } = useUIStore();
    const { scrollY } = useScroll();

    // Landing BGM — 첫 인터랙션 후 자동 재생
    useEffect(() => {
        audioManager.playBGM('landing');
        return () => audioManager.stopBGM();
    }, []);

    // Parallax - castle image scrolls slower than content
    const castleY = useTransform(scrollY, [0, 600], [0, 120]);
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

    const sages = [
        { name: '진실의 현자', color: '#38bdf8' },
        { name: '정의의 현자', color: '#06d6a0' },
        { name: '지혜의 현자', color: '#a78bfa' },
        { name: '연대의 현자', color: '#fb923c' },
        { name: '용기의 현자', color: '#f43f5e' },
    ];

    const phases = [
        { phase: 0, name: '환상의 장막', desc: '달콤한 초콜릿 광고 뒤에 숨겨진 불편한 진실. 마몬의 황금 안대가 세상을 가렸다.', color: '#f43f5e', emoji: '🎭' },
        { phase: 1, name: '진실의 돋보기', desc: '화면을 문질러 착취의 현장을 파헤쳐라. 고발 리포트를 제출하여 교사의 인장을 받으라.', color: '#f5a623', emoji: '🔍' },
        { phase: 2, name: '지혜의 토론', desc: '5인의 AI 이해관계자와 협상하라. 당신의 공감 깊이를 AI가 분석하고 점수화한다.', color: '#06d6a0', emoji: '⚖️' },
        { phase: 3, name: '공정의 설계', desc: '가격 시뮬레이터로 진정한 공정가를 도출하라. 현자들의 황금 안대를 벗겨라.', color: '#a78bfa', emoji: '✨' },
    ];

    return (
        <div className="min-h-screen overflow-x-hidden"
            style={{ background: 'linear-gradient(180deg, #0a0618 0%, #110d2e 40%, #0d0d1a 100%)' }}>

            {/* ── Sticky Header ── */}
            <header className="fixed top-0 left-0 right-0 z-50"
                style={{ background: 'rgba(10,6,24,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
                <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #e94560)' }}>
                            공
                        </div>
                        <div className="hidden sm:block">
                            <span className="font-black text-white text-sm">공정공장</span>
                            <span className="text-purple-400 text-xs ml-2 opacity-60">The Justice Architects</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                            className="p-2 rounded-lg text-purple-300 hover:text-white hover:bg-white/10 transition-all text-sm flex items-center gap-1"
                            aria-label="언어 변경"
                        >
                            <Globe size={14} /> {language === 'ko' ? 'EN' : 'KO'}
                        </button>
                        <button
                            onClick={() => navigate('/teacher/login')}
                            aria-label="교사 로그인 - Game Master로 수업 진행하기"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-500/10 transition-all"
                        >
                            <GraduationCap size={15} /> 교사 로그인
                        </button>
                        <button
                            onClick={() => navigate('/join')}
                            aria-label="학생으로 게임 참여하기"
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
                        >
                            <Sparkles size={14} /> 학생 입장
                        </button>
                    </div>
                </nav>
            </header>

            {/* ════════════════════════════════════════════
          HERO SECTION — Castle Background
      ════════════════════════════════════════════ */}
            <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
                aria-labelledby="hero-title">

                {/* ── Castle Background with Parallax ── */}
                <motion.div
                    style={{ y: castleY }}
                    className="absolute inset-0 w-full h-full"
                >
                    <img
                        src="/hero-castle.png"
                        alt="침묵의 성 - 마몬이 지배하는 황금 사슬의 요새"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        style={{ filter: 'brightness(0.45) saturate(1.2) hue-rotate(20deg)' }}
                    />
                </motion.div>

                {/* ── Gradient Overlays ── */}
                {/* Top fade */}
                <div className="absolute inset-x-0 top-0 h-32 z-10"
                    style={{ background: 'linear-gradient(to bottom, #0a0618 0%, transparent 100%)' }} />
                {/* Bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-48 z-10"
                    style={{ background: 'linear-gradient(to top, #0d0d1a 0%, transparent 100%)' }} />
                {/* Purple tint overlay */}
                <div className="absolute inset-0 z-10"
                    style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(109,40,217,0.25) 0%, rgba(10,6,24,0.5) 70%)' }} />
                {/* Left vignette for text readability */}
                <div className="absolute inset-0 z-10"
                    style={{ background: 'radial-gradient(ellipse at 30% 50%, transparent 30%, rgba(10,6,24,0.6) 100%)' }} />

                {/* ── Floating Coins ── */}
                {Array.from({ length: 12 }).map((_, i) => (
                    <FloatingCoin
                        key={i}
                        style={{
                            width: `${8 + Math.random() * 14}px`,
                            height: `${8 + Math.random() * 14}px`,
                            left: `${5 + Math.random() * 90}%`,
                            top: `${10 + Math.random() * 80}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            zIndex: 15,
                        }}
                    />
                ))}

                {/* ── Main Content ── */}
                <motion.div
                    style={{ opacity: heroOpacity }}
                    className="relative z-20 text-center px-6 max-w-4xl mx-auto pt-20"
                >
                    {/* Eyebrow badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold uppercase tracking-widest"
                        style={{
                            background: 'rgba(124,58,237,0.2)',
                            border: '1px solid rgba(124,58,237,0.5)',
                            color: '#c4b5fd',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <Link2 size={11} />
                        에듀테크 롤플레잉 시뮬레이션
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        id="hero-title"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.1 }}
                        className="font-black leading-tight mb-3"
                        style={{ fontSize: 'clamp(2.2rem, 7vw, 4.8rem)' }}
                    >
                        <span style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #ddd6fe 40%, #c4b5fd 70%, #a78bfa 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '-0.02em',
                        }}>
                            Fair Factory Friends
                        </span>
                    </motion.h1>

                    {/* Korean subtitle with separator */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="flex items-center justify-center gap-3 mb-3"
                    >
                        <div className="h-px w-8 opacity-30" style={{ background: '#fbbf24' }} />
                        <span
                            className="font-black tracking-widest"
                            style={{
                                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontSize: 'clamp(1.1rem, 3.5vw, 2rem)',
                            }}
                        >
                            공정공장 공정가들
                        </span>
                        <div className="h-px w-8 opacity-30" style={{ background: '#fbbf24' }} />
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-sm mb-6 tracking-[0.4em] uppercase font-semibold"
                        style={{
                            background: 'linear-gradient(135deg, #06d6a0, #38bdf8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Just fair
                    </motion.p>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.35 }}
                        className="text-base sm:text-lg leading-relaxed mb-10 max-w-2xl mx-auto"
                        style={{ color: 'rgba(196,181,253,0.75)' }}
                    >
                        탐욕의 사이렌 <strong style={{ color: '#f43f5e' }}>마몬</strong>이 황금 사슬로 세상을 침묵의 성에 가뒀습니다.
                        <br className="hidden sm:block" />
                        공정가가 되어 왜곡된 경제 구조를 파헤치고,&nbsp;
                        <strong style={{ color: '#fbbf24' }}>공정의 노래</strong>로 현자들의 눈을 뜨게 하세요.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.45 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                    >
                        <button
                            onClick={() => navigate('/join')}
                            aria-label="학생으로 게임 참여하기 - 공정가로 합류"
                            className="group flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-lg text-white w-full sm:w-auto justify-center transition-all duration-300"
                            style={{
                                background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                                boxShadow: '0 0 30px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.4)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 0 50px rgba(124,58,237,0.8), 0 4px 30px rgba(0,0,0,0.5)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = '0 0 30px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.4)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <Sparkles size={20} />
                            30분으로 세상을 바꾸는 수업 시작하기
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/teacher/login')}
                            aria-label="교사 로그인 - Game Master로 수업 진행하기"
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base w-full sm:w-auto justify-center transition-all duration-300"
                            style={{
                                background: 'rgba(245,162,35,0.12)',
                                border: '1.5px solid rgba(245,162,35,0.4)',
                                color: '#fbbf24',
                                backdropFilter: 'blur(10px)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(245,162,35,0.22)';
                                e.currentTarget.style.borderColor = 'rgba(245,162,35,0.8)';
                                e.currentTarget.style.boxShadow = '0 0 25px rgba(245,162,35,0.35)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(245,162,35,0.12)';
                                e.currentTarget.style.borderColor = 'rgba(245,162,35,0.4)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <GraduationCap size={18} />
                            Game Master 입장
                        </button>
                    </motion.div>

                    {/* ── 5 Imprisoned Sages ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        <p className="text-xs uppercase tracking-[0.2em] mb-5"
                            style={{ color: 'rgba(139,92,246,0.5)' }}>
                            ⛓ 침묵의 성에 결박된 현자들 ⛓
                        </p>
                        <div className="flex items-start justify-center gap-4 sm:gap-8">
                            {sages.map((s, i) => (
                                <SageOrb key={s.name} index={i} name={s.name} color={s.color} />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>

                {/* ── Scroll Indicator ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
                >
                    <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(139,92,246,0.5)' }}>Scroll</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <ChevronDown size={18} style={{ color: 'rgba(139,92,246,0.5)' }} />
                    </motion.div>
                </motion.div>
            </section>

            {/* ════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════ */}
            <section
                className="py-8 relative"
                style={{ background: 'rgba(109,40,217,0.08)', borderTop: '1px solid rgba(109,40,217,0.2)', borderBottom: '1px solid rgba(109,40,217,0.2)' }}
                aria-label="플랫폼 통계"
            >
                <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                    {[
                        { value: '4단계', label: '게임 페이즈', icon: '🎮' },
                        { value: '5인', label: '페르소나 역할', icon: '🎭' },
                        { value: '5명', label: 'AI 협상 NPC', icon: '🤝' },
                        { value: 'PWA', label: '설치형 앱 지원', icon: '📱' },
                    ].map(({ value, label, icon }) => (
                        <div key={label}>
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className="text-2xl font-black" style={{
                                background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>{value}</div>
                            <div className="text-xs mt-1" style={{ color: 'rgba(167,139,250,0.6)' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════════════════
          PHASE CARDS
      ════════════════════════════════════════════ */}
            <section className="py-24 px-6 max-w-6xl mx-auto" aria-labelledby="phases-title">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <h2 id="phases-title" className="text-4xl font-black mb-4">
                        <span style={{
                            background: 'linear-gradient(135deg, #c4b5fd, #7c3aed)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>게임 흐름</span>
                    </h2>
                    <p style={{ color: 'rgba(167,139,250,0.6)' }}>
                        4개의 Phase를 거쳐 황금 안대를 벗겨라
                    </p>
                    <ChainLinks className="justify-center mt-6" />
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {phases.map((p, i) => (
                        <PhaseCard key={p.phase} {...p} delay={i * 0.1} />
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════════════════
          PERSONA SECTION
      ════════════════════════════════════════════ */}
            <section
                className="py-24 px-6"
                style={{ background: 'linear-gradient(180deg, transparent, rgba(109,40,217,0.08), transparent)' }}
                aria-labelledby="persona-title"
            >
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <h2 id="persona-title" className="text-4xl font-black mb-4 text-white">5인의 공정가</h2>
                        <p style={{ color: 'rgba(167,139,250,0.6)' }}>
                            각자의 역할이 하나의 팀을 완성합니다
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        {[
                            { name: '알파', title: '분석가', emoji: '📊', color: '#38bdf8', desc: '팩트 체크, 경제 수치 분석' },
                            { name: '델타', title: '중재자', emoji: '🕊️', color: '#06d6a0', desc: '갈등 완화, 이견 조율' },
                            { name: '오메가', title: '설계자', emoji: '💡', color: '#a78bfa', desc: '윈윈 모델 창의적 제안' },
                            { name: '람다', title: '치유사', emoji: '💚', color: '#fb923c', desc: '팀워크 관리, 버프 부여' },
                            { name: '시그마', title: '수호자', emoji: '⚡', color: '#f43f5e', desc: 'AI 논리 허점 압박 질문' },
                        ].map((p, i) => (
                            <motion.div
                                key={p.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                viewport={{ once: true }}
                                className="rounded-2xl p-5 text-center group cursor-default transition-all duration-300"
                                style={{
                                    background: `linear-gradient(135deg, ${p.color}0d, ${p.color}05)`,
                                    border: `1px solid ${p.color}25`,
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${p.color}60`; e.currentTarget.style.boxShadow = `0 0 25px ${p.color}20`; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${p.color}25`; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div className="text-3xl mb-3">{p.emoji}</div>
                                <div className="font-black text-white text-lg">{p.name}</div>
                                <div className="text-xs font-bold mb-2" style={{ color: p.color }}>{p.title}</div>
                                <div className="text-xs leading-relaxed" style={{ color: 'rgba(167,139,250,0.6)' }}>{p.desc}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════
          NPC SECTION
      ════════════════════════════════════════════ */}
            <section className="py-24 px-6 max-w-5xl mx-auto" aria-labelledby="npc-title">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <h2 id="npc-title" className="text-4xl font-black mb-4 text-white">협상 상대 NPC</h2>
                    <p style={{ color: 'rgba(167,139,250,0.6)' }}>
                        5명 중 3명 이상 설득 시 공정의 설계 단계로 진입
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {[
                        { name: '😈 고렉스 (Gorex)', role: '대형 유통업자', agenda: '마진 40% 사수', weakness: '농장주 대비 3배 수익 비교 지적', color: '#f43f5e' },
                        { name: '😔 티에라 (Tierra)', role: '소규모 농장주', agenda: '빚더미, 인증비 부담', weakness: '인증 지원 제도 정보 제공 시 협력 전환', color: '#fb923c' },
                        { name: '🏢 맥스웰 (Maxwell)', role: '다국적 기업 임원', agenda: 'CSR로 이미지 세탁 중', weakness: 'CSR 보고서 vs 실제 데이터 불일치 고발', color: '#fbbf24' },
                        { name: '🌱 아마라 (Amara)', role: '현지 협동조합장', agenda: '공정무역 신봉, 설득 어려움', weakness: '윈윈 모델 제안 시 연대 즉시 선언', color: '#06d6a0' },
                        { name: '🛒 김현주 (Kim)', role: '소비자 대표', agenda: '"비싼 제품은 사치"', weakness: '가격차가 200원임을 감성적으로 전달', color: '#38bdf8' },
                    ].map((npc, i) => (
                        <motion.div
                            key={npc.name}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            viewport={{ once: true }}
                            className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                            style={{
                                background: `linear-gradient(135deg, ${npc.color}0a, transparent)`,
                                borderLeft: `3px solid ${npc.color}60`,
                                border: `1px solid ${npc.color}18`,
                                borderLeftWidth: '3px',
                            }}
                        >
                            <div className="flex-shrink-0 sm:w-48">
                                <div className="font-bold text-white text-sm">{npc.name}</div>
                                <div className="text-xs" style={{ color: npc.color }}>{npc.role}</div>
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{ color: 'rgba(167,139,250,0.7)' }}>
                                <div><span className="opacity-50">숨겨진 의도</span><br />{npc.agenda}</div>
                                <div><span className="opacity-50">약점</span><br />{npc.weakness}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════════════════
          CTA BOTTOM
      ════════════════════════════════════════════ */}
            <section className="py-28 px-6 text-center relative overflow-hidden"
                aria-labelledby="cta-title">

                {/* Glow orb behind */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-96 h-96 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative z-10 max-w-xl mx-auto"
                >
                    <ChainLinks className="justify-center mb-8" />
                    <div className="text-6xl mb-6">🌱</div>
                    <h2 id="cta-title" className="text-4xl sm:text-5xl font-black mb-5 text-white">
                        지금 씨앗을 심으세요
                    </h2>
                    <p className="mb-10 text-lg leading-relaxed" style={{ color: 'rgba(196,181,253,0.7)' }}>
                        씨앗에서 지혜의 현자로.
                        <br />당신의 선택이 세상의 사슬을 끊습니다.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={() => navigate('/join')}
                            aria-label="지금 게임 참여하기 - 공정가로 시작"
                            className="flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-xl text-white transition-all duration-300 w-full sm:w-auto justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                                boxShadow: '0 0 40px rgba(124,58,237,0.5)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(124,58,237,0.7)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(124,58,237,0.5)'; }}
                        >
                            <Swords size={24} />
                            공정가로 시작하기
                        </button>
                        <button onClick={() => navigate('/teacher/login')}
                            className="flex items-center gap-3 px-8 py-5 rounded-2xl font-bold text-base border transition-all duration-300 w-full sm:w-auto justify-center"
                            style={{ borderColor: 'rgba(245,162,35,0.4)', color: '#fbbf24' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,162,35,0.1)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(245,162,35,0.3)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <Scale size={18} />
                            교사로 시작하기
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ── */}
            <footer
                className="py-8 px-6 text-center text-xs"
                style={{ borderTop: '1px solid rgba(109,40,217,0.2)', color: 'rgba(139,92,246,0.4)' }}
            >
                <p>© 2026 Fair Factory Friends — 공정공장 공정가들 · Just fair</p>
                <p className="mt-1 opacity-60">사회정서학습(SEL) + 공정무역 에듀테크 플랫폼</p>
            </footer>
        </div>
    );
}
