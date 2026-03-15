import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Send, Heart, Download, Share2, CheckCircle, Sparkles } from 'lucide-react';
import { useSessionStore } from '@/store';

interface Props {
    persona: string;
    playerName: string;
    xp: number;
}

// ─── 성찰 질문 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS = [
    {
        id: 'before',
        emoji: '🎭',
        question: 'Phase 0에서 초콜릿 광고를 처음 봤을 때, 어떤 생각이 들었나요?',
        placeholder: '예: 화려한 광고에 끌려서 사고 싶었다 / 뭔가 수상했다...',
        color: '#f43f5e',
    },
    {
        id: 'discovery',
        emoji: '🔍',
        question: '가장 충격적이었던 "숨겨진 진실"은 무엇이었나요? 왜 그랬나요?',
        placeholder: '예: 아동 노동 사실을 알았을 때 가장 놀랐다. 왜냐하면...',
        color: '#f5a623',
    },
    {
        id: 'empathy',
        emoji: '💬',
        question: 'NPC 중 가장 이해하기 어려웠던 인물은 누구였나요? 지금은 어떻게 생각하나요?',
        placeholder: '예: 고렉스(유통업자)가 가장 나빠 보였지만, 그도 사정이 있다는 걸...',
        color: '#06d6a0',
    },
    {
        id: 'change',
        emoji: '✨',
        question: '이 게임을 하기 전과 후, 나의 생각이 어떻게 바뀌었나요?',
        placeholder: '예: 예전에는 싼 게 좋은 거라고만 생각했는데, 이제는...',
        color: '#a78bfa',
    },
    {
        id: 'action',
        emoji: '🌱',
        question: '오늘 이후 일상에서 실천할 수 있는 작은 행동 하나를 적어보세요.',
        placeholder: '예: 공정무역 마크 확인하기 / 친구에게 이 이야기 들려주기 / ...',
        color: '#38bdf8',
    },
];

// ─── 행동 약속 카드 프리셋 ──────────────────────────────────────
const ACTION_PLEDGES = [
    { emoji: '🏷️', text: '물건 살 때 공정무역 마크를 확인한다' },
    { emoji: '📢', text: '친구나 가족에게 오늘 배운 내용을 알려준다' },
    { emoji: '🛒', text: '가격이 조금 비싸도 윤리적 제품을 선택해본다' },
    { emoji: '📱', text: 'SNS에 공정무역에 대해 한 번 포스팅한다' },
    { emoji: '📖', text: '공정무역 관련 도서나 영상을 하나 더 찾아본다' },
    { emoji: '✍️', text: '나만의 약속 직접 쓰기' },
];

export default function Phase4({ persona, playerName, xp }: Props) {
    const { sessionId, studentId } = useSessionStore();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedPledge, setSelectedPledge] = useState<string | null>(null);
    const [customPledge, setCustomPledge] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [showEnding, setShowEnding] = useState(false);

    const q = REFLECTION_QUESTIONS[currentQ];
    const answeredCount = Object.values(answers).filter(v => v.trim().length >= 5).length;
    const allAnswered = answeredCount >= REFLECTION_QUESTIONS.length;
    const pledge = selectedPledge === '✍️ 나만의 약속 직접 쓰기'
        ? customPledge
        : selectedPledge;

    function handleSubmit() {
        setShowEnding(true);
        if (sessionId && studentId) {
            const content = Object.entries(answers).map(([qId, a]) => {
                const qText = REFLECTION_QUESTIONS.find(q => q.id === qId)?.question;
                return `Q. ${qText}\nA. ${a}`;
            }).join('\n\n') + `\n\n[행동 약속]\n${pledge}`;

            import('@/lib/firebaseService').then(({ StudentService }) => {
                StudentService.submitReport(sessionId, studentId, 4, content, { answers, pledge }).catch(console.error);
            });
        }
    }

    if (showEnding) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-hidden"
                style={{ background: 'rgba(10,6,24,0.95)', backdropFilter: 'blur(15px)' }}>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="w-[800px] h-[800px] rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)' }} />
                </div>

                <div className="text-center max-w-2xl relative z-10">
                    <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                        className="text-6xl mb-6">✨</motion.div>
                    <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                        className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight">
                        <span style={{ color: '#fbbf24' }}>모든 미션 완수!</span><br />
                        침묵의 성곽이 무너졌습니다
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                        className="text-base sm:text-lg mb-10 leading-relaxed" style={{ color: 'rgba(196,181,253,0.9)' }}>
                        당신이 작성한 진심 어린 성찰이 마몬의 마법을 깼습니다.<br />
                        마침내 <strong style={{ color: '#fbbf24' }}>5명의 현자</strong>들이 황금 안대를 벗고 온전한 지혜의 눈을 되찾았습니다!
                    </motion.p>

                    {/* 현자 5명 보여주기 */}
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.5, staggerChildren: 0.2 }}
                        className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-12">
                        {['진실의 현자', '정의의 현자', '지혜의 현자', '연대의 현자', '용기의 현자'].map((name, i) => (
                            <motion.div key={name} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.5 + i * 0.1 }}
                                className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden"
                                    style={{ border: '2px solid rgba(251,191,36,0.6)', boxShadow: '0 0 20px rgba(251,191,36,0.3)' }}>
                                    <img src={`/sages/sage${i + 1}.png`} alt={name} className="w-full h-full object-cover"
                                        // 안대가 벗겨진 밝은 모습
                                        style={{ filter: 'brightness(1.1) saturate(1.2)' }} />
                                </div>
                                <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>{name}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
                        onClick={() => { setShowEnding(false); setSubmitted(true); }}
                        className="px-8 py-4 rounded-xl font-bold text-white transition-all hover:scale-105 mx-auto block"
                        style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', boxShadow: '0 0 30px rgba(251,191,36,0.4)' }}>
                        여정 마무리하기 →
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    // ── 제출 완료 화면 ──
    if (submitted) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center max-w-lg">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="text-8xl mb-6">🌟</motion.div>
                    <h2 className="text-3xl font-black text-white mb-3">성찰 완료!</h2>
                    <p className="text-sm mb-6" style={{ color: 'rgba(196,181,253,0.7)' }}>
                        {playerName}님의 성찰 저널이 기록되었습니다.
                    </p>

                    {/* 약속 카드 */}
                    {pledge && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="rounded-2xl p-6 mb-6 text-center mx-auto max-w-sm"
                            style={{
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,214,160,0.1))',
                                border: '1px solid rgba(124,58,237,0.35)',
                                boxShadow: '0 0 40px rgba(124,58,237,0.15)',
                            }}>
                            <div className="text-xs uppercase tracking-widest mb-3"
                                style={{ color: 'rgba(167,139,250,0.6)' }}>🤝 나의 행동 약속</div>
                            <p className="text-lg font-bold text-white leading-relaxed">
                                "{pledge}"
                            </p>
                            <div className="text-xs mt-3" style={{ color: 'rgba(139,92,246,0.5)' }}>
                                — {playerName}, {new Date().toLocaleDateString('ko-KR')}
                            </div>
                        </motion.div>
                    )}

                    <div className="flex gap-3 justify-center">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                const text = `🌱 [공정공장] 나의 약속: "${pledge}"\n#공정무역 #공정공장 #FairFactory`;
                                navigator.clipboard.writeText(text);
                            }}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white"
                            style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.5)' }}>
                            <Share2 size={14} /> 약속 공유하기
                        </motion.button>
                    </div>

                    <p className="text-xs mt-8" style={{ color: 'rgba(139,92,246,0.35)' }}>
                        교사의 최종 결과 확인을 기다리는 중...
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                                style={{ background: '#a78bfa', animationDelay: `${i * 0.2}s` }} />
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen px-4 py-8 max-w-2xl mx-auto">

            {/* Header */}
            <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-xs font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8' }}>
                    <BookOpen size={12} /> Phase 4 · 성찰의 거울
                </span>
                <h2 className="text-3xl font-black text-white mb-2">
                    나를 되돌아보는 시간
                </h2>
                <p style={{ color: 'rgba(196,181,253,0.6)' }}>
                    게임을 통해 배운 것, 느낀 것, 실천할 것을 기록하세요
                </p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1 flex-1">
                    {REFLECTION_QUESTIONS.map((rq, i) => (
                        <motion.button key={rq.id}
                            onClick={() => setCurrentQ(i)}
                            className="flex-1 h-2 rounded-full cursor-pointer transition-all"
                            style={{
                                background: answers[rq.id]?.trim().length >= 5
                                    ? rq.color
                                    : i === currentQ
                                        ? `${rq.color}60`
                                        : 'rgba(255,255,255,0.08)',
                            }} />
                    ))}
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: '#38bdf8' }}>
                    {answeredCount}/{REFLECTION_QUESTIONS.length}
                </span>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div key={q.id}
                    initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                    className="rounded-2xl p-6 mb-4"
                    style={{ background: `${q.color}0a`, border: `1px solid ${q.color}25` }}>

                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ background: `${q.color}18` }}>
                            {q.emoji}
                        </div>
                        <div>
                            <div className="text-xs mb-1" style={{ color: `${q.color}99` }}>
                                질문 {currentQ + 1}/{REFLECTION_QUESTIONS.length}
                            </div>
                            <h3 className="font-bold text-white text-base leading-relaxed">
                                {q.question}
                            </h3>
                        </div>
                    </div>

                    <textarea
                        value={answers[q.id] ?? ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: `1px solid ${q.color}20`,
                            color: '#f0f0f5',
                            minHeight: 120,
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = `${q.color}60`; }}
                        onBlur={e => { e.currentTarget.style.borderColor = `${q.color}20`; }}
                        placeholder={q.placeholder}
                    />

                    <div className="flex items-center justify-between mt-3">
                        <span className="text-xs" style={{ color: 'rgba(139,92,246,0.4)' }}>
                            {(answers[q.id] ?? '').length}자
                            {(answers[q.id] ?? '').trim().length < 5 && ' (5자 이상 작성해주세요)'}
                        </span>
                        <div className="flex gap-2">
                            {currentQ > 0 && (
                                <button onClick={() => setCurrentQ(currentQ - 1)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(196,181,253,0.6)' }}>
                                    ← 이전
                                </button>
                            )}
                            {currentQ < REFLECTION_QUESTIONS.length - 1 ? (
                                <button onClick={() => setCurrentQ(currentQ + 1)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                                    style={{ background: `${q.color}40` }}>
                                    다음 →
                                </button>
                            ) : (
                                (answers[q.id] ?? '').trim().length >= 5 && (
                                    <div className="flex items-center gap-1 text-xs" style={{ color: '#06d6a0' }}>
                                        <CheckCircle size={12} /> 마지막 질문 완료!
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* 행동 약속 카드 (전체 답변 완료 후) */}
            {allAnswered && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-6 mb-6"
                    style={{ background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.25)' }}>
                    <h3 className="font-black text-white mb-1 flex items-center gap-2">
                        <Heart size={16} style={{ color: '#06d6a0' }} />
                        나의 행동 약속
                    </h3>
                    <p className="text-xs mb-4" style={{ color: 'rgba(6,214,160,0.7)' }}>
                        오늘 이후 실천할 약속을 하나 선택하세요
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {ACTION_PLEDGES.map(p => (
                            <motion.button key={p.text}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setSelectedPledge(p.text)}
                                className="flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all"
                                style={{
                                    background: selectedPledge === p.text
                                        ? 'rgba(6,214,160,0.15)'
                                        : 'rgba(255,255,255,0.04)',
                                    border: selectedPledge === p.text
                                        ? '1.5px solid rgba(6,214,160,0.5)'
                                        : '1px solid rgba(255,255,255,0.08)',
                                    color: selectedPledge === p.text ? '#06d6a0' : 'rgba(196,181,253,0.7)',
                                }}>
                                <span className="text-lg">{p.emoji}</span>
                                <span className="font-medium">{p.text}</span>
                                {selectedPledge === p.text && (
                                    <CheckCircle size={14} className="ml-auto flex-shrink-0"
                                        style={{ color: '#06d6a0' }} />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {selectedPledge === '나만의 약속 직접 쓰기' && (
                        <input type="text" value={customPledge}
                            onChange={e => setCustomPledge(e.target.value)}
                            className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-3"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(6,214,160,0.3)',
                                color: '#f0f0f5',
                            }}
                            placeholder="나만의 행동 약속을 적어보세요..." />
                    )}
                </motion.div>
            )}

            {/* 제출 버튼 */}
            {allAnswered && pledge && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    className="w-full py-5 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3"
                    style={{
                        background: 'linear-gradient(135deg, #06d6a0, #059669)',
                        boxShadow: '0 0 30px rgba(6,214,160,0.4)',
                    }}>
                    <Sparkles size={22} />
                    성찰 저널 제출하기 🌱
                </motion.button>
            )}

            {!allAnswered && (
                <p className="text-center text-xs mt-4" style={{ color: 'rgba(139,92,246,0.35)' }}>
                    모든 질문에 5자 이상 답변하면 제출할 수 있습니다
                </p>
            )}
        </motion.div>
    );
}
