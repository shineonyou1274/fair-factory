import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ChevronLeft, Sparkles, Settings, Clock } from 'lucide-react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore, useSessionStore } from '@/store';
import { isFirebaseConfigured, MOCK_SESSION } from '@/lib/mockData';
import type { ClassSession } from '@/types';

// ─── Random 6-char code generator ────────────────────────────
function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Setting Row ──────────────────────────────────────────────
function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-4"
            style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
            <div>
                <div className="text-sm font-semibold text-white">{label}</div>
                {desc && <div className="text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.5)' }}>{desc}</div>}
            </div>
            <div className="ml-4">{children}</div>
        </div>
    );
}

// ─── Toggle ───────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button onClick={() => onChange(!value)}
            className="w-12 h-6 rounded-full relative transition-all duration-300"
            style={{ background: value ? '#7c3aed' : 'rgba(255,255,255,0.1)' }}
            aria-checked={value} role="switch">
            <motion.div
                animate={{ x: value ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
            />
        </button>
    );
}

// ─── Main ─────────────────────────────────────────────────────
export default function SessionCreate() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { setSession } = useSessionStore();

    const [step, setStep] = useState<'settings' | 'ready'>('settings');
    const [classCode] = useState(generateCode);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    // Settings
    const [minGroup, setMinGroup] = useState(3);
    const [maxGroup, setMaxGroup] = useState(5);
    const [allowLang, setAllowLang] = useState(true);   // 다국어
    const [timeLimit0] = useState<null>(null);            // Phase 0 (자유)
    const [timeLimit1, setTimeLimit1] = useState(600);   // 10분
    const [timeLimit2, setTimeLimit2] = useState(900);   // 15분
    const [timeLimit3, setTimeLimit3] = useState(600);   // 10분

    function copyCode() {
        navigator.clipboard.writeText(classCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function handleCreate() {
        setLoading(true);
        try {
            if (isFirebaseConfigured() && user) {
                // ✅ 실제 Firebase 세션 생성
                const { SessionService } = await import('@/lib/firebaseService');
                const session = await SessionService.create(
                    user.uid,
                    user.displayName ?? '선생님',
                    { maxGroupSize: maxGroup as 3 | 4 | 5 }
                );
                setSession(session);
            } else {
                // 🧪 목 데이터 모드
                const session: ClassSession = {
                    id: classCode,
                    classCode,
                    teacherId: user?.uid ?? 'mock-teacher-001',
                    teacherName: user?.displayName ?? '김공정 선생님',
                    currentPhase: 0,
                    goldenSealsAwarded: 0,
                    isActive: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    settings: {
                        maxGroupSize: maxGroup as 3 | 4 | 5,
                        minGroupSize: minGroup as 3 | 4 | 5,
                        allowPersonaChoice: false,
                        phaseTimeLimits: { 0: timeLimit0, 1: timeLimit1, 2: timeLimit2, 3: timeLimit3, 4: null },
                        language: 'ko',
                    },
                };
                setSession(session);
            }
            setStep('ready');
        } catch (e) {
            console.error('세션 생성 오류:', e);
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0618 0%, #0d0d1a 100%)' }}>
            <header className="sticky top-0 z-40"
                style={{ background: 'rgba(10,6,24,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
                <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-4">
                    <Link to="/teacher/dashboard"
                        className="flex items-center gap-2 text-sm transition-colors"
                        style={{ color: 'rgba(167,139,250,0.6)' }}>
                        <ChevronLeft size={16} /> 대시보드
                    </Link>
                    <h1 className="font-black text-white">새 세션 만들기</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-10">
                <AnimatePresence mode="wait">

                    {/* ── Step 1: Settings ── */}
                    {step === 'settings' && (
                        <motion.div key="settings"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Code preview */}
                            <div className="rounded-3xl p-6 mb-6 text-center"
                                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(91,33,182,0.08))', border: '1px solid rgba(124,58,237,0.3)' }}>
                                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(167,139,250,0.5)' }}>
                                    학급 코드 (자동 발급)
                                </p>
                                <div className="flex items-center justify-center gap-4 mb-2">
                                    <span className="font-black text-5xl font-mono tracking-[0.2em]"
                                        style={{ color: '#fbbf24', letterSpacing: '0.3em' }}>
                                        {classCode}
                                    </span>
                                    <button onClick={copyCode}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                                        style={{ background: copied ? 'rgba(6,214,160,0.2)' : 'rgba(255,255,255,0.08)' }}
                                        aria-label="코드 복사">
                                        {copied ? <Check size={16} style={{ color: '#06d6a0' }} /> : <Copy size={16} style={{ color: '#a78bfa' }} />}
                                    </button>
                                </div>
                                <p className="text-xs" style={{ color: 'rgba(167,139,250,0.4)' }}>
                                    학생들이 이 코드로 입장합니다
                                </p>
                            </div>

                            {/* Settings */}
                            <div className="rounded-2xl p-6 mb-6"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                <h2 className="font-black text-white mb-1 flex items-center gap-2">
                                    <Settings size={16} style={{ color: '#a78bfa' }} /> 세션 설정
                                </h2>
                                <p className="text-xs mb-4" style={{ color: 'rgba(139,92,246,0.4)' }}>
                                    나중에도 변경 가능합니다
                                </p>

                                {/* Group size */}
                                <SettingRow label="모둠당 인원" desc={`${minGroup}~${maxGroup}명 자동 랜덤 배정`}>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setMinGroup(m => Math.max(2, m - 1))}
                                            className="w-7 h-7 rounded-lg font-black text-white flex items-center justify-center"
                                            style={{ background: 'rgba(255,255,255,0.08)' }}>−</button>
                                        <span className="text-white font-bold w-8 text-center">{minGroup}~{maxGroup}</span>
                                        <button onClick={() => setMaxGroup(m => Math.min(6, m + 1))}
                                            className="w-7 h-7 rounded-lg font-black text-white flex items-center justify-center"
                                            style={{ background: 'rgba(255,255,255,0.08)' }}>+</button>
                                    </div>
                                </SettingRow>

                                <SettingRow label="페르소나 배정" desc="해리포터 기숙사 방식 (수정구슬 랜덤 배정)">
                                    <span className="text-xs px-3 py-1.5 rounded-full font-bold"
                                        style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
                                        🔮 랜덤 고정
                                    </span>
                                </SettingRow>

                                <SettingRow label="다국어 지원" desc="학생 화면에 언어 전환 버튼 표시">
                                    <Toggle value={allowLang} onChange={setAllowLang} />
                                </SettingRow>

                                {/* Phase time limits */}
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock size={13} style={{ color: '#a78bfa' }} />
                                        <span className="text-sm font-semibold text-white">Phase 제한 시간</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { phase: 0, label: '환상의 장막', value: null, setter: null },
                                            { phase: 1, label: '진실의 돋보기', value: timeLimit1, setter: setTimeLimit1 },
                                            { phase: 2, label: '지혜의 토론', value: timeLimit2, setter: setTimeLimit2 },
                                            { phase: 3, label: '공정의 설계', value: timeLimit3, setter: setTimeLimit3 },
                                        ].map(({ phase, label, value, setter }) => (
                                            <div key={phase} className="rounded-xl p-3"
                                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)' }}>
                                                <div className="text-xs mb-1" style={{ color: 'rgba(139,92,246,0.5)' }}>P{phase} {label}</div>
                                                {setter && value !== null ? (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => setter(Math.max(120, value - 60))}
                                                            className="w-6 h-6 rounded-md text-white flex items-center justify-center text-xs"
                                                            style={{ background: 'rgba(255,255,255,0.08)' }}>−</button>
                                                        <span className="text-white font-black text-sm flex-1 text-center">
                                                            {Math.floor(value / 60)}분
                                                        </span>
                                                        <button onClick={() => setter(Math.min(1800, value + 60))}
                                                            className="w-6 h-6 rounded-md text-white flex items-center justify-center text-xs"
                                                            style={{ background: 'rgba(255,255,255,0.08)' }}>+</button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold" style={{ color: 'rgba(167,139,250,0.5)' }}>자유 진행</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                                onClick={handleCreate}
                                disabled={loading}
                                className="w-full py-5 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3 disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 30px rgba(124,58,237,0.5)' }}
                            >
                                <Sparkles size={22} />
                                {loading ? '세션 생성 중...' : '세션 시작하기!'}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Step 2: Ready ── */}
                    {step === 'ready' && (
                        <motion.div key="ready"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-10"
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: 3, duration: 0.4 }}
                                className="text-8xl mb-6">🎉</motion.div>
                            <h2 className="text-3xl font-black text-white mb-3">세션이 열렸습니다!</h2>
                            <p className="mb-6" style={{ color: 'rgba(196,181,253,0.6)' }}>
                                학생들에게 아래 코드를 공유하세요
                            </p>

                            {/* Big code display */}
                            <div className="rounded-3xl p-8 mb-6 inline-block"
                                style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(245,166,35,0.06))', border: '2px solid rgba(245,166,35,0.4)' }}>
                                <div className="text-sm mb-2 uppercase tracking-widest" style={{ color: 'rgba(245,166,35,0.6)' }}>학급 코드</div>
                                <div className="font-black font-mono text-6xl tracking-[0.3em] mb-4" style={{ color: '#fbbf24' }}>
                                    {classCode}
                                </div>
                                <button onClick={copyCode}
                                    className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                                    style={{ background: copied ? 'rgba(6,214,160,0.2)' : 'rgba(245,166,35,0.15)', color: copied ? '#06d6a0' : '#fbbf24', border: `1px solid ${copied ? 'rgba(6,214,160,0.4)' : 'rgba(245,166,35,0.3)'}` }}>
                                    {copied ? <><Check size={14} /> 복사됨!</> : <><Copy size={14} /> 코드 복사</>}
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate(`/teacher/session/${classCode}`)}
                                    className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-base text-white"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 25px rgba(124,58,237,0.4)' }}
                                >
                                    <Sparkles size={18} /> 수업 컨트롤 패널 입장 →
                                </motion.button>
                                <button
                                    onClick={() => navigate('/teacher/dashboard')}
                                    className="px-6 py-4 rounded-2xl text-sm font-semibold transition-all"
                                    style={{ color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                    대시보드로
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
