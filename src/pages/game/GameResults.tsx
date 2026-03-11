import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, RotateCcw, Zap, Star, CheckCircle } from 'lucide-react';
import type { Persona } from '@/types';

// ─── Types ────────────────────────────────────────────────────
interface StudentResult {
    id: string;
    name: string;
    persona: Persona;
    xp: number;
    goldenSeal: boolean;
    reportScore: number;   // 0~100
    fairPrice: number | null;
    npcsPersuaded: number;
}

interface Props {
    students?: StudentResult[];
    sessionCode?: string;
    teacherName?: string;
    onReplay?: () => void;
}

const PERSONA_COLORS: Record<Persona, string> = {
    Alpha: '#38bdf8', Delta: '#06d6a0', Omega: '#a78bfa',
    Lambda: '#fb923c', Sigma: '#f43f5e',
};
const PERSONA_EMOJI: Record<Persona, string> = {
    Alpha: '📊', Delta: '🕊️', Omega: '💡', Lambda: '💚', Sigma: '⚡',
};

// ─── Mock result data for demo ─────────────────────────────────
const DEMO_RESULTS: StudentResult[] = [
    { id: 's1', name: '김민준', persona: 'Alpha', xp: 340, goldenSeal: true, reportScore: 88, fairPrice: 3200, npcsPersuaded: 4 },
    { id: 's2', name: '이서연', persona: 'Delta', xp: 290, goldenSeal: false, reportScore: 72, fairPrice: 2900, npcsPersuaded: 3 },
    { id: 's3', name: '박지호', persona: 'Omega', xp: 415, goldenSeal: true, reportScore: 95, fairPrice: 3600, npcsPersuaded: 5 },
    { id: 's4', name: '최수아', persona: 'Lambda', xp: 180, goldenSeal: false, reportScore: 60, fairPrice: 2800, npcsPersuaded: 2 },
    { id: 's5', name: '정도윤', persona: 'Sigma', xp: 310, goldenSeal: true, reportScore: 80, fairPrice: 3100, npcsPersuaded: 3 },
    { id: 's6', name: '황예은', persona: 'Alpha', xp: 255, goldenSeal: false, reportScore: 68, fairPrice: 2700, npcsPersuaded: 2 },
];

// ─── Sage Liberation Animation ────────────────────────────────
function SageLiberationStage({ onDone }: { onDone: () => void }) {
    const SAGES = [
        { src: '/sages/sage1.png', name: '불꽃의 현자' },
        { src: '/sages/sage2.png', name: '바람의 현자' },
        { src: '/sages/sage3.png', name: '대지의 현자' },
        { src: '/sages/sage4.png', name: '별의 현자' },
        { src: '/sages/sage5.png', name: '물의 현자' },
    ];
    const [stage, setStage] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setStage(1), 600),
            setTimeout(() => setStage(2), 1600),
            setTimeout(() => setStage(3), 2800),
            setTimeout(() => setStage(4), 4200),
            setTimeout(() => onDone(), 5200),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            {/* Castle image */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="mb-4"
                style={{ filter: 'drop-shadow(0 0 40px rgba(245,166,35,0.6))' }}
            >
                <img
                    src="/hero-castle.png"
                    alt="침묵의 성"
                    className="w-48 h-32 object-cover rounded-2xl mx-auto"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? 0 : 20 }}
                transition={{ duration: 0.6 }}
                className="font-black text-4xl mb-2"
                style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f5a623)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}
            >
                침묵의 성이 열립니다!
            </motion.h1>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: stage >= 1 ? 1 : 0 }}
                className="text-base mb-10"
                style={{ color: 'rgba(196,181,253,0.7)' }}
            >
                공정의 노래가 마몬의 결박을 풀어냅니다...
            </motion.p>

            {/* Sages appear one by one */}
            <div className="flex gap-4 mb-10">
                {SAGES.map((sage, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 50, scale: 0.3 }}
                        animate={stage >= 2 ? { opacity: 1, y: 0, scale: 1 } : {}}
                        transition={{ delay: i * 0.25, type: 'spring', stiffness: 200 }}
                        className="flex flex-col items-center"
                    >
                        <motion.div
                            animate={stage >= 3 ? {
                                y: [-5, 5, -5],
                                filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'],
                            } : {}}
                            transition={{ repeat: Infinity, duration: 2 + i * 0.2 }}
                            style={{
                                filter: stage >= 3 ? `drop-shadow(0 0 20px gold)` : 'none',
                            }}
                        >
                            <img
                                src={sage.src}
                                alt={sage.name}
                                className="w-16 h-20 object-contain"
                                onError={e => {
                                    const t = e.target as HTMLImageElement;
                                    t.style.display = 'none';
                                    t.parentElement!.innerHTML = ['🧙', '🧝', '🧚', '🧌', '🧜'][i];
                                    t.parentElement!.className = 'text-5xl';
                                }}
                            />
                        </motion.div>
                        {stage >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center text-xs mt-1 font-bold"
                                style={{ color: '#fbbf24' }}
                            >
                                해방!
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>

            {stage >= 4 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <div className="text-5xl mb-4">✨</div>
                    <p className="font-black text-white text-xl">5명의 현자가 모두 깨어났습니다!</p>
                </motion.div>
            )}

            {/* Sparkles */}
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="fixed text-lg pointer-events-none select-none"
                    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [-20, -60] }}
                    transition={{ repeat: Infinity, duration: 2 + Math.random() * 2, delay: Math.random() * 3 }}
                >
                    {['✨', '⭐', '💫', '🌟'][i % 4]}
                </motion.div>
            ))}
        </div>
    );
}

// ─── Podium Rankings ──────────────────────────────────────────
function Podium({ students }: { students: StudentResult[] }) {
    const sorted = [...students].sort((a, b) => b.xp - a.xp);
    const [first, second, third] = sorted;
    const rest = sorted.slice(3);

    return (
        <div>
            {/* Top 3 Podium */}
            <div className="flex items-end justify-center gap-3 mb-8 px-2">
                {/* 2nd */}
                {second && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="flex flex-col items-center gap-2 flex-1"
                    >
                        <div className="text-2xl">{PERSONA_EMOJI[second.persona]}</div>
                        <div className="font-bold text-white text-sm">{second.name}</div>
                        <div className="text-xs" style={{ color: PERSONA_COLORS[second.persona] }}>{second.persona}</div>
                        <div className="w-full rounded-t-xl flex flex-col items-center py-4"
                            style={{ background: 'rgba(192,192,192,0.15)', border: '1px solid rgba(192,192,192,0.3)', height: 80 }}>
                            <div className="text-2xl font-black text-gray-300">2</div>
                            <div className="text-xs font-bold" style={{ color: '#fbbf24' }}>
                                <Zap size={9} className="inline mr-0.5" />{second.xp} XP
                            </div>
                        </div>
                    </motion.div>
                )}
                {/* 1st */}
                {first && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="flex flex-col items-center gap-2 flex-1"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="text-3xl"
                        >
                            👑
                        </motion.div>
                        <div className="text-3xl">{PERSONA_EMOJI[first.persona]}</div>
                        <div className="font-black text-white">{first.name}</div>
                        <div className="text-xs" style={{ color: PERSONA_COLORS[first.persona] }}>{first.persona}</div>
                        {first.goldenSeal && (
                            <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(245,166,35,0.2)', color: '#fbbf24' }}>
                                <Award size={10} /> 황금 인장
                            </div>
                        )}
                        <div className="w-full rounded-t-xl flex flex-col items-center py-4"
                            style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.4)', height: 110, boxShadow: '0 0 20px rgba(245,166,35,0.2)' }}>
                            <div className="text-3xl font-black" style={{ color: '#fbbf24' }}>1</div>
                            <div className="text-sm font-black" style={{ color: '#fbbf24' }}>
                                <Zap size={11} className="inline mr-0.5" />{first.xp} XP
                            </div>
                        </div>
                    </motion.div>
                )}
                {/* 3rd */}
                {third && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="flex flex-col items-center gap-2 flex-1"
                    >
                        <div className="text-2xl">{PERSONA_EMOJI[third.persona]}</div>
                        <div className="font-bold text-white text-sm">{third.name}</div>
                        <div className="text-xs" style={{ color: PERSONA_COLORS[third.persona] }}>{third.persona}</div>
                        <div className="w-full rounded-t-xl flex flex-col items-center py-4"
                            style={{ background: 'rgba(205,127,50,0.12)', border: '1px solid rgba(205,127,50,0.3)', height: 60 }}>
                            <div className="text-xl font-black" style={{ color: '#cd7f32' }}>3</div>
                            <div className="text-xs font-bold" style={{ color: '#fbbf24' }}>
                                <Zap size={9} className="inline mr-0.5" />{third.xp} XP
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Rest of rankings */}
            {rest.length > 0 && (
                <div className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    {rest.map((s, i) => (
                        <div key={s.id}
                            className="flex items-center gap-3 px-4 py-3"
                            style={{ borderTop: '1px solid rgba(139,92,246,0.08)' }}>
                            <span className="w-6 text-center text-sm font-bold"
                                style={{ color: 'rgba(139,92,246,0.5)' }}>{i + 4}</span>
                            <span className="text-lg">{PERSONA_EMOJI[s.persona]}</span>
                            <span className="flex-1 text-sm font-semibold text-white">{s.name}</span>
                            <span className="text-xs" style={{ color: PERSONA_COLORS[s.persona] }}>{s.persona}</span>
                            {s.goldenSeal && <Award size={14} style={{ color: '#fbbf24' }} />}
                            <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>
                                <Zap size={9} className="inline mr-0.5" />{s.xp}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── CSV Export ───────────────────────────────────────────────
function exportResults(students: StudentResult[], code: string) {
    const headers = ['이름', '페르소나', 'XP', '황금인장', '리포트점수', '공정가', 'NPC설득수'];
    const rows = students.map(s => [
        s.name, s.persona, s.xp,
        s.goldenSeal ? '✓' : '', s.reportScore,
        s.fairPrice ?? '-', s.npcsPersuaded,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `공정공장_결과_${code}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ─── Main ─────────────────────────────────────────────────────
export default function GameResults({
    students = DEMO_RESULTS,
    sessionCode = 'FAIR01',
    teacherName = '김공정 선생님',
    onReplay,
}: Props) {
    const navigate = useNavigate();
    const [stage, setStage] = useState<'liberation' | 'results'>('liberation');
    const [tab, setTab] = useState<'ranking' | 'stats'>('ranking');

    const totalSeals = students.filter(s => s.goldenSeal).length;
    const avgXp = Math.round(students.reduce((a, s) => a + s.xp, 0) / students.length);
    const avgFairness = Math.round(students.reduce((a, s) => a + (s.fairPrice ?? 0), 0) / students.filter(s => s.fairPrice).length);
    const allNpcs = students.reduce((a, s) => a + s.npcsPersuaded, 0);

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0618 0%, #110d2e 100%)' }}>

            {/* Fixed stars */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div key={i}
                        className="absolute rounded-full"
                        style={{ width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`, left: `${(i * 7.3) % 100}%`, top: `${(i * 11.7) % 100}%`, background: '#a78bfa' }}
                        animate={{ opacity: [0.1, 0.7, 0.1] }}
                        transition={{ repeat: Infinity, duration: 2 + (i % 4), delay: (i % 5) * 0.5 }}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ── Stage 1: Liberation ── */}
                {stage === 'liberation' && (
                    <motion.div key="liberation"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="relative z-10"
                    >
                        <SageLiberationStage onDone={() => setStage('results')} />
                    </motion.div>
                )}

                {/* ── Stage 2: Results ── */}
                {stage === 'results' && (
                    <motion.div key="results"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="relative z-10 max-w-2xl mx-auto px-6 py-8"
                    >
                        {/* Header */}
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                                className="text-6xl mb-4"
                            >
                                🏆
                            </motion.div>
                            <h1 className="font-black text-3xl text-white mb-1">수업 결산</h1>
                            <p className="text-sm" style={{ color: 'rgba(196,181,253,0.5)' }}>
                                {sessionCode} · {teacherName}
                            </p>
                        </div>

                        {/* Summary stats */}
                        <div className="grid grid-cols-4 gap-3 mb-6">
                            {[
                                { label: '황금 인장', value: `${totalSeals}명`, color: '#fbbf24', emoji: '🏅' },
                                { label: '평균 XP', value: avgXp, color: '#a78bfa', emoji: '⚡' },
                                { label: '평균 공정가', value: `₩${avgFairness.toLocaleString()}`, color: '#06d6a0', emoji: '⚖️' },
                                { label: 'NPC 설득 합계', value: `${allNpcs}회`, color: '#38bdf8', emoji: '🤝' },
                            ].map(({ label, value, color, emoji }) => (
                                <motion.div
                                    key={label}
                                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                    className="rounded-xl p-3 text-center"
                                    style={{ background: `${color}0a`, border: `1px solid ${color}25` }}
                                >
                                    <div className="text-xl mb-1">{emoji}</div>
                                    <div className="font-black text-lg text-white">{value}</div>
                                    <div className="text-xs" style={{ color: `${color}99` }}>{label}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
                            {[{ key: 'ranking', label: '🏆 순위' }, { key: 'stats', label: '📊 세부 통계' }].map(({ key, label }) => (
                                <button key={key} onClick={() => setTab(key as any)}
                                    className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                                    style={{
                                        background: tab === key ? 'rgba(124,58,237,0.35)' : 'transparent',
                                        color: tab === key ? '#fff' : 'rgba(167,139,250,0.5)',
                                        border: tab === key ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
                                    }}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {tab === 'ranking' && (
                                <motion.div key="ranking"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <Podium students={students} />
                                </motion.div>
                            )}

                            {tab === 'stats' && (
                                <motion.div key="stats"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="rounded-2xl overflow-hidden"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}
                                >
                                    <div className="px-5 py-3 grid grid-cols-6 text-xs font-bold uppercase tracking-wider"
                                        style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(139,92,246,0.4)', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                                        <span>이름</span><span>페르소나</span><span>XP</span><span>리포트</span><span>공정가</span><span>인장</span>
                                    </div>
                                    {[...students].sort((a, b) => b.xp - a.xp).map((s, i) => (
                                        <motion.div key={s.id}
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                            className="px-5 py-3 grid grid-cols-6 items-center gap-2"
                                            style={{ borderTop: '1px solid rgba(139,92,246,0.07)' }}
                                        >
                                            <span className="text-sm text-white truncate">{s.name}</span>
                                            <span className="text-xs" style={{ color: PERSONA_COLORS[s.persona] }}>
                                                {PERSONA_EMOJI[s.persona]} {s.persona}
                                            </span>
                                            <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>{s.xp}</span>
                                            <span className="text-sm" style={{ color: s.reportScore >= 80 ? '#06d6a0' : 'rgba(196,181,253,0.6)' }}>
                                                {s.reportScore}점
                                            </span>
                                            <span className="text-xs" style={{ color: (s.fairPrice ?? 0) >= 2800 ? '#06d6a0' : '#f43f5e' }}>
                                                {s.fairPrice ? `₩${s.fairPrice.toLocaleString()}` : '-'}
                                            </span>
                                            <span>{s.goldenSeal ? <Award size={14} style={{ color: '#fbbf24' }} /> : <span style={{ color: 'rgba(139,92,246,0.2)' }}>—</span>}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-8">
                            <motion.button
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => exportResults(students, sessionCode)}
                                className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm"
                                style={{ background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.3)', color: '#06d6a0' }}
                            >
                                <Download size={15} /> 결과 CSV 내보내기
                            </motion.button>
                            {onReplay && (
                                <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={onReplay}
                                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm"
                                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}
                                >
                                    <RotateCcw size={15} /> 다시 시작
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/teacher/dashboard')}
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-base text-white"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 25px rgba(124,58,237,0.4)' }}
                            >
                                <CheckCircle size={18} /> 수업 마치기
                            </motion.button>
                        </div>

                        <p className="text-center text-xs mt-4" style={{ color: 'rgba(139,92,246,0.3)' }}>
                            수고하셨습니다! 침묵의 성이 다시 빛을 되찾았습니다. ✨
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
