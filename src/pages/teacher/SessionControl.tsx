import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ChevronLeft, Award, Users, Copy,
    Check, Eye, Clock, Zap, BarChart3, Download, Flag,
} from 'lucide-react';
import { ref, set, onValue } from 'firebase/database';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { rtdb, db } from '@/lib/firebase';
import { useSessionStore, useAuthStore } from '@/store';
import { isFirebaseConfigured, MOCK_NPCS } from '@/lib/mockData';
import type { Phase } from '@/types';

const PHASE_NAMES = ['환상의 장막', '진실의 돋보기', '지혜의 토론', '공정의 설계', '성찰의 거울'];
const PHASE_COLORS = ['#f43f5e', '#f5a623', '#06d6a0', '#a78bfa', '#38bdf8'];
const PHASE_EMOJIS = ['🎭', '🔍', '⚖️', '✨', '📝'];
const PHASE_DESCS = [
    '학생들이 달콤한 광고를 보고 구매 여부를 선택합니다.',
    '화면을 문질러 숨겨진 착취의 진실을 발견합니다.',
    '5명의 AI 이해관계자와 협상하여 설득합니다.',
    '가격 시뮬레이터로 공정가를 설계하고 제출합니다.',
    '게임을 돌아보며 성찰 저널을 작성합니다.',
];

// ─── Mock student list ────────────────────────────────────────
const MOCK_STUDENTS = [
    { id: 's1', name: '김민준', persona: 'Alpha', group: 1, submitted: true, xp: 120 },
    { id: 's2', name: '이서연', persona: 'Delta', group: 1, submitted: false, xp: 85 },
    { id: 's3', name: '박지호', persona: 'Omega', group: 1, submitted: true, xp: 140 },
    { id: 's4', name: '최수아', persona: 'Lambda', group: 2, submitted: false, xp: 60 },
    { id: 's5', name: '정도윤', persona: 'Sigma', group: 2, submitted: true, xp: 110 },
    { id: 's6', name: '황예은', persona: 'Alpha', group: 2, submitted: false, xp: 75 },
];

const PERSONA_COLORS: Record<string, string> = {
    Alpha: '#38bdf8', Delta: '#06d6a0', Omega: '#a78bfa',
    Lambda: '#fb923c', Sigma: '#f43f5e',
};
const PERSONA_EMOJI: Record<string, string> = {
    Alpha: '📊', Delta: '🕊️', Omega: '💡', Lambda: '💚', Sigma: '⚡',
};

// ─── Phase Control Card ───────────────────────────────────────
function PhaseControl({
    current, onAdvance, onBack, loading,
}: {
    current: Phase; onAdvance: () => void; onBack: () => void; loading: boolean;
}) {
    return (
        <div className="rounded-2xl p-6"
            style={{ background: `${PHASE_COLORS[current]}0d`, border: `1px solid ${PHASE_COLORS[current]}30` }}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-xs uppercase tracking-widest mb-1" style={{ color: `${PHASE_COLORS[current]}80` }}>
                        현재 Phase
                    </div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        {PHASE_EMOJIS[current]}
                        <span style={{ color: PHASE_COLORS[current] }}>{PHASE_NAMES[current]}</span>
                    </h2>
                    <p className="text-xs mt-1" style={{ color: 'rgba(196,181,253,0.5)' }}>{PHASE_DESCS[current]}</p>
                </div>
                <div className="text-6xl opacity-20">P{current}</div>
            </div>

            {/* Phase Progress Dots */}
            <div className="flex gap-2 mb-6">
                {[0, 1, 2, 3, 4].map(p => (
                    <div key={p} className="flex-1 h-2 rounded-full transition-all duration-500"
                        style={{ background: p <= current ? PHASE_COLORS[p] : 'rgba(255,255,255,0.08)' }} />
                ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    disabled={current === 0 || loading}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(196,181,253,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    <ChevronLeft size={16} /> 이전 Phase
                </button>
                <motion.button
                    whileHover={loading || current === 4 ? {} : { scale: 1.02 }}
                    whileTap={loading || current === 4 ? {} : { scale: 0.98 }}
                    onClick={onAdvance}
                    disabled={current === 4 || loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-white transition-all disabled:opacity-40"
                    style={{
                        background: current < 4 ? `linear-gradient(135deg, ${PHASE_COLORS[current + 1 < 5 ? current + 1 : current]}, ${PHASE_COLORS[current]})` : 'rgba(255,255,255,0.08)',
                        boxShadow: current < 4 ? `0 0 20px ${PHASE_COLORS[current]}40` : 'none',
                    }}
                >
                    {loading ? '전환 중...' :
                        current === 4 ? '🏁 모든 Phase 완료' :
                            `다음: ${PHASE_EMOJIS[current + 1]} ${PHASE_NAMES[current + 1]}`}
                    {current < 4 && <ChevronRight size={16} />}
                </motion.button>
            </div>
        </div>
    );
}

// ─── Student Row ──────────────────────────────────────────────
function StudentRow({ student, onAwardSeal }: {
    student: { id: string; name: string; persona: string; group?: number; submitted?: boolean; xp?: number; goldenSeal?: boolean };
    onAwardSeal: (id: string) => void;
}) {
    const color = PERSONA_COLORS[student.persona] ?? '#a78bfa';
    return (
        <div className="flex items-center gap-3 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                {PERSONA_EMOJI[student.persona]}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{student.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${color}18`, color, border: `1px solid ${color}28` }}>
                        {student.persona}
                    </span>
                    {student.group && <span className="text-xs" style={{ color: 'rgba(139,92,246,0.4)' }}>모둠{student.group}</span>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>
                    <Zap size={10} className="inline mr-0.5" />{student.xp ?? 0}
                </span>
                {student.submitted && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(6,214,160,0.15)', color: '#06d6a0' }}>
                        제출 ✓
                    </span>
                )}
                <button
                    onClick={() => onAwardSeal(student.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)' }}
                    title="황금 인장 수여"
                    aria-label={`${student.name}에게 황금 인장 수여`}
                >
                    <Award size={13} style={{ color: '#fbbf24' }} />
                </button>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────
export default function SessionControl() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { currentPhase, setPhase } = useSessionStore();
    const [phase, setLocalPhase] = useState<Phase>(currentPhase);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [sealAwarded, setSealAwarded] = useState<Set<string>>(new Set());
    const [tab, setTab] = useState<'control' | 'students' | 'stats'>('control');
    const [liveStudents, setLiveStudents] = useState<any[]>(MOCK_STUDENTS);
    const [endConfirm, setEndConfirm] = useState(false);
    const classCode = sessionId ?? 'FAIR01';

    // ── 실시간 학생 현황 구독 ──────────────────────────────────
    useEffect(() => {
        if (!isFirebaseConfigured() || !sessionId) return;
        import('@/lib/firebaseService').then(({ SessionService }) => {
            return SessionService.subscribeStudents(sessionId, (students) => {
                setLiveStudents(students.map(s => ({
                    id: s.studentId,
                    name: s.displayName,
                    persona: s.persona,
                    xp: Object.values(s.xp ?? {}).reduce((a: number, b: any) => a + b, 0),
                    submitted: s.reportSubmitted,
                    goldenSeal: (s as any).goldenSeal ?? false,
                })));
            });
        });
    }, [sessionId]);

    // ── Phase 전환 (RTDB + Firestore) ─────────────────────────
    async function pushPhase(newPhase: Phase) {
        setLoading(true);
        try {
            if (isFirebaseConfigured() && sessionId) {
                const { SessionService } = await import('@/lib/firebaseService');
                await SessionService.setPhase(sessionId, newPhase);
            }
        } catch (e) {
            console.warn('Phase sync 실패 (로컬 반영):', e);
        } finally {
            // 항상 로컬 상태 업데이트 (Firebase 성공/실패 무관)
            // Zustand persist → localStorage('fair-factory-session') 자동 저장 → 학생 탭 storage event로 동기화
            setLocalPhase(newPhase);
            setPhase(newPhase);
            setLoading(false);
        }
    }

    // ── 황금 인장 수여 ────────────────────────────────────────
    async function handleAwardSeal(id: string) {
        setSealAwarded(prev => new Set(prev).add(id));
        if (isFirebaseConfigured() && sessionId) {
            const { SessionService } = await import('@/lib/firebaseService');
            await SessionService.awardGoldenSeal(sessionId, id).catch(console.error);
        }
    }

    function copyCode() {
        navigator.clipboard.writeText(classCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const submittedCount = liveStudents.filter(s => s.submitted).length;
    const avgXp = liveStudents.length
        ? Math.round(liveStudents.reduce((a, s) => a + (s.xp ?? 0), 0) / liveStudents.length)
        : 0;
    const studentCount = liveStudents.length;


    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0618 0%, #0d0d1a 100%)' }}>

            {/* ── Header ── */}
            <header className="sticky top-0 z-40"
                style={{ background: 'rgba(10,6,24,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${PHASE_COLORS[phase]}25` }}>
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
                    <Link to="/teacher/dashboard"
                        className="flex items-center gap-1 text-sm"
                        style={{ color: 'rgba(167,139,250,0.5)' }}>
                        <ChevronLeft size={15} />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-xl"
                                style={{ background: `${PHASE_COLORS[phase]}15`, border: `1px solid ${PHASE_COLORS[phase]}35` }}>
                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: PHASE_COLORS[phase] }} />
                                <span className="text-xs font-bold" style={{ color: PHASE_COLORS[phase] }}>
                                    {PHASE_NAMES[phase]} 진행 중
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users size={12} style={{ color: 'rgba(139,92,246,0.5)' }} />
                                <span className="text-xs" style={{ color: 'rgba(139,92,246,0.5)' }}>{studentCount}명 접속</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                            style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)' }}>
                            <span className="font-black font-mono text-sm tracking-widest" style={{ color: '#fbbf24' }}>
                                {classCode}
                            </span>
                            <button onClick={copyCode} aria-label="코드 복사">
                                {copied ? <Check size={12} style={{ color: '#06d6a0' }} /> : <Copy size={12} style={{ color: '#fbbf24' }} />}
                            </button>
                        </div>
                        {/* End session button */}
                        {!endConfirm ? (
                            <button
                                onClick={() => setEndConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                                style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e' }}
                            >
                                <Flag size={12} /> 수업 종료
                            </button>
                        ) : (
                            <motion.button
                                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                                onClick={() => navigate(`/game/${classCode}/results`)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white"
                                style={{ background: 'linear-gradient(135deg, #f43f5e, #e8192c)', boxShadow: '0 0 15px rgba(244,63,94,0.4)' }}
                            >
                                ✓ 확인 - 결과 보기
                            </motion.button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">

                {/* ── Quick Stats ── */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                        { label: '접속 학생', value: studentCount, icon: Users, color: '#a78bfa' },
                        { label: '제출 완료', value: `${submittedCount}/${studentCount}`, icon: Check, color: '#06d6a0' },
                        { label: '황금 인장', value: sealAwarded.size, icon: Award, color: '#fbbf24' },
                        { label: '평균 XP', value: avgXp, icon: Zap, color: '#f5a623' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="rounded-xl p-4"
                            style={{ background: `${color}0a`, border: `1px solid ${color}20` }}>
                            <Icon size={14} style={{ color, marginBottom: 6 }} />
                            <div className="text-xl font-black text-white">{value}</div>
                            <div className="text-xs" style={{ color: `${color}80` }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.12)' }}>
                    {[
                        { key: 'control', label: '⏱️ Phase 제어' },
                        { key: 'students', label: '👥 학생 현황' },
                        { key: 'stats', label: '📊 통계' },
                    ].map(({ key, label }) => (
                        <button key={key} onClick={() => setTab(key as any)}
                            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{
                                background: tab === key ? 'rgba(124,58,237,0.4)' : 'transparent',
                                color: tab === key ? '#fff' : 'rgba(167,139,250,0.5)',
                                border: tab === key ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
                            }}>
                            {label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── Phase Control Tab ── */}
                    {tab === 'control' && (
                        <motion.div key="control"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-5"
                        >
                            <PhaseControl
                                current={phase}
                                onAdvance={() => phase < 4 && pushPhase((phase + 1) as Phase)}
                                onBack={() => phase > 0 && pushPhase((phase - 1) as Phase)}
                                loading={loading}
                            />

                            {/* All phases overview */}
                            <div className="rounded-2xl p-5"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.12)' }}>
                                <h3 className="text-sm font-bold text-white mb-4">전체 Phase 개요</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[0, 1, 2, 3].map(p => (
                                        <motion.button
                                            key={p}
                                            whileHover={{ scale: 1.03 }}
                                            onClick={() => pushPhase(p as Phase)}
                                            className="rounded-xl p-4 text-left transition-all"
                                            style={{
                                                background: p === phase ? `${PHASE_COLORS[p]}15` : 'rgba(255,255,255,0.03)',
                                                border: p === phase ? `2px solid ${PHASE_COLORS[p]}50` : '1px solid rgba(255,255,255,0.06)',
                                                boxShadow: p === phase ? `0 0 15px ${PHASE_COLORS[p]}25` : 'none',
                                            }}
                                        >
                                            <div className="text-2xl mb-2">{PHASE_EMOJIS[p]}</div>
                                            <div className="text-xs font-bold text-white mb-0.5">Phase {p}</div>
                                            <div className="text-xs" style={{ color: `${PHASE_COLORS[p]}90` }}>{PHASE_NAMES[p]}</div>
                                            {p === phase && (
                                                <div className="mt-2 w-2 h-2 rounded-full animate-pulse"
                                                    style={{ background: PHASE_COLORS[p] }} />
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Broadcast notice */}
                            <div className="rounded-xl p-4 flex items-start gap-3"
                                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                                <Eye size={16} style={{ color: '#a78bfa', flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <div className="text-sm font-bold text-white mb-1">실시간 동기화</div>
                                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(196,181,253,0.6)' }}>
                                        Phase 전환 버튼을 누르면 <strong className="text-white">모든 학생 화면</strong>이 즉시 전환됩니다.
                                        Firebase {isFirebaseConfigured() ? '✅ 연결됨' : '⚠️ 미설정 (로컬 모드)'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Students Tab ── */}
                    {tab === 'students' && (
                        <motion.div key="students"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        >
                            <div className="rounded-2xl overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                <div className="px-6 py-4 flex items-center justify-between"
                                    style={{ borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
                                    <h3 className="font-black text-white">학생 목록</h3>
                                    <button className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all"
                                        style={{ color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                        <Download size={11} /> CSV 내보내기
                                    </button>
                                </div>
                                <div className="px-6">
                                    {liveStudents.length === 0 ? (
                                        <div className="text-center py-10">
                                            <div className="text-4xl mb-3">👀</div>
                                            <p className="text-sm" style={{ color: 'rgba(167,139,250,0.5)' }}>
                                                아직 접속한 학생이 없습니다. 학급 코드를 공유하세요!
                                            </p>
                                        </div>
                                    ) : (
                                        liveStudents.map(s => (
                                            <StudentRow key={s.id} student={s}
                                                onAwardSeal={handleAwardSeal} />
                                        ))
                                    )}
                                </div>
                                <div className="px-6 py-3" style={{ borderTop: '1px solid rgba(139,92,246,0.08)' }}>
                                    <p className="text-xs text-center" style={{ color: 'rgba(139,92,246,0.35)' }}>
                                        {isFirebaseConfigured() ? '✅ 실시간 동기화 중' : '⚠️ 로컬 모드 (Mock 데이터)'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Stats Tab ── */}
                    {tab === 'stats' && (
                        <motion.div key="stats"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-5"
                        >
                            {/* Persona distribution */}
                            <div className="rounded-2xl p-6"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                <h3 className="font-black text-white mb-4 flex items-center gap-2">
                                    <BarChart3 size={16} style={{ color: '#a78bfa' }} /> 페르소나 분포
                                </h3>
                                {Object.entries(PERSONA_COLORS).map(([persona, color]) => {
                                    const count = liveStudents.filter(s => s.persona === persona).length;
                                    const pct = liveStudents.length ? Math.round((count / liveStudents.length) * 100) : 0;
                                    return (
                                        <div key={persona} className="mb-3">
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="text-white">{PERSONA_EMOJI[persona]} {persona}</span>
                                                <span style={{ color }}>{count}명 ({pct}%)</span>
                                            </div>
                                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                <motion.div className="h-full rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.6, delay: 0.1 }}
                                                    style={{ background: color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* NPC Trust Leaderboard */}
                            <div className="rounded-2xl p-6"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                <h3 className="font-black text-white mb-4">전체 NPC 신뢰도 현황</h3>
                                {MOCK_NPCS.map(npc => (
                                    <div key={npc.id} className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-white">{npc.emoji} {npc.name}</span>
                                            <span style={{ color: npc.trustLevel >= 80 ? '#06d6a0' : 'rgba(167,139,250,0.6)' }}>
                                                {npc.trustLevel}% {npc.trustLevel >= 80 ? '✓ 설득' : ''}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                            <motion.div className="h-full rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${npc.trustLevel}%` }}
                                                transition={{ duration: 0.7 }}
                                                style={{ background: npc.trustLevel >= 80 ? '#06d6a0' : 'linear-gradient(90deg, #f43f5e, #fbbf24)' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Rubric Download */}
                            <div className="rounded-2xl p-6"
                                style={{ background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.2)' }}>
                                <h3 className="font-black text-white mb-2 flex items-center gap-2">
                                    <Download size={16} style={{ color: '#06d6a0' }} /> 교사용 평가 도구
                                </h3>
                                <p className="text-xs mb-4" style={{ color: 'rgba(6,214,160,0.6)' }}>
                                    공정공장 수업에서 사용할 수 있는 루브릭(평가 기준표)입니다.
                                </p>
                                <button
                                    onClick={() => {
                                        const rubricHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>공정공장 루브릭</title>
<style>
body{font-family:'Malgun Gothic',sans-serif;padding:40px;max-width:900px;margin:0 auto;color:#1a1a2e}
h1{text-align:center;color:#7c3aed}
h2{color:#5b21b6;border-bottom:2px solid #e9d5ff;padding-bottom:8px}
table{width:100%;border-collapse:collapse;margin:16px 0 32px}
th,td{border:1px solid #d8b4fe;padding:10px 12px;text-align:left;font-size:13px}
th{background:#f3e8ff;font-weight:700;color:#5b21b6}
tr:nth-child(even){background:#faf5ff}
.header{background:linear-gradient(135deg,#7c3aed,#a78bfa);color:white;padding:20px;border-radius:12px;text-align:center;margin-bottom:24px}
.footer{text-align:center;margin-top:32px;color:#888;font-size:12px}
</style></head><body>
<div class="header"><h1>🏭 공정공장(Fair Factory) 평가 기준표</h1><p>학급 코드: ${classCode} | 생성일: ${new Date().toLocaleDateString('ko-KR')}</p></div>
<h2>📊 Phase별 평가 기준</h2>
<table>
<tr><th>Phase</th><th>평가 요소</th><th>상 (A)</th><th>중 (B)</th><th>하 (C)</th></tr>
<tr><td>🎭 P0<br>환상의 장막</td><td>비판적 사고</td><td>광고의 의도를 파악하고 근거를 들어 판단</td><td>광고에 의문을 제기하나 근거 부족</td><td>광고를 그대로 수용</td></tr>
<tr><td>🔍 P1<br>진실의 돋보기</td><td>탐구력/공감</td><td>3개 이상 진실 발견 + 감정 표현</td><td>2개 진실 발견</td><td>1개 이하 발견</td></tr>
<tr><td>⚖️ P2<br>지혜의 토론</td><td>의사소통/설득력</td><td>3명 이상 NPC 설득 + 논리적 근거 제시</td><td>2명 NPC 설득</td><td>1명 이하 설득</td></tr>
<tr><td>✨ P3<br>공정의 설계</td><td>문제해결/윤리</td><td>공정지수 80%+ 달성 + 이유 서술</td><td>공정지수 60-79%</td><td>공정지수 60% 미만</td></tr>
<tr><td>📝 P4<br>성찰의 거울</td><td>자기성찰/실천의지</td><td>5개 질문 모두 깊이 있는 답변 + 구체적 행동 약속</td><td>답변은 했으나 깊이 부족</td><td>형식적 답변</td></tr>
</table>
<h2>🌟 종합 평가 (구조적 공감 지수)</h2>
<table>
<tr><th>등급</th><th>기준</th><th>설명</th></tr>
<tr><td>🏅 감정적 공감</td><td>반사적 공감 점수 0-39</td><td>"불쌍하다" 수준의 단순 감정 반응</td></tr>
<tr><td>🥈 인과적 공감</td><td>반사적 공감 점수 40-69</td><td>"왜 그럴까?" 원인을 탐구하는 수준</td></tr>
<tr><td>🥇 구조적 공감</td><td>반사적 공감 점수 70+</td><td>"어떻게 바꿀까?" 시스템 변화를 모색하는 수준</td></tr>
</table>
<h2>📋 성취기준 매핑</h2>
<table>
<tr><th>교육과정</th><th>성취기준</th><th>관련 Phase</th></tr>
<tr><td>사회 (경제)</td><td>[6사04-04] 합리적 소비와 윤리적 소비</td><td>P0, P3</td></tr>
<tr><td>사회 (일반사회)</td><td>[9사(일사)02-03] 국제 사회 문제와 해결</td><td>P1, P2</td></tr>
<tr><td>도덕</td><td>[9도02-02] 세계시민으로서 도덕적 판단</td><td>P2, P4</td></tr>
<tr><td>국어 (화법)</td><td>[9국01-04] 토론에서 적절한 근거 활용</td><td>P2</td></tr>
</table>
<div class="footer">© 공정공장(Fair Factory) - 교사용 평가 도구 | 이 문서는 자유롭게 수정하여 사용 가능합니다.</div>
</body></html>`;
                                        const blob = new Blob([rubricHtml], { type: 'text/html' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url; a.download = `공정공장_루브릭_${classCode}.html`;
                                        a.click(); URL.revokeObjectURL(url);
                                    }}
                                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all"
                                    style={{ background: 'rgba(6,214,160,0.25)', border: '1px solid rgba(6,214,160,0.4)' }}
                                >
                                    <Download size={14} /> 루브릭(평가표) 다운로드 (.html)
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
