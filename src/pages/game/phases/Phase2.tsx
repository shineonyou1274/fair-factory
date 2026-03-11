import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, CheckCircle, Lock, Timer } from 'lucide-react';
import type { NpcCharacter } from '@/types';

const MAX_ROUNDS = 5;      // NPC당 최대 발언 횟수
const TIMER_SECONDS = 60;  // NPC당 대화 제한 시간(초)

interface Props { persona: string; npcs: NpcCharacter[]; }

// Persona action card config
const ACTION_CARDS: Record<string, { label: string; emoji: string; color: string; prompt: string }> = {
    Alpha: { label: '데이터 스캔', emoji: '📊', color: '#38bdf8', prompt: '[데이터 스캔] 방금 말씀하신 수치의 출처가 어디인가요? 저희가 조사한 바에 따르면...' },
    Delta: { label: '중재 선언', emoji: '🕊️', color: '#06d6a0', prompt: '[중재 선언] 잠깐, 양측의 입장을 모두 이해합니다. 공통점을 찾아봅시다...' },
    Omega: { label: '대안 제안', emoji: '💡', color: '#a78bfa', prompt: '[대안 제안] 제로섬이 아닌 방법이 있습니다. 협동조합 모델에서 힌트를 얻으면...' },
    Lambda: { label: '힐링 버프', emoji: '💚', color: '#fb923c', prompt: '[힐링 버프] 우리 팀의 협력 정신을 믿습니다. 함께라면 반드시 해결할 수 있어요.' },
    Sigma: { label: '급소 질문', emoji: '⚡', color: '#f43f5e', prompt: '[급소 질문] CSR 보고서에는 공정무역 인증을 추진한다고 했는데, 실제로는 왜...' },
};

const NPC_IMG: Record<string, string> = {
    gorex: '/npcs/gorex.png', tierra: '/npcs/tierra.png',
    maxwell: '/npcs/maxwell.png', amara: '/npcs/amara.png', kim: '/npcs/kim.png',
};

// ─── NPC Response Generator (mock AI) ────────────────────────
function generateNpcResponse(npc: NpcCharacter, userMsg: string, persona: string): string {
    const lower = userMsg.toLowerCase();
    const hasChallenge = lower.includes('왜') || lower.includes('어떻게') || lower.includes('출처') || lower.includes('실제');
    const hasEmpathy = lower.includes('이해') || lower.includes('함께') || lower.includes('어렵') || lower.includes('힘드');
    const hasAlternative = lower.includes('대안') || lower.includes('방법') || lower.includes('협동') || lower.includes('윈윈');

    if (npc.id === 'gorex') {
        if (persona === 'Sigma' && hasChallenge) return '흠... 그 부분은 제가 잘못 말씀드렸군요. 마진 구조에 대해 좀 더 투명하게 설명해드리겠습니다. 사실 우리도 압박이 심합니다만...';
        return '싼 가격이 소비자를 위한 겁니다! 유통 비용이 얼마나 드는지 아세요? 우리도 남는 게 없어요.';
    }
    if (npc.id === 'tierra') {
        if (hasEmpathy) return '...감사해요. 사실 인증 비용 때문에 공정무역에 가입하고 싶어도 못 하고 있어요. 지원 제도가 있다면 정말 해보고 싶습니다.';
        return '우리 가족은 이 농장 하나로 먹고살아요. 빚도 많고... 어쩔 수 없이 싸게 팔 수밖에 없어요.';
    }
    if (npc.id === 'maxwell') {
        if (persona === 'Sigma') return '(목소리가 떨림) 그... 그 데이터는 구체적인 맥락이 필요합니다. 우리 기업도 지속가능성을 위해 많은 투자를 하고 있습니다!';
        return '저희는 글로벌 공급망의 효율화를 추구합니다. CSR 활동도 열심히 하고 있고요. 주주 기대치를 충족시키는 건 기업의 의무입니다.';
    }
    if (npc.id === 'amara') {
        if (hasAlternative) return '바로 그겁니다! 우리 협동조합이 원하는 게 그거예요. 농장주들을 설득하고 인증 비용 지원만 있으면 가능해요. 함께 해봅시다!';
        return '공정무역은 단순한 가격 문제가 아니에요. 존엄성의 문제입니다. 우리 농부들도 자녀를 학교에 보내고 싶거든요.';
    }
    if (npc.id === 'kim') {
        if (hasEmpathy || persona === 'Lambda') return '...200원 차이라고요? 생각해보니 하루 커피 값도 안 되네요. 그 차이가 아이들 교육비라면 저도 충분히 낼 수 있을 것 같아요.';
        return '저도 나쁜 건 아니에요. 그냥 비싼 건 살 수 없는 거잖아요. 가격이 오르면 서민들은 어쩌라고요?';
    }
    return '...생각해볼게요.';
}

// ─── Chat Bubble ──────────────────────────────────────────────
function ChatBubble({ msg }: { msg: { role: 'user' | 'npc'; text: string; persona?: string; npcName?: string; npcEmoji?: string; color?: string; timestamp: number } }) {
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex items-end gap-2 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${msg.color}25`, border: `1px solid ${msg.color}40` }}>
                    {msg.npcEmoji}
                </div>
            )}
            <div className="max-w-xs sm:max-w-sm">
                {!isUser && <div className="text-xs mb-1 ml-1" style={{ color: msg.color }}>{msg.npcName}</div>}
                <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                    style={{
                        background: isUser ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'rgba(255,255,255,0.06)',
                        color: isUser ? '#fff' : '#e2e8f0',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                    {msg.text}
                </div>
            </div>
        </motion.div>
    );
}

// ─── NPC Selector ────────────────────────────────────────────
function NpcSelector({ npcs, selected, onSelect }: { npcs: NpcCharacter[]; selected: string; onSelect: (id: string) => void; }) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {npcs.map(npc => {
                const selected_ = selected === npc.id;
                return (
                    <motion.button key={npc.id} whileTap={{ scale: 0.95 }} onClick={() => onSelect(npc.id)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl flex-shrink-0 transition-all"
                        style={{
                            background: selected_ ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                            border: selected_ ? '1.5px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.08)',
                            minWidth: 72,
                        }}>
                        <div className="relative">
                            <img src={NPC_IMG[npc.id]} alt={npc.name}
                                className="w-10 h-10 rounded-full object-cover relative z-10"
                                onError={e => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
                                }}
                            />
                            <div hidden className="w-10 h-10 rounded-full flex items-center justify-center text-xl absolute inset-0"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                {npc.emoji}
                            </div>
                            {npc.isPersuaded && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                    style={{ background: '#06d6a0' }}>
                                    <CheckCircle size={10} color="#fff" />
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-medium text-white whitespace-nowrap">{npc.name}</span>
                        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-full rounded-full transition-all"
                                style={{ width: `${npc.trustLevel}%`, background: npc.isPersuaded ? '#06d6a0' : '#f5a623' }} />
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
}

// ─── Phase 2 Main ─────────────────────────────────────────────
export default function Phase2({ persona, npcs: initNpcs }: Props) {
    const defaultNpcs: NpcCharacter[] = [
        { id: 'gorex',   name: '고렉스', role: '대형 유통업자',     emoji: '😈', hiddenAgenda: '', weakness: '', trustLevel: 20, isPersuaded: false },
        { id: 'tierra',  name: '티에라', role: '소규모 농장주',     emoji: '😔', hiddenAgenda: '', weakness: '', trustLevel: 40, isPersuaded: false },
        { id: 'maxwell', name: '맥스웰', role: '다국적 기업 임원',  emoji: '🏢', hiddenAgenda: '', weakness: '', trustLevel: 15, isPersuaded: false },
        { id: 'amara',   name: '아마라', role: '현지 협동조합장',   emoji: '🌱', hiddenAgenda: '', weakness: '', trustLevel: 65, isPersuaded: false },
        { id: 'kim',     name: '김현주', role: '소비자 대표',       emoji: '🛒', hiddenAgenda: '', weakness: '', trustLevel: 35, isPersuaded: false },
    ];
    const [npcs, setNpcs] = useState<NpcCharacter[]>(initNpcs.length ? initNpcs : defaultNpcs);
    const [selectedNpc, setSelectedNpc] = useState<string>(npcs[0]?.id ?? 'gorex');
    const [messages, setMessages] = useState<Record<string, any[]>>({});
    const [input, setInput] = useState('');
    const [actionUsed, setActionUsed] = useState(false);
    const [sending, setSending] = useState(false);
    // 라운드 제한: NPC별 남은 발언 횟수
    const [npcRounds, setNpcRounds] = useState<Record<string, number>>(
        () => Object.fromEntries((initNpcs.length ? initNpcs : defaultNpcs).map(n => [n.id, MAX_ROUNDS]))
    );
    // 타이머
    const [timer, setTimer] = useState(TIMER_SECONDS);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const npc = npcs.find(n => n.id === selectedNpc)!;
    const chatHistory = messages[selectedNpc] ?? [];
    const action = ACTION_CARDS[persona];
    const persuadeCount = npcs.filter(n => n.isPersuaded).length;
    const roundsLeft = npcRounds[selectedNpc] ?? 0;
    const isExhausted = roundsLeft <= 0 && !npc?.isPersuaded;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // NPC 전환 시 타이머 리셋
    const handleTimerExpired = useCallback(() => {
        const notPersuaded = npcs.filter(n => !n.isPersuaded && n.id !== selectedNpc);
        if (notPersuaded.length > 0) {
            setMessages(prev => ({
                ...prev,
                [selectedNpc]: [
                    ...(prev[selectedNpc] ?? []),
                    { role: 'npc', text: '⏰ 시간이 초과됐습니다. 다음 대화 상대로 이동합니다.', npcName: '시스템', npcEmoji: '⏰', color: '#f43f5e', timestamp: Date.now() },
                ],
            }));
            setTimeout(() => setSelectedNpc(notPersuaded[0].id), 1200);
        }
    }, [npcs, selectedNpc]);

    useEffect(() => {
        setTimer(TIMER_SECONDS);
        if (timerRef.current) clearInterval(timerRef.current);
        if (isExhausted || npc?.isPersuaded) return;

        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleTimerExpired();
                    return TIMER_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [selectedNpc]);

    // Init NPC greeting
    useEffect(() => {
        if (!messages[selectedNpc]) {
            const greetings: Record<string, string> = {
                gorex: '어서오세요. 뭘 원하시는 겁니까? 바쁜 사람이에요.',
                tierra: '...(고개를 숙인 채) 안녕하세요.',
                maxwell: '우리 기업의 공급망 최적화 전략에 대해 이야기할 준비가 되어 있습니다.',
                amara: '반가워요! 공정무역에 대해 이야기나눠봐요. 우리 농부들 이야기를 들어줄 사람이 필요했어요.',
                kim: '저는 그냥 소비잔데요... 뭘 얘기하려고요?',
            };
            setMessages(prev => ({
                ...prev,
                [selectedNpc]: [{ role: 'npc', text: greetings[selectedNpc] ?? '...', npcName: npc?.name, npcEmoji: npc?.emoji, color: '#a78bfa', timestamp: Date.now() }],
            }));
        }
    }, [selectedNpc]);

    function updateNpcTrust(npcId: string, delta: number) {
        setNpcs(prev => prev.map(n => {
            if (n.id !== npcId) return n;
            const newLevel = Math.max(0, Math.min(100, n.trustLevel + delta));
            return { ...n, trustLevel: newLevel, isPersuaded: newLevel >= 80 };
        }));
    }

    async function sendMessage(text: string) {
        if (!text.trim() || sending || roundsLeft <= 0) return;
        setSending(true);
        const currentHistory = messages[selectedNpc] ?? [];
        const userMsg = { role: 'user' as const, text, persona, timestamp: Date.now() };
        setMessages(prev => ({ ...prev, [selectedNpc]: [...currentHistory, userMsg] }));
        setInput('');
        // 라운드 차감
        setNpcRounds(prev => ({ ...prev, [selectedNpc]: (prev[selectedNpc] ?? MAX_ROUNDS) - 1 }));

        let response: string;
        try {
            // Claude API 프록시 호출
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    npcId: selectedNpc,
                    userMessage: text,
                    persona,
                    chatHistory: currentHistory.slice(-6).map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text })),
                }),
            });
            const data = await res.json();
            response = data.text ?? generateNpcResponse(npc, text, persona);
        } catch {
            // 네트워크 오류 시 로컬 폴백
            await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
            response = generateNpcResponse(npc, text, persona);
        }

        const delta = text.length > 30 ? 8 : text.length > 15 ? 4 : 2;
        updateNpcTrust(selectedNpc, delta);

        const npcMsg = { role: 'npc' as const, text: response, npcName: npc.name, npcEmoji: npc.emoji, color: '#a78bfa', timestamp: Date.now() };
        setMessages(prev => ({ ...prev, [selectedNpc]: [...(prev[selectedNpc] ?? []), npcMsg] }));
        setSending(false);
    }

    function useActionCard() {
        if (actionUsed) return;
        setActionUsed(true);
        sendMessage(action.prompt);
        updateNpcTrust(selectedNpc, persona === 'Sigma' ? 15 : 10);
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col max-w-3xl mx-auto px-4 py-6">

            {/* Header */}
            <div className="text-center mb-5">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(6,214,160,0.15)', border: '1px solid rgba(6,214,160,0.3)', color: '#06d6a0' }}>
                    Phase 2 · 지혜의 토론
                </span>
                <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                    <span style={{ color: 'rgba(196,181,253,0.6)' }}>설득 현황:</span>
                    <strong style={{ color: '#fbbf24' }}>{persuadeCount}/5</strong>
                    <span style={{ color: 'rgba(196,181,253,0.4)' }}>— 3명 이상 설득 시 Phase 3 진입</span>
                </div>
            </div>

            {/* NPC Selector */}
            <div className="mb-3">
                <NpcSelector npcs={npcs} selected={selectedNpc} onSelect={setSelectedNpc} />
            </div>

            {/* NPC 공략 힌트 */}
            {npc && (
                <div className="mb-3 rounded-xl px-4 py-3 text-xs"
                    style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    <div className="flex items-start gap-3">
                        <div>
                            <span className="font-bold text-white">{npc.emoji} {npc.name}</span>
                            <span className="ml-2" style={{ color: 'rgba(167,139,250,0.5)' }}>{npc.role}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
                            {/* 타이머 */}
                            {!npc.isPersuaded && !isExhausted && (
                                <div className="flex items-center gap-1 text-xs font-mono"
                                    style={{ color: timer <= 10 ? '#f43f5e' : 'rgba(196,181,253,0.5)' }}>
                                    <Timer size={11} />
                                    {String(timer).padStart(2, '0')}s
                                </div>
                            )}
                            {/* 라운드 카운터 */}
                            {!npc.isPersuaded && (
                                <div className="text-xs" style={{ color: roundsLeft <= 1 ? '#f43f5e' : 'rgba(196,181,253,0.4)' }}>
                                    {roundsLeft}/{MAX_ROUNDS} 라운드
                                </div>
                            )}
                            <span style={{ color: npc.isPersuaded ? '#06d6a0' : '#fbbf24' }}>
                                {npc.isPersuaded ? '✅ 설득 완료' : `신뢰도 ${npc.trustLevel}%`}
                            </span>
                        </div>
                    </div>
                    <div className="mt-2" style={{ color: 'rgba(196,181,253,0.6)' }}>
                        {{
                            gorex: '💡 날카로운 질문(Sigma)이나 구체적 데이터 제시에 반응합니다. 이익 구조를 지적하면 효과적!',
                            tierra: '💡 공감과 배려의 말(Lambda/Delta)이 효과적입니다. 실질적인 해결책을 제안해보세요.',
                            maxwell: '💡 CSR 보고서와 실제 행동의 모순을 지적하면 흔들립니다. 데이터로 압박하세요.',
                            amara: '💡 공정무역 확장 방법과 구체적 지원 방안을 제시하면 강하게 호응합니다.',
                            kim: '💡 소비자 입장에서 공감하되, 작은 가격 차이의 큰 의미를 설명해보세요.',
                        }[npc.id] ?? '상대방의 말을 잘 듣고 핵심을 짚어보세요.'}
                    </div>
                </div>
            )}

            {/* Chat area */}
            <div className="flex-1 rounded-2xl p-4 overflow-y-auto mb-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', minHeight: 320, maxHeight: 420 }}>
                {chatHistory.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
                {sending && (
                    <div className="flex items-center gap-2 text-xs mb-4" style={{ color: 'rgba(167,139,250,0.5)' }}>
                        <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#a78bfa', animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                        {npc?.name} 이(가) 생각 중...
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Action Card */}
            <div className="flex items-center gap-3 mb-3">
                <motion.button
                    onClick={useActionCard}
                    disabled={actionUsed}
                    whileHover={actionUsed ? {} : { scale: 1.02 }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    style={{
                        background: actionUsed ? 'rgba(255,255,255,0.05)' : `${action?.color}20`,
                        border: `1px solid ${actionUsed ? 'rgba(255,255,255,0.1)' : action?.color + '50'}`,
                        color: actionUsed ? '#627290' : action?.color,
                    }}
                    title={actionUsed ? '이미 사용했습니다' : '전용 액션 카드 사용'}
                    aria-label={`전용 액션: ${action?.label}`}
                >
                    {actionUsed ? <Lock size={12} /> : <Zap size={12} />}
                    {action?.emoji} {action?.label}
                </motion.button>
                {actionUsed && <span className="text-xs" style={{ color: 'rgba(139,92,246,0.4)' }}>사용 완료 (1회/세션)</span>}
            </div>

            {/* 라운드 소진 안내 */}
            {isExhausted && (
                <div className="mb-2 px-4 py-2 rounded-xl text-xs text-center"
                    style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e' }}>
                    ⚠️ 이 NPC와의 라운드가 종료됐습니다. 다른 NPC와 대화하세요.
                </div>
            )}

            {/* Input */}
            <div className="flex gap-3">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                    placeholder={isExhausted ? '라운드 종료 — 다른 NPC를 선택하세요' : `${npc?.name}에게 메시지 보내기... (Enter로 전송)`}
                    disabled={isExhausted || npc?.isPersuaded}
                    className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#f0f0f5' }}
                    onFocus={e => { if (!isExhausted) e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; }}
                    aria-label="NPC에게 메시지 입력"
                />
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || sending || isExhausted || npc?.isPersuaded}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
                    aria-label="메시지 전송"
                >
                    <Send size={16} color="#fff" />
                </motion.button>
            </div>

            {/* Persuade complete banner */}
            <AnimatePresence>
                {persuadeCount >= 3 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-4 rounded-2xl p-4 text-center"
                        style={{ background: 'rgba(6,214,160,0.12)', border: '1px solid rgba(6,214,160,0.35)' }}>
                        <div className="text-2xl mb-1">🎉</div>
                        <p className="font-black text-white text-sm">3명 이상 설득 완료!</p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(6,214,160,0.8)' }}>선생님이 Phase 3으로 넘겨주실 때까지 대화를 계속하세요.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
