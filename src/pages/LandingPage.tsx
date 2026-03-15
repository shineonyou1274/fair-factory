import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
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

// ─── Sage Portrait (imprisoned sage) ─────────────────────────
function SageOrb({
    index, name, color,
}: {
    index: number; name: string; color: string;
}) {
    const imgSrc = `/sages/sage${index + 1}.png`;
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.15, type: 'spring', stiffness: 180 }}
            className="flex flex-col items-center gap-2 group cursor-default"
        >
            <div
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                    border: `2px solid ${color}55`,
                    boxShadow: `0 0 20px ${color}44, inset 0 0 12px ${color}22`,
                    animation: `float ${3.5 + index * 0.3}s ease-in-out infinite`,
                    animationDelay: `${index * 0.4}s`,
                }}
            >
                <img src={imgSrc} alt={name}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                    style={{ filter: 'brightness(0.5) saturate(0.3)' }}
                />
                {/* Blindfold overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-1.5 rounded-full"
                        style={{ background: `linear-gradient(90deg, ${color}aa, ${color}dd, ${color}aa)`, boxShadow: `0 0 8px ${color}66` }} />
                </div>
            </div>
            <span className="text-[10px] sm:text-xs text-center leading-tight font-medium"
                style={{ color: `${color}99` }}>
                {name}
            </span>
        </motion.div>
    );
}

// ─── Phase Card ───────────────────────────────────────────────
function PhaseCard({
    phase, name, desc, color, emoji, delay, sage,
}: {
    phase: number; name: string; desc: string;
    color: string; emoji: string; delay: number; sage?: string;
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
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(180,170,210,0.8)' }}>{desc}</p>
                {sage && (
                    <div className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg"
                        style={{ background: `${color}10`, border: `1px solid ${color}20`, color }}>
                        <span>🎯</span> {sage}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Main ─────────────────────────────────────────────────────
export default function LandingPage() {
    const navigate = useNavigate();
    const { setLanguage, language } = useUIStore();
    const { scrollY } = useScroll();
    const [introStep, setIntroStep] = useState(0);

    const introDialogues = [
        "똑똑! 저희 목소리가 들리시나요?",
        "누군가 도와주러 온 것 같아!",
        "이곳은 마몬의 탐욕에 갇힌 '침묵의 성'입니다.",
        "현자들을 구출하고 공정의 노래를 되찾아주세요!",
        "자, 화면을 살펴보고 '공정가'가 되어주세요!",
    ];

    useEffect(() => {
        // 첫 시작 시 오디오 재생 대기 (인터랙션 필요)
        // introStep이 1 이상이 되면 재생
        if (introStep === 1) {
            audioManager.playBGM('landing');
        }
    }, [introStep]);

    const nextIntro = () => {
        if (introStep < introDialogues.length) {
            setIntroStep(s => s + 1);
            if (introStep > 0) audioManager.playSFX('click');
        }
    };

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
        { phase: 0, name: '환상의 장막', desc: '마몬이 뿌린 달콤한 광고의 환상을 뚫고, 공정가 페르소나를 선택하세요. 팀을 구성하여 침묵의 성으로 잠입합니다.', sage: '진실의 현자 구출 준비', color: '#f43f5e', emoji: '🎭' },
        { phase: 1, name: '진실의 돋보기', desc: '광고 뒤에 숨겨진 아동 노동, 착취 임금, 산림 파괴 등 5가지 진실을 스크래치로 파헤치세요. 고발 리포트를 작성하여 교사의 황금 인장을 받으면 현자가 풀려납니다!', sage: '정의의 현자 구출', color: '#f5a623', emoji: '🔍' },
        { phase: 2, name: '지혜의 토론', desc: '유통업자, 농장주, 기업 임원, 협동조합장, 소비자 — 5명의 AI NPC와 1:1 협상에 도전! 공감과 데이터로 3명 이상 설득하세요.', sage: '지혜의 현자 구출', color: '#06d6a0', emoji: '⚖️' },
        { phase: 3, name: '공정의 설계', desc: '가격 시뮬레이터로 농부·유통·기업의 배분율을 직접 조절하여 진정한 공정 가격을 설계하세요. 파이차트로 결과를 확인합니다.', sage: '연대·용기의 현자 구출', color: '#a78bfa', emoji: '✨' },
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
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-500/10 transition-all"
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

                {/* BGM Prompt (Tutorial Style Overlay) */}
                <AnimatePresence>
                    {introStep < introDialogues.length && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }}
                            className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer overflow-hidden p-6"
                            style={{ background: 'rgba(10,6,24,0.7)', backdropFilter: 'blur(12px)' }}
                            onClick={nextIntro}
                        >
                            {/* Decorative background glow for the overlay */}
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                style={{ background: 'radial-gradient(circle at center, rgba(124,58,237,0.2) 0%, transparent 60%)' }}
                            />

                            <motion.div
                                key={introStep}
                                initial={{ opacity: 0, scale: 0.85, y: 30, rotateX: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20, filter: 'blur(10px)' }}
                                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                className="relative px-8 py-10 rounded-[2rem] max-w-md w-full text-center shadow-2xl"
                                style={{
                                    background: 'linear-gradient(145deg, rgba(88,28,135,0.4), rgba(46,16,101,0.6))',
                                    border: '1.5px solid rgba(167,139,250,0.5)',
                                    boxShadow: '0 25px 50px -12px rgba(88,28,135,0.5), inset 0 0 20px rgba(167,139,250,0.2)',
                                    backdropFilter: 'blur(16px)'
                                }}
                            >
                                <motion.div
                                    className="text-5xl mb-6 mx-auto w-20 h-20 flex items-center justify-center rounded-3xl"
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    style={{
                                        background: 'rgba(139,92,246,0.2)',
                                        border: '1px solid rgba(167,139,250,0.4)',
                                        boxShadow: '0 0 20px rgba(139,92,246,0.3)'
                                    }}
                                >
                                    {introStep === 0 ? '🆘' : introStep === introDialogues.length - 1 ? '✨' : '💬'}
                                </motion.div>
                                <p className="text-xl sm:text-2xl font-black text-white leading-relaxed mb-10 tracking-wide" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                                    {introDialogues[introStep]}
                                </p>

                                <div className="flex flex-col items-center gap-2">
                                    <motion.div
                                        className="h-1 bg-purple-500 rounded-full mb-3"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((introStep + 1) / introDialogues.length) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                    <div className="text-xs font-bold tracking-widest animate-pulse flex items-center gap-2" style={{ color: 'rgba(196,181,253,0.9)' }}>
                                        <ChevronRight size={14} />
                                        화면을 터치해서 다음 읽기 ({introStep + 1}/{introDialogues.length})
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                        탐욕의 악마 <strong style={{ color: '#f43f5e' }}>마몬</strong>이 황금 안대로 현자들의 눈을 가리고,
                        <br className="hidden sm:block" />
                        거짓 광고와 착취로 세상을 <strong style={{ color: '#f43f5e' }}>침묵의 성</strong>에 가뒀습니다.
                        <br className="hidden sm:block" />
                        <span style={{ color: 'rgba(251,191,36,0.9)' }}>5명의 현자를 구출하고 공정의 노래를 되찾을 영웅,</span>
                        <br className="hidden sm:block" />
                        <strong style={{ color: '#fbbf24' }}>공정가(公正家)</strong>가 되어 미션을 클리어하세요!
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
                            className="group flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-lg text-white w-full sm:w-auto justify-center transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                                boxShadow: '0 0 30px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.4)',
                            }}
                        >
                            <Sparkles size={20} />
                            30분으로 세상을 바꾸는 수업 시작하기 (학생용)
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/teacher/login')}
                            aria-label="교사 로그인 - Game Master로 수업 진행하기"
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base w-full sm:w-auto justify-center transition-all duration-300 hover:brightness-125 active:scale-95"
                            style={{
                                background: 'rgba(245,162,35,0.12)',
                                border: '1.5px solid rgba(245,162,35,0.4)',
                                color: '#fbbf24',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <GraduationCap size={18} />
                            Game Master 입장 (교사용)
                        </button>
                    </motion.div>

                    {/* ── 5 Imprisoned Sages ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                    >
                        <p className="text-xs uppercase tracking-[0.2em] mb-2"
                            style={{ color: 'rgba(139,92,246,0.5)' }}>
                            ⛓ 침묵의 성에 결박된 현자들 ⛓
                        </p>
                        <p className="text-xs mb-5 max-w-md mx-auto leading-relaxed"
                            style={{ color: 'rgba(196,181,253,0.5)' }}>
                            마몬이 황금 안대로 눈을 가린 5명의 현자들. 각 Phase를 클리어할 때마다 현자 한 명의 안대가 벗겨집니다.
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
          STORY INTRO — 미션 브리핑
      ════════════════════════════════════════════ */}
            <section
                className="py-12 relative"
                style={{ background: 'rgba(109,40,217,0.06)', borderTop: '1px solid rgba(109,40,217,0.15)', borderBottom: '1px solid rgba(109,40,217,0.15)' }}
                aria-label="미션 브리핑"
            >
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-xs uppercase tracking-[0.3em] mb-4 font-bold" style={{ color: 'rgba(244,63,94,0.7)' }}>
                            긴급 미션 브리핑
                        </p>
                        <h2 className="text-xl sm:text-2xl font-black text-white mb-5 leading-relaxed">
                            침묵의 성에서 <span style={{ color: '#f43f5e' }}>SOS 신호</span>가 왔습니다
                        </h2>
                        <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'rgba(196,181,253,0.7)' }}>
                            <p>
                                탐욕의 악마 <strong style={{ color: '#f43f5e' }}>마몬</strong>이 세상의 진실을 감추고,
                                공정한 무역을 지키던 <strong style={{ color: '#fbbf24' }}>5명의 현자</strong>를 황금 안대로 결박했습니다.
                            </p>
                            <p>
                                현자들이 침묵하자, 농부의 아이들은 학교 대신 농장으로,
                                소비자들은 거짓 광고에 속아 착취의 사슬을 이어가고 있습니다.
                            </p>
                            <p style={{ color: 'rgba(251,191,36,0.9)' }}>
                                <strong>공정가(公正家)</strong>로 선발된 당신만이 이 사슬을 끊을 수 있습니다.
                                <br />4개의 미션을 클리어하고, 현자들의 눈을 되찾아주세요!
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ════════════════════════════════════════════
          VILLAIN STORY — 마몬
      ════════════════════════════════════════════ */}
            <section className="py-20 px-6 max-w-4xl mx-auto" aria-labelledby="villain-title">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="rounded-3xl overflow-hidden relative"
                    style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(10,6,24,0.95))', border: '1px solid rgba(244,63,94,0.2)' }}
                >
                    {/* 마몬 소개 */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-8 sm:p-10">
                        <div className="flex-shrink-0">
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden"
                                style={{ border: '2px solid rgba(244,63,94,0.4)', boxShadow: '0 0 30px rgba(244,63,94,0.2)' }}>
                                <img src="/boss/mamon.png" alt="마몬 - 탐욕의 악마"
                                    className="w-full h-full object-cover"
                                    style={{ filter: 'saturate(1.3) contrast(1.1)' }} />
                            </div>
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 id="villain-title" className="text-2xl sm:text-3xl font-black mb-3">
                                <span style={{ color: '#f43f5e' }}>마몬</span>
                                <span className="text-white"> — 탐욕의 악마</span>
                            </h2>
                            <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(196,181,253,0.75)' }}>
                                마몬은 <strong style={{ color: '#fbbf24' }}>황금 안대</strong>로 현자들의 눈을 가리고,
                                달콤한 광고로 소비자를 속이며 불공정한 무역 구조를 유지합니다.
                                농부들의 땀을 착취하고, 아이들의 교육 기회를 빼앗으며,
                                모든 진실을 <strong style={{ color: '#f43f5e' }}>침묵의 성</strong> 깊숙이 감추었습니다.
                            </p>
                            <p className="text-sm font-bold" style={{ color: 'rgba(251,191,36,0.9)' }}>
                                공정가여, 마몬의 거짓을 파헤치고 현자들을 구출하세요!
                            </p>
                        </div>
                    </div>

                    {/* 마몬의 수법 */}
                    <div className="px-8 sm:px-10 pb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { icon: '🎭', title: '거짓 광고', desc: '"행복한 농장에서 온 초콜릿" — 실제로는 아동 노동과 착취가 숨겨져 있습니다.' },
                            { icon: '⛓', title: '황금 사슬', desc: '농부에게 3%, 유통업자에게 40%. 불공정한 가격 구조로 빈곤의 사슬을 조여갑니다.' },
                            { icon: '🔇', title: '침묵의 강요', desc: '진실을 말하려는 현자들을 가두고, 세상이 아무것도 모르게 만듭니다.' },
                        ].map(item => (
                            <div key={item.title} className="rounded-xl p-4 text-center"
                                style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.12)' }}>
                                <div className="text-2xl mb-2">{item.icon}</div>
                                <div className="text-xs font-bold text-white mb-1">{item.title}</div>
                                <div className="text-xs leading-relaxed" style={{ color: 'rgba(196,181,253,0.6)' }}>{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
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
                        4개의 Phase를 클리어하여 현자들의 황금 안대를 벗겨라
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

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {[
                            { name: '알파', title: '분석가', emoji: '📊', color: '#38bdf8', desc: '팩트 체크, 경제 수치 분석', img: '/personas/alpha.png' },
                            { name: '델타', title: '중재자', emoji: '🕊️', color: '#06d6a0', desc: '갈등 완화, 이견 조율', img: '/personas/delta.png' },
                            { name: '오메가', title: '설계자', emoji: '💡', color: '#a78bfa', desc: '윈윈 모델 창의적 제안', img: '/personas/omega.png' },
                            { name: '람다', title: '치유사', emoji: '💚', color: '#fb923c', desc: '팀워크 관리, 버프 부여', img: '/personas/lambda.png' },
                            { name: '시그마', title: '수호자', emoji: '⚡', color: '#f43f5e', desc: 'AI 논리 허점 압박 질문', img: '/personas/sigma.png' },
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
                                <div className="relative w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden"
                                    style={{ border: `2px solid ${p.color}40`, boxShadow: `0 0 15px ${p.color}25` }}>
                                    <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                </div>
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
            <section className="py-16 px-6 max-w-5xl mx-auto" aria-labelledby="npc-title">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <h2 id="npc-title" className="text-3xl font-black mb-3 text-white">Phase 2 협상 상대</h2>
                    <p className="text-sm" style={{ color: 'rgba(167,139,250,0.6)' }}>
                        5명의 AI NPC와 대화하여 3명 이상 설득하세요. 각 NPC의 성격과 공략법은 게임 내에서 확인!
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { name: '고렉스', role: '유통업자', color: '#f43f5e', img: '/npcs/gorex.png' },
                        { name: '티에라', role: '농장주', color: '#fb923c', img: '/npcs/tierra.png' },
                        { name: '맥스웰', role: '기업 임원', color: '#fbbf24', img: '/npcs/maxwell.png' },
                        { name: '아마라', role: '협동조합장', color: '#06d6a0', img: '/npcs/amara.png' },
                        { name: '김현주', role: '소비자', color: '#38bdf8', img: '/npcs/kim.png' },
                    ].map((npc, i) => (
                        <motion.div
                            key={npc.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            viewport={{ once: true }}
                            className="rounded-2xl p-4 text-center group cursor-default"
                            style={{
                                background: `linear-gradient(135deg, ${npc.color}0d, ${npc.color}05)`,
                                border: `1px solid ${npc.color}25`,
                            }}
                        >
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 rounded-full overflow-hidden"
                                style={{ border: `2px solid ${npc.color}40`, boxShadow: `0 0 12px ${npc.color}20` }}>
                                <img src={npc.img} alt={npc.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy" />
                            </div>
                            <div className="font-black text-white text-sm">{npc.name}</div>
                            <div className="text-xs mt-0.5" style={{ color: npc.color }}>{npc.role}</div>
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
