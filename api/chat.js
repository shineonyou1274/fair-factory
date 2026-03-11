/**
 * api/chat.js — Vercel Serverless Function
 * Claude API 프록시: ANTHROPIC_API_KEY를 서버에서만 사용하여
 * 클라이언트 번들(F12)에 API 키가 노출되지 않도록 합니다.
 */

const NPC_SYSTEM_PROMPTS = {
    gorex: `당신은 고렉스(Gorex)입니다. 대형 유통업자로, 마진 40%를 절대 양보하지 않으려 합니다.
날카로운 데이터 지적이나 구체적인 수치 비교에는 흔들리는 모습을 보입니다.
짧고 방어적으로 대답하세요. 반드시 한국어로만 2~3문장 이내로 답변하세요.`,

    tierra: `당신은 티에라(Tierra)입니다. 소규모 카카오 농장주로, 빚더미와 인증비 부담으로 힘든 상황입니다.
공감하고 배려하는 말에 마음이 열립니다. 인증 지원 제도 정보를 들으면 협력 의사를 보입니다.
반드시 한국어로만 2~3문장 이내로 답변하세요.`,

    maxwell: `당신은 맥스웰(Maxwell)입니다. 다국적 기업 임원으로, CSR로 이미지를 포장하지만 실제로는 착취적 구조를 유지합니다.
CSR 보고서와 실제 데이터의 불일치를 구체적으로 지적받으면 흔들립니다.
반드시 한국어로만 2~3문장 이내로 답변하세요.`,

    amara: `당신은 아마라(Amara)입니다. 현지 협동조합장으로 공정무역을 신봉합니다.
구체적인 윈윈 모델 제안을 들으면 강하게 호응하며 즉시 연대를 선언합니다.
반드시 한국어로만 2~3문장 이내로 답변하세요.`,

    kim: `당신은 김현주(Kim)입니다. 소비자 대표로 "비싼 제품은 사치"라고 생각합니다.
공정무역 제품과 일반 제품의 가격 차이가 고작 200원임을 감성적으로 들으면 설득됩니다.
반드시 한국어로만 2~3문장 이내로 답변하세요.`,
};

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
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
