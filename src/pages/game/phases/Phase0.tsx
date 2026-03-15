import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useSessionStore } from '@/store';
import TutorialOverlay from '@/components/ui/TutorialOverlay';

interface Props {
    persona: string;
    onPhaseComplete: () => void;
}

// ─── Fake Ad Component ────────────────────────────────────────
function FakeAd({ onChoice }: { onChoice: (bought: boolean) => void }) {
    const [hover, setHover] = useState(false);

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative rounded-3xl overflow-hidden max-w-sm mx-auto"
            style={{
                background: 'linear-gradient(135deg, #ff6b6b, #feca57, #ff9ff3, #54a0ff)',
                boxShadow: hover ? '0 0 60px rgba(255,107,107,0.6), 0 0 120px rgba(254,202,87,0.3)' : '0 0 40px rgba(255,107,107,0.3)',
                transition: 'box-shadow 0.3s',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Glitter particles */}
            {Array.from({ length: 12 }).map((_, i) => (
                <motion.div key={i}
                    className="absolute text-lg pointer-events-none select-none"
                    style={{ left: `${8 + (i * 8) % 84}%`, top: `${5 + (i * 13) % 70}%` }}
                    animate={{ y: [-5, 5, -5], opacity: [0.5, 1, 0.5], rotate: [0, 20, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 2 + i * 0.2, delay: i * 0.15 }}
                >
                    {['✨', '⭐', '💫', '🌟'][i % 4]}
                </motion.div>
            ))}

            <div className="relative z-10 p-8 text-center">
                {/* Product */}
                <motion.div
                    animate={{ rotate: [-3, 3, -3], scale: hover ? 1.08 : 1 }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="text-9xl mb-4 select-none"
                >
                    🍫
                </motion.div>

                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-5">
                    <div className="text-2xl font-black text-white mb-1 drop-shadow">
                        럭키 초코바
                    </div>
                    <div className="text-sm text-white/90 mb-3">
                        세상에서 가장 달콤한 초콜릿!<br />
                        카카오 농부들이 사랑을 담아 전하는 프리미엄 초코바 🌈
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-xs line-through text-white/60">₩3,500</span>
                        <span className="text-3xl font-black text-yellow-300 drop-shadow-lg">₩990</span>
                        <span className="bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full">72% OFF</span>
                    </div>
                    <div className="text-xs text-white/70 mt-2">⏰ 오늘만 이 가격!</div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-5">
                    {[['🌿', '100% 천연'], ['🏆', '수상 경력'], ['💚', '친환경']].map(([e, t]) => (
                        <div key={t} className="bg-white/15 rounded-xl p-2 text-center">
                            <div className="text-lg">{e}</div>
                            <div className="text-xs text-white font-medium">{t}</div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                        onClick={() => onChoice(true)}
                        className="w-full py-4 rounded-2xl font-black text-lg text-white"
                        style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', boxShadow: '0 4px 20px rgba(231,76,60,0.5)' }}
                    >
                        🛒 지금 바로 살래요!
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => onChoice(false)}
                        className="w-full py-3 rounded-2xl font-semibold text-sm"
                        style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
                    >
                        🤔 잠깐, 뭔가 이상한데...?
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Phase 0 Main ─────────────────────────────────────────────
export default function Phase0({ persona, onPhaseComplete }: Props) {
    const [stage, setStage] = useState<'intro' | 'ad' | 'reaction'>('intro');
    const [bought, setBought] = useState<boolean | null>(null);
    const [showTutorial, setShowTutorial] = useState(true);
    const setPhase0Choice = useSessionStore(s => s.setPhase0Choice);

    function handleChoice(didBuy: boolean) {
        setBought(didBuy);
        setPhase0Choice(didBuy);  // Phase 3 슬라이더 초기값에 반영
        setStage('reaction');
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
        >
            {showTutorial && (
                <TutorialOverlay
                    title="페르소나 역할극 시작"
                    icon="🎭"
                    description={
                        <div className="space-y-2 text-left">
                            <p>환영한다, 공정가. 당신은 이제부터 <strong className="text-yellow-400">'{persona}'</strong>의 역할을 맡게 된다.</p>
                            <p>잠시 후, 당신을 시험하기 위한 <span className="text-red-400 font-bold">마몬의 환상 광고</span>가 나타난다.</p>
                            <p className="text-purple-300 font-bold">👉 광고를 보고 본능적으로 '살지', '말지' 선택하라!</p>
                        </div>
                    }
                    onClose={() => setShowTutorial(false)}
                />
            )}

            {/* Phase 0 배경 */}
            <div className="absolute inset-0 z-0">
                <img src="/phases/phase0-bg.png" alt="" className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.25) saturate(1.3)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(244,63,94,0.15), rgba(10,6,24,0.8))' }} />
            </div>
            <AnimatePresence mode="wait">

                {/* Intro */}
                {stage === 'intro' && (
                    <motion.div key="intro"
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                        className="text-center max-w-xl relative z-10"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="mb-6 mx-auto w-32 h-32 sm:w-40 sm:h-40 relative"
                        >
                            <img src="/boss/mamon.png" alt="탐욕의 사이렌 마몬"
                                className="w-full h-full object-contain drop-shadow-2xl"
                                style={{ filter: 'drop-shadow(0 0 30px rgba(244,63,94,0.5))' }}
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        </motion.div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-xs font-bold uppercase tracking-widest"
                            style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e' }}>
                            Phase 0 · 환상의 장막
                        </div>
                        <h2 className="text-4xl font-black text-white mb-4">
                            마몬의 세상에 오신 걸 환영합니다
                        </h2>
                        <p className="text-lg leading-relaxed mb-3" style={{ color: 'rgba(196,181,253,0.7)' }}>
                            탐욕의 사이렌 마몬이 달콤한 노래를 부릅니다.
                        </p>
                        <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(167,139,250,0.55)' }}>
                            세상 사람들은 황금 안대를 쓴 채 그 목소리에 홀려 있습니다.
                            <br />당신도 그 목소리에 귀를 기울여 보시겠어요?
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setStage('ad')}
                            className="px-10 py-4 rounded-2xl font-black text-lg text-white"
                            style={{ background: 'linear-gradient(135deg, #f43f5e, #dc2626)', boxShadow: '0 0 30px rgba(244,63,94,0.5)' }}
                        >
                            <Sparkles size={20} className="inline mr-2" />
                            광고 세계로 들어가기
                        </motion.button>
                    </motion.div>
                )}

                {/* Ad */}
                {stage === 'ad' && (
                    <motion.div key="ad"
                        initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="w-full max-w-md relative z-10"
                    >
                        {/* Fake TV frame */}
                        <div className="text-center mb-4">
                            <span className="text-xs px-3 py-1 rounded-full font-bold"
                                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                                📺 마몬 쇼핑 네트워크 · LIVE
                            </span>
                        </div>
                        <FakeAd onChoice={handleChoice} />
                        <p className="text-center mt-4 text-xs" style={{ color: 'rgba(139,92,246,0.4)' }}>
                            솔직한 첫 인상으로 선택해보세요
                        </p>
                    </motion.div>
                )}

                {/* Reaction */}
                {stage === 'reaction' && (
                    <motion.div key="reaction"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="text-center max-w-lg relative z-10"
                    >
                        {bought ? (
                            <>
                                <div className="text-7xl mb-5">😍</div>
                                <h3 className="text-2xl font-black text-white mb-3">구매하셨군요!</h3>
                                <div className="rounded-2xl p-5 mb-6"
                                    style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={18} style={{ color: '#f43f5e', flexShrink: 0, marginTop: 2 }} />
                                        <p className="text-sm text-left leading-relaxed" style={{ color: 'rgba(196,181,253,0.8)' }}>
                                            대부분의 사람들이 같은 선택을 합니다. 저렴한 가격과 화려한 광고에
                                            이끌리는 건 자연스러운 일이에요. 하지만 그 뒤에 무엇이 숨어있는지
                                            알고 계신가요? 이제 함께 알아봅시다.
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-7xl mb-5">🤨</div>
                                <h3 className="text-2xl font-black text-white mb-3">예리한 눈을 가졌군요!</h3>
                                <div className="rounded-2xl p-5 mb-6"
                                    style={{ background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.25)' }}>
                                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(196,181,253,0.8)' }}>
                                        무언가 이상함을 느꼈군요! 그 감각이 맞습니다.
                                        이 달콤한 광고 뒤에는 우리가 모르는 이야기가 숨어 있습니다.
                                        지금부터 그 진실을 파헤쳐 봐요.
                                    </p>
                                </div>
                            </>
                        )}

                        <p className="text-sm mb-6" style={{ color: 'rgba(167,139,250,0.5)' }}>
                            ※ 이 선택은 Phase 3 최종 평가에 반영됩니다
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                            onClick={onPhaseComplete}
                            className="px-10 py-4 rounded-2xl font-black text-lg text-white"
                            style={{ background: 'linear-gradient(135deg, #f5a623, #e8920a)', boxShadow: '0 0 30px rgba(245,166,35,0.5)' }}
                        >
                            <Sparkles size={20} className="inline mr-2" />
                            진실을 보러 가기 →
                        </motion.button>
                        <p className="text-xs mt-3" style={{ color: 'rgba(139,92,246,0.3)' }}>
                            (선생님이 다음 단계로 넘겨주실 때까지 대기 중...)
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
