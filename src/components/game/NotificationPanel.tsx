import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Zap, Award, ArrowRight, Users, CheckCircle } from 'lucide-react';
import { useUIStore } from '@/store';

export interface Notification {
    id: string;
    type: 'phase_change' | 'xp_gain' | 'golden_seal' | 'team_submit' | 'npc_persuaded' | 'system';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    xpAmount?: number;
}

const TYPE_CONFIG: Record<Notification['type'], { icon: React.ElementType; color: string; bg: string }> = {
    phase_change: { icon: ArrowRight, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    xp_gain: { icon: Zap, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    golden_seal: { icon: Award, color: '#f5a623', bg: 'rgba(245,166,35,0.12)' },
    team_submit: { icon: Users, color: '#06d6a0', bg: 'rgba(6,214,160,0.10)' },
    npc_persuaded: { icon: CheckCircle, color: '#38bdf8', bg: 'rgba(56,189,248,0.10)' },
    system: { icon: Bell, color: '#f43f5e', bg: 'rgba(244,63,94,0.10)' },
};

function timeAgo(ts: number) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return '방금';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    return `${Math.floor(diff / 3600)}시간 전`;
}

// ─── Single Notification Item ─────────────────────────────────
function NotifItem({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
    const cfg = TYPE_CONFIG[notif.type];
    const Icon = cfg.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => onRead(notif.id)}
            className="flex gap-3 p-4 cursor-pointer transition-all rounded-xl"
            style={{
                background: notif.read ? 'transparent' : cfg.bg,
                border: `1px solid ${notif.read ? 'transparent' : cfg.color + '30'}`,
                marginBottom: 6,
            }}
        >
            {/* Icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}>
                <Icon size={14} style={{ color: cfg.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-white">{notif.title}</span>
                    {!notif.read && (
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                    )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(196,181,253,0.6)' }}>
                    {notif.message}
                </p>
                {notif.xpAmount && (
                    <div className="flex items-center gap-1 mt-1">
                        <Zap size={9} style={{ color: '#fbbf24' }} />
                        <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>+{notif.xpAmount} XP</span>
                    </div>
                )}
                <div className="text-xs mt-1" style={{ color: 'rgba(139,92,246,0.35)' }}>
                    {timeAgo(notif.timestamp)}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Notification Panel ───────────────────────────────────────
export default function NotificationPanel({
    open, onClose,
}: {
    open: boolean; onClose: () => void;
}) {
    const { notifications, markAllRead, markRead, clearNotifications } = useUIStore();

    const unreadCount = notifications.filter(n => !n.read).length;

    // Auto-mark read when panel opens
    useEffect(() => {
        if (open && unreadCount > 0) {
            setTimeout(() => markAllRead(), 2000);
        }
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.aside
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        className="fixed top-16 right-4 z-50 w-80 rounded-2xl overflow-hidden"
                        style={{ background: '#110d2e', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                    >
                        {/* Header */}
                        <div className="px-4 py-3 flex items-center justify-between"
                            style={{ borderBottom: '1px solid rgba(124,58,237,0.15)', background: 'rgba(124,58,237,0.08)' }}>
                            <div className="flex items-center gap-2">
                                <Bell size={14} style={{ color: '#a78bfa' }} />
                                <span className="font-black text-white text-sm">알림</span>
                                {unreadCount > 0 && (
                                    <span className="w-5 h-5 rounded-full text-xs font-black text-white flex items-center justify-center"
                                        style={{ background: '#f43f5e' }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearNotifications}
                                        className="text-xs transition-colors"
                                        style={{ color: 'rgba(139,92,246,0.5)' }}>
                                        모두 지우기
                                    </button>
                                )}
                                <button onClick={onClose}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: 'rgba(255,255,255,0.05)' }}
                                    aria-label="알림 패널 닫기">
                                    <X size={12} style={{ color: '#a78bfa' }} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto p-3" style={{ maxHeight: 400 }}>
                            {notifications.length === 0 ? (
                                <div className="text-center py-10">
                                    <Bell size={28} style={{ color: 'rgba(139,92,246,0.2)', margin: '0 auto 8px' }} />
                                    <p className="text-xs" style={{ color: 'rgba(139,92,246,0.35)' }}>알림이 없습니다</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {[...notifications].reverse().map(n => (
                                        <NotifItem key={n.id} notif={n} onRead={markRead} />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Unread hint bar */}
                        {unreadCount > 0 && (
                            <div className="px-4 py-2 flex items-center justify-between"
                                style={{ borderTop: '1px solid rgba(124,58,237,0.1)', background: 'rgba(167,139,250,0.04)' }}>
                                <span className="text-xs" style={{ color: 'rgba(167,139,250,0.5)' }}>
                                    읽지 않은 알림 {unreadCount}개
                                </span>
                                <button onClick={markAllRead}
                                    className="text-xs font-bold transition-colors"
                                    style={{ color: '#a78bfa' }}>
                                    모두 읽음
                                </button>
                            </div>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Floating XP Toast (standalone) ──────────────────────────
export function XPToast({ amount, reason, onDone }: {
    amount: number; reason: string; onDone: () => void;
}) {
    useEffect(() => {
        const t = setTimeout(onDone, 2500);
        return () => clearTimeout(t);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{ background: 'rgba(15,8,40,0.95)', border: '1px solid rgba(245,166,35,0.4)', backdropFilter: 'blur(16px)', boxShadow: '0 0 30px rgba(245,166,35,0.2)' }}
        >
            <motion.div
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ repeat: 2, duration: 0.3, delay: 0.1 }}
            >
                <Zap size={20} style={{ color: '#fbbf24' }} />
            </motion.div>
            <div>
                <div className="font-black text-white text-sm">+{amount} XP 획득!</div>
                <div className="text-xs" style={{ color: 'rgba(245,166,35,0.7)' }}>{reason}</div>
            </div>
        </motion.div>
    );
}
