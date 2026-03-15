// ─── Enums ───────────────────────────────────────────────────
export type Persona = 'Alpha' | 'Delta' | 'Omega' | 'Lambda' | 'Sigma';
export type Phase = 0 | 1 | 2 | 3 | 4;
export type AvatarLevel = 1 | 2 | 3 | 4;
export type UserRole = 'teacher' | 'student' | 'superadmin';
export type Language = 'ko' | 'en' | 'ja';

// ─── NPC ─────────────────────────────────────────────────────
export type NpcId = 'gorex' | 'tierra' | 'maxwell' | 'amara' | 'kim';

export interface NpcCharacter {
    id: NpcId;
    name: string;
    role: string;
    emoji: string;
    hiddenAgenda: string;
    weakness: string;
    trustLevel: number;       // 0~100
    isPersuaded: boolean;
}

// ─── Student ──────────────────────────────────────────────────
export interface StudentActivity {
    studentId: string;
    displayName: string;
    persona: Persona;
    reflectiveEmpathyScore: number;   // 구조적 공감 지수 (0~100)
    avatarLevel: AvatarLevel;
    xp: {
        trendSetter: number;       // 알파 - 트렌드 세터
        heartBridge: number;       // 람다 - 하트 브릿지
        justiceBuilder: number;    // 오메가 - 저스티스 빌더
        criticalEye: number;       // 시그마 - 크리티컬 아이
        peaceMaker: number;        // 델타 - 피스메이커
    };
    actionCardsUsed: ActionCardUse[];
    reportSubmitted: boolean;
    submissions?: Record<string, { content: string; data?: any; submittedAt: any }>; // Phase별 제출 데이터
    fairPrice: number | null;
    teamworkGauge: number;        // 0~100
    inventoryItems: ShopItem[];
}

// ─── Action Cards ─────────────────────────────────────────────
export type ActionCardType =
    | 'data_scan'      // Alpha
    | 'sharp_question' // Sigma
    | 'healing_buff'   // Lambda
    | 'alt_proposal'   // Omega
    | 'mediation'      // Delta

export interface ActionCard {
    type: ActionCardType;
    persona: Persona;
    label: string;
    description: string;
    emoji: string;
    cooldown: number;    // 몇 번 사용 가능/Phase
    effect: string;
}

export interface ActionCardUse {
    cardType: ActionCardType;
    usedAt: number;      // timestamp
    targetNpc?: NpcId;
    result: string;
}

// ─── Session / Room ───────────────────────────────────────────
export interface ClassSession {
    id: string;
    classCode: string;
    teacherId: string;
    teacherName: string;
    currentPhase: Phase;
    goldenSealsAwarded: number;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
    settings: SessionSettings;
}

export interface SessionSettings {
    maxGroupSize: 3 | 4 | 5;
    minGroupSize: 3 | 4 | 5;
    allowPersonaChoice: boolean;
    phaseTimeLimits: Record<Phase, number | null>;  // null = unlimited
    language: Language;
}

// ─── Group / Modum ────────────────────────────────────────────
export interface Group {
    id: string;
    sessionId: string;
    groupNumber: number;
    memberIds: string[];
    personaAssignments: Record<string, Persona>;
    completedPhases: Phase[];
    groupScore: number;
    goldenSeals: number;
    npcs: NpcCharacter[];
}

// ─── Teacher User ─────────────────────────────────────────────
export interface TeacherUser {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    school?: string;
    sessions: string[];  // session IDs
    createdAt: number;
}

// ─── Report ───────────────────────────────────────────────────
export interface AccusationReport {
    id: string;
    studentId: string;
    sessionId: string;
    groupId: string;
    hiddenTruths: string[];   // 발견한 숨겨진 진실 목록
    analysis: string;         // 학생 서술형 분석
    empathyScore: number;     // AI 평가 점수
    empathyLevel: 'emotional' | 'causal' | 'structural';
    status: 'pending' | 'approved' | 'rejected';
    teacherComment?: string;
    submittedAt: number;
    reviewedAt?: number;
}

// ─── Chat ─────────────────────────────────────────────────────
export interface ChatMessage {
    id: string;
    sessionId: string;
    groupId: string;
    senderId: string;
    senderName: string;
    senderPersona?: Persona;
    isNpc: boolean;
    npcId?: NpcId;
    content: string;
    timestamp: number;
    empathyScore?: number;
    flaggedType?: 'emotional' | 'causal' | 'structural';
}

// ─── Shop ─────────────────────────────────────────────────────
export type ShopItemId =
    | 'hope_shoes'
    | 'wisdom_glasses'
    | 'justice_shield'
    | 'truth_compass'
    | 'solidarity_seed';

export interface ShopItem {
    id: ShopItemId;
    name: string;
    description: string;
    emoji: string;
    price: number;
    effect: string;
    rarity: 'common' | 'rare' | 'legendary';
}

// ─── Price Simulator ──────────────────────────────────────────
export interface PriceSimulation {
    farmProduceCost: number;       // 농장 원가
    farmerMargin: number;          // 농장주 마진 %
    cooperativeMargin: number;     // 협동조합 마진 %
    distributorMargin: number;     // 유통업자 마진 %
    retailerMargin: number;        // 소매상 마진 %
    finalPrice: number;            // 최종 소비자가
    fairTradeMinPrice: number;     // 공정무역 최저 보장가
    isFair: boolean;               // 공정 여부
}

// ─── Notification ─────────────────────────────────────────────
export interface AppNotification {
    id: string;
    type: 'golden_seal' | 'phase_change' | 'xp_gain' | 'team_submit' | 'npc_persuaded' | 'report_reviewed' | 'quiz' | 'system';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    xpAmount?: number;
}
