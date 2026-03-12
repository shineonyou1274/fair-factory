import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Zap, CheckCircle, Lock } from 'lucide-react';

interface Props {
    xp: number;
    ownedItems: string[];
    persona: string;
    onClose: () => void;
    onBuy: (itemId: string, cost: number) => void;
}

// ─── Shop Items ───────────────────────────────────────────────
const SHOP_ITEMS = [
    // ── 소모품 ──
    { id: 'extra_action', category: 'consumable', name: '비밀 행동권', emoji: '🃏', image: null, desc: 'Phase 중 추가 액션카드 1장을 사용할 수 있습니다.', cost: 80, limit: 2, special: false },
    { id: 'truth_lens', category: 'consumable', name: '진실의 렌즈', emoji: '🔍', image: null, desc: 'Phase 1에서 숨겨진 진실 하나를 즉시 공개합니다.', cost: 60, limit: 1, special: false },
    { id: 'npc_hint', category: 'consumable', name: 'NPC 비밀 노트', emoji: '📓', image: null, desc: 'Phase 2에서 NPC의 약점을 미리 확인합니다.', cost: 100, limit: 1, special: false },
    { id: 'price_calc', category: 'consumable', name: '공정가 계산기', emoji: '🧮', image: null, desc: 'Phase 3에서 자동 최적화 버튼이 활성화됩니다.', cost: 120, limit: 1, special: false },
    // ── 장식 ──
    { id: 'hope_shoes', category: 'cosmetic', name: '희망의 신발', emoji: '👟', image: '/items/hope_shoes.png', desc: '아바타에 희망의 신발이 장착됩니다. 이동 속도 +1 액션.', cost: 50, limit: 1, special: false },
    { id: 'wisdom_glasses', category: 'cosmetic', name: '지혜의 안경', emoji: '🔮', image: '/items/wisdom_glasses.png', desc: '착용 시 NPC 감정 상태가 미리 보입니다.', cost: 80, limit: 1, special: false },
    { id: 'gold_frame', category: 'cosmetic', name: '황금 테두리', emoji: '✨', image: null, desc: '아바타 카드에 황금 테두리가 생깁니다.', cost: 50, limit: 99, special: false },
    // ── 팀 전용 ──
    { id: 'solidarity_seed', category: 'team', name: '연대의 씨앗', emoji: '🌱', image: '/items/solidarity_seed.png', desc: '사용 시 팀원 전체 XP +15, 팀워크 게이지 +5.', cost: 180, limit: 1, special: true },
    { id: 'team_boost', category: 'team', name: '팀 XP 부스트', emoji: '🚀', image: null, desc: '다음 제출 팀원 전체 XP +20%.', cost: 200, limit: 1, special: true },
];


const CATEGORIES = [
    { key: 'all', label: '전체', emoji: '🏪' },
    { key: 'consumable', label: '소모품', emoji: '🃏' },
    { key: 'cosmetic', label: '장식', emoji: '✨' },
    { key: 'team', label: '팀 아이템', emoji: '🛡️' },
];

// ─── Item Card ────────────────────────────────────────────────
function ItemCard({
    item, canAfford, owned, onBuy,
}: {
    item: typeof SHOP_ITEMS[0];
    canAfford: boolean;
    owned: number;
    onBuy: () => void;
}) {
    const isMaxed = owned >= item.limit;
    const disabled = !canAfford || isMaxed;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={disabled ? {} : { y: -4, scale: 1.02 }}
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
                background: item.special ? 'rgba(245,166,35,0.07)' : 'rgba(255,255,255,0.04)',
                border: item.special ? '1px solid rgba(245,166,35,0.25)' : '1px solid rgba(139,92,246,0.15)',
                boxShadow: item.special ? '0 0 20px rgba(245,166,35,0.08)' : 'none',
                opacity: isMaxed ? 0.6 : 1,
            }}
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="w-12 h-12 flex items-center justify-center">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-contain"
                            onError={e => {
                                const t = e.target as HTMLImageElement;
                                t.style.display = 'none';
                                t.parentElement!.textContent = item.emoji;
                                t.parentElement!.className = 'text-3xl';
                            }}
                        />
                    ) : (
                        <span className="text-3xl">{item.emoji}</span>
                    )}
                </div>
                {item.special && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(245,166,35,0.2)', color: '#fbbf24' }}>팀 전용</span>
                )}
                {isMaxed && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(6,214,160,0.15)', color: '#06d6a0' }}>
                        <CheckCircle size={10} className="inline mr-1" />보유 중
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1">
                <div className="font-bold text-white text-sm mb-1">{item.name}</div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(196,181,253,0.55)' }}>{item.desc}</p>
                {item.limit > 1 && item.limit < 99 && (
                    <div className="text-xs mt-1" style={{ color: 'rgba(139,92,246,0.4)' }}>최대 {item.limit}개</div>
                )}
            </div>

            {/* Buy Button */}
            <motion.button
                whileTap={disabled ? {} : { scale: 0.95 }}
                onClick={disabled ? undefined : onBuy}
                disabled={disabled}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                    background: isMaxed
                        ? 'rgba(6,214,160,0.1)'
                        : canAfford
                            ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                            : 'rgba(255,255,255,0.06)',
                    color: isMaxed ? '#06d6a0' : canAfford ? '#fff' : 'rgba(139,92,246,0.35)',
                    boxShadow: !disabled && canAfford ? '0 0 15px rgba(124,58,237,0.4)' : 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                aria-label={`${item.name} ${isMaxed ? '보유 중' : `${item.cost} XP로 구매`}`}
            >
                {isMaxed ? (
                    <><CheckCircle size={13} /> 보유 중</>
                ) : !canAfford ? (
                    <><Lock size={13} /> XP 부족</>
                ) : (
                    <><Zap size={13} /> {item.cost} XP</>
                )}
            </motion.button>
        </motion.div>
    );
}

// ─── Main Shop ────────────────────────────────────────────────
export default function Shop({ xp, ownedItems, persona, onClose, onBuy }: Props) {
    const [category, setCategory] = useState('all');
    const [buyFeedback, setBuyFeedback] = useState<{ id: string; name: string } | null>(null);

    const filtered = SHOP_ITEMS.filter(i => category === 'all' || i.category === category);

    function handleBuy(item: typeof SHOP_ITEMS[0]) {
        onBuy(item.id, item.cost);
        setBuyFeedback({ id: item.id, name: item.name });
        setTimeout(() => setBuyFeedback(null), 2000);
    }

    function getOwned(id: string) {
        return ownedItems.filter(i => i === id).length;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(10,6,24,0.92)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-2xl rounded-3xl overflow-hidden"
                style={{ background: '#110d2e', border: '1px solid rgba(124,58,237,0.3)', maxHeight: '90vh' }}
            >
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between"
                    style={{ background: 'linear-gradient(180deg, rgba(124,58,237,0.2), transparent)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">🏪</div>
                        <div>
                            <h2 className="font-black text-white">공정가 상점</h2>
                            <p className="text-xs" style={{ color: 'rgba(167,139,250,0.5)' }}>XP로 아이템을 구매하세요</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* XP display */}
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)' }}>
                            <Zap size={14} style={{ color: '#fbbf24' }} />
                            <span className="font-black text-base" style={{ color: '#fbbf24' }}>{xp}</span>
                            <span className="text-xs" style={{ color: 'rgba(245,166,35,0.6)' }}>XP</span>
                        </div>
                        <button onClick={onClose}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                            style={{ background: 'rgba(255,255,255,0.06)' }}
                            aria-label="상점 닫기">
                            <X size={16} style={{ color: '#a78bfa' }} />
                        </button>
                    </div>
                </div>

                {/* Category filter */}
                <div className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide"
                    style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                    {CATEGORIES.map(c => (
                        <button key={c.key} onClick={() => setCategory(c.key)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                            style={{
                                background: category === c.key ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.04)',
                                color: category === c.key ? '#fff' : 'rgba(167,139,250,0.5)',
                                border: category === c.key ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
                            }}>
                            {c.emoji} {c.label}
                        </button>
                    ))}
                </div>

                {/* Items grid */}
                <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filtered.map((item, i) => (
                            <motion.div key={item.id} transition={{ delay: i * 0.04 }}>
                                <ItemCard
                                    item={item}
                                    canAfford={xp >= item.cost}
                                    owned={getOwned(item.id)}
                                    onBuy={() => handleBuy(item)}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-2">🛒</div>
                            <p className="text-sm" style={{ color: 'rgba(139,92,246,0.4)' }}>해당 카테고리에 아이템이 없습니다</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Buy feedback toast */}
            <AnimatePresence>
                {buyFeedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl z-[60]"
                        style={{ background: 'rgba(6,214,160,0.2)', border: '1px solid rgba(6,214,160,0.4)', backdropFilter: 'blur(12px)' }}
                    >
                        <CheckCircle size={16} style={{ color: '#06d6a0' }} />
                        <span className="text-sm font-bold text-white">{buyFeedback.name} 구매 완료!</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
