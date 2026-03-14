import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Info, TrendingUp, Check } from 'lucide-react';
import { useSessionStore } from '@/store';

interface Props { persona: string; }

interface Margins {
    farmCost: number;
    farmerMargin: number;
    coopMargin: number;
    distMargin: number;
    retailMargin: number;
}

const FAIR_TRADE_MIN = 2800;  // 공정무역 최저 보장가 (원)

const PERSONA_COLORS: Record<string, string> = {
    Alpha: '#38bdf8', Delta: '#06d6a0', Omega: '#a78bfa',
    Lambda: '#fb923c', Sigma: '#f43f5e',
};

// 신호등 3단계 판정
type FairLevel = 'unfair' | 'partial' | 'fair';

function getFairLevel(price: number, farmerShare: number): FairLevel {
    if (price >= FAIR_TRADE_MIN && farmerShare >= 15) return 'fair';
    if (price >= FAIR_TRADE_MIN * 0.85 || farmerShare >= 10) return 'partial';
    return 'unfair';
}

const FAIR_LEVEL_CONFIG: Record<FairLevel, { emoji: string; label: string; color: string; bg: string; border: string }> = {
    fair:    { emoji: '🟢', label: '공정 가격',  color: '#06d6a0', bg: 'rgba(6,214,160,0.1)',   border: 'rgba(6,214,160,0.4)' },
    partial: { emoji: '🟡', label: '개선 필요',  color: '#f5a623', bg: 'rgba(245,166,35,0.1)',  border: 'rgba(245,166,35,0.4)' },
    unfair:  { emoji: '🔴', label: '불공정',     color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.3)' },
};

function calcPrice(m: Margins) {
    const base = m.farmCost * (1 + m.farmerMargin / 100);
    const afterCoop = base * (1 + m.coopMargin / 100);
    const afterDist = afterCoop * (1 + m.distMargin / 100);
    return Math.round(afterDist * (1 + m.retailMargin / 100));
}

function calcShares(m: Margins, finalPrice: number) {
    const farmerGet = m.farmCost * (m.farmerMargin / 100) / finalPrice * 100;
    const coopGet = m.farmCost * (1 + m.farmerMargin / 100) * (m.coopMargin / 100) / finalPrice * 100;
    const distGet = m.farmCost * (1 + m.farmerMargin / 100) * (1 + m.coopMargin / 100) * (m.distMargin / 100) / finalPrice * 100;
    const retailGet = 100 - farmerGet - coopGet - distGet;
    return { farmerGet, coopGet, distGet, retailGet };
}

// ─── Slider ───────────────────────────────────────────────────
function SliderRow({ label, value, min, max, color, unit = '%', onChange, hint }: {
    label: string; value: number; min: number; max: number;
    color: string; unit?: string; onChange: (v: number) => void; hint?: string;
}) {
    return (
        <div className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{label}</span>
                    {hint && (
                        <div className="group relative">
                            <Info size={12} style={{ color: 'rgba(139,92,246,0.5)', cursor: 'help' }} />
                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 rounded-lg text-xs hidden group-hover:block z-10"
                                style={{ background: '#1a1a3e', border: '1px solid rgba(139,92,246,0.3)', color: 'rgba(196,181,253,0.8)' }}>
                                {hint}
                            </div>
                        </div>
                    )}
                </div>
                <span className="font-black text-base" style={{ color }}>
                    {value}{unit}
                </span>
            </div>
            <div className="relative">
                <input type="range" min={min} max={max} value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: color, background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)` }}
                    aria-label={`${label} 조절 (현재값: ${value}${unit})`}
                    aria-valuenow={value}
                    aria-valuemin={min}
                    aria-valuemax={max}
                />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(139,92,246,0.3)' }}>
                <span>{min}{unit}</span><span>{max}{unit}</span>
            </div>
        </div>
    );
}

// ─── Pie Chart (CSS conic-gradient) ──────────────────────────
function PieChart({ shares, fairScore, levelCfg }: {
    shares: ReturnType<typeof calcShares>;
    fairScore: number;
    levelCfg: { emoji: string; label: string; color: string };
}) {
    const items = [
        { label: '농장주', pct: shares.farmerGet, color: '#06d6a0' },
        { label: '협동조합', pct: shares.coopGet, color: '#38bdf8' },
        { label: '유통업자', pct: shares.distGet, color: '#f5a623' },
        { label: '소매상', pct: shares.retailGet, color: '#a78bfa' },
    ];

    // Build conic-gradient stops
    let cumulative = 0;
    const stops = items.map(item => {
        const start = cumulative;
        cumulative += item.pct;
        return `${item.color} ${start}% ${cumulative}%`;
    }).join(', ');

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Pie */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full flex-shrink-0"
                style={{ background: `conic-gradient(${stops})`, boxShadow: '0 0 30px rgba(139,92,246,0.2)' }}>
                {/* Inner circle with score */}
                <div className="absolute inset-4 rounded-full flex flex-col items-center justify-center"
                    style={{ background: 'rgba(15,10,40,0.95)' }}>
                    <div className="text-xs" style={{ color: 'rgba(196,181,253,0.5)' }}>공정 지수</div>
                    <div className="text-2xl font-black" style={{ color: fairScore >= 70 ? '#06d6a0' : fairScore >= 40 ? '#f5a623' : '#f43f5e' }}>
                        {fairScore}
                    </div>
                    <div className="text-xs font-bold" style={{ color: levelCfg.color }}>{levelCfg.emoji} {levelCfg.label}</div>
                </div>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {items.map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span style={{ color: 'rgba(196,181,253,0.7)' }}>{item.label}</span>
                        <span className="font-black ml-auto" style={{ color: item.color }}>{Math.round(item.pct)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Phase 3 Main ─────────────────────────────────────────────
export default function Phase3({ persona }: Props) {
    const phase0Choice = useSessionStore(s => s.phase0Choice);

    // Phase 0에서 광고를 구매했으면 유통 마진을 높게 설정 → 문제 인식 유도
    // 거부했으면 낮게 → 다른 구조적 원인 탐색 유도
    const initialDistMargin = phase0Choice === true ? 50 : phase0Choice === false ? 30 : 40;

    const [margins, setMargins] = useState<Margins>({
        farmCost: 600,
        farmerMargin: 10,
        coopMargin: 8,
        distMargin: initialDistMargin,
        retailMargin: 25,
    });
    const [submitted, setSubmitted] = useState(false);
    const [showSageAnim, setShowSageAnim] = useState(false);

    const finalPrice = calcPrice(margins);
    const shares = calcShares(margins, finalPrice);
    const fairLevel = getFairLevel(finalPrice, shares.farmerGet);
    const levelCfg = FAIR_LEVEL_CONFIG[fairLevel];
    const isFair = fairLevel === 'fair';
    const fairScore = Math.min(100, Math.round(
        (Math.min(finalPrice, FAIR_TRADE_MIN * 1.5) / (FAIR_TRADE_MIN * 1.5)) * 50 +
        (Math.min(shares.farmerGet, 30) / 30) * 50
    ));

    const set = useCallback((key: keyof Margins) => (v: number) =>
        setMargins(prev => ({ ...prev, [key]: v })), []);

    function handleSubmit() {
        setSubmitted(true);
        if (isFair) setTimeout(() => setShowSageAnim(true), 800);
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen px-4 py-8 pb-40 max-w-4xl mx-auto relative z-10 overflow-x-hidden overflow-y-auto">
            {/* Phase 3 배경 */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img src="/phases/phase3-bg.png" alt="" className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.18) saturate(1.2)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.1), rgba(10,6,24,0.85))' }} />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-xs font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}>
                    <TrendingUp size={12} /> Phase 3 · 공정의 설계
                </span>
                <img src={`/personas/${persona.toLowerCase()}.png`} alt={persona}
                    className="w-20 h-20 mx-auto mb-3 rounded-full object-cover"
                    style={{ border: `3px solid ${PERSONA_COLORS[persona] ?? '#a78bfa'}`, boxShadow: `0 0 20px ${PERSONA_COLORS[persona] ?? '#a78bfa'}40` }} />
                <h2 className="text-3xl font-black text-white mb-2">최적의 공정가를 설계하라</h2>
                <p style={{ color: 'rgba(196,181,253,0.6)' }}>
                    슬라이더를 조작하여 모두가 납득할 수 있는 가격 구조를 만드세요
                </p>
                {phase0Choice !== null && (
                    <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs"
                        style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: 'rgba(196,181,253,0.7)' }}>
                        {phase0Choice ? '💸 Phase 0에서 광고에 구매했군요 — 유통 마진이 높게 설정됐어요!' : '🤔 Phase 0에서 의심했군요 — 구조적 원인을 탐색해보세요!'}
                    </div>
                )}
            </div>

            {/* ── 실시간 가격 미니 패널 ── */}
            <motion.div
                className="rounded-2xl p-4 text-center mb-6"
                animate={{ background: levelCfg.bg, borderColor: levelCfg.border }}
                style={{ border: `2px solid ${levelCfg.border}`, backdropFilter: 'blur(12px)' }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex items-center justify-center gap-6 flex-wrap">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(196,181,253,0.5)' }}>최종 소비자가</div>
                        <motion.div key={finalPrice} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
                            className="text-4xl font-black" style={{ color: levelCfg.color }}>
                            ₩{finalPrice.toLocaleString()}
                        </motion.div>
                    </div>
                    <motion.span key={fairLevel} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="px-3 py-1 rounded-full text-xs font-black"
                        style={{ background: `${levelCfg.color}25`, color: levelCfg.color, border: `1px solid ${levelCfg.color}50` }}>
                        {levelCfg.emoji} {levelCfg.label}
                    </motion.span>
                    <div className="text-xs" style={{ color: 'rgba(196,181,253,0.4)' }}>
                        농장주 <strong style={{ color: shares.farmerGet >= 15 ? '#06d6a0' : '#f43f5e' }}>{Math.round(shares.farmerGet)}%</strong>
                        <span className="ml-2">최저가 ₩{FAIR_TRADE_MIN.toLocaleString()}</span>
                    </div>
                </div>
            </motion.div>

            {/* ── 메인 그리드: 슬라이더(2/3) + 파이차트(1/3) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* 슬라이더 패널 (2/3) */}
                <div className="lg:col-span-2 rounded-2xl p-6"
                    style={{ background: 'rgba(15,10,40,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <h3 className="font-black text-white mb-5 flex items-center gap-2">
                        🎛️ 가격 조절 패널
                    </h3>

                    <SliderRow label="카카오 원가" value={margins.farmCost} min={300} max={1500} unit="원"
                        color="#06d6a0" onChange={set('farmCost')}
                        hint="농장에서 카카오 1kg 생산에 드는 원가" />
                    <SliderRow label="농장주 마진" value={margins.farmerMargin} min={5} max={50}
                        color="#06d6a0" onChange={set('farmerMargin')}
                        hint="농장주의 수익률 (현실: 3~8%)" />
                    <SliderRow label="협동조합 마진" value={margins.coopMargin} min={2} max={30}
                        color="#38bdf8" onChange={set('coopMargin')}
                        hint="공정무역 협동조합의 운영비 및 공동 기금" />
                    <SliderRow label="유통업자 마진" value={margins.distMargin} min={5} max={60}
                        color="#f5a623" onChange={set('distMargin')}
                        hint="유통업자 마진 (현실: 35~45%)" />
                    <SliderRow label="소매상 마진" value={margins.retailMargin} min={10} max={50}
                        color="#a78bfa" onChange={set('retailMargin')}
                        hint="슈퍼마켓 등 소매상의 수익률" />

                    {/* 실제 데이터 비교 */}
                    <div className="mt-2 rounded-xl p-4 text-xs space-y-2"
                        style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)' }}>
                        <div className="font-bold text-white mb-2">📊 실제 수익 분배 (2023)</div>
                        {[
                            { who: '🌱 농장주', real: '3~6%', fair: '15%↑', color: '#06d6a0' },
                            { who: '🏭 유통사', real: '35~45%', fair: '25%↓', color: '#f5a623' },
                            { who: '🏪 소매상', real: '20~30%', fair: '20~25%', color: '#a78bfa' },
                        ].map(d => (
                            <div key={d.who} className="flex items-center gap-2">
                                <span className="flex-1" style={{ color: 'rgba(196,181,253,0.7)' }}>{d.who}</span>
                                <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>{d.real}</span>
                                <span className="px-1.5 py-0.5 rounded" style={{ background: `${d.color}20`, color: d.color }}>{d.fair}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 파이차트 패널 (1/3) */}
                <div className="lg:col-span-1 rounded-2xl p-6 flex flex-col items-center justify-center"
                    style={{ background: 'rgba(15,10,40,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <h4 className="text-sm font-bold text-white mb-4">수익 분배율</h4>
                    <PieChart shares={shares} fairScore={fairScore} levelCfg={levelCfg} />

                    {/* 농장주 수입 */}
                    <div className="w-full mt-5 rounded-xl p-3"
                        style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)' }}>
                        <div className="text-xs" style={{ color: 'rgba(6,214,160,0.7)' }}>농장주 실수령액</div>
                        <div className="text-xl font-black" style={{ color: '#06d6a0' }}>
                            ₩{Math.round(margins.farmCost * (margins.farmerMargin / 100)).toLocaleString()}
                        </div>
                        <div className="text-xs mt-1" style={{ color: shares.farmerGet >= 15 ? '#06d6a0' : '#f43f5e' }}>
                            {shares.farmerGet >= 15 ? '✓ 공정 기준 충족' : '✗ 목표 15% 미달'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 제출 버튼 ── */}
            <div className="mt-6">
                {!submitted ? (
                    <motion.button
                        whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={handleSubmit}
                        className="w-full py-5 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3 transition-all"
                        style={{
                            background: isFair ? 'linear-gradient(135deg, #06d6a0, #059669)' : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                            boxShadow: isFair ? '0 0 30px rgba(6,214,160,0.5)' : '0 0 25px rgba(124,58,237,0.4)',
                        }}
                    >
                        <Sparkles size={22} />
                        {isFair ? '🌟 공정가 확정 & 제출!' : '현재 가격으로 제출하기'}
                    </motion.button>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl p-5 text-center"
                        style={{ background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.35)' }}>
                        <Check size={32} style={{ color: '#06d6a0', margin: '0 auto 8px' }} />
                        <div className="font-black text-white text-lg mb-1">제출 완료!</div>
                        <div className="text-xs" style={{ color: 'rgba(6,214,160,0.8)' }}>
                            교사의 최종 승인을 기다리는 중...
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── Sage Liberation Animation ── */}
            <AnimatePresence>
                {showSageAnim && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: 'rgba(10,6,24,0.95)' }}
                        onClick={() => setShowSageAnim(false)}
                    >
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className="text-center px-8"
                        >
                            <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                transition={{ repeat: 3, duration: 0.5 }}
                                className="text-8xl mb-6">
                                ✨
                            </motion.div>
                            <h2 className="text-4xl font-black mb-4"
                                style={{ background: 'linear-gradient(135deg, #fbbf24, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                현자의 눈이 열립니다!
                            </h2>
                            <p className="text-lg mb-2" style={{ color: 'rgba(196,181,253,0.8)' }}>
                                공정의 노래가 침묵의 성을 흔들고 있습니다.
                            </p>
                            <p className="text-sm mb-8" style={{ color: 'rgba(139,92,246,0.6)' }}>
                                (탭하여 닫기)
                            </p>
                            <div className="flex justify-center gap-6">
                                {['😌', '😌', '😌', '😌', '😌'].map((e, i) => (
                                    <motion.div key={i}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.15 }}
                                        className="text-4xl"
                                        style={{ filter: 'brightness(1.5) drop-shadow(0 0 12px gold)' }}
                                    >
                                        {e}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
