import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, Send, FileText } from 'lucide-react';
import TutorialOverlay from '@/components/ui/TutorialOverlay';
import { useAuthStore } from '@/store';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props { persona: string; onPhaseComplete: () => void; }

// ─── Hidden Truth Items ───────────────────────────────────────
const HIDDEN_TRUTHS = [
    { id: 'child_labor', x: 20, y: 30, emoji: '👦', label: '아동 노동', desc: '10세 미만 아이들이 카카오 농장에서 하루 12시간 이상 일하고 있습니다.', color: '#f43f5e' },
    { id: 'low_wage', x: 65, y: 55, emoji: '💸', label: '착취 임금', desc: '농장주는 초콜릿 최종 가격의 단 3%만 받습니다. 유통업자는 40%를 가져갑니다.', color: '#f5a623' },
    { id: 'deforestation', x: 40, y: 70, emoji: '🌳', label: '산림 파괴', desc: '카카오 재배를 위해 열대우림이 무분별하게 벌채되고 있습니다.', color: '#06d6a0' },
    { id: 'no_school', x: 75, y: 25, emoji: '📚', label: '교육 기회 박탈', desc: '농장 아이들은 학교에 가지 못하고 부모의 빚을 대신 갚기 위해 일합니다.', color: '#a78bfa' },
    { id: 'health', x: 50, y: 45, emoji: '🏥', label: '의료 접근 불가', desc: '농장 노동자들은 기본적인 의료 서비스조차 받지 못하고 있습니다.', color: '#38bdf8' },
];

// ─── Canvas Scratch Reveal ────────────────────────────────────
function ScratchCanvas({
    width, height, onProgress, setIsShaking, addFloatingText
}: {
    width: number; height: number; onProgress: (pct: number) => void;
    setIsShaking: (v: boolean) => void; addFloatingText: (x: number, y: number) => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastCheck = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        // Fill with dark overlay
        ctx.fillStyle = 'rgba(15, 10, 40, 0.95)';
        ctx.fillRect(0, 0, width, height);
        // Draw "문질러보세요" text
        ctx.fillStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.font = 'bold 16px Noto Sans KR, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔍 화면을 문질러 진실을 찾으세요', width / 2, height / 2 - 10);
        ctx.font = '12px Noto Sans KR, sans-serif';
        ctx.fillStyle = 'rgba(139, 92, 246, 0.35)';
        ctx.fillText('마우스를 드래그하거나 터치해보세요', width / 2, height / 2 + 16);
    }, [width, height]);

    function getPos(e: React.MouseEvent | React.TouchEvent) {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    }

    function scratch(pos: { x: number; y: number }) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        setIsShaking(true);
        if (Math.random() < 0.08) {
            addFloatingText(pos.x, pos.y);
        }

        const now = Date.now();
        if (now - lastCheck.current > 200) {
            lastCheck.current = now;
            // Calculate progress
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let transparent = 0;
            for (let i = 3; i < imageData.data.length; i += 4) {
                if (imageData.data[i] < 128) transparent++;
            }
            onProgress(Math.round((transparent / (canvas.width * canvas.height)) * 100));
        }
    }

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 rounded-2xl cursor-crosshair touch-none"
            style={{ zIndex: 10 }}
            onMouseDown={(e) => { isDrawing.current = true; scratch(getPos(e)); }}
            onMouseMove={(e) => { if (isDrawing.current) scratch(getPos(e)); }}
            onMouseUp={() => { isDrawing.current = false; setIsShaking(false); }}
            onMouseLeave={() => { isDrawing.current = false; setIsShaking(false); }}
            onTouchStart={(e) => { isDrawing.current = true; scratch(getPos(e)); }}
            onTouchMove={(e) => { if (isDrawing.current) scratch(getPos(e)); }}
            onTouchEnd={() => { isDrawing.current = false; setIsShaking(false); }}
            aria-label="진실 스크래치 영역 - 드래그 또는 터치하여 숨겨진 진실을 발견하세요"
        />
    );
}

// ─── Report Form ──────────────────────────────────────────────
function ReportForm({
    found, onSubmit,
}: {
    found: typeof HIDDEN_TRUTHS;
    onSubmit: (analysis: string) => void;
}) {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 mt-6 relative z-20"
            style={{ background: 'rgba(15,10,40,0.92)', border: '1px solid rgba(245,166,35,0.3)' }}>
            <h3 className="font-black text-white mb-3 flex items-center gap-2">
                <FileText size={16} style={{ color: '#fbbf24' }} />
                {t('phase1.report_title')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {found.map(truth => (
                    <div key={truth.id} className="flex items-center gap-2 text-xs py-2 px-3 rounded-xl"
                        style={{ background: `${truth.color}15`, border: `1px solid ${truth.color}30`, color: truth.color }}>
                        <CheckCircle size={11} /> {truth.label}
                    </div>
                ))}
            </div>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,166,35,0.2)', color: '#f0f0f5', minHeight: 100 }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(245,166,35,0.6)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)'; }}
                placeholder={t('phase1.report_placeholder')}
                aria-label="고발 리포트 내용 작성"
            />
            <div className="flex items-center justify-between mt-3">
                <span className="text-xs" style={{ color: 'rgba(139,92,246,0.4)' }}>{text.length}/500자</span>
                <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => text.trim() && onSubmit(text)}
                    disabled={text.trim().length < 10}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #f5a623, #e8920a)', boxShadow: '0 0 20px rgba(245,166,35,0.4)' }}
                >
                    <Send size={14} /> {t('phase1.submit_teacher')}
                </motion.button>
            </div>
        </motion.div>
    );
}

// ─── Phase 1 Main ─────────────────────────────────────────────
const BASE_W = 560;
const BASE_H = 360;

export default function Phase1({ onPhaseComplete }: Props) {
    const { t } = useTranslation();
    const { sessionId } = useParams();
    const studentId = useAuthStore(s => s.studentProfile?.studentId);
    const [scratchProgress, setScratchProgress] = useState(0);
    const [foundTruths, setFoundTruths] = useState<Set<string>>(new Set());
    const [activeTruth, setActiveTruth] = useState<typeof HIDDEN_TRUTHS[0] | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState(false);
    const [showTutorial, setShowTutorial] = useState(true);

    const [isShaking, setIsShaking] = useState(false);
    const [floatingTexts, setFloatingTexts] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
    const nextTextId = useRef(0);

    const FLOATING_OPTIONS = ["점점 드러나고 있어요!", "조금만 더 세게! 💥", "진실이 파헤쳐집니다! 🔥", "거의 다 왔어요! 🕵️", "더 문질러보세요! ✨"];

    const addFloatingText = useCallback((x: number, y: number) => {
        const id = nextTextId.current++;
        const text = FLOATING_OPTIONS[Math.floor(Math.random() * FLOATING_OPTIONS.length)];

        // Offset starting position slightly randomly
        const ox = x + (Math.random() * 40 - 20);
        const oy = y + (Math.random() * 20 - 10);

        setFloatingTexts(prev => [...prev, { id, x: ox, y: oy, text }]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(t => t.id !== id));
        }, 1200);
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ w: BASE_W, h: BASE_H });

    useEffect(() => {
        function measure() {
            if (!containerRef.current) return;
            const cw = containerRef.current.clientWidth;
            const w = Math.min(cw, BASE_W);
            const h = Math.round(w * (BASE_H / BASE_W));
            setCanvasSize({ w, h });
        }
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const CANVAS_W = canvasSize.w;
    const CANVAS_H = canvasSize.h;

    // Discover truth when scratch reveals its position
    useEffect(() => {
        if (scratchProgress >= 15) {
            const newFound = new Set(foundTruths);
            HIDDEN_TRUTHS.forEach(t => {
                if (scratchProgress >= 10 + HIDDEN_TRUTHS.indexOf(t) * 12) newFound.add(t.id);
            });
            setFoundTruths(newFound);
        }
    }, [scratchProgress]);

    function handleSubmit(analysis: string) {
        setSubmitted(true);
        setSubmitError(false);
        // Firebase에 리포트 전송 (교사 대시보드에서 확인 가능)
        if (sessionId && studentId) {
            import('@/lib/mockData').then(({ isFirebaseConfigured }) => {
                if (!isFirebaseConfigured()) return; // Mock 모드에서는 전송 스킵
                import('@/lib/firebaseService').then(({ StudentService }) => {
                    StudentService.submitReport(sessionId, studentId, 1, analysis).catch(() => {
                        setSubmitError(true);
                    });
                });
            });
        }
    }

    const foundList = HIDDEN_TRUTHS.filter(t => foundTruths.has(t.id));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen px-4 py-8 pb-32 max-w-3xl mx-auto relative z-10">
            {showTutorial && (
                <TutorialOverlay
                    title="진실을 파헤쳐라"
                    icon="🕵️"
                    description={
                        <div className="space-y-2 text-left">
                            <p>요원, 마몬은 달콤한 초콜릿 뒤에 끔찍한 진실을 감추어 두었다.</p>
                            <p className="text-purple-300 font-bold">👉 화면의 어두운 부분을 손가락이나 마우스로 문질러 보라.</p>
                            <p>숨겨진 <span className="text-yellow-400 font-bold">5가지 진실</span>을 모두 찾아내어 보고서를 제출해야 한다!</p>
                        </div>
                    }
                    onClose={() => setShowTutorial(false)}
                />
            )}

            {/* Phase 1 배경 */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img src="/phases/phase1-bg.png" alt="" className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.2) saturate(1.2)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(245,166,35,0.1), rgba(10,6,24,0.85))' }} />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-xs font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', color: '#f5a623' }}>
                    <Search size={12} /> {t('phase1.title')}
                </span>
                <h2 className="text-3xl font-black text-white mb-2">{t('phase1.header')}</h2>
                <p style={{ color: 'rgba(196,181,253,0.6)' }}>
                    화면을 문질러 마몬이 감춘 <strong style={{ color: '#f5a623' }}>5가지 진실</strong>을 발견하세요
                </p>
            </div>

            {/* Scratch Area */}
            <motion.div ref={containerRef} className="relative rounded-2xl mx-auto mb-2 select-none"
                animate={isShaking ? { x: [-3, 3, -3, 3, 0], y: [-2, 2, -2, 2, 0] } : {}}
                transition={{ repeat: isShaking ? Infinity : 0, duration: 0.15 }}
                style={{ width: '100%', maxWidth: BASE_W, aspectRatio: `${BASE_W}/${BASE_H}` }}>
                {/* Background: real image */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #1a0a2e, #0d1a3a)' }}>
                    {/* Hidden truth markers */}
                    {HIDDEN_TRUTHS.map(truth => (
                        <motion.button
                            key={truth.id}
                            onClick={() => setActiveTruth(activeTruth?.id === truth.id ? null : truth)}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-20"
                            style={{ left: `${truth.x}%`, top: `${truth.y}%` }}
                            animate={foundTruths.has(truth.id) ? { scale: [1, 1.2, 1], opacity: 1 } : { opacity: 0, scale: 0 }}
                            transition={{ duration: 0.4 }}
                            aria-label={`발견된 진실: ${truth.label}`}
                        >
                            <motion.div
                                animate={{ y: [0, -4, 0] }}
                                transition={{ repeat: Infinity, duration: 2, delay: HIDDEN_TRUTHS.indexOf(truth) * 0.3 }}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xl cursor-pointer"
                                style={{
                                    background: `${truth.color}30`,
                                    border: `2px solid ${truth.color}`,
                                    boxShadow: `0 0 16px ${truth.color}60`,
                                }}
                            >
                                {truth.emoji}
                            </motion.div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                                style={{ background: `${truth.color}22`, color: truth.color }}>
                                {truth.label}
                            </span>
                        </motion.button>
                    ))}
                    {/* Scratch canvas overlay */}
                    <ScratchCanvas width={CANVAS_W} height={CANVAS_H} onProgress={setScratchProgress} setIsShaking={setIsShaking} addFloatingText={addFloatingText} />

                    {/* Floating Texts */}
                    <AnimatePresence>
                        {floatingTexts.map(ft => (
                            <motion.div key={ft.id}
                                initial={{ opacity: 1, y: ft.y, x: ft.x, scale: 0.8 }}
                                animate={{ opacity: 0, y: ft.y - 60, scale: 1.2 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className="absolute pointer-events-none z-30 font-black text-xl drop-shadow-lg flex items-center justify-center whitespace-nowrap"
                                style={{
                                    left: 0, top: 0,
                                    color: '#fff',
                                    textShadow: '0px 0px 10px rgba(255,107,107,0.9), 0px 4px 6px rgba(0,0,0,0.8)'
                                }}
                            >
                                {ft.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Progress */}
            <div className="flex items-center gap-4 mb-6 max-w-xl mx-auto">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #7c3aed, #f5a623)', width: `${(foundList.length / HIDDEN_TRUTHS.length) * 100}%` }}
                        transition={{ duration: 0.5 }} />
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: '#fbbf24' }}>
                    {foundList.length}/{HIDDEN_TRUTHS.length} 발견
                </span>
            </div>

            {/* Active Truth Detail */}
            <AnimatePresence>
                {activeTruth && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="max-w-xl mx-auto rounded-2xl p-5 mb-5 relative z-20"
                        style={{ background: `rgba(15,10,40,0.92)`, border: `1px solid ${activeTruth.color}50`, boxShadow: `0 0 20px ${activeTruth.color}20` }}
                    >
                        <div className="flex items-start gap-4">
                            <div className="text-3xl">{activeTruth.emoji}</div>
                            <div>
                                <h4 className="font-black text-white mb-1">{activeTruth.label}</h4>
                                <p className="text-sm leading-relaxed" style={{ color: 'rgba(196,181,253,0.85)' }}>{activeTruth.desc}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report form - appears when enough found */}
            {foundList.length >= 3 && !submitted && (
                <div className="max-w-xl mx-auto">
                    <ReportForm found={foundList} onSubmit={handleSubmit} />
                </div>
            )}

            {/* Submitted state */}
            {submitted && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl mx-auto rounded-2xl p-6 text-center mt-4 relative z-20"
                    style={{ background: submitError ? 'rgba(15,10,40,0.92)' : 'rgba(15,10,40,0.92)', border: `1px solid ${submitError ? 'rgba(244,63,94,0.3)' : 'rgba(6,214,160,0.3)'}` }}>
                    {submitError ? (
                        <>
                            <div className="text-4xl mb-3">⚠️</div>
                            <h3 className="font-black text-white text-xl mb-2">{t('common.error_submit')}</h3>
                            <p className="text-sm mb-4" style={{ color: 'rgba(244,63,94,0.8)' }}>
                                {t('common.error_submit_detail')}
                            </p>
                        </>
                    ) : (
                        <>
                            <CheckCircle size={40} style={{ color: '#06d6a0', margin: '0 auto 12px' }} />
                            <h3 className="font-black text-white text-xl mb-2">{t('phase1.submit_success')}</h3>
                            <p className="text-sm mb-4" style={{ color: 'rgba(6,214,160,0.8)' }}>
                                {t('phase1.submit_waiting')}
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#06d6a0', animationDelay: '0s' }} />
                                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#06d6a0', animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#06d6a0', animationDelay: '0.4s' }} />
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {foundList.length < 3 && (
                <p className="text-center text-xs mt-4 relative z-20" style={{ color: 'rgba(139,92,246,0.35)' }}>
                    {t('phase1.min_truths')}
                </p>
            )}
        </motion.div>
    );
}
