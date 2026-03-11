import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, User, Sparkles, Zap } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSessionStore } from '@/store';
import { MOCK_SESSION, isFirebaseConfigured } from '@/lib/mockData';
import type { ClassSession } from '@/types';

export default function StudentJoinPage() {
    const navigate = useNavigate();
    const { setSession } = useSessionStore();
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ── 테스트 빠른 입장 ──────────────────────────────
    function handleMockJoin() {
        setSession(MOCK_SESSION);
        navigate('/onboarding', { state: { sessionId: MOCK_SESSION.id, playerName: '테스트학생' } });
    }

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        if (code.length < 6) return setError('코드는 6자리입니다.');
        if (!name.trim()) return setError('이름을 입력해주세요.');

        // 테스트 코드 처리
        if (code.toUpperCase() === 'FAIR01' && !isFirebaseConfigured()) {
            setSession(MOCK_SESSION);
            navigate('/onboarding', { state: { sessionId: MOCK_SESSION.id, playerName: name.trim() } });
            return;
        }

        setError('');
        setLoading(true);
        try {
            const { StudentService } = await import('@/lib/firebaseService');
            const { student, session } = await StudentService.joinSession(code.toUpperCase(), name.trim());
            setSession(session);
            navigate('/onboarding', {
                state: {
                    sessionId: session.id,
                    playerName: name.trim(),
                    studentId: student.studentId,
                    persona: student.persona,
                },
            });
        } catch (err: any) {
            if (err.message === 'SESSION_NOT_FOUND') setError('존재하지 않는 학급 코드입니다.');
            else if (err.message === 'SESSION_INACTIVE') setError('이 세션은 현재 비활성화되어 있습니다.');
            else setError('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'linear-gradient(180deg, #0a0618 0%, #110d2e 100%)' }}>
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <Link to="/">
                        <div className="w-10 h-10 rounded-xl mx-auto mb-4 flex items-center justify-center font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #e94560)' }}>공</div>
                    </Link>
                    <div className="text-5xl mb-3">🌱</div>
                    <h1 className="text-3xl font-black mb-1 text-white">수업 참여하기</h1>
                    <p className="text-sm" style={{ color: 'rgba(167,139,250,0.6)' }}>선생님께 받은 학급 코드를 입력하세요</p>
                </div>

                {/* 테스트 계정 박스 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl p-4 mb-5"
                    style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.25)' }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} style={{ color: '#06d6a0' }} />
                        <span className="text-xs font-bold" style={{ color: '#06d6a0' }}>테스트 입장 (코드: FAIR01)</span>
                    </div>
                    <div className="text-xs mb-3" style={{ color: 'rgba(6,214,160,0.7)' }}>
                        이름 없이 바로 테스트 캐릭터로 입장합니다.
                    </div>
                    <button onClick={handleMockJoin}
                        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-300"
                        style={{ background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 0 20px rgba(6,214,160,0.3)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 30px rgba(6,214,160,0.5)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(6,214,160,0.3)'; }}
                    >
                        <Zap size={14} className="inline mr-1" /> 테스트로 즉시 입장
                    </button>
                </motion.div>

                <div className="rounded-2xl p-6"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(20px)' }}>
                    <form onSubmit={handleJoin} className="space-y-5" noValidate>
                        <div>
                            <label htmlFor="classCode" className="block text-xs font-medium mb-2" style={{ color: 'rgba(196,181,253,0.7)' }}>
                                학급 코드
                            </label>
                            <div className="relative">
                                <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(139,92,246,0.5)' }} />
                                <input id="classCode" type="text" value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    className="w-full pl-10 pr-4 py-4 rounded-xl text-2xl font-mono font-black text-center tracking-[0.25em] outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#fbbf24' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(245,162,35,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,162,35,0.15)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    placeholder="FAIR01" maxLength={6} required aria-label="학급 코드 6자리 입력" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="playerName" className="block text-xs font-medium mb-2" style={{ color: 'rgba(196,181,253,0.7)' }}>
                                이름
                            </label>
                            <div className="relative">
                                <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(139,92,246,0.5)' }} />
                                <input id="playerName" type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#f0f0f5' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    placeholder="홍길동" maxLength={20} required />
                            </div>
                        </div>
                        {error && <p className="text-xs" style={{ color: '#f43f5e' }} role="alert">⚠️ {error}</p>}
                        <button type="submit" disabled={loading || code.length < 6 || !name.trim()}
                            className="w-full py-4 rounded-xl font-black text-base text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 25px rgba(124,58,237,0.4)' }}>
                            <Sparkles size={18} className="inline mr-2" />
                            {loading ? '입장 중...' : '공정가로 입장하기!'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs mt-5" style={{ color: 'rgba(139,92,246,0.4)' }}>
                    <Link to="/" className="hover:text-purple-300 transition-colors">← 메인으로</Link>
                </p>
            </motion.div>
        </div>
    );
}
