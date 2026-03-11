import { motion } from 'framer-motion';
import type { Persona } from '@/types';

interface Props {
    persona: Persona;
    name: string;
    xp: number;
    showItems?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

// ─── XP → Level calc ─────────────────────────────────────────
export const XP_LEVELS = [
    { level: 1, name: '견습 공정가', minXp: 0, maxXp: 99, suffix: '🌱' },
    { level: 2, name: '탐구자', minXp: 100, maxXp: 249, suffix: '🔍' },
    { level: 3, name: '협상가', minXp: 250, maxXp: 499, suffix: '⚖️' },
    { level: 4, name: '변혁가', minXp: 500, maxXp: 999, suffix: '🔥' },
    { level: 5, name: '현자', minXp: 1000, maxXp: Infinity, suffix: '✨' },
];

export function getLevel(xp: number) {
    const matched = XP_LEVELS.filter(l => xp >= l.minXp);
    return matched[matched.length - 1] ?? XP_LEVELS[0];
}

export function getLevelProgress(xp: number): number {
    const level = getLevel(xp);
    if (level.level === 5) return 100;
    return Math.min(100, Math.round(((xp - level.minXp) / (level.maxXp - level.minXp)) * 100));
}

// ─── Persona config ───────────────────────────────────────────
const PERSONA_COLORS: Record<Persona, string> = {
    Alpha: '#38bdf8', Delta: '#06d6a0', Omega: '#a78bfa',
    Lambda: '#fb923c', Sigma: '#f43f5e',
};
const PERSONA_EMOJI: Record<Persona, string> = {
    Alpha: '📊', Delta: '🕊️', Omega: '💡', Lambda: '💚', Sigma: '⚡',
};

const SIZE_CONFIG = {
    sm: { img: 56, ring: 64, text: 'text-xs', xpH: 'h-1' },
    md: { img: 80, ring: 92, text: 'text-sm', xpH: 'h-1.5' },
    lg: { img: 120, ring: 136, text: 'text-base', xpH: 'h-2' },
};

// ─── Avatar Card ──────────────────────────────────────────────
export default function AvatarCard({ persona, name, xp, size = 'md' }: Props) {
    const color = PERSONA_COLORS[persona];
    const emoji = PERSONA_EMOJI[persona];
    const level = getLevel(xp);
    const progress = getLevelProgress(xp);
    const cfg = SIZE_CONFIG[size];

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Avatar ring */}
            <div className="relative" style={{ width: cfg.ring, height: cfg.ring }}>
                {/* Glowing ring */}
                <div className="absolute inset-0 rounded-full"
                    style={{
                        background: `conic-gradient(${color} ${progress}%, rgba(255,255,255,0.05) ${progress}%)`,
                        padding: 3,
                        borderRadius: '50%',
                    }}
                >
                    <div className="w-full h-full rounded-full flex items-center justify-center"
                        style={{ background: '#110d2e' }}>
                        {/* Persona image */}
                        <div className="relative" style={{ width: cfg.img, height: cfg.img }}>
                            <img
                                src={`/personas/${persona.toLowerCase()}.png`}
                                alt={persona}
                                style={{ width: cfg.img, height: cfg.img, borderRadius: '50%', objectFit: 'cover' }}
                                onError={e => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
                                }}
                            />
                            <div hidden
                                style={{
                                    width: cfg.img, height: cfg.img, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: cfg.img * 0.42, background: `${color}20`,
                                    position: 'absolute', inset: 0,
                                }}
                            >
                                {emoji}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level badge */}
                <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center font-black text-white z-10"
                    style={{
                        width: cfg.img * 0.35, height: cfg.img * 0.35,
                        background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                        border: '2px solid #110d2e',
                        fontSize: cfg.img * 0.14,
                        boxShadow: `0 0 12px ${color}60`,
                    }}
                >
                    {level.level}
                </motion.div>
            </div>

            {/* Name + title */}
            <div className="text-center">
                <div className={`font-black text-white ${cfg.text}`}>{name}</div>
                <div className="text-xs font-medium" style={{ color }}>
                    {level.suffix} {level.name}
                </div>
            </div>

            {/* XP bar */}
            {size !== 'sm' && (
                <div className="w-full max-w-[120px]">
                    <div className={`${cfg.xpH} rounded-full overflow-hidden`} style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${color}bb, ${color})` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.4)' }}>
                        <span>{xp} XP</span>
                        {level.level < 5 && <span>{level.maxXp}</span>}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── XP Gain Toast ────────────────────────────────────────────
export function XPGainToast({ amount, reason }: { amount: number; reason: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.4)', backdropFilter: 'blur(12px)' }}
        >
            <motion.div
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ repeat: 2, duration: 0.3 }}
            >
                <Zap size={18} style={{ color: '#fbbf24' }} />
            </motion.div>
            <div>
                <div className="font-black text-white text-sm">+{amount} XP!</div>
                <div className="text-xs" style={{ color: 'rgba(245,166,35,0.7)' }}>{reason}</div>
            </div>
        </motion.div>
    );
}

// ─── Level Up Modal ───────────────────────────────────────────
export function LevelUpModal({ newLevel, persona, onClose }: {
    newLevel: typeof XP_LEVELS[0]; persona: Persona; onClose: () => void;
}) {
    const color = PERSONA_COLORS[persona];
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(10,6,24,0.9)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-center px-8"
            >
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
                    transition={{ repeat: 3, duration: 0.4 }}
                    className="text-8xl mb-6"
                >
                    {newLevel.suffix}
                </motion.div>
                <p className="text-base mb-1" style={{ color: 'rgba(196,181,253,0.6)' }}>레벨 업!</p>
                <h2 className="font-black text-4xl mb-3" style={{ color }}>
                    Lv.{newLevel.level} {newLevel.name}
                </h2>
                <p className="text-sm mb-8" style={{ color: 'rgba(196,181,253,0.5)' }}>
                    새로운 칭호를 획득했습니다. 상점에서 특별 아이템을 확인하세요!
                </p>
                {/* Sparkle ring */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div key={i}
                        className="absolute text-2xl"
                        style={{ left: `${30 + Math.cos(i / 8 * Math.PI * 2) * 120}px`, top: `${50 + Math.sin(i / 8 * Math.PI * 2) * 80}px` }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                    >
                        ✨
                    </motion.div>
                ))}
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-8 py-4 rounded-2xl font-black text-lg text-white"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 0 30px ${color}50` }}
                >
                    계속하기 →
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

// Zap icon used inside component
function Zap({ size, style }: { size: number; style?: React.CSSProperties }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    );
}
