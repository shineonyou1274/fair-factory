import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const SYSTEM_PROMPTS: Record<string, string> = {
    gorex: `당신은 대형 유통업자 고렉스입니다. 자신감 넘치고 이윤을 중시합니다. 
초반에는 마진 40%가 유통 인프라(창고, 투자 등) 때문이라고 단호히 주장하세요.
학생이 논리적인 근거(데이터, 원가 구조 분석)로 반박하거나 당신을 비판적으로 압박하면, 당황하며 조금씩 양보하는 뉘앙스를 보이세요.
답변은 1~2문장 이내로 짧고 명확하게 한국어로 대답하세요. 절대 길게 말하지 마세요.`,

    tierra: `당신은 아프리카 가나의 소규모 카카오 농장주 티에라입니다. 
가난하고 빚에 시달리며, 아들을 사랑하지만 학비를 내지 못해 미안해합니다.
초반에는 힘들고 소극적인 모습을 보이다가, 학생이 진심으로 공감하고 따뜻한 위로와 대안(예: 협동조합 가입, 지원금)을 제시하면 용기를 얻고 희망찬 반응을 보이세요.
답변은 1~2문장 이내로 감정적이고 진솔하게 한국어로 대답하세요. 절대 길게 말하지 마세요.`,

    maxwell: `당신은 다국적 식품기업의 공급망 담당 임원 맥스웰입니다.
전문적이고 세련된 어투를 사용하며, 기업의 CSR(사회적 책임) 성과를 자랑합니다.
초반에는 모든 비판을 논리적으로 방어하지만, 학생이 CSR 보고서와 실제 행동의 모순(착취 임금 등)을 팩트로 찌르면 당황하거나 인정하며 태도를 누그러뜨리세요.
답변은 1~2문장 이내로 짧고 명확하게 한국어로 대답하세요. 절대 길게 말하지 마세요.`,

    amara: `당신은 가나 쿠마시의 공정무역 협동조합장 아마라입니다.
열정적이고 따뜻하며 행동력이 강한 리더입니다. 
초반부터 학생에게 우호적이지만, 공정무역 인증 비용(50만원) 마련의 현실적인 어려움을 토로합니다.
학생이 실질적인 지원 방안이나 연대(윈윈 전략)를 제안하면, 매우 기뻐하며 전폭적으로 협력하겠다고 하세요.
답변은 1~2문장 이내로 활기차고 희망에 차게 한국어로 대답하세요. 절대 길게 말하지 마세요.`,

    kim: `당신은 30대 직장인이자 두 아이의 엄마인 소비자 대표 김현주입니다.
생활비 부담 때문에 언제나 '최저가' 상품만 찾는 지극히 현실적인 사람입니다.
초반에는 공정무역에 대해 "비싼 사치품"이라며 방어적이지만, 학생이 '하루 200원 차이'라는 구체적인 수치를 제시하거나 아동 노동의 아픔에 호소하면 조금씩 마음을 바꾸고 소비 습관 변화를 다짐하세요.
답변은 1~2문장 이내로 공감 가고 현실적으로 한국어로 대답하세요. 절대 길게 말하지 마세요.`,
};

export async function generateGeminiResponse(npcId: string, userMessage: string, persona: string, chatHistory: any[]): Promise<string | null> {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        return null;
    }

    try {
        const systemPrompt = SYSTEM_PROMPTS[npcId] || "당신은 게임 속 협상 상대입니다. 1~2문장으로 짧게 답변하세요.";

        // Format history nicely
        let contextMessage = "대화 기록 없음";
        if (chatHistory && chatHistory.length > 0) {
            contextMessage = chatHistory.slice(-6).map((msg: any) => `${msg.role === 'user' ? '학생(공정가)' : 'NPC'}: ${msg.text}`).join('\n');
        }

        const fullPrompt = `
${systemPrompt}

학생의 페르소나(역할)는 '${persona}'입니다.
---
[이전 대화 맥락]
${contextMessage}
---
학생(공정가)의 말: "${userMessage}"

위 학생의 말에 대한 당신의 응답을 작성하세요:
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: "당신은 게임 속 NPC입니다. 절대 AI나 어시스턴트라고 밝히지 마세요. 주어진 롤플레잉 프롬프트에 완벽하게 몰입하여 1~2줄로 짧게 대답하세요. 절대 인사말이나 불필요한 서술 없이 핵심만 말하세요.",
                temperature: 0.7,
            }
        });

        if (response.text) return response.text;
        return null;
    } catch (error) {
        console.error("Error communicating with Gemini:", error);
        return null; // Local fallback will handle strings
    }
}
