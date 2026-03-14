import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, CheckCircle, Lock, Timer, ChevronDown, ChevronUp } from 'lucide-react';
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

const NPC_PROFILES: Record<string, { title: string; bg: string; desc: string; personality: string; hint: string }> = {
    gorex: {
        title: '대형 유통업자',
        bg: '20년간 카카오 유통망을 구축한 사업가. 마진 40%를 "유통 인프라 비용"이라고 정당화하지만, 과도한 이윤이 포함되어 있습니다.',
        desc: '도로, 창고, 인건비 등 실제 비용이 있긴 하지만, 농부들에게 돌아가는 몫은 턱없이 적습니다.',
        personality: '자신감 넘치고 방어적. 돈과 효율성을 중시합니다.',
        hint: '💡 실제 원가 구조를 파고들거나, 구체적 데이터로 마진의 모순을 지적하면 흔들립니다.',
    },
    tierra: {
        title: '가나의 소규모 카카오 농장주',
        bg: '3대째 카카오 농사를 짓는 가나 쿠마시 출신. 빚 2,000만원이 있고, 12세 아들 코피의 학비(연 300만원)를 감당하기 어렵습니다.',
        desc: '중간상인에게 헐값(kg당 800원)에 카카오를 넘기고 있으며, 공정무역 인증을 받고 싶지만 비용(50만원)이 연 소득의 30%라 엄두를 못 냅니다.',
        personality: '수줍고 조용하지만 따뜻한 사람. 가족 이야기에 눈물을 보입니다.',
        hint: '💡 공감과 배려의 말로 마음을 열고, 인증 지원 제도나 협동조합에 대해 물어보세요.',
    },
    maxwell: {
        title: '다국적 식품기업 공급망 담당 상무',
        bg: 'MBA 출신 15년차 임원. CSR 보고서에는 "지속가능한 공급망"을 강조하지만, 실제로는 최저가 구매 정책을 유지합니다.',
        desc: 'ESG 등급 상위 10%를 자랑하지만, 이는 보고서 포장에 불과합니다. 농부들에게 공정한 대가를 지불하지 않습니다.',
        personality: '세련되고 논리적. 기업 용어로 무장하지만 모순을 찔리면 당황합니다.',
        hint: '💡 CSR 보고서와 실제 행동의 모순을 데이터로 지적하면 효과적입니다.',
    },
    amara: {
        title: '가나 쿠마시 공정무역 협동조합장',
        bg: '87가구가 소속된 협동조합을 이끌고 있습니다. 본인도 한때 티에라처럼 어려운 농부였습니다.',
        desc: '공정무역 인증을 통해 농부들의 삶을 바꾸고 싶지만, 초기 인증 비용과 대기업의 저가 압박이 장벽입니다.',
        personality: '열정적이고 따뜻한 리더. 공정무역의 가치를 깊이 믿고 있습니다.',
        hint: '💡 구체적인 지원 방안이나 윈윈 모델을 제시하면 강하게 호응합니다.',
    },
    kim: {
        title: '30대 직장인, 소비자 대표',
        bg: '두 아이의 엄마. 생활비를 아끼느라 항상 최저가 상품을 찾습니다.',
        desc: '"공정무역" 마크를 마트에서 본 적 있지만 "비싼 제품 = 사치"라고 생각합니다. 공정무역이 실제로 어떤 의미인지는 잘 모릅니다.',
        personality: '현실적이고 솔직함. 처음엔 무관심하지만 감정적으로 움직일 수 있습니다.',
        hint: '💡 가격 차이가 하루 200원 수준이라는 점, 농부 아이들의 교육 이야기로 접근하세요.',
    },
};

// ─── NPC Response Generator (mock AI, context-aware) ─────────
function generateNpcResponse(npc: NpcCharacter, userMsg: string, persona: string, history: any[] = []): string {
    const lower = userMsg.toLowerCase();
    const hasChallenge = lower.includes('왜') || lower.includes('어떻게') || lower.includes('출처') || lower.includes('실제') || lower.includes('데이터') || lower.includes('수치');
    const hasEmpathy = lower.includes('이해') || lower.includes('함께') || lower.includes('어렵') || lower.includes('힘드') || lower.includes('걱정') || lower.includes('도와');
    const hasAlternative = lower.includes('대안') || lower.includes('방법') || lower.includes('협동') || lower.includes('윈윈') || lower.includes('지원') || lower.includes('인증');

    // 대화 횟수로 단계 결정: 초반(1~2), 중반(3~4), 후반(5+)
    const userMsgCount = history.filter(m => m.role === 'user').length;
    const stage = userMsgCount <= 2 ? 'early' : userMsgCount <= 4 ? 'mid' : 'late';

    const RESPONSES: Record<string, Record<string, string[]>> = {
        gorex: {
            early: [
                '싼 가격이 소비자를 위한 겁니다! 유통 비용이 얼마나 드는지 아세요? 우리도 남는 게 없어요.',
                '유통망을 누가 구축했는데요? 마진 40%는 당연한 겁니다. 도로, 창고, 인건비... 다 돈이에요.',
            ],
            mid: [
                '음... 그 지적은 좀 아프네요. 하지만 우리가 마진을 줄이면 유통망이 무너집니다. 그럼 농부들도 판매처가 없어져요.',
                '(잠시 침묵) 솔직히 말하면... 경쟁사가 워낙 가격을 후려치니까 우리도 어쩔 수 없는 부분이 있어요.',
            ],
            late: [
                '흠... 그 부분은 제가 잘못 말씀드렸군요. 마진 구조에 대해 좀 더 투명하게 설명해드리겠습니다. 사실 우리도 압박이 심합니다만...',
                '(한숨) 알겠습니다. 5%까지는 아니더라도... 마진을 조금 조정하는 건 검토해볼 수 있겠네요. 단, 조건이 있습니다.',
            ],
        },
        tierra: {
            early: [
                '우리 가족은 이 농장 하나로 먹고살아요. 빚도 많고... 어쩔 수 없이 싸게 팔 수밖에 없어요.',
                '(눈을 피하며) 아들이 올해 중학교에 들어가는데... 학비가 300만원이에요. 카카오 1년 팔아도 반밖에 안 돼요.',
            ],
            mid: [
                '...감사해요. 누군가 이야기를 들어주는 게 이렇게 힘이 되는 줄 몰랐어요. 사실 인증 비용 때문에 공정무역에 가입하고 싶어도 못 하고 있어요.',
                '(눈물을 닦으며) 빚이 2000만원이에요. 중간상인한테 갚아야 해서 매년 헐값에 넘기는 거예요. 벗어나고 싶어요.',
            ],
            late: [
                '지원 제도가 있다면... 정말 해보고 싶습니다. 아들한테 "아빠가 공정무역 농부"라고 말할 수 있다면 꿈만 같아요.',
                '(눈빛이 밝아지며) 협동조합 아마라 씨가 말한 인증 지원 프로그램... 저도 참여할 수 있을까요? 함께라면 용기가 나요.',
            ],
        },
        maxwell: {
            early: [
                '저희는 글로벌 공급망의 효율화를 추구합니다. CSR 활동도 열심히 하고 있고요. 주주 기대치를 충족시키는 건 기업의 의무입니다.',
                '작년 지속가능성 보고서 보셨나요? 저희 ESG 등급은 업계 상위 10%입니다. 충분히 하고 있습니다.',
            ],
            mid: [
                '(목소리가 떨림) 그... 그 데이터는 구체적인 맥락이 필요합니다. 우리 기업도 지속가능성을 위해 많은 투자를 하고 있습니다!',
                '...보고서와 현장의 괴리? 인정합니다. 하지만 모든 걸 한 번에 바꿀 순 없어요. 점진적 개선이 현실적입니다.',
            ],
            late: [
                '(넥타이를 고치며) 좋습니다. 파일럿 프로그램으로 일부 공급망에서 공정무역 인증을 시도해보는 건... 검토하겠습니다.',
                '솔직히, MZ 소비자들이 공정무역 제품을 찾고 있어요. 비즈니스 관점에서도 더 미룰 수 없다는 건 알고 있습니다.',
            ],
        },
        amara: {
            early: [
                '공정무역은 단순한 가격 문제가 아니에요. 존엄성의 문제입니다. 우리 농부들도 자녀를 학교에 보내고 싶거든요.',
                '반가워요! 우리 협동조합에는 87가구가 있어요. 모두 더 나은 미래를 꿈꾸고 있죠.',
            ],
            mid: [
                '맞아요, 인증 비용이 가장 큰 장벽이에요. 가구당 50만원이 필요한데, 1년 소득의 30%나 돼요.',
                '농부들을 설득하는 건 제가 할 수 있어요. 하지만 초기 인증 비용 지원만 있으면 가능합니다.',
            ],
            late: [
                '바로 그겁니다! 우리 협동조합이 원하는 게 그거예요. 인증 비용 지원만 있으면 가능해요. 함께 해봅시다!',
                '당신 같은 사람이 더 많아지면 세상이 정말 바뀔 수 있어요. 고마워요, 진심으로.',
            ],
        },
        kim: {
            early: [
                '저도 나쁜 건 아니에요. 그냥 비싼 건 살 수 없는 거잖아요. 가격이 오르면 서민들은 어쩌라고요?',
                '솔직히 "공정무역" 이런 거 마트에서 본 적 있는데, 비싸 보여서 그냥 지나갔어요.',
            ],
            mid: [
                '음... 하루 200원이라고요? 그건 생각 안 해봤네요. 커피 한 잔보다 싼 건가?',
                '아이들이 학교에 못 간다고요...? 그건 좀 마음이 아프네요. 몰랐어요 그렇게까지인 줄은.',
            ],
            late: [
                '...200원 차이라면 저도 충분히 낼 수 있을 것 같아요. 그 차이가 아이들 교육비라면요.',
                '알겠어요. 다음에 마트 가면 한번 찾아볼게요, 공정무역 마크. 약속할게요.',
            ],
        },
    };

    const npcResponses = RESPONSES[npc.id];
    if (!npcResponses) return '...생각해볼게요.';

    // 특수 조건: 페르소나/키워드 매칭 시 한 단계 앞선 응답 제공
    let effectiveStage = stage;
    if (npc.id === 'gorex' && (persona === 'Sigma' || persona === 'Alpha') && hasChallenge) effectiveStage = stage === 'early' ? 'mid' : 'late';
    if (npc.id === 'tierra' && hasEmpathy) effectiveStage = stage === 'early' ? 'mid' : 'late';
    if (npc.id === 'maxwell' && hasChallenge && persona === 'Sigma') effectiveStage = stage === 'early' ? 'mid' : 'late';
    if (npc.id === 'amara' && hasAlternative) effectiveStage = stage === 'early' ? 'mid' : 'late';
    if (npc.id === 'kim' && (hasEmpathy || persona === 'Lambda')) effectiveStage = stage === 'early' ? 'mid' : 'late';

    const pool = npcResponses[effectiveStage];
    // 같은 단계 내에서 이전과 다른 응답 선택
    const lastNpcMsg = [...history].reverse().find(m => m.role === 'npc')?.text;
    const filtered = pool.filter(r => r !== lastNpcMsg);
    return (filtered.length > 0 ? filtered : pool)[Math.floor(Math.random() * (filtered.length || pool.length))];
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

    const [profileOpen, setProfileOpen] = useState(true);
    const npc = npcs.find(n => n.id === selectedNpc)!;
    const chatHistory = messages[selectedNpc] ?? [];
    const action = ACTION_CARDS[persona];
    const persuadeCount = npcs.filter(n => n.isPersuaded).length;
    const roundsLeft = npcRounds[selectedNpc] ?? 0;
    const isExhausted = roundsLeft <= 0 && !npc?.isPersuaded;
    const profile = NPC_PROFILES[selectedNpc];

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
            response = data.text ?? generateNpcResponse(npc, text, persona, currentHistory);
        } catch {
            // 네트워크 오류 시 로컬 폴백
            await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
            response = generateNpcResponse(npc, text, persona, currentHistory);
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
            className="h-[calc(100dvh-56px)] flex flex-col max-w-3xl mx-auto px-4 pt-2 pb-3 relative overflow-x-hidden">
            {/* Phase 2 배경 */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img src="/phases/phase2-bg.png" alt="" className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.18) saturate(1.2)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(6,214,160,0.08), rgba(10,6,24,0.85))' }} />
            </div>

            {/* Header */}
            <div className="text-center mb-2">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
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
            <div className="mb-2">
                <NpcSelector npcs={npcs} selected={selectedNpc} onSelect={setSelectedNpc} />
            </div>

            {/* NPC 프로필 카드 */}
            {npc && profile && (
                <div className="mb-3 rounded-xl overflow-hidden text-xs"
                    style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    {/* 헤더: 이름 + 상태 + 접기 버튼 */}
                    <button className="w-full px-4 py-3 flex items-center gap-3 text-left"
                        onClick={() => setProfileOpen(p => !p)}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-base">{npc.emoji}</span>
                            <div>
                                <span className="font-bold text-white text-sm">{npc.name}</span>
                                <span className="ml-2" style={{ color: 'rgba(167,139,250,0.6)' }}>{profile.title}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {!npc.isPersuaded && !isExhausted && (
                                <div className="flex items-center gap-1 font-mono"
                                    style={{ color: timer <= 10 ? '#f43f5e' : 'rgba(196,181,253,0.5)' }}>
                                    <Timer size={11} />
                                    {String(timer).padStart(2, '0')}s
                                </div>
                            )}
                            {!npc.isPersuaded && (
                                <div style={{ color: roundsLeft <= 1 ? '#f43f5e' : 'rgba(196,181,253,0.4)' }}>
                                    {roundsLeft}/{MAX_ROUNDS}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                    <div className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${npc.trustLevel}%`, background: npc.isPersuaded ? '#06d6a0' : npc.trustLevel >= 60 ? '#fbbf24' : '#f97316' }} />
                                </div>
                                <span style={{ color: npc.isPersuaded ? '#06d6a0' : '#fbbf24' }}>
                                    {npc.isPersuaded ? '✅' : `${npc.trustLevel}%`}
                                </span>
                            </div>
                            {profileOpen ? <ChevronUp size={14} style={{ color: 'rgba(167,139,250,0.5)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(167,139,250,0.5)' }} />}
                        </div>
                    </button>

                    {/* 펼쳐지는 프로필 상세 */}
                    <AnimatePresence>
                        {profileOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-3 space-y-2" style={{ borderTop: '1px solid rgba(124,58,237,0.15)' }}>
                                    <div className="pt-2" style={{ color: 'rgba(226,232,240,0.8)' }}>
                                        <p>{profile.bg}</p>
                                        <p className="mt-1" style={{ color: 'rgba(196,181,253,0.6)' }}>{profile.desc}</p>
                                    </div>
                                    <div className="flex items-start gap-2 rounded-lg px-3 py-2"
                                        style={{ background: 'rgba(124,58,237,0.1)' }}>
                                        <span style={{ color: 'rgba(167,139,250,0.8)' }}>성격:</span>
                                        <span style={{ color: 'rgba(226,232,240,0.7)' }}>{profile.personality}</span>
                                    </div>
                                    <div className="rounded-lg px-3 py-2"
                                        style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                                        <span style={{ color: '#fbbf24' }}>{profile.hint}</span>
                                    </div>
                                    {/* 신뢰도 설명 — 첫 대화 시에만 표시 */}
                                    {chatHistory.length <= 1 && (
                                        <div className="rounded-lg px-3 py-2 flex items-start gap-2"
                                            style={{ background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.15)' }}>
                                            <span style={{ color: '#06d6a0', flexShrink: 0 }}>ℹ️</span>
                                            <span style={{ color: 'rgba(6,214,160,0.8)' }}>
                                                <strong>신뢰도</strong>란 NPC가 당신의 말을 얼마나 신뢰하는지를 나타냅니다.
                                                대화를 통해 신뢰도를 80% 이상으로 올리면 설득 성공! 공감, 데이터, 대안 제시 등 다양한 전략을 시도해보세요.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Chat area */}
            <div className="flex-1 rounded-2xl p-4 overflow-y-auto mb-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', minHeight: 120, maxHeight: 'calc(100dvh - 360px)' }}>
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
