import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, BookOpen, Award, BarChart3, Download,
    ChevronRight, Shield, Zap, CheckCircle,
    Globe, Trash2, RefreshCw, Eye,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────
const MOCK_TEACHERS = [
    { id: 't1', name: '김공정', email: 'teacher@fair.edu', school: '공정중학교', sessions: 3, lastActive: '방금 전', status: 'active' },
    { id: 't2', name: '이민주', email: 'mj@school.kr', school: '정의초등학교', sessions: 1, lastActive: '1시간 전', status: 'active' },
    { id: 't3', name: '박세준', email: 'sj@edu.kr', school: '공평고등학교', sessions: 5, lastActive: '어제', status: 'inactive' },
];

const MOCK_SESSIONS_ALL = [
    { id: 's1', code: 'FAIR01', teacher: '김공정', students: 6, phase: 1, active: true, created: '2026-03-10' },
    { id: 's2', code: 'JUST02', teacher: '김공정', students: 4, phase: 3, active: false, created: '2026-03-08' },
    { id: 's3', code: 'MINJOO', teacher: '이민주', students: 8, phase: 0, active: true, created: '2026-03-10' },
    { id: 's4', code: 'PEACE3', teacher: '박세준', students: 5, phase: 2, active: false, created: '2026-03-05' },
];

const MOCK_REPORTS = [
    { id: 'r1', student: '김민준', session: 'FAIR01', persona: '📊 알파', xp: 120, submitted: '14:32', preview: '카카오 농장에서 아동 노동이 발생하는 구조적 원인은 유통업자의 과도한 마진 때문입니다. 농장주에게 돌아오는 3%는...', sealed: false },
    { id: 'r2', student: '박지호', session: 'FAIR01', persona: '💡 오메가', xp: 140, submitted: '14:45', preview: '협동조합 모델을 도입하면 농장주의 수익을 15%까지 올릴 수 있습니다. 유통 단계를 줄이기 위한 직거래...', sealed: true },
    { id: 'r3', student: '정도윤', session: 'FAIR01', persona: '⚡ 시그마', xp: 110, submitted: '15:01', preview: 'CSR 보고서와 실제 데이터의 불일치가 명백합니다. 맥스웰 사의 공정무역 인증률은 2%에 불과하며...', sealed: false },
    { id: 'r4', student: '최은율', session: 'MINJOO', persona: '🕊️ 델타', xp: 95, submitted: '15:22', preview: '이해관계자 간의 갈등을 해소하기 위한 3단계 협상 프로세스를 제안합니다. 첫째, 농장주와 유통업자가...', sealed: false },
];

const PHASE_NAMES = ['환상의 장막', '진실의 돋보기', '지혜의 토론', '공정의 설계'];
const PHASE_COLORS = ['#f43f5e', '#f5a623', '#06d6a0', '#a78bfa'];

// ─── Stat Big Card ────────────────────────────────────────────
function BigStat({ icon: Icon, value, label, sub, color }: {
    icon: React.ElementType; value: string | number; label: string; sub?: string; color: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6"
            style={{ background: `${color}0a`, border: `1px solid ${color}22` }}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}20` }}>
                    <Icon size={18} style={{ color }} />
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: `${color}15`, color: `${color}cc` }}>live</span>
            </div>
            <div className="text-4xl font-black text-white mb-1">{value}</div>
            <div className="text-sm font-semibold" style={{ color: `${color}cc` }}>{label}</div>
            {sub && <div className="text-xs mt-1" style={{ color: 'rgba(139,92,246,0.4)' }}>{sub}</div>}
        </motion.div>
    );
}

// ─── Export Utils ─────────────────────────────────────────────
function downloadCSV(data: object[], filename: string) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => JSON.stringify((row as any)[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ─── Main Admin Panel ─────────────────────────────────────────
export default function AdminPanel() {
    const [tab, setTab] = useState<'overview' | 'teachers' | 'sessions' | 'reports' | 'export'>('overview');
    const [sealed, setSealed] = useState<Set<string>>(new Set(['r2']));
    const [reportModal, setReportModal] = useState<typeof MOCK_REPORTS[0] | null>(null);

    const totalStudents = MOCK_SESSIONS_ALL.reduce((a, s) => a + s.students, 0);
    const activeSessions = MOCK_SESSIONS_ALL.filter(s => s.active).length;

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0618 0%, #0d0d1a 100%)' }}>

            {/* ── Header ── */}
            <header className="sticky top-0 z-40"
                style={{ background: 'rgba(10,6,24,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(244,63,94,0.2)' }}>
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #e94560)' }}>공</div>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <Shield size={14} style={{ color: '#f43f5e' }} />
                                <span className="font-black text-white text-sm">슈퍼 관리자</span>
                            </div>
                            <p className="text-xs" style={{ color: 'rgba(244,63,94,0.5)' }}>최고 권한 패널</p>
                        </div>
                    </div>
                    <Link to="/teacher/dashboard"
                        className="text-xs px-3 py-2 rounded-lg transition-all"
                        style={{ color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(139,92,246,0.2)' }}>
                        ← 교사 대시보드
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">

                {/* ── Tabs ── */}
                <div className="flex gap-1 mb-8 p-1 rounded-xl overflow-x-auto"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.12)', width: 'fit-content' }}>
                    {[
                        { key: 'overview', label: '📊 개요' },
                        { key: 'teachers', label: '👨‍🏫 교사' },
                        { key: 'sessions', label: '🎮 세션' },
                        { key: 'reports', label: `📝 리포트 ${MOCK_REPORTS.filter(r => !sealed.has(r.id)).length > 0 ? `(${MOCK_REPORTS.filter(r => !sealed.has(r.id)).length})` : ''}` },
                        { key: 'export', label: '📤 내보내기' },
                    ].map(({ key, label }) => (
                        <button key={key} onClick={() => setTab(key as any)}
                            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                            style={{
                                background: tab === key ? 'rgba(244,63,94,0.25)' : 'transparent',
                                color: tab === key ? '#fff' : 'rgba(167,139,250,0.5)',
                                border: tab === key ? '1px solid rgba(244,63,94,0.4)' : '1px solid transparent',
                            }}>
                            {label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* ── Overview ── */}
                    {tab === 'overview' && (
                        <motion.div key="overview"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                <BigStat icon={Users} value={MOCK_TEACHERS.length} label="전체 교사" sub="이번 달 가입" color="#a78bfa" />
                                <BigStat icon={BookOpen} value={MOCK_SESSIONS_ALL.length} label="전체 세션" sub={`${activeSessions}개 활성`} color="#38bdf8" />
                                <BigStat icon={Users} value={totalStudents} label="전체 학생" sub="누적 참여" color="#06d6a0" />
                                <BigStat icon={Award} value={MOCK_REPORTS.filter(r => sealed.has(r.id)).length} label="황금 인장" sub="수여 완료" color="#fbbf24" />
                            </div>

                            {/* Activity Feed */}
                            <div className="rounded-2xl p-6 mb-5"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                <h3 className="font-black text-white mb-4 flex items-center gap-2">
                                    <RefreshCw size={15} style={{ color: '#a78bfa' }} /> 최근 활동
                                </h3>
                                {[
                                    { time: '15:22', msg: '이민주 교사 — MINJOO 세션에 학생 8명 입장', color: '#06d6a0' },
                                    { time: '15:01', msg: '정도윤 — FAIR01 리포트 제출 (⚡ 시그마)', color: '#f43f5e' },
                                    { time: '14:45', msg: '박지호 — FAIR01 황금 인장 수령', color: '#fbbf24' },
                                    { time: '14:32', msg: '김민준 — FAIR01 리포트 제출 (📊 알파)', color: '#38bdf8' },
                                    { time: '14:10', msg: '김공정 교사 — Phase 1 전환 (FAIR01)', color: '#a78bfa' },
                                ].map(({ time, msg, color }, i) => (
                                    <div key={i} className="flex items-start gap-3 mb-3">
                                        <span className="text-xs flex-shrink-0 w-12 text-right pt-0.5"
                                            style={{ color: 'rgba(139,92,246,0.4)' }}>{time}</span>
                                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                                        <span className="text-xs leading-relaxed" style={{ color: 'rgba(196,181,253,0.7)' }}>{msg}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Phase Distribution Chart */}
                            <div className="rounded-2xl p-6"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                <h3 className="font-black text-white mb-4">세션별 Phase 현황</h3>
                                <div className="space-y-3">
                                    {MOCK_SESSIONS_ALL.map(s => (
                                        <div key={s.id} className="flex items-center gap-4">
                                            <span className="text-xs font-mono font-bold w-16 flex-shrink-0"
                                                style={{ color: '#fbbf24' }}>{s.code}</span>
                                            <div className="flex-1 flex gap-1">
                                                {[0, 1, 2, 3].map(p => (
                                                    <div key={p} className="flex-1 h-3 rounded-full"
                                                        style={{ background: p <= s.phase ? PHASE_COLORS[p] : 'rgba(255,255,255,0.06)' }} />
                                                ))}
                                            </div>
                                            <span className="text-xs flex-shrink-0"
                                                style={{ color: PHASE_COLORS[s.phase] }}>{PHASE_NAMES[s.phase]}</span>
                                            <span className="text-xs w-4 text-right" style={{ color: s.active ? '#06d6a0' : 'rgba(255,255,255,0.2)' }}>
                                                {s.active ? '●' : '○'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Teachers ── */}
                    {tab === 'teachers' && (
                        <motion.div key="teachers"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="rounded-2xl overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                <div className="px-6 py-4 border-b flex items-center justify-between"
                                    style={{ borderColor: 'rgba(139,92,246,0.12)' }}>
                                    <h3 className="font-black text-white">교사 계정 ({MOCK_TEACHERS.length})</h3>
                                    <button
                                        className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                                        style={{ color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(139,92,246,0.2)' }}
                                        onClick={() => downloadCSV(MOCK_TEACHERS, '교사목록.csv')}>
                                        <Download size={11} /> CSV
                                    </button>
                                </div>
                                {MOCK_TEACHERS.map((t, i) => (
                                    <motion.div key={t.id}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="px-6 py-4 flex items-center gap-4"
                                        style={{ borderBottom: i < MOCK_TEACHERS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                                            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
                                            {t.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-sm">{t.name}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{
                                                        background: t.status === 'active' ? 'rgba(6,214,160,0.15)' : 'rgba(255,255,255,0.06)',
                                                        color: t.status === 'active' ? '#06d6a0' : 'rgba(139,92,246,0.4)',
                                                    }}>
                                                    {t.status === 'active' ? '● 활성' : '○ 비활성'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-xs" style={{ color: 'rgba(139,92,246,0.5)' }}>{t.email}</span>
                                                <span className="text-xs" style={{ color: 'rgba(139,92,246,0.35)' }}>|</span>
                                                <span className="text-xs" style={{ color: 'rgba(139,92,246,0.5)' }}>{t.school}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-sm font-bold text-white">{t.sessions}개</div>
                                            <div className="text-xs" style={{ color: 'rgba(139,92,246,0.4)' }}>세션</div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-xs" style={{ color: 'rgba(139,92,246,0.4)' }}>{t.lastActive}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{ background: 'rgba(255,255,255,0.05)' }}
                                                title="세션 보기">
                                                <Eye size={13} style={{ color: '#a78bfa' }} />
                                            </button>
                                            <button className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{ background: 'rgba(244,63,94,0.08)' }}
                                                title="계정 삭제">
                                                <Trash2 size={13} style={{ color: '#f43f5e' }} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Sessions ── */}
                    {tab === 'sessions' && (
                        <motion.div key="sessions"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="rounded-2xl overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                <div className="px-6 py-4 border-b flex justify-between items-center"
                                    style={{ borderColor: 'rgba(139,92,246,0.12)' }}>
                                    <h3 className="font-black text-white">전체 세션 ({MOCK_SESSIONS_ALL.length})</h3>
                                    <button
                                        className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                                        style={{ color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(139,92,246,0.2)' }}
                                        onClick={() => downloadCSV(MOCK_SESSIONS_ALL, '세션목록.csv')}>
                                        <Download size={11} /> CSV
                                    </button>
                                </div>
                                {/* Table header */}
                                <div className="px-6 py-2 grid grid-cols-6 text-xs font-bold uppercase tracking-wider"
                                    style={{ color: 'rgba(139,92,246,0.4)', background: 'rgba(255,255,255,0.02)' }}>
                                    <span>코드</span><span>교사</span><span>학생</span><span>단계</span><span>상태</span><span>날짜</span>
                                </div>
                                {MOCK_SESSIONS_ALL.map((s, i) => (
                                    <motion.div key={s.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                        className="px-6 py-4 grid grid-cols-6 items-center gap-2"
                                        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                                    >
                                        <span className="font-mono font-black text-sm" style={{ color: '#fbbf24' }}>{s.code}</span>
                                        <span className="text-sm text-white">{s.teacher}</span>
                                        <span className="text-sm" style={{ color: 'rgba(196,181,253,0.7)' }}>{s.students}명</span>
                                        <span className="text-xs px-2 py-1 rounded-full w-fit"
                                            style={{ background: `${PHASE_COLORS[s.phase]}15`, color: PHASE_COLORS[s.phase] }}>
                                            P{s.phase}
                                        </span>
                                        <span className="text-xs" style={{ color: s.active ? '#06d6a0' : 'rgba(139,92,246,0.3)' }}>
                                            {s.active ? '● 진행 중' : '○ 종료'}
                                        </span>
                                        <span className="text-xs" style={{ color: 'rgba(139,92,246,0.4)' }}>{s.created}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Reports ── */}
                    {tab === 'reports' && (
                        <motion.div key="reports"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div className="space-y-4">
                                {MOCK_REPORTS.map((r, i) => (
                                    <motion.div key={r.id}
                                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                        className="rounded-2xl p-5"
                                        style={{
                                            background: sealed.has(r.id) ? 'rgba(6,214,160,0.05)' : 'rgba(255,255,255,0.03)',
                                            border: sealed.has(r.id) ? '1px solid rgba(6,214,160,0.25)' : '1px solid rgba(139,92,246,0.15)',
                                        }}>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-white">{r.student}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full"
                                                        style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>{r.persona}</span>
                                                    <span className="text-xs" style={{ color: 'rgba(139,92,246,0.4)' }}>
                                                        {r.session} · {r.submitted}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Zap size={11} style={{ color: '#fbbf24' }} />
                                                    <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>{r.xp} XP</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => setReportModal(r)}
                                                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl transition-all"
                                                    style={{ color: 'rgba(167,139,250,0.7)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                                    <Eye size={11} /> 전체 보기
                                                </button>
                                                {sealed.has(r.id) ? (
                                                    <div className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl"
                                                        style={{ background: 'rgba(6,214,160,0.15)', color: '#06d6a0', border: '1px solid rgba(6,214,160,0.3)' }}>
                                                        <CheckCircle size={11} /> 인장 수여 완료
                                                    </div>
                                                ) : (
                                                    <motion.button
                                                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => setSealed(prev => new Set(prev).add(r.id))}
                                                        className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl font-bold text-white"
                                                        style={{ background: 'linear-gradient(135deg, #f5a623, #e8920a)', boxShadow: '0 0 15px rgba(245,166,35,0.3)' }}>
                                                        <Award size={11} /> 황금 인장 수여
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(196,181,253,0.55)' }}>
                                            {r.preview}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Export ── */}
                    {tab === 'export' && (
                        <motion.div key="export"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <div className="rounded-2xl p-6"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                <h3 className="font-black text-white mb-2">📤 데이터 내보내기</h3>
                                <p className="text-xs mb-6" style={{ color: 'rgba(139,92,246,0.5)' }}>
                                    모든 데이터는 BOM이 포함된 UTF-8 CSV 형식으로 내보내져 Excel에서 바로 열립니다.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: '교사 목록', desc: '전체 교사 계정 정보', icon: '👨‍🏫', data: MOCK_TEACHERS, filename: '공정공장_교사목록.csv', color: '#a78bfa' },
                                        { label: '세션 목록', desc: '전체 세션 현황 및 Phase 진행도', icon: '🎮', data: MOCK_SESSIONS_ALL, filename: '공정공장_세션목록.csv', color: '#38bdf8' },
                                        { label: '리포트 목록', desc: '학생 제출 리포트 전체', icon: '📝', data: MOCK_REPORTS.map(r => ({ ...r, preview: r.preview.slice(0, 100) })), filename: '공정공장_리포트.csv', color: '#06d6a0' },
                                        { label: '황금 인장 현황', desc: '인장 수여 기록', icon: '🏅', data: MOCK_REPORTS.filter(r => sealed.has(r.id)).map(r => ({ 학생: r.student, 세션: r.session, 페르소나: r.persona, XP: r.xp, 제출시각: r.submitted })), filename: '공정공장_황금인장.csv', color: '#fbbf24' },
                                    ].map(({ label, desc, icon, data, filename, color }) => (
                                        <motion.button
                                            key={label}
                                            whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                                            onClick={() => downloadCSV(data, filename)}
                                            className="rounded-2xl p-5 text-left transition-all"
                                            style={{ background: `${color}08`, border: `1px solid ${color}22` }}
                                        >
                                            <div className="text-3xl mb-3">{icon}</div>
                                            <div className="font-black text-white mb-1">{label}</div>
                                            <div className="text-xs mb-3" style={{ color: 'rgba(196,181,253,0.5)' }}>{desc}</div>
                                            <div className="flex items-center gap-2 text-xs font-bold"
                                                style={{ color }}>
                                                <Download size={12} /> CSV 다운로드
                                                <ChevronRight size={12} />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Global settings placeholder */}
                            <div className="rounded-2xl p-6"
                                style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)' }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Globe size={15} style={{ color: '#f43f5e' }} />
                                    <h3 className="font-black text-white">전역 설정</h3>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: '플랫폼 정기 점검 모드', desc: '모든 세션 일시 중단' },
                                        { label: '신규 교사 회원가입', desc: '현재: 허용됨' },
                                        { label: '디버그 로그', desc: 'Firebase console 연동' },
                                    ].map(({ label, desc }) => (
                                        <div key={label} className="flex items-center justify-between py-3"
                                            style={{ borderBottom: '1px solid rgba(244,63,94,0.08)' }}>
                                            <div>
                                                <div className="text-sm font-semibold text-white">{label}</div>
                                                <div className="text-xs" style={{ color: 'rgba(244,63,94,0.5)' }}>{desc}</div>
                                            </div>
                                            <span className="text-xs px-2 py-1 rounded-full"
                                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(167,139,250,0.5)' }}>
                                                Firebase 연결 필요
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ── Report Detail Modal ── */}
            <AnimatePresence>
                {reportModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(10,6,24,0.9)' }}
                        onClick={() => setReportModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="rounded-3xl p-8 w-full max-w-lg"
                            style={{ background: '#110d2e', border: '1px solid rgba(139,92,246,0.3)' }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-black text-white text-lg">{reportModal.student}</span>
                                        <span className="text-sm">{reportModal.persona}</span>
                                    </div>
                                    <div className="text-xs" style={{ color: 'rgba(139,92,246,0.5)' }}>
                                        {reportModal.session} · {reportModal.submitted} 제출
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => { setSealed(prev => new Set(prev).add(reportModal.id)); setReportModal(null); }}
                                    disabled={sealed.has(reportModal.id)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
                                    style={{ background: sealed.has(reportModal.id) ? 'rgba(6,214,160,0.2)' : 'linear-gradient(135deg, #f5a623, #e8920a)' }}>
                                    {sealed.has(reportModal.id) ? <><CheckCircle size={14} /> 수여됨</> : <><Award size={14} /> 황금 인장 수여</>}
                                </motion.button>
                            </div>
                            <div className="rounded-2xl p-5 text-sm leading-relaxed"
                                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(196,181,253,0.85)', minHeight: 150 }}>
                                {reportModal.preview}
                                <span style={{ color: 'rgba(139,92,246,0.3)' }}>
                                    {' '}(Firebase 연결 후 전체 내용이 표시됩니다)
                                </span>
                            </div>
                            <button onClick={() => setReportModal(null)}
                                className="mt-4 w-full py-2 rounded-xl text-sm transition-all"
                                style={{ color: 'rgba(139,92,246,0.5)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                닫기
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
