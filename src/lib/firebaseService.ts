/**
 * firebaseService.ts
 * Firebase Firestore + RTDB 서비스 레이어
 *
 * 사용법:
 *   import { SessionService, StudentService, TeacherService } from '@/lib/firebaseService';
 */

import {
    collection, doc, setDoc, getDoc, updateDoc, query,
    where, getDocs, serverTimestamp, onSnapshot, Timestamp, deleteDoc
} from 'firebase/firestore';
import { ref, set, update, onValue, off, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { db, rtdb, auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import type { ClassSession, StudentActivity, TeacherUser, Persona } from '@/types';
import { MOCK_NPCS } from '@/lib/mockData';

// ─── 세션 코드 생성 ────────────────────────────────────────────
export function generateSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── 페르소나 랜덤 배정 (순환) ────────────────────────────────
const PERSONAS: Persona[] = ['Alpha', 'Delta', 'Omega', 'Lambda', 'Sigma'];
export function assignPersona(index: number): Persona {
    return PERSONAS[index % PERSONAS.length];
}

// ══════════════════════════════════════════════════════════════════
// 🎓 TeacherService
// ══════════════════════════════════════════════════════════════════
export const TeacherService = {

    /** 교사 프로필 저장/업데이트 */
    async upsert(uid: string, data: Partial<TeacherUser>) {
        await setDoc(doc(db, 'teachers', uid), {
            ...data,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    },

    /** 교사 프로필 불러오기 */
    async get(uid: string): Promise<TeacherUser | null> {
        const snap = await getDoc(doc(db, 'teachers', uid));
        return snap.exists() ? snap.data() as TeacherUser : null;
    },

    /** 교사의 세션 목록 가져오기 */
    async getSessions(teacherId: string): Promise<ClassSession[]> {
        const q = query(collection(db, 'sessions'), where('teacherId', '==', teacherId));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as ClassSession);
    },
};

// ══════════════════════════════════════════════════════════════════
// 🏫 SessionService
// ══════════════════════════════════════════════════════════════════
export const SessionService = {

    /** 새 세션 생성 */
    async create(teacherId: string, teacherName: string, options?: {
        maxGroupSize?: number;
        language?: 'ko' | 'en';
    }): Promise<ClassSession> {
        const code = generateSessionCode();
        const session: ClassSession = {
            id: code,
            classCode: code,
            teacherId,
            teacherName,
            currentPhase: 0,
            goldenSealsAwarded: 0,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            settings: {
                maxGroupSize: (options?.maxGroupSize ?? 5) as 3 | 4 | 5,
                minGroupSize: 2,
                allowPersonaChoice: false,
                phaseTimeLimits: { 0: null, 1: 600, 2: 900, 3: 600, 4: null },
                language: options?.language ?? 'ko',
            },
        };

        // Firestore에 세션 저장
        await setDoc(doc(db, 'sessions', code), {
            ...session,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // RTDB에 실시간 Phase 초기화
        await set(ref(rtdb, `sessions/${code}`), {
            currentPhase: 0,
            isActive: true,
            updatedAt: rtdbTimestamp(),
        });

        // 교사 sessions 배열에 코드 추가 (문서 미존재 시에도 안전)
        const existing = await TeacherService.get(teacherId);
        await setDoc(doc(db, 'teachers', teacherId), {
            sessions: [...(existing?.sessions ?? []), code],
            updatedAt: serverTimestamp(),
        }, { merge: true });

        return session;
    },

    /** 세션 코드로 세션 가져오기 */
    async getByCode(code: string): Promise<ClassSession | null> {
        const snap = await getDoc(doc(db, 'sessions', code.toUpperCase()));
        if (!snap.exists()) return null;
        return snap.data() as ClassSession;
    },

    /** Phase 변경 (교사 전용) */
    async setPhase(sessionCode: string, phase: 0 | 1 | 2 | 3 | 4) {
        // Firestore 업데이트
        await updateDoc(doc(db, 'sessions', sessionCode), {
            currentPhase: phase,
            updatedAt: serverTimestamp(),
        });
        // RTDB 실시간 브로드캐스트
        await update(ref(rtdb, `sessions/${sessionCode}`), {
            currentPhase: phase,
            updatedAt: rtdbTimestamp(),
        });
    },

    /** 실시간 Phase 구독 */
    subscribePhase(sessionCode: string, callback: (phase: number) => void): () => void {
        const phaseRef = ref(rtdb, `sessions/${sessionCode}/currentPhase`);
        onValue(phaseRef, (snap) => {
            if (snap.val() !== null) callback(snap.val() as number);
        });
        return () => off(phaseRef);
    },

    /** 세션 종료 */
    async close(sessionCode: string) {
        await updateDoc(doc(db, 'sessions', sessionCode), {
            isActive: false,
            closedAt: serverTimestamp(),
        });
        await update(ref(rtdb, `sessions/${sessionCode}`), { isActive: false });
    },

    /** 세션 삭제 */
    async delete(sessionCode: string) {
        await deleteDoc(doc(db, 'sessions', sessionCode));
        await set(ref(rtdb, `sessions/${sessionCode}`), null);
    },

    /** 세션 학생 목록 실시간 구독 */
    subscribeStudents(sessionCode: string, callback: (students: StudentActivity[]) => void): () => void {
        const q = query(collection(db, 'sessions', sessionCode, 'students'));
        return onSnapshot(q, snap => {
            callback(snap.docs.map(d => d.data() as StudentActivity));
        });
    },

    /** 황금 인장 수여 */
    async awardGoldenSeal(sessionCode: string, studentId: string) {
        await updateDoc(doc(db, 'sessions', sessionCode, 'students', studentId), {
            goldenSeal: true,
            goldenSealAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'sessions', sessionCode), {
            goldenSealsAwarded: (await getDoc(doc(db, 'sessions', sessionCode))).data()?.goldenSealsAwarded + 1,
        });
    },
};

// ══════════════════════════════════════════════════════════════════
// 🎒 StudentService
// ══════════════════════════════════════════════════════════════════
export const StudentService = {

    /** 익명 로그인 후 학생 등록 */
    async joinSession(sessionCode: string, displayName: string): Promise<{
        student: StudentActivity;
        session: ClassSession;
    }> {
        // 1. 익명 로그인 먼저 수행 (Firestore 권한 획득)
        const { user } = await signInAnonymously(auth);

        // 2. 세션 확인
        const session = await SessionService.getByCode(sessionCode);
        if (!session) throw new Error('SESSION_NOT_FOUND');
        if (!session.isActive) throw new Error('SESSION_INACTIVE');

        // 3. 현재 세션 학생 수 확인하여 페르소나 배정
        const existingStudents = await getDocs(collection(db, 'sessions', sessionCode, 'students'));
        const persona = assignPersona(existingStudents.size);

        // 4. 학생 데이터 생성
        const student: StudentActivity = {
            studentId: user.uid,
            displayName,
            persona,
            reflectiveEmpathyScore: 0,
            avatarLevel: 1,
            xp: { trendSetter: 0, heartBridge: 0, justiceBuilder: 0, criticalEye: 0, peaceMaker: 0 },
            actionCardsUsed: [],
            reportSubmitted: false,
            fairPrice: null,
            teamworkGauge: 70,
            inventoryItems: [],
            joinedAt: Date.now(),
            sessionCode,
        };

        // 5. Firestore에 학생 저장
        await setDoc(doc(db, 'sessions', sessionCode, 'students', user.uid), {
            ...student,
            joinedAt: serverTimestamp(),
        });

        // 6. RTDB presence 설정
        await set(ref(rtdb, `sessions/${sessionCode}/presence/${user.uid}`), {
            displayName,
            persona,
            online: true,
            joinedAt: rtdbTimestamp(),
        });

        return { student, session };
    },

    /** XP 업데이트 */
    async addXP(sessionCode: string, studentId: string, amount: number, category: keyof StudentActivity['xp']) {
        const studentRef = doc(db, 'sessions', sessionCode, 'students', studentId);
        const snap = await getDoc(studentRef);
        if (!snap.exists()) return;
        const current = snap.data().xp ?? {};
        const newVal = (current[category] ?? 0) + amount;
        await updateDoc(studentRef, {
            [`xp.${category}`]: newVal,
            updatedAt: serverTimestamp(),
        });
    },

    /** 아이템 구매 */
    async buyItem(sessionCode: string, studentId: string, itemId: string, cost: number) {
        const studentRef = doc(db, 'sessions', sessionCode, 'students', studentId);
        const snap = await getDoc(studentRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const totalXp = Object.values(data.xp ?? {}).reduce((a: number, b: unknown) => a + (b as number), 0);
        if (totalXp < cost) throw new Error('XP_INSUFFICIENT');

        await updateDoc(studentRef, {
            inventoryItems: [...(data.inventoryItems ?? []), itemId],
            updatedAt: serverTimestamp(),
        });
    },

    /** 리포트 제출 (Phase별) */
    async submitReport(sessionCode: string, studentId: string, phase: number, content: string, data?: Record<string, unknown>) {
        await updateDoc(doc(db, 'sessions', sessionCode, 'students', studentId), {
            reportSubmitted: true,
            [`submissions.phase${phase}`]: {
                content,
                data: data ?? null,
                submittedAt: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
        });

        // 별도 리포트 컬렉션에도 저장 (교사용 백업/상세 조회)
        await setDoc(doc(db, 'reports', `${sessionCode}_${studentId}_p${phase}`), {
            sessionCode,
            studentId,
            phase,
            content,
            data: data ?? null,
            submittedAt: serverTimestamp(),
        });
    },

    /** 학생 현황 실시간 구독 */
    subscribePresence(sessionCode: string, callback: (presence: Record<string, unknown>) => void): () => void {
        const presenceRef = ref(rtdb, `sessions/${sessionCode}/presence`);
        onValue(presenceRef, snap => {
            callback(snap.val() ?? {});
        });
        return () => off(presenceRef);
    },
};

// ══════════════════════════════════════════════════════════════════
// 📊 ReportService
// ══════════════════════════════════════════════════════════════════
export const ReportService = {

    /** 세션 전체 리포트 가져오기 (교사용) */
    async getSessionReports(sessionCode: string) {
        const q = query(collection(db, 'reports'), where('sessionCode', '==', sessionCode));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    /** 채팅 메시지 저장 */
    async saveChat(sessionCode: string, studentId: string, npcId: string, messages: Array<Record<string, unknown>>) {
        await setDoc(doc(db, 'chatLogs', `${sessionCode}_${studentId}_${npcId}`), {
            sessionCode,
            studentId,
            npcId,
            messages,
            savedAt: serverTimestamp(),
        });
    },
};
