import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Heart, Users, Bell, ShoppingBag, ChevronRight, LogOut } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuthStore, useSessionStore, useUIStore } from '@/store';
import { isFirebaseConfigured } from '@/lib/mockData';
import type { Phase } from '@/types';

const Phase0 = lazy(() => import('@/pages/game/phases/Phase0'));
const Phase1 = lazy(() => import('@/pages/game/phases/Phase1'));
const Phase2 = lazy(() => import('@/pages/game/phases/Phase2'));
const Phase3 = lazy(() => import('@/pages/game/phases/Phase3'));
const Phase4 = lazy(() => import('@/pages/game/phases/Phase4'));
import Shop from '@/components/game/Shop';
import NotificationPanel from '@/components/game/NotificationPanel';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import AudioControls from '@/components/ui/AudioControls';
import { audioManager } from '@/lib/audioManager';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useTranslation } from 'react-i18next';

const PERSONA_COLORS: Record<string, string> = {
    Alpha: '#38bdf8', Delta: '#06d6a0', Omega: '#a78bfa',
    Lambda: '#fb923c', Sigma: '#f43f5e',
};
const PERSONA_EMOJI: Record<string, string> = {
    Alpha: '📊', Delta: '🕊️', Omega: '💡', Lambda: '💚', Sigma: '⚡',
};
const PHASE_KEYS = ['phase0', 'phase1', 'phase2', 'phase3', 'phase4'] as const;
const PHASE_COLORS = ['#f43f5e', '#f5a623', '#06d6a0', '#a78bfa', '#38bdf8'];

// ─── HUD Top Bar ──────────────────────────────────────────────
function HUD({
    phase, persona, name, teamwork, xp, unreadCount,
    onShop, onNotif, onLogout, onHome,
}: {
    phase: Phase; persona: string; name: string;
    teamwork: number; xp: number; unreadCount: number;
    onShop: () => void; onNotif: () => void; onLogout: () => void; onHome: () => void;
}) {
    const { t } = useTranslation();
    const color = PERSONA_COLORS[persona] ?? '#a78bfa';
    const phaseColor = PHASE_COLORS[phase];
    const phaseName = t(`game.${PHASE_KEYS[phase]}.name`);

    return (
        <header className="fixed top-0 left-0 right-0 z-50"
            style={{ background: 'rgba(10,6,24,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${phaseColor}30` }}>
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">

                {/* Home button */}
                <button onClick={onHome} className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white flex-shrink-0 transition-all"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #e94560)' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 12px rgba(124,58,237,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                    aria-label={t('hud.home')} title={t('hud.home')}>
                    공
                </button>

                {/* Phase badge */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl flex-shrink-0"
                    style={{ background: `${phaseColor}18`, border: `1px solid ${phaseColor}40` }}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: phaseColor }} />
                    <span className="text-xs font-bold hidden sm:block" style={{ color: phaseColor }}>
                        {phaseName}
                    </span>
                    <span className="text-xs font-bold sm:hidden" style={{ color: phaseColor }}>P{phase}</span>
                </div>

                {/* Phase progress — emoji + 이름 + 완료 체크 */}
                <div className="hidden md:flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map(p => {
                        const isDone = p < phase;
                        const isCurrent = p === phase;
                        const PHASE_STEP_LABELS = ['🎭', '🔍', '⚖️', '✨', '📝'];
                        return (
                            <div key={p}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                                style={{
                                    background: isCurrent ? `${PHASE_COLORS[p]}20` : 'transparent',
                                    border: isCurrent ? `1px solid ${PHASE_COLORS[p]}50` : '1px solid transparent',
                                }}
                                title={`Phase ${p}: ${t(`game.${PHASE_KEYS[p]}.name`)}`}
                            >
                                <span className="text-xs">{PHASE_STEP_LABELS[p]}</span>
                                {isDone && <span className="text-xs" style={{ color: '#06d6a0' }}>✓</span>}
                                {isCurrent && (
                                    <span className="text-xs font-bold hidden lg:block" style={{ color: PHASE_COLORS[p] }}>
                                        {t(`game.${PHASE_KEYS[p]}.name`)}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* 모바일용: 진행도 % */}
                <div className="md:hidden text-xs font-mono" style={{ color: phaseColor, opacity: 0.7 }}>
                    {Math.round((phase / 4) * 100)}%
                </div>

                <div className="flex-1" />

                {/* Teamwork gauge */}
                <div className="hidden sm:flex items-center gap-2">
                    <Heart size={12} style={{ color: '#fb923c' }} />
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <motion.div className="h-full rounded-full" style={{ background: '#fb923c', width: `${teamwork}%` }}
                            transition={{ duration: 0.5 }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: '#fb923c' }}>{teamwork}</span>
                </div>

                {/* XP */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)' }}>
                    <Zap size={11} style={{ color: '#fbbf24' }} />
                    <span className="text-xs font-black" style={{ color: '#fbbf24' }}>{xp} XP</span>
                </div>

                {/* Persona badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
                    <span className="text-sm">{PERSONA_EMOJI[persona]}</span>
                    <span className="text-xs font-bold hidden sm:block" style={{ color }}>{name}</span>
                </div>

                {/* Action buttons */}
                <button onClick={onShop} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    aria-label={t('hud.shop')}>
                    <ShoppingBag size={14} style={{ color: '#a78bfa' }} />
                </button>
                <button onClick={onNotif} className="w-8 h-8 rounded-lg flex items-center justify-center relative transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    aria-label={t('hud.notifications')}>
                    <Bell size={14} style={{ color: '#a78bfa' }} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                            style={{ background: '#f43f5e', fontSize: 9, fontWeight: 900 }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
                <LanguageSwitcher compact />
                <AudioControls compact />
                <button onClick={onLogout} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    aria-label={t('hud.logout')}>
                    <LogOut size={14} style={{ color: '#f43f5e' }} />
                </button>
            </div>
        </header>
    );
}

// ─── Team Panel (right side) ──────────────────────────────────
function TeamPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { t } = useTranslation();
    const { currentGroup } = useSessionStore();
    const assignments = currentGroup?.personaAssignments ?? {};

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40" onClick={onClose} />
                    <motion.aside
                        initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-14 right-0 bottom-0 w-72 z-50 p-5 overflow-y-auto"
                        style={{ background: 'rgba(17,13,46,0.97)', borderLeft: '1px solid rgba(124,58,237,0.2)', backdropFilter: 'blur(20px)' }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-black text-white flex items-center gap-2">
                                <Users size={16} style={{ color: '#a78bfa' }} /> {t('hud.team_panel')}
                            </h3>
                            <button onClick={onClose} className="text-xs" style={{ color: 'rgba(139,92,246,0.5)' }}>{t('common.close')}</button>
                        </div>

                        {Object.entries(assignments).length === 0 ? (
                            <p className="text-xs" style={{ color: 'rgba(139,92,246,0.4)' }}>{t('hud.no_team')}</p>
                        ) : (
                            Object.entries(assignments).map(([id, persona]) => {
                                const color = PERSONA_COLORS[persona] ?? '#a78bfa';
                                return (
                                    <div key={id} className="flex items-center gap-3 mb-3 p-3 rounded-xl"
                                        style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                                            style={{ background: `${color}22` }}>
                                            {PERSONA_EMOJI[persona]}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">{persona}</div>
                                            <div className="text-xs" style={{ color: `${color}80` }}>
                                                {t(`persona.${persona}.role`)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* NPC Trust Levels */}
                        <div className="mt-6">
                            <h4 className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.5)' }}>
                                {t('hud.npc_trust')}
                            </h4>
                            {(currentGroup?.npcs ?? []).map(npc => (
                                <div key={npc.id} className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-white">{npc.emoji} {npc.name}</span>
                                        <span style={{ color: npc.isPersuaded ? '#06d6a0' : 'rgba(139,92,246,0.5)' }}>
                                            {npc.isPersuaded ? `${t('hud.persuaded')} ✓` : `${npc.trustLevel}%`}
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                        <motion.div className="h-full rounded-full" style={{
                                            width: `${npc.trustLevel}%`,
                                            background: npc.isPersuaded ? '#06d6a0' : 'linear-gradient(90deg, #f43f5e, #fbbf24)',
                                        }} transition={{ duration: 0.6 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Main GameRoom ────────────────────────────────────────────
export default function GameRoom() {
    const { t } = useTranslation();
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { studentProfile, logout } = useAuthStore();
    const { currentPhase, setPhase, currentGroup } = useSessionStore();
    const { addNotification, unreadCount } = useUIStore();
    const [teamPanelOpen, setTeamPanelOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [shopOpen, setShopOpen] = useState(false);
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [localXp, setLocalXp] = useState<number>(0);

    const persona = studentProfile?.persona ?? 'Alpha';
    const name = studentProfile?.displayName ?? '플레이어';
    const teamwork = studentProfile?.teamworkGauge ?? 70;
    const baseXp = Object.values(studentProfile?.xp ?? {}).reduce((a, b) => a + b, 0);
    const xp = baseXp + localXp;

    // ── 새 게임 진입 시 Phase 0으로 초기화 (persist된 이전 값 방지) ──
    useEffect(() => {
        if (!isFirebaseConfigured()) {
            setPhase(0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Real-time phase sync from Firebase RTDB ──────────────────
    useEffect(() => {
        if (!isFirebaseConfigured() || !sessionId) return;
        const phaseRef = ref(rtdb, `sessions/${sessionId}/currentPhase`);
        const unsub = onValue(phaseRef, (snap) => {
            const val = snap.val();
            if (val !== null) {
                setPhase(val as Phase);
                addNotification({ type: 'phase_change', title: t('game.phase_change'), message: `Phase ${val}: ${t(`game.${PHASE_KEYS[val as Phase]}.name`)}` });
            }
        });
        return () => unsub();
    }, [sessionId]);

    // ── Mock 모드: 교사 탭에서 Phase 변경 시 storage event로 수신 ──
    useEffect(() => {
        if (isFirebaseConfigured()) return;
        function onStorage(e: StorageEvent) {
            if (e.key === 'fair-factory-session' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    const newPhase = parsed?.state?.currentPhase;
                    if (newPhase !== undefined && newPhase !== currentPhase) {
                        setPhase(newPhase as Phase);
                        addNotification({ type: 'phase_change', title: t('game.phase_change'), message: `Phase ${newPhase}: ${t(`game.${PHASE_KEYS[newPhase as Phase]}.name`)}` });
                    }
                } catch { /* ignore */ }
            }
        }
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [currentPhase]);

    // ── Dev: keyboard shortcut to change phase (for testing) ─────
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.ctrlKey && e.key >= '0' && e.key <= '4') {
                setPhase(Number(e.key) as Phase);
            }
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    // ── BGM: Phase 바뀔 때 자동 전환 ─────────────────────────────
    useEffect(() => {
        audioManager.playBGM(currentPhase);
        audioManager.playSFX('phase');
    }, [currentPhase]);

    // ── BGM cleanup when leaving ──────────────────────────────────
    useEffect(() => {
        return () => audioManager.stopBGM();
    }, []);

    // ── Phase 전환 브리핑 카드 ─────────────────────────────────────
    const [briefing, setBriefing] = useState(false);
    const prevPhaseRef = useState<Phase | null>(null);

    const BRIEFING_EMOJIS = ['🎭', '🔍', '⚖️', '✨', '📝'];

    useEffect(() => {
        // 첫 렌더 제외, Phase 변경 시에만 브리핑 표시
        if (prevPhaseRef[0] !== null && prevPhaseRef[0] !== currentPhase) {
            setBriefing(true);
            const t = setTimeout(() => setBriefing(false), 3500);
            return () => clearTimeout(t);
        }
        prevPhaseRef[0] = currentPhase;
    }, [currentPhase]);

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0618 0%, #0d0d1a 100%)' }}>
            <HUD
                phase={currentPhase}
                persona={persona}
                name={name}
                teamwork={teamwork}
                xp={xp}
                unreadCount={unreadCount}
                onShop={() => setShopOpen(true)}
                onNotif={() => setNotifOpen(v => !v)}
                onHome={() => navigate('/')}
                onLogout={() => {
                    if (confirm(t('hud.logout_confirm'))) {
                        audioManager.stopBGM();
                        logout();
                        navigate('/');
                    }
                }}
            />

            {/* Phase Briefing Overlay */}
            <AnimatePresence>
                {briefing && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center"
                        style={{ background: 'rgba(10,6,24,0.92)', backdropFilter: 'blur(12px)' }}
                        onClick={() => setBriefing(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.7, y: 40 }} animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: -20, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                            className="text-center max-w-md px-6"
                        >
                            <motion.div animate={{ scale: [1, 1.15, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-7xl mb-5"
                                style={{ filter: `drop-shadow(0 0 30px ${PHASE_COLORS[currentPhase]}80)` }}>
                                {BRIEFING_EMOJIS[currentPhase]}
                            </motion.div>
                            <div className="text-xs uppercase tracking-[0.3em] mb-2 font-bold"
                                style={{ color: PHASE_COLORS[currentPhase] }}>
                                Phase {currentPhase}
                            </div>
                            <h2 className="text-3xl font-black text-white mb-3">
                                {t(`game.${PHASE_KEYS[currentPhase]}.name`)}
                            </h2>
                            <p className="text-base font-semibold text-white mb-4">
                                🎯 {t(`briefing.phase${currentPhase}_mission`)}
                            </p>
                            <p className="text-sm rounded-xl px-4 py-3 mb-6"
                                style={{ background: `${PHASE_COLORS[currentPhase]}12`, color: `${PHASE_COLORS[currentPhase]}cc`, border: `1px solid ${PHASE_COLORS[currentPhase]}25` }}>
                                {t(`briefing.phase${currentPhase}_tip`)}
                            </p>
                            <p className="text-xs animate-pulse" style={{ color: 'rgba(139,92,246,0.4)' }}>
                                {t('briefing.touch_to_start')}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dev Phase Switcher (테스트용) */}
            <div className="fixed bottom-4 left-4 z-50 flex gap-1">
                {[0, 1, 2, 3, 4].map(p => (
                    <button key={p} onClick={() => setPhase(p as Phase)}
                        className="w-8 h-8 rounded-lg text-xs font-black transition-all"
                        style={{
                            background: currentPhase === p ? PHASE_COLORS[p] : 'rgba(255,255,255,0.08)',
                            color: currentPhase === p ? '#fff' : 'rgba(255,255,255,0.3)',
                        }}
                        title={`Phase ${p}: ${t(`game.${PHASE_KEYS[p]}.name`)}`}
                    >
                        {p}
                    </button>
                ))}
                <span className="text-xs self-center ml-1" style={{ color: 'rgba(139,92,246,0.4)' }}>{t('hud.test')}</span>
            </div>

            {/* Team Panel toggle */}
            <button
                onClick={() => setTeamPanelOpen(true)}
                className="fixed top-20 right-0 z-40 flex items-center gap-1 px-2 py-3 rounded-l-xl transition-all"
                style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.4)', borderRight: 'none' }}
                aria-label={t('hud.team_panel')}
            >
                <Users size={14} style={{ color: '#c4b5fd' }} />
                <ChevronRight size={12} style={{ color: '#a78bfa' }} />
            </button>

            <TeamPanel open={teamPanelOpen} onClose={() => setTeamPanelOpen(false)} />

            {/* Shop Modal */}
            <AnimatePresence>
                {shopOpen && (
                    <Shop
                        xp={xp}
                        ownedItems={ownedItems}
                        persona={persona}
                        onClose={() => setShopOpen(false)}
                        onBuy={(itemId, cost) => {
                            setOwnedItems(prev => [...prev, itemId]);
                            setLocalXp(prev => prev - cost);
                            audioManager.playSFX('buy');
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Notification Panel */}
            <NotificationPanel
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
            />

            {/* ── Phase Content ── */}
            <main className="pt-14 min-h-screen">
                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                className="w-10 h-10 rounded-full mx-auto mb-4"
                                style={{ border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed' }} />
                            <p className="text-sm" style={{ color: 'rgba(139,92,246,0.6)' }}>{t('game.loading')}</p>
                        </div>
                    </div>
                }>
                    <ErrorBoundary fallbackTitle={t('error.game_error')}>
                        <AnimatePresence mode="wait">
                            {currentPhase === 0 && <Phase0 key="p0" persona={persona} onPhaseComplete={() => setPhase(1)} />}
                            {currentPhase === 1 && <Phase1 key="p1" persona={persona} onPhaseComplete={() => setPhase(2)} />}
                            {currentPhase === 2 && <Phase2 key="p2" persona={persona} npcs={currentGroup?.npcs ?? []} />}
                            {currentPhase === 3 && <Phase3 key="p3" persona={persona} />}
                            {currentPhase === 4 && <Phase4 key="p4" persona={persona} playerName={name} xp={xp} />}
                        </AnimatePresence>
                    </ErrorBoundary>
                </Suspense>
            </main>
        </div>
    );
}
