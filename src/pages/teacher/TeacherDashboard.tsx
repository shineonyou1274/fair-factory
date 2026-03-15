import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, LogOut, Copy, Check, Users, ChevronRight,
    Zap, Award, BarChart3, Clock, Settings, Shield, Trash2,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore, useSessionStore } from '@/store';
import { MOCK_SESSION, isFirebaseConfigured } from '@/lib/mockData';
import type { ClassSession } from '@/types';

// ── Small Stat Card ───────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType; label: string; value: string | number; color: string;
}) {
    return (
        <div className="rounded-2xl p-5"
            style={{ background: `${color}0d`, border: `1px solid ${color}22` }}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: `${color}99` }}>{label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                    <Icon size={15} style={{ color }} />
                </div>
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
        </div>
    );
}

// ── Session Card ──────────────────────────────────────────────
function SessionCard({ session, onEnter, onDelete }: { session: ClassSession; onEnter: () => void; onDelete: () => void }) {
    const [copied, setCopied] = useState(false);
    const [settingsTip, setSettingsTip] = useState(false);
    const phaseNames = ['환상의 장막', '진실의 돋보기', '지혜의 토론', '공정의 설계'];
    const phaseColors = ['#f43f5e', '#f5a623', '#06d6a0', '#a78bfa'];

    function copyCode() {
        navigator.clipboard.writeText(session.classCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleSettings() {
        setSettingsTip(true);
        setTimeout(() => setSettingsTip(false), 2000);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 transition-all duration-300"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)' }}
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold px-3 py-1 rounded-full"
                            style={{ background: session.isActive ? 'rgba(6,214,160,0.15)' : 'rgba(255,255,255,0.08)', color: session.isActive ? '#06d6a0' : '#627290', border: `1px solid ${session.isActive ? 'rgba(6,214,160,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                            {session.isActive ? '● 진행 중' : '○ 종료됨'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full"
                            style={{ background: `${phaseColors[session.currentPhase]}22`, color: phaseColors[session.currentPhase] }}>
                            Phase {session.currentPhase}: {phaseNames[session.currentPhase]}
                        </span>
                    </div>
                    <h3 className="font-black text-white text-lg">{session.teacherName}의 수업</h3>
                    <p className="text-xs mt-1" style={{ color: 'rgba(167,139,250,0.5)' }}>
                        {new Date(session.createdAt).toLocaleDateString('ko-KR')} 생성
                    </p>
                </div>
                {/* Class Code & Delete */}
                <div className="flex flex-col items-end gap-2 text-right">
                    <div className="flex items-center gap-2">
                        <div className="text-xs" style={{ color: 'rgba(167,139,250,0.5)' }}>학급 코드</div>
                        <span className="text-xl font-black font-mono tracking-widest" style={{ color: '#fbbf24' }}>
                            {session.classCode}
                        </span>
                        <button onClick={copyCode}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: copied ? 'rgba(6,214,160,0.2)' : 'rgba(255,255,255,0.08)' }}
                            aria-label="코드 복사">
                            {copied ? <Check size={12} style={{ color: '#06d6a0' }} /> : <Copy size={12} style={{ color: '#a78bfa' }} />}
                        </button>
                    </div>
                    <button onClick={onDelete}
                        className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                        style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}
                        aria-label="세션 삭제">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Phase Progress Bar */}
            <div className="mb-5">
                <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(139,92,246,0.5)' }}>
                    <span>진행 단계</span>
                    <span>{session.currentPhase}/3</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(session.currentPhase / 3) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, #7c3aed, ${phaseColors[session.currentPhase]})` }}
                    />
                </div>
                <div className="flex justify-between mt-2">
                    {[0, 1, 2, 3].map((p) => (
                        <div key={p} className="flex flex-col items-center gap-1">
                            <div className="w-3 h-3 rounded-full"
                                style={{ background: p <= session.currentPhase ? phaseColors[p] : 'rgba(255,255,255,0.1)' }} />
                            <span className="text-[10px]" style={{ color: 'rgba(139,92,246,0.4)' }}>{p}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={onEnter}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-300"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 30px rgba(124,58,237,0.6)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(124,58,237,0.3)'; }}
                >
                    수업 대시보드 입장 <ChevronRight size={15} />
                </button>
                <div className="relative">
                    <button onClick={handleSettings}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        aria-label="세션 설정">
                        <Settings size={15} style={{ color: 'rgba(167,139,250,0.6)' }} />
                    </button>
                    {settingsTip && (
                        <div className="absolute bottom-12 right-0 text-xs px-3 py-2 rounded-xl whitespace-nowrap z-10"
                            style={{ background: '#1a1035', border: '1px solid rgba(124,58,237,0.3)', color: 'rgba(196,181,253,0.7)' }}>
                            🔧 세션 설정 — 준비 중
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function TeacherDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { setSession } = useSessionStore();
    const [sessions, setSessions] = useState<ClassSession[]>([]);
    const [tab, setTab] = useState<'sessions' | 'guide'>('sessions');
    const [loadingSessions, setLoadingSessions] = useState(true);

    useEffect(() => {
        async function loadSessions() {
            setLoadingSessions(true);
            try {
                if (isFirebaseConfigured() && user?.uid) {
                    const { TeacherService } = await import('@/lib/firebaseService');
                    const real = await TeacherService.getSessions(user.uid);
                    setSessions(real);
                } else if (!isFirebaseConfigured()) {
                    // Mock 모드: 삭제된 세션 ID를 localStorage에서 확인
                    const deletedIds: string[] = JSON.parse(localStorage.getItem('fair-factory-deleted-sessions') ?? '[]');
                    if (!deletedIds.includes(MOCK_SESSION.id)) {
                        setSessions([MOCK_SESSION]);
                    } else {
                        setSessions([]);
                    }
                } else {
                    setSessions([]);
                }
            } catch (e) {
                console.error('Failed to load sessions:', e);
                setSessions([]);
            } finally {
                setLoadingSessions(false);
            }
        }
        loadSessions();
    }, [user]);

    async function handleLogout() {
        try { await signOut(auth); } catch { /* mock mode */ }
        logout();
        navigate('/');
    }

    function handleEnterSession(session: ClassSession) {
        setSession(session);
        navigate(`/teacher/session/${session.id}`);
    }

    function handleDeleteSession(id: string) {
        if (!confirm('정말로 이 수업을 삭제하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) return;

        if (isFirebaseConfigured()) {
            import('@/lib/firebaseService').then(({ SessionService }) => {
                SessionService.delete(id);
                setSessions(prev => prev.filter(s => s.id !== id));
            }).catch(console.error);
        } else {
            // Mock 모드: 삭제된 세션 ID를 localStorage에 기록
            const deletedIds: string[] = JSON.parse(localStorage.getItem('fair-factory-deleted-sessions') ?? '[]');
            if (!deletedIds.includes(id)) {
                localStorage.setItem('fair-factory-deleted-sessions', JSON.stringify([...deletedIds, id]));
            }
            setSessions(prev => prev.filter(s => s.id !== id));
        }
    }

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0618 0%, #0d0d1a 100%)' }}>

            {/* ── Header ── */}
            <header className="sticky top-0 z-40"
                style={{ background: 'rgba(10,6,24,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #e94560)' }}>공</div>
                        </Link>
                        <div>
                            <h1 className="font-black text-white text-sm">교사 대시보드</h1>
                            <p className="text-xs" style={{ color: 'rgba(167,139,250,0.5)' }}>
                                {user?.displayName} · {user?.school ?? 'Game Master'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/admin"
                            className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all"
                            style={{ color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <Shield size={12} /> 관리자
                        </Link>
                        <button onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
                            style={{ color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <LogOut size={12} /> 로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">

                {/* ── Welcome Banner ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl p-8 mb-8 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(91,33,182,0.1))', border: '1px solid rgba(124,58,237,0.3)' }}
                >
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-8xl opacity-20 select-none">🏰</div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-white mb-1">
                            안녕하세요, {user?.displayName}! 👋
                        </h2>
                        <p className="mb-5" style={{ color: 'rgba(196,181,253,0.7)' }}>
                            오늘도 학생들과 함께 공정의 여정을 떠나봐요.
                        </p>
                        <button onClick={() => navigate('/teacher/session/new')}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 25px rgba(124,58,237,0.5)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <Plus size={18} /> 새 세션 만들기
                        </button>
                    </div>
                </motion.div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={Users} label="전체 세션" value={sessions.length} color="#a78bfa" />
                    <StatCard icon={Zap} label="활성 세션" value={sessions.filter(s => s.isActive).length} color="#06d6a0" />
                    <StatCard icon={Award} label="황금 인장 수여" value={sessions.reduce((a, s) => a + s.goldenSealsAwarded, 0)} color="#fbbf24" />
                    <StatCard icon={BarChart3} label="완료된 Phase" value="—" color="#f43f5e" />
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    {(['sessions', 'guide'] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{
                                background: tab === t ? 'rgba(124,58,237,0.4)' : 'transparent',
                                color: tab === t ? '#fff' : 'rgba(167,139,250,0.5)',
                                border: tab === t ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
                            }}>
                            {t === 'sessions' ? '📋 내 세션' : '📖 시작 가이드'}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {tab === 'sessions' && (
                        <motion.div key="sessions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {loadingSessions ? (
                                <div className="text-center py-20">
                                    <div className="text-5xl mb-4 animate-pulse">🔄</div>
                                    <h3 className="text-xl font-bold text-white mb-2">세션 불러오는 중...</h3>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="text-5xl mb-4">📭</div>
                                    <h3 className="text-xl font-bold text-white mb-2">아직 세션이 없어요</h3>
                                    <p className="text-sm mb-6" style={{ color: 'rgba(167,139,250,0.5)' }}>새 세션을 만들어 수업을 시작해보세요!</p>
                                    <button onClick={() => navigate('/teacher/session/new')}
                                        className="btn-gold px-8 py-3">
                                        <Plus size={16} /> 첫 세션 만들기
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {sessions.map((s) => (
                                        <SessionCard key={s.id} session={s} onEnter={() => handleEnterSession(s)} onDelete={() => handleDeleteSession(s.id)} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {tab === 'guide' && (
                        <motion.div key="guide"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {[
                                { step: 1, title: '새 세션 만들기', desc: '"새 세션 만들기" 버튼으로 학급 코드를 발급받으세요.', icon: '🎯', color: '#a78bfa' },
                                { step: 2, title: '학급 코드 공유', desc: '발급된 6자리 코드를 학생들에게 공유하세요.', icon: '📣', color: '#fbbf24' },
                                { step: 3, title: '모둠 자동 구성', desc: '학생들이 입장하면 3~5인 모둠이 자동으로 랜덤 구성됩니다.', icon: '👥', color: '#06d6a0' },
                                { step: 4, title: '타임라인 제어', desc: '대시보드의 Phase 슬라이더로 전체 학생의 화면을 동기화하세요.', icon: '⏱️', color: '#f43f5e' },
                                { step: 5, title: '황금 인장 수여', desc: '우수 모둠의 제출물을 승인하고 황금 인장으로 포상하세요.', icon: '🏅', color: '#f5a623' },
                            ].map(({ step, title, desc, icon, color }) => (
                                <div key={step} className="flex items-start gap-4 rounded-2xl p-5"
                                    style={{ background: `${color}08`, border: `1px solid ${color}1a` }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                                        style={{ background: `${color}22` }}>{icon}</div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: `${color}22`, color }}>Step {step}</span>
                                            <h3 className="font-bold text-white text-sm">{title}</h3>
                                        </div>
                                        <p className="text-xs leading-relaxed" style={{ color: 'rgba(167,139,250,0.6)' }}>{desc}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="rounded-2xl p-5 mt-2"
                                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={14} style={{ color: '#a78bfa' }} />
                                    <span className="text-sm font-bold text-white">권장 수업 시간</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                                    {[['Phase 0', '5분', '🎭'], ['Phase 1', '10분', '🔍'], ['Phase 2', '15분', '⚖️'], ['Phase 3', '10분', '✨']].map(([p, t, e]) => (
                                        <div key={p} className="rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <div className="text-lg mb-1">{e}</div>
                                            <div className="font-bold text-white">{p}</div>
                                            <div style={{ color: 'rgba(167,139,250,0.6)' }}>{t}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
