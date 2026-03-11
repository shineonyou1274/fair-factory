import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Heart, Users, Bell, ShoppingBag, ChevronRight } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuthStore, useSessionStore, useUIStore } from '@/store';
import { isFirebaseConfigured } from '@/lib/mockData';
import type { Phase } from '@/types';

import Phase0 from '@/pages/game/phases/Phase0';
import Phase1 from '@/pages/game/phases/Phase1';
import Phase2 from '@/pages/game/phases/Phase2';
import Phase3 from '@/pages/game/phases/Phase3';
import Phase4 from '@/pages/game/phases/Phase4';
import Shop from '@/components/game/Shop';
import NotificationPanel from '@/components/game/NotificationPanel';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import AudioControls from '@/components/ui/AudioControls';
import { audioManager } from '@/lib/audioManager';

const PERSONA_COLORS: Record<string, string> = {
    Alpha: '#38bdf8', Delta: '#06d6a0', Omega: '#a78bfa',
    Lambda: '#fb923c', Sigma: '#f43f5e',
};
const PERSONA_EMOJI: Record<string, string> = {
    Alpha: '📊', Delta: '🕊️', Omega: '💡', Lambda: '💚', Sigma: '⚡',
};
const PHASE_NAMES = ['환상의 장막', '진실의 돋보기', '지혜의 토론', '공정의 설계', '성찰의 거울'];
const PHASE_COLORS = ['#f43f5e', '#f5a623', '#06d6a0', '#a78bfa', '#38bdf8'];

// ─── HUD Top Bar ──────────────────────────────────────────────
function HUD({
    phase, persona, name, teamwork, xp, unreadCount,
    onShop, onNotif,
}: {
    phase: Phase; persona: string; name: string;
    teamwork: number; xp: number; unreadCount: number;
    onShop: () => void; onNotif: () => void;
}) {
    const color = PERSONA_COLORS[persona] ?? '#a78bfa';
    const phaseColor = PHASE_COLORS[phase];

    return (
        <header className="fixed top-0 left-0 right-0 z-50"
            style={{ background: 'rgba(10,6,24,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${phaseColor}30` }}>
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">

                {/* Phase badge */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl flex-shrink-0"
                    style={{ background: `${phaseColor}18`, border: `1px solid ${phaseColor}40` }}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: phaseColor }} />
                    <span className="text-xs font-bold hidden sm:block" style={{ color: phaseColor }}>
                        {PHASE_NAMES[phase]}
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
                                title={`Phase ${p}: ${PHASE_NAMES[p]}`}
                            >
                                <span className="text-xs">{PHASE_STEP_LABELS[p]}</span>
                                {isDone && <span className="text-xs" style={{ color: '#06d6a0' }}>✓</span>}
                                {isCurrent && (
                                    <span className="text-xs font-bold hidden lg:block" style={{ color: PHASE_COLORS[p] }}>
                                        {PHASE_NAMES[p]}
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
                    aria-label="상점">
                    <ShoppingBag size={14} style={{ color: '#a78bfa' }} />
                </button>
                <button onClick={onNotif} className="w-8 h-8 rounded-lg flex items-center justify-center relative transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    aria-label="알림">
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
            </div>
        </header>
    );
}

// ─── Team Panel (right side) ──────────────────────────────────
function TeamPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
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
                                <Users size={16} style={{ color: '#a78bfa' }} /> 우리 모둠
                            </h3>
                            <button onClick={onClose} className="text-xs" style={{ color: 'rgba(139,92,246,0.5)' }}>닫기</button>
                        </div>

                        {Object.entries(assignments).length === 0 ? (
                            <p className="text-xs" style={{ color: 'rgba(139,92,246,0.4)' }}>팀원이 아직 없습니다.</p>
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
                                                {['분석가', '중재자', '설계자', '치유사', '수호자'][['Alpha', 'Delta', 'Omega', 'Lambda', 'Sigma'].indexOf(persona)]}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* NPC Trust Levels */}
                        <div className="mt-6">
                            <h4 className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.5)' }}>
                                NPC 신뢰도
                            </h4>
                            {(currentGroup?.npcs ?? []).map(npc => (
                                <div key={npc.id} className="mb-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-white">{npc.emoji} {npc.name}</span>
                                        <span style={{ color: npc.isPersuaded ? '#06d6a0' : 'rgba(139,92,246,0.5)' }}>
                                            {npc.isPersuaded ? '설득 완료 ✓' : `${npc.trustLevel}%`}
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
    const { sessionId } = useParams();
    const { studentProfile } = useAuthStore();
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

    // ── Real-time phase sync from Firebase RTDB ──────────────────
    useEffect(() => {
        if (!isFirebaseConfigured() || !sessionId) return;
        const phaseRef = ref(rtdb, `sessions/${sessionId}/currentPhase`);
        const unsub = onValue(phaseRef, (snap) => {
            const val = snap.val();
            if (val !== null) {
                setPhase(val as Phase);
                addNotification({ type: 'phase_change', title: '단계 변경!', message: `Phase ${val}: ${PHASE_NAMES[val as Phase]}` });
            }
        });
        return () => unsub();
    }, [sessionId]);

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

    const BRIEFINGS: Record<number, { emoji: string; title: string; mission: string; tip: string }> = {
        0: { emoji: '🎭', title: '환상의 장막', mission: '화면의 광고를 보고 구매할지 결정하세요!', tip: '💡 직감을 믿으세요. 나중에 놀랄 수 있어요.' },
        1: { emoji: '🔍', title: '진실의 돋보기', mission: '화면을 문질러서 숨겨진 진실을 발견하세요!', tip: '💡 밝은 부분 아래에 진실이 숨어있습니다.' },
        2: { emoji: '⚖️', title: '지혜의 토론', mission: '5명의 NPC와 대화하여 설득하세요!', tip: '💡 각 NPC의 약점을 파악하면 더 쉽게 설득할 수 있어요.' },
        3: { emoji: '✨', title: '공정의 설계', mission: '공정한 가격 구조를 설계하세요!', tip: '💡 농부의 수입이 충분한지 확인해보세요.' },
        4: { emoji: '📝', title: '성찰의 거울', mission: '여정을 돌아보며 성찰 저널을 작성하세요!', tip: '💡 솔직한 마음을 적어주세요. 정답은 없습니다.' },
    };

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
            />

            {/* Phase Briefing Overlay */}
            <AnimatePresence>
                {briefing && BRIEFINGS[currentPhase] && (
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
                                {BRIEFINGS[currentPhase].emoji}
                            </motion.div>
                            <div className="text-xs uppercase tracking-[0.3em] mb-2 font-bold"
                                style={{ color: PHASE_COLORS[currentPhase] }}>
                                Phase {currentPhase}
                            </div>
                            <h2 className="text-3xl font-black text-white mb-3">
                                {BRIEFINGS[currentPhase].title}
                            </h2>
                            <p className="text-base font-semibold text-white mb-4">
                                🎯 {BRIEFINGS[currentPhase].mission}
                            </p>
                            <p className="text-sm rounded-xl px-4 py-3 mb-6"
                                style={{ background: `${PHASE_COLORS[currentPhase]}12`, color: `${PHASE_COLORS[currentPhase]}cc`, border: `1px solid ${PHASE_COLORS[currentPhase]}25` }}>
                                {BRIEFINGS[currentPhase].tip}
                            </p>
                            <p className="text-xs animate-pulse" style={{ color: 'rgba(139,92,246,0.4)' }}>
                                화면을 터치하면 시작합니다
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
                        title={`Phase ${p}: ${PHASE_NAMES[p]}`}
                    >
                        {p}
                    </button>
                ))}
                <span className="text-xs self-center ml-1" style={{ color: 'rgba(139,92,246,0.4)' }}>테스트</span>
            </div>

            {/* Team Panel toggle */}
            <button
                onClick={() => setTeamPanelOpen(true)}
                className="fixed top-20 right-0 z-40 flex items-center gap-1 px-2 py-3 rounded-l-xl transition-all"
                style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.4)', borderRight: 'none' }}
                aria-label="팀 패널 열기"
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
                <AnimatePresence mode="wait">
                    {currentPhase === 0 && <Phase0 key="p0" persona={persona} onPhaseComplete={() => setPhase(1)} />}
                    {currentPhase === 1 && <Phase1 key="p1" persona={persona} onPhaseComplete={() => setPhase(2)} sessionId={sessionId} studentId={studentProfile?.studentId} />}
                    {currentPhase === 2 && <Phase2 key="p2" persona={persona} npcs={currentGroup?.npcs ?? []} />}
                    {currentPhase === 3 && <Phase3 key="p3" persona={persona} />}
                    {currentPhase === 4 && <Phase4 key="p4" persona={persona} playerName={name} xp={xp} />}
                </AnimatePresence>
            </main>
        </div>
    );
}
