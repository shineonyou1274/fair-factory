import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// ─── Firebase 설정 ────────────────────────────────────────────
// trim(): Vercel 환경변수에 줄바꿈(\n)이 포함되면 Firebase URL이 깨짐
const t = (v: string | undefined) => v?.trim();
const firebaseConfig = {
    apiKey: t(import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: t(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    databaseURL: t(import.meta.env.VITE_FIREBASE_DATABASE_URL),
    projectId: t(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: t(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: t(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: t(import.meta.env.VITE_FIREBASE_APP_ID),
};

// ─── 설정 검증 ───────────────────────────────────────────────
const REQUIRED_KEYS: (keyof typeof firebaseConfig)[] = [
    'apiKey', 'authDomain', 'projectId', 'appId',
];
const missingKeys = REQUIRED_KEYS.filter(k => !firebaseConfig[k] || firebaseConfig[k]?.startsWith('여기에'));

if (missingKeys.length > 0) {
    console.warn(
        `⚠️  Firebase 미설정 키: ${missingKeys.join(', ')}\n` +
        '    FIREBASE_SETUP.md를 참고하여 .env.local을 작성해주세요.\n' +
        '    현재는 목 데이터 모드로 동작합니다.'
    );
} else if (import.meta.env.DEV) {
    console.info(`🔥 Firebase 연결됨 (프로젝트: ${firebaseConfig.projectId})`);
}

// ─── 앱 초기화 (중복 방지) ────────────────────────────────────
const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);    // 학생/세션/리포트 데이터
export const rtdb = getDatabase(app);     // 실시간 Phase 동기화
export const storage = getStorage(app);      // 리포트 첨부파일

export default app;
