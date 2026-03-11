# 🔥 공정공장 친구들 — Firebase 설정 가이드

## ✅ 현재 상태

`.env.local` 파일이 이미 존재합니다. Firebase 프로젝트 키가 설정된 경우
`npm run dev` 재시작만으로 실시간 기능이 활성화됩니다.

---

## 📋 Firebase 콘솔 5분 설정법

### 1단계 — 프로젝트 생성

1. [console.firebase.google.com](https://console.firebase.google.com) 접속
2. **프로젝트 추가** 클릭
3. 프로젝트 이름: `fair-factory` (또는 원하는 이름)
4. Google Analytics: 선택사항 (건너뛰어도 됨)

---

### 2단계 — Authentication 설정

```
Firebase 콘솔 → Authentication → 시작하기
→ Sign-in method 탭 → 이메일/비밀번호 → 사용 설정 ON
```

**테스트 교사 계정 직접 추가:**
```
Authentication → 사용자 탭 → 사용자 추가
  이메일: teacher@fair.edu
  비밀번호: fair1234!
```

---

### 3단계 — Firestore 생성

```
Firebase 콘솔 → Firestore Database → 데이터베이스 만들기
→ 프로덕션 모드 선택
→ 위치: asia-northeast3 (서울)
```

---

### 4단계 — Realtime Database 생성

```
Firebase 콘솔 → Realtime Database → 데이터베이스 만들기
→ 위치: asia-southeast1 (싱가포르) — 싱가포르가 한국에서 가장 빠름
→ 테스트 모드로 시작 (규칙은 나중에 적용)
```

---

### 5단계 — 웹 앱 등록 및 키 복사

```
Firebase 콘솔 → 프로젝트 설정 (톱니바퀴) → 일반 탭
→ 내 앱 섹션 → </> (웹) 아이콘 클릭
→ 앱 닉네임: fair-factory-web
→ Firebase SDK 스니펫 → 구성 선택
```

복사한 값을 `.env.local`에 붙여넣기:

```ini
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=fair-factory.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://fair-factory-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=fair-factory
VITE_FIREBASE_STORAGE_BUCKET=fair-factory.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=76500...
VITE_FIREBASE_APP_ID=1:76500...:web:c974...
```

> ⚠️ `.env.local` 저장 후 반드시 **npm run dev 재시작** 필요

---

### 6단계 — 보안 규칙 배포

Firebase CLI 설치 (1회만):
```bash
npm install -g firebase-tools
firebase login
firebase init   # Firestore, Realtime Database 체크
```

규칙 배포:
```bash
firebase deploy --only firestore:rules
firebase deploy --only database
```

또는 콘솔에서 직접 붙여넣기:
- `firestore.rules` → Firestore → 규칙 탭
- `database.rules.json` → Realtime Database → 규칙 탭

---

### 7단계 — Storage 설정 (선택)

```
Firebase 콘솔 → Storage → 시작하기
→ 보안 규칙: 프로덕션 모드
→ 위치: asia-northeast3 (서울)
```

---

## ✅ 설정 완료 체크리스트

| 항목 | 확인 |
|:---|:---:|
| Firebase 프로젝트 생성 | ☐ |
| Authentication (이메일) 활성화 | ☐ |
| Firestore Database 생성 (서울) | ☐ |
| Realtime Database 생성 | ☐ |
| `.env.local`에 키 입력 | ☐ |
| `npm run dev` 재시작 | ☐ |
| `/teacher/login` 로그인 성공 | ☐ |
| Phase 전환 시 학생화면 실시간 반영 | ☐ |

---

## 🧪 Firebase 없이 테스트하는 방법

Firebase 없이도 **전체 UI를 테스트**할 수 있습니다:

| 화면 | 방법 |
|:---|:---|
| 교사 로그인 | `/teacher/login` → "테스트 계정으로 입장" 버튼 |
| 학생 입장 | `/join` → 코드 `FAIR01` 입력 |
| 게임 진행 | 화면 좌하단 0/1/2/3 버튼으로 Phase 전환 |
| 관리자 | `/admin` 직접 접속 |

---

## 📂 프로젝트 구조

```
fair-factory/
├── .env.local                ← API 키 (⚠️ .gitignore에 있음, 공유 금지)
├── firestore.rules           ← Firestore 보안 규칙
├── database.rules.json       ← Realtime DB 보안 규칙
├── firestore.indexes.json    ← 복합 쿼리 인덱스
└── src/
    └── lib/
        ├── firebase.ts       ← Firebase 초기화
        └── mockData.ts       ← 테스트용 목 데이터
```

---

## 🌏 배포 (Vercel 추천)

```bash
npm run build
# dist/ 폴더를 Vercel, Netlify, 또는 Firebase Hosting에 업로드
```

Vercel 배포 시 환경변수는 Vercel 대시보드 → Settings → Environment Variables에 입력.
