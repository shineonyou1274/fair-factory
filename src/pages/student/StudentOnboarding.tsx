import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useAuthStore, useSessionStore } from '@/store';
import { createMockStudent, MOCK_GROUP } from '@/lib/mockData';
import { audioManager } from '@/lib/audioManager';
import type { Persona } from '@/types';

const PERSONAS: {
    id: Persona; name: string; title: string; emoji: string;
    color: string; colorBg: string; desc: string; action: string; actionDesc: string;
}[] = [
        { id: 'Alpha', name: '알파', title: '분석가', emoji: '📊', color: '#38bdf8', colorBg: 'rgba(56,189,248,0.12)', desc: '팩트 체크 & 수치 분석 담당. 팀의 두뇌!', action: '📊 데이터 스캔', actionDesc: 'AI NPC의 허위 수치를 즉시 반박 (1회/Phase)' },
        { id: 'Delta', name: '델타', title: '중재자', emoji: '🕊️', color: '#06d6a0', colorBg: 'rgba(6,214,160,0.12)', desc: '이견 조율 & 갈등 완화 담당. 팀의 평화!', action: '🕊️ 중재 선언', actionDesc: '갈등 패널티 면제, 재협상 기회 부여 (1회/Phase)' },
        { id: 'Omega', name: '오메가', title: '설계자', emoji: '💡', color: '#a78bfa', colorBg: 'rgba(167,139,250,0.12)', desc: '창의적 대안 제시 담당. 팀의 아이디어!', action: '💡 대안 카드', actionDesc: '새로운 협상안 제출, NPC 반응 변화 유도 (1회/Phase)' },
        { id: 'Lambda', name: '람다', title: '치유사', emoji: '💚', color: '#fb923c', colorBg: 'rgba(251,146,60,0.12)', desc: 'SEL & 팀워크 관리 담당. 팀의 심장!', action: '💚 힐링 버프', actionDesc: '팀 사기+10, 다음 행동 성공률 상승 (1회/Phase)' },
        { id: 'Sigma', name: '시그마', title: '수호자', emoji: '⚡', color: '#f43f5e', colorBg: 'rgba(244,63,94,0.12)', desc: '비판적 질문 & 허점 공격 담당. 팀의 칼!', action: '⚡ 급소 질문', actionDesc: 'NPC 신뢰도 -20%, 약점 노출 (2회/Phase)' },
    ];

const SORTING_MESSAGES = [
    '결정의 수정구슬이 빛나기 시작합니다...',
    '당신의 영혼을 들여다보고 있습니다...',
    '숨겨진 재능을 감지하는 중...',
    '공정의 운명이 결정되고 있습니다...',
    '현자들의 목소리가 속삭입니다...',
];

// ─── Sorting Hat Animation ────────────────────────────────────
function SortingAnimation({ onComplete }: { onComplete: (p: Persona) => void }) {
    const [messageIdx, setMessageIdx] = useState(0);
    const [shuffleVisible, setShuffleVisible] = useState(true);
    const [currentEmojis, setCurrentEmojis] = useState(['📊', '🕊️', '💡', '💚', '⚡']);
    const [finalIdx, setFinalIdx] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);

    // Pick random persona on mount
    const picked = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];

    useEffect(() => {
        // 수정구슬 사운드
        audioManager.playSFX('crystal');

        // Phase 1: shuffle messages
        const msgInterval = setInterval(() => {
            setMessageIdx(i => (i + 1) % SORTING_MESSAGES.length);
        }, 700);

        // Phase 2: shuffle emoji cards rapidly + 셔플 사운드
        let shuffleCount = 0;
        const emojiInterval = setInterval(() => {
            setCurrentEmojis([...PERSONAS].sort(() => Math.random() - 0.5).map(p => p.emoji));
            shuffleCount++;
            if (shuffleCount % 8 === 0) audioManager.playSFX('whoosh');
        }, 120);

        // Phase 3: slow down and reveal after 3.5s
        const slowTimer = setTimeout(() => {
            clearInterval(emojiInterval);
        }, 3200);

        // Phase 4: final reveal after 4.5s
        const revealTimer = setTimeout(() => {
            clearInterval(msgInterval);
            setFinalIdx(PERSONAS.findIndex(p => p.id === picked.id));
            setRevealed(true);
            setTimeout(() => onComplete(picked.id), 1600);
        }, 4500);

        return () => {
            clearInterval(msgInterval);
            clearInterval(emojiInterval);
            clearTimeout(slowTimer);
            clearTimeout(revealTimer);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] select-none">
            {/* Crystal ball */}
            <motion.div
                animate={revealed ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : { scale: [1, 1.05, 1] }}
                transition={revealed ? { duration: 0.6 } : { repeat: Infinity, duration: 1.5 }}
                className="text-9xl mb-8"
                style={{ filter: 'drop-shadow(0 0 30px rgba(124,58,237,0.8))' }}
            >
                🔮
            </motion.div>

            {/* Shuffling emoji cards */}
            {!revealed && (
                <div className="flex gap-3 mb-8">
                    {currentEmojis.map((emoji, i) => (
                        <motion.div
                            key={`${emoji}-${i}`}
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}
                        >
                            {emoji}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Revealed card */}
            {revealed && (
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl mb-8"
                    style={{
                        background: `linear-gradient(135deg, ${picked.color}33, ${picked.color}11)`,
                        border: `2px solid ${picked.color}`,
                        boxShadow: `0 0 40px ${picked.color}60`,
                    }}
                >
                    {picked.emoji}
                </motion.div>
            )}

            {/* Sorting message */}
            <motion.p
                key={messageIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-base text-center"
                style={{ color: 'rgba(196,181,253,0.7)' }}
            >
                {revealed ? '배정 완료!' : SORTING_MESSAGES[messageIdx]}
            </motion.p>

            {/* Progress dots */}
            {!revealed && (
                <div className="flex gap-2 mt-6">
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.3 }}
                            className="w-2 h-2 rounded-full"
                            style={{ background: '#7c3aed' }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Persona Reveal ───────────────────────────────────────────
function PersonaReveal({ persona, name, onConfirm }: {
    persona: typeof PERSONAS[0]; name: string; onConfirm: () => void;
}) {
    const [step, setStep] = useState<'flash' | 'show' | 'ready'>('flash');

    useEffect(() => {
        const t1 = setTimeout(() => setStep('show'), 400);
        const t2 = setTimeout(() => setStep('ready'), 1200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    return (
        <AnimatePresence mode="wait">
            {step === 'flash' && (
                <motion.div key="flash"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: persona.color + '22' }}
                />
            )}

            {(step === 'show' || step === 'ready') && (
                <motion.div key="reveal"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center text-center px-6 py-10 max-w-lg mx-auto"
                >
                    {/* Persona image or emoji */}
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
                        className="relative mb-6"
                    >
                        <div className="w-36 h-36 rounded-full flex items-center justify-center text-7xl relative"
                            style={{
                                background: `radial-gradient(circle at 40% 35%, ${persona.color}44, ${persona.color}11)`,
                                border: `3px solid ${persona.color}`,
                                boxShadow: `0 0 50px ${persona.color}50, 0 0 100px ${persona.color}20`,
                            }}
                        >
                            {/* Try to load persona image, fallback to emoji */}
                            <img
                                src={`/personas/${persona.id.toLowerCase()}.png`}
                                alt={persona.name}
                                className="w-full h-full object-cover rounded-full"
                                onError={e => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
                                }}
                            />
                            <span hidden>{persona.emoji}</span>
                        </div>
                        {/* Sparkle ring */}
                        {[0, 60, 120, 180, 240, 300].map((deg) => (
                            <motion.div key={deg}
                                className="absolute text-sm"
                                style={{
                                    top: '50%', left: '50%',
                                    transform: `rotate(${deg}deg) translateY(-72px) translateX(-50%)`,
                                }}
                                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 2, delay: deg / 600 }}
                            >
                                ✨
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Announcement */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <p className="text-sm mb-2 tracking-widest uppercase" style={{ color: 'rgba(196,181,253,0.5)' }}>
                            운명이 결정했습니다
                        </p>
                        <h2 className="text-xl font-black mb-1"
                            style={{ color: 'rgba(196,181,253,0.7)' }}>
                            {name}님은...
                        </h2>
                        <h1 className="font-black mb-1" style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)', color: persona.color }}>
                            {persona.emoji} {persona.name}
                        </h1>
                        <p className="text-xl font-bold mb-4 text-white">{persona.title}</p>
                        <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(196,181,253,0.65)' }}>
                            {persona.desc}
                        </p>
                    </motion.div>

                    {/* Action card preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        className="w-full rounded-2xl p-4 mb-6"
                        style={{ background: `${persona.color}15`, border: `1px solid ${persona.color}30` }}
                    >
                        <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: persona.color }}>
                            전용 액션 카드 지급됨
                        </div>
                        <div className="text-sm font-bold text-white">{persona.action}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(196,181,253,0.5)' }}>{persona.actionDesc}</div>
                    </motion.div>

                    {step === 'ready' && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                            onClick={onConfirm}
                            className="flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-xl text-white"
                            style={{
                                background: `linear-gradient(135deg, ${persona.color}, ${persona.color}bb)`,
                                boxShadow: `0 0 35px ${persona.color}60`,
                            }}
                        >
                            <Sparkles size={22} /> 운명을 받아들이기
                            <ChevronRight size={22} />
                        </motion.button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Tutorial Slides ──────────────────────────────────────────
const TUTORIAL_SLIDES = [
    {
        emoji: '🗺️',
        title: '게임의 흐름',
        desc: '5단계의 여정을 거치면서 공정무역의 진실을 파헤치고,\n최종적으로 공정한 세상을 만들어갑니다.',
        items: [
            { icon: '🎭', text: 'Phase 0 — 달콤한 광고에 속아볼까?', color: '#f43f5e' },
            { icon: '🔍', text: 'Phase 1 — 숨겨진 진실을 찾아라', color: '#f5a623' },
            { icon: '⚖️', text: 'Phase 2 — NPC를 설득하라', color: '#06d6a0' },
            { icon: '✨', text: 'Phase 3 — 공정 가격을 설계하라', color: '#a78bfa' },
            { icon: '📝', text: 'Phase 4 — 나를 돌아보는 성찰', color: '#38bdf8' },
        ],
        color: '#7c3aed',
    },
    {
        emoji: '⭐',
        title: 'XP와 레벨',
        desc: '게임 속 활동에서 XP를 모아 레벨을 올리세요!\nXP로 상점에서 특별한 아이템도 구매할 수 있습니다.',
        items: [
            { icon: '🔍', text: '진실 발견 → +15 XP', color: '#f5a623' },
            { icon: '💬', text: 'NPC 설득 성공 → +30 XP', color: '#06d6a0' },
            { icon: '📝', text: '리포트 제출 → +20 XP', color: '#a78bfa' },
            { icon: '🏅', text: '황금 인장 → +50 XP (교사 수여)', color: '#fbbf24' },
        ],
        color: '#f5a623',
    },
    {
        emoji: '🤝',
        title: '팀워크가 핵심!',
        desc: '혼자서는 풀 수 없는 미션들이 있습니다.\n같은 팀 친구들과 소통하고 협력하세요!',
        items: [
            { icon: '💚', text: '팀워크 게이지를 80% 이상 유지하세요', color: '#06d6a0' },
            { icon: '🛒', text: '연대의 씨앗(팀 아이템)은 팀 전체에 효과!', color: '#fb923c' },
            { icon: '🏆', text: '동료를 도울수록 더 높은 점수를 받습니다', color: '#fbbf24' },
        ],
        color: '#06d6a0',
    },
];

function TutorialSlides({ onComplete }: { onComplete: () => void }) {
    const [current, setCurrent] = useState(0);
    const slide = TUTORIAL_SLIDES[current];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-screen text-center px-4">

            {/* Progress */}
            <div className="flex gap-2 mb-8">
                {TUTORIAL_SLIDES.map((_, i) => (
                    <div key={i} className="w-12 h-1.5 rounded-full transition-all duration-300"
                        style={{ background: i <= current ? TUTORIAL_SLIDES[i].color : 'rgba(255,255,255,0.1)' }} />
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={current}
                    initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                    className="max-w-md w-full">

                    <div className="text-6xl mb-4">{slide.emoji}</div>
                    <h2 className="text-2xl font-black text-white mb-3">{slide.title}</h2>
                    <p className="text-sm leading-relaxed mb-6 whitespace-pre-line"
                        style={{ color: 'rgba(196,181,253,0.65)' }}>
                        {slide.desc}
                    </p>

                    <div className="space-y-2 mb-8 text-left">
                        {slide.items.map((item, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                style={{ background: `${item.color}0c`, border: `1px solid ${item.color}20` }}>
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-sm font-medium" style={{ color: item.color }}>{item.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div className="flex gap-3">
                {current > 0 && (
                    <button onClick={() => setCurrent(current - 1)}
                        className="px-6 py-3 rounded-xl font-bold text-sm transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(196,181,253,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        ← 이전
                    </button>
                )}
                {current < TUTORIAL_SLIDES.length - 1 ? (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setCurrent(current + 1)}
                        className="px-8 py-3 rounded-xl font-black text-sm text-white flex items-center gap-2"
                        style={{ background: `linear-gradient(135deg, ${slide.color}, ${slide.color}bb)`, boxShadow: `0 0 20px ${slide.color}40` }}>
                        다음 <ChevronRight size={16} />
                    </motion.button>
                ) : (
                    <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={onComplete}
                        className="px-10 py-4 rounded-2xl font-black text-base text-white flex items-center gap-3"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 30px rgba(124,58,237,0.5)' }}>
                        <Sparkles size={18} /> 게임 시작! 🎮
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}

// ─── Main ─────────────────────────────────────────────────────
export default function StudentOnboarding() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setStudentProfile } = useAuthStore();
    const { setGroup } = useSessionStore();

    const state = location.state as { sessionId?: string; playerName?: string } | null;
    const playerName = state?.playerName ?? '플레이어';

    const [stage, setStage] = useState<'intro' | 'sorting' | 'reveal' | 'tutorial'>('intro');
    const [assignedPersona, setAssignedPersona] = useState<Persona | null>(null);

    const personaData = PERSONAS.find(p => p.id === assignedPersona);

    function handleSortingComplete(persona: Persona) {
        setAssignedPersona(persona);
        audioManager.playSFX('reveal');
        setStage('reveal');
    }

    function handleRevealConfirm() {
        audioManager.playSFX('click');
        setStage('tutorial');
    }

    function handleTutorialComplete() {
        if (!assignedPersona) return;
        const profile = createMockStudent(playerName, assignedPersona);
        setStudentProfile(profile);
        setGroup({ ...MOCK_GROUP, personaAssignments: { [profile.studentId]: assignedPersona } });
        navigate(`/game/${state?.sessionId ?? 'mock-session-001'}`);
    }

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0618 0%, #110d2e 100%)' }}>

            {/* Floating stars background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div key={i}
                        className="absolute rounded-full"
                        style={{
                            width: `${1 + Math.random() * 3}px`,
                            height: `${1 + Math.random() * 3}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            background: '#a78bfa',
                        }}
                        animate={{ opacity: [0.1, 0.8, 0.1] }}
                        transition={{ repeat: Infinity, duration: 2 + Math.random() * 3, delay: Math.random() * 4 }}
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-xl mx-auto px-6">
                <AnimatePresence mode="wait">

                    {/* ── Intro ── */}
                    {stage === 'intro' && (
                        <motion.div key="intro"
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center min-h-screen text-center"
                        >
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 3, 0], scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 5 }}
                                className="text-9xl mb-6"
                                style={{ filter: 'drop-shadow(0 0 20px rgba(124,58,237,0.6))' }}
                            >
                                🔮
                            </motion.div>
                            <h1 className="text-4xl font-black text-white mb-3">
                                배정의 수정구슬
                            </h1>
                            <p className="text-lg leading-relaxed mb-2" style={{ color: 'rgba(196,181,253,0.7)' }}>
                                안녕하세요, <strong className="text-white">{playerName}</strong>님!
                            </p>
                            <p className="text-base leading-relaxed mb-2" style={{ color: 'rgba(167,139,250,0.6)' }}>
                                당신의 역할은 선택하는 것이 아닙니다.
                            </p>
                            <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(167,139,250,0.6)' }}>
                                수정구슬이 당신 안에 잠든 <strong style={{ color: '#fbbf24' }}>재능과 운명</strong>을 읽어낼 것입니다.
                            </p>
                            <div className="rounded-2xl p-4 mb-8 w-full"
                                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}>
                                <p className="text-sm" style={{ color: 'rgba(196,181,253,0.6)' }}>
                                    🎭 <strong className="text-white">5가지 역할</strong> 중 하나가 배정됩니다<br />
                                    📊 알파 · 🕊️ 델타 · 💡 오메가 · 💚 람다 · ⚡ 시그마
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}
                                onClick={() => { audioManager.playSFX('click'); setStage('sorting'); }}
                                className="flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-xl text-white"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 40px rgba(124,58,237,0.6)' }}
                            >
                                🔮 수정구슬에 손을 댑니다
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Sorting Animation ── */}
                    {stage === 'sorting' && (
                        <motion.div key="sorting"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="min-h-screen"
                        >
                            <SortingAnimation onComplete={handleSortingComplete} />
                        </motion.div>
                    )}

                    {/* ── Persona Reveal ── */}
                    {stage === 'reveal' && personaData && (
                        <motion.div key="reveal"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="min-h-screen"
                        >
                            <PersonaReveal
                                persona={personaData}
                                name={playerName}
                                onConfirm={handleRevealConfirm}
                            />
                        </motion.div>
                    )}

                    {/* ── Tutorial ── */}
                    {stage === 'tutorial' && (
                        <motion.div key="tutorial"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="min-h-screen"
                        >
                            <TutorialSlides onComplete={handleTutorialComplete} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
