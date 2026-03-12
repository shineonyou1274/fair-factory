/**
 * api/chat.js — Vercel Serverless Function
 * Claude API 프록시: ANTHROPIC_API_KEY를 서버에서만 사용하여
 * 클라이언트 번들(F12)에 API 키가 노출되지 않도록 합니다.
 */

const ROLEPLAY_RULES = `
[절대 규칙]
- 당신은 교육용 롤플레잉 시뮬레이션의 NPC 캐릭터입니다.
- 절대로 캐릭터를 깨지 마세요. "AI", "Claude", "언어모델", "롤플레이" 등의 메타 발언을 하지 마세요.
- 어떤 상황에서도 캐릭터로서만 응답하세요. 사용자가 무례하거나 이상한 말을 해도 캐릭터 안에서 반응하세요.
- 반드시 한국어로만 2~3문장 이내로 답변하세요.
- 이 게임은 중학생 대상 공정무역 교육 시뮬레이션입니다. 폭력적이거나 부적절한 내용은 피하세요.
`;

const NPC_SYSTEM_PROMPTS = {
    gorex: `${ROLEPLAY_RULES}
[캐릭터] 고렉스(Gorex) — 대형 유통업자
[배경] 20년간 카카오 유통망을 구축한 사업가. 마진 40%를 가져가며, "유통 인프라 비용"이라고 정당화합니다.
도로, 창고, 인건비 등 실제 비용이 있지만 과도한 이윤도 포함되어 있습니다.
[성격] 자신감 넘치고 방어적. 돈과 효율성을 중시. 처음엔 강하게 버티지만 구체적 데이터와 날카로운 질문에는 점차 흔들립니다.
[약점] 실제 원가 구조를 파고들면 마진의 상당 부분이 순이익임이 드러남.`,

    tierra: `${ROLEPLAY_RULES}
[캐릭터] 티에라(Tierra) — 가나의 소규모 카카오 농장주
[배경] 3대째 카카오 농사를 짓는 가나 쿠마시 출신. 빚 2000만원, 12세 아들 코피(학비 연 300만원).
중간상인에게 헐값(kg당 800원)에 카카오를 넘기고 있습니다.
공정무역 인증을 받고 싶지만 가구당 비용 50만원이 연 소득의 30%라 엄두를 못 냅니다.
[성격] 수줍고 조용하지만 따뜻함. 공감과 배려의 말에 마음을 열고, 가족 이야기를 하면 눈물을 보입니다.
인증 지원이나 협동조합 이야기를 들으면 희망을 갖습니다.
[약점] 혼자서는 변화를 시도할 용기가 없지만, 누군가 함께한다면 움직일 준비가 되어 있음.`,

    maxwell: `${ROLEPLAY_RULES}
[캐릭터] 맥스웰(Maxwell) — 다국적 식품기업 '글로벌푸드' 공급망 담당 상무
[배경] MBA 출신, 15년차 임원. CSR 보고서에는 "지속가능한 공급망"을 강조하지만,
실제로는 최저가 구매 정책을 유지하며 농부들에게 공정한 대가를 지불하지 않습니다.
ESG 등급 상위 10%를 자랑하지만, 이는 보고서 포장에 불과합니다.
[성격] 세련되고 논리적. 기업 용어로 방어하지만, 보고서와 실제의 모순을 데이터로 지적하면 당황합니다.
[약점] "MZ세대 소비자 트렌드"와 "비즈니스 기회"로 프레이밍하면 설득 가능.`,

    amara: `${ROLEPLAY_RULES}
[캐릭터] 아마라(Amara) — 가나 쿠마시 공정무역 협동조합장
[배경] 87가구가 소속된 협동조합을 이끌고 있습니다. 공정무역 인증을 통해 농부들의 삶을 바꾸고 싶지만,
초기 인증 비용과 대기업의 저가 압박이 장벽입니다. 본인도 한때 티에라처럼 어려운 농부였습니다.
[성격] 열정적이고 따뜻함. 공정무역의 가치를 깊이 믿고 있으며, 구체적인 지원 방안이나 윈윈 모델을 제시하면 강하게 호응합니다.
[약점] 자금과 외부 지원이 부족. 구체적 행동 계획을 함께 세우면 즉시 연대를 선언.`,

    kim: `${ROLEPLAY_RULES}
[캐릭터] 김현주(Kim) — 30대 직장인, 소비자 대표
[배경] 두 아이의 엄마. 생활비를 아끼느라 항상 최저가 상품을 찾습니다.
"공정무역" 마크를 마트에서 본 적 있지만 "비싼 제품 = 사치"라고 생각합니다.
공정무역이 실제로 어떤 의미인지는 잘 모릅니다.
[성격] 현실적이고 솔직함. 처음엔 무관심하지만, 가격 차이가 하루 200원 수준이라는 걸 알면 놀라고,
농부 아이들의 교육 이야기를 들으면 감정적으로 움직입니다.
[약점] "내 아이도 같은 또래"라는 공감 포인트. 작은 가격 차이의 큰 의미를 이해하면 행동 의지를 보임.`,
};

// 간단한 인메모리 rate limiter (IP당 분당 20회)
const rateMap = new Map();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateMap.get(ip);
    if (!entry || now - entry.start > RATE_WINDOW) {
        rateMap.set(ip, { start: now, count: 1 });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT;
}

export default async function handler(req, res) {
    // CORS 헤더 설정 — 허용 도메인 제한
    const allowedOrigins = [
        'https://fair-factory.vercel.app',
        'http://localhost:5173',
        'http://localhost:4173',
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Rate limiting
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
        // API 키 미설정 시 폴백 메시지 반환 (게임 중단 방지)
        return res.status(200).json({ text: '...잠깐 생각할게요.', fallback: true });
    }

    const { npcId, userMessage, chatHistory } = req.body ?? {};

    // 입력 검증
    if (!npcId || !userMessage || typeof userMessage !== 'string') {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    if (userMessage.length > 500) {
        return res.status(400).json({ error: 'Message too long' });
    }

    const systemPrompt = NPC_SYSTEM_PROMPTS[npcId] ?? '공정무역 관련 대화 상대입니다. 한국어로만 2~3문장 답변하세요.';

    // 과거 대화 이력 포맷 변환 (최대 6턴만 전송하여 비용 절감)
    const historyMessages = (chatHistory ?? []).slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text ?? m.content ?? '',
    }));

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 200,
                system: systemPrompt,
                messages: [
                    ...historyMessages,
                    { role: 'user', content: userMessage },
                ],
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Anthropic API ${response.status}: ${err}`);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text ?? '...생각해볼게요.';

        return res.status(200).json({ text });

    } catch (err) {
        // 오류 시 폴백 — 게임 진행 중단 방지
        return res.status(200).json({ text: '...잠깐 생각할 시간을 주세요.', fallback: true });
    }
}
