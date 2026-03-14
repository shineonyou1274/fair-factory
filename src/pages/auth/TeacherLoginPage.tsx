import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, GraduationCap, Chrome, Zap } from 'lucide-react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/store';
import { MOCK_TEACHER, isFirebaseConfigured } from '@/lib/mockData';
import type { TeacherUser } from '@/types';

export default function TeacherLoginPage() {
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ── 테스트 빠른 입장 ──────────────────────────────
    function handleMockLogin() {
        setUser(MOCK_TEACHER);
        navigate('/teacher/dashboard');
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        if (!isFirebaseConfigured()) {
            setError('Firebase가 설정되지 않았습니다. 아래 테스트 계정을 이용해주세요.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const snap = await getDoc(doc(db, 'teachers', cred.user.uid));
            if (snap.exists()) {
                setUser(snap.data() as TeacherUser);
                navigate('/teacher/dashboard');
            } else {
                setError('교사 계정이 아닙니다.');
            }
        } catch {
            setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        if (!isFirebaseConfigured()) {
            setError('Firebase가 설정되지 않았습니다. 아래 테스트 계정을 이용해주세요.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const cred = await signInWithPopup(auth, provider);

            // Google 인증 성공 → Firestore에서 교사 프로필 조회/생성
            let teacherData: TeacherUser;
            try {
                const snap = await getDoc(doc(db, 'teachers', cred.user.uid));
                if (snap.exists()) {
                    teacherData = snap.data() as TeacherUser;
                } else {
                    teacherData = {
                        uid: cred.user.uid,
                        email: cred.user.email!,
                        displayName: cred.user.displayName ?? '선생님',
                        role: 'teacher',
                        sessions: [],
                        createdAt: Date.now(),
                    };
                    const { TeacherService } = await import('@/lib/firebaseService');
                    await TeacherService.upsert(cred.user.uid, teacherData);
                }
            } catch (firestoreErr: any) {
                // Firestore 실패해도 인증은 성공했으므로 기본 프로필로 진행
                console.warn('Firestore 조회/생성 실패, 기본 프로필로 진행:', firestoreErr);
                teacherData = {
                    uid: cred.user.uid,
                    email: cred.user.email!,
                    displayName: cred.user.displayName ?? '선생님',
                    role: 'teacher',
                    sessions: [],
                    createdAt: Date.now(),
                };
            }
            setUser(teacherData);
            navigate('/teacher/dashboard');
        } catch (err: any) {
            // 팝업 취소는 에러 아님
            if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
                setError('');
            } else if (err?.code === 'auth/unauthorized-domain') {
                console.error('Google login error:', err);
                setError('이 도메인이 Firebase 승인 도메인에 등록되지 않았습니다. Firebase Console → Authentication → Settings → Authorized domains에서 현재 도메인을 추가하세요.');
            } else if (err?.code === 'auth/operation-not-allowed') {
                console.error('Google login error:', err);
                setError('Google 로그인이 Firebase에서 활성화되지 않았습니다. Firebase Console → Authentication → Sign-in method에서 Google을 활성화하세요.');
            } else if (err?.code === 'auth/internal-error' || err?.code === 'auth/network-request-failed') {
                console.error('Google login error:', err);
                setError('네트워크 오류입니다. 인터넷 연결을 확인하고 다시 시도해주세요.');
            } else {
                console.error('Google login error:', err);
                setError(`Google 로그인 오류: ${err?.code ?? err?.message ?? '알 수 없는 오류'}. 아래 테스트 계정을 이용해주세요.`);
            }
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
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #e94560)' }}>공</div>
                    </Link>
                    <h1 className="text-3xl font-black mb-1 text-white">교사 로그인</h1>
                    <p className="text-sm" style={{ color: 'rgba(167,139,250,0.6)' }}>Game Master로 수업을 시작하세요</p>
                </div>

                {/* ── 테스트 계정 박스 ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl p-4 mb-5"
                    style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)' }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} style={{ color: '#a78bfa' }} />
                        <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>테스트 계정 (Firebase 불필요)</span>
                    </div>
                    <div className="text-xs mb-3 space-y-1" style={{ color: 'rgba(196,181,253,0.7)' }}>
                        <div>👤 이름: <strong className="text-white">김공정 선생님</strong></div>
                        <div>🏫 학교: <strong className="text-white">공정중학교</strong></div>
                        <div>🔑 코드: <strong className="text-white">FAIR01</strong></div>
                    </div>
                    <button
                        onClick={handleMockLogin}
                        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-300"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 30px rgba(124,58,237,0.7)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(124,58,237,0.4)'; }}
                    >
                        <Zap size={14} className="inline mr-1" />
                        테스트 교사 계정으로 즉시 입장
                    </button>
                </motion.div>

                <div className="rounded-2xl p-6"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(20px)' }}>
                    {/* Google Login */}
                    <button onClick={handleGoogle} disabled={loading}
                        className="w-full mb-5 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                    >
                        <Chrome size={18} /> Google 계정으로 로그인
                    </button>

                    <div className="flex items-center gap-4 mb-5">
                        <div className="flex-1 h-px" style={{ background: 'rgba(139,92,246,0.2)' }} />
                        <span className="text-xs" style={{ color: 'rgba(139,92,246,0.5)' }}>또는 이메일로</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(139,92,246,0.2)' }} />
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4" noValidate>
                        <div>
                            <label htmlFor="teacher-email" className="block text-xs font-medium mb-2" style={{ color: 'rgba(196,181,253,0.7)' }}>
                                이메일
                            </label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(139,92,246,0.5)' }} />
                                <input id="teacher-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#f0f0f5' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    placeholder="teacher@school.edu" autoComplete="email" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="teacher-password" className="block text-xs font-medium mb-2" style={{ color: 'rgba(196,181,253,0.7)' }}>
                                비밀번호
                            </label>
                            <div className="relative">
                                <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(139,92,246,0.5)' }} />
                                <input id="teacher-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#f0f0f5' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    placeholder="••••••••" autoComplete="current-password" />
                            </div>
                        </div>
                        {error && <p className="text-xs" style={{ color: '#f43f5e' }} role="alert">⚠️ {error}</p>}
                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl font-bold text-sm text-white mt-1 transition-all"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
                            <GraduationCap size={16} className="inline mr-2" />
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs mt-5" style={{ color: 'rgba(139,92,246,0.4)' }}>
                    <Link to="/" className="hover:text-purple-300 transition-colors">← 랜딩 페이지로</Link>
                </p>
            </motion.div>
        </div>
    );
}
