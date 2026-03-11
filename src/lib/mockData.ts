import type { TeacherUser, ClassSession, Group, StudentActivity, NpcCharacter } from '@/types';

export const MOCK_TEACHER: TeacherUser = {
    uid: 'mock-teacher-001',
    email: 'teacher@fairfactory.edu',
    displayName: '김공정 선생님',
    role: 'teacher',
    school: '공정중학교',
    sessions: ['mock-session-001'],
    createdAt: Date.now(),
};

export const MOCK_SESSION: ClassSession = {
    id: 'mock-session-001',
    classCode: 'FAIR01',
    teacherId: 'mock-teacher-001',
    teacherName: '김공정 선생님',
    currentPhase: 0,
    goldenSealsAwarded: 0,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: {
        maxGroupSize: 5,
        minGroupSize: 3,
        allowPersonaChoice: true,
        phaseTimeLimits: { 0: null, 1: 600, 2: 900, 3: 600, 4: null },
        language: 'ko',
    },
};

export const MOCK_NPCS: NpcCharacter[] = [
    { id: 'gorex', name: '고렉스', role: '대형 유통업자', emoji: '😈', hiddenAgenda: '마진 40% 사수', weakness: '농장주 대비 수익 3배 지적', trustLevel: 20, isPersuaded: false },
    { id: 'tierra', name: '티에라', role: '소규모 농장주', emoji: '😔', hiddenAgenda: '빚더미, 인증비 부담', weakness: '인증 지원 제도 안내', trustLevel: 40, isPersuaded: false },
    { id: 'maxwell', name: '맥스웰', role: '다국적 기업 임원', emoji: '🏢', hiddenAgenda: 'CSR 이미지 세탁', weakness: 'CSR vs 실제 데이터 불일치 고발', trustLevel: 15, isPersuaded: false },
    { id: 'amara', name: '아마라', role: '현지 협동조합장', emoji: '🌱', hiddenAgenda: '공정무역 신봉, 연대 희망', weakness: '윈윈 모델 제안 즉시 전환', trustLevel: 65, isPersuaded: false },
    { id: 'kim', name: '김현주', role: '소비자 대표', emoji: '🛒', hiddenAgenda: '"비싼 제품은 사치"', weakness: '가격차 200원 감성 설득', trustLevel: 35, isPersuaded: false },
];

export const MOCK_GROUP: Group = {
    id: 'mock-group-001',
    sessionId: 'mock-session-001',
    groupNumber: 1,
    memberIds: ['s1', 's2', 's3', 's4', 's5'],
    personaAssignments: {},
    completedPhases: [],
    groupScore: 0,
    goldenSeals: 0,
    npcs: MOCK_NPCS,
};

export const createMockStudent = (
    name: string,
    persona: StudentActivity['persona'],
): StudentActivity => ({
    studentId: `mock-${crypto.randomUUID().slice(0, 8)}`,
    displayName: name,
    persona,
    reflectiveEmpathyScore: 0,
    avatarLevel: 1,
    xp: { trendSetter: 0, heartBridge: 0, justiceBuilder: 0, criticalEye: 0, peaceMaker: 0 },
    actionCardsUsed: [],
    reportSubmitted: false,
    fairPrice: null,
    teamworkGauge: 70,
    inventoryItems: [],
});

/** Firebase 가 설정됐는지 확인 */
export const isFirebaseConfigured = () => {
    const key = import.meta.env.VITE_FIREBASE_API_KEY;
    return key && key !== '여기에_입력' && key.length > 10;
};
