/**
 * AudioManager — Phase별 BGM 자동 전환 + 효과음 관리
 *
 * 사용법:
 *   import { audioManager } from '@/lib/audioManager';
 *   audioManager.playBGM(0);          // Phase 0 BGM 재생
 *   audioManager.playSFX('xp');        // XP 획득 효과음
 *   audioManager.setMuted(true);       // 전체 음소거
 */

type BGMKey = 'phase0' | 'phase1' | 'phase2' | 'phase3' | 'results' | 'landing';
type SFXKey = 'buy' | 'xp' | 'phase' | 'seal' | 'click' | 'error' | 'crystal' | 'reveal' | 'whoosh';

const BGM_PATHS: Record<BGMKey, string> = {
    landing: '/audio/bgm_results.mp3',
    phase0: '/audio/bgm_phase0.mp3',
    phase1: '/audio/bgm_phase1.mp3',
    phase2: '/audio/bgm_phase2.mp3',
    phase3: '/audio/bgm_phase3.mp3',
    results: '/audio/bgm_results.mp3',
};


class AudioManager {
    private bgmAudio: HTMLAudioElement | null = null;
    private currentBGM: string | null = null;
    private muted: boolean = false;
    private bgmVolume: number = 0.35;
    private sfxVolume: number = 0.7;
    // SFX는 Web Audio API 합성 방식 사용 (파일 불필요)
    private userInteracted: boolean = false;
    private pendingBGM: string | null = null;

    constructor() {
        // 첫 사용자 인터랙션 감지 (브라우저 자동재생 정책 대응)
        const onInteract = () => {
            this.userInteracted = true;
            // AudioContext가 suspended 상태일 수 있으므로 resume
            if (this._ctx && this._ctx.state === 'suspended') {
                this._ctx.resume();
            }
            if (this.pendingBGM) {
                this._startBGM(this.pendingBGM);
                this.pendingBGM = null;
            }
            document.removeEventListener('click', onInteract);
            document.removeEventListener('keydown', onInteract);
            document.removeEventListener('touchstart', onInteract);
            document.removeEventListener('scroll', onInteract, true);
        };
        document.addEventListener('click', onInteract);
        document.addEventListener('keydown', onInteract);
        document.addEventListener('touchstart', onInteract);
        document.addEventListener('scroll', onInteract, true);

        // 저장된 설정 불러오기
        const saved = localStorage.getItem('fair-factory-audio');
        if (saved) {
            try {
                const { muted, bgmVolume, sfxVolume } = JSON.parse(saved);
                this.muted = muted ?? false;
                this.bgmVolume = bgmVolume ?? 0.35;
                this.sfxVolume = sfxVolume ?? 0.7;
            } catch { }
        }
    }

    // ─── BGM ──────────────────────────────────────────────────
    playBGM(key: BGMKey | number) {
        const bgmKey: BGMKey = typeof key === 'number'
            ? (`phase${key}` as BGMKey)
            : key;
        const path = BGM_PATHS[bgmKey];
        if (!path || this.currentBGM === path) return;

        if (!this.userInteracted) {
            this.pendingBGM = path;
            return;
        }
        this._startBGM(path);
    }

    private _startBGM(path: string) {
        // 이전 BGM 즉시 정지 (겹침 방지)
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.src = '';
            this.bgmAudio = null;
        }

        const audio = new Audio(path);
        audio.loop = true;
        audio.volume = 0;
        audio.preload = 'auto';

        this.bgmAudio = audio;
        this.currentBGM = path;

        const target = this.muted ? 0 : this.bgmVolume;

        // play()를 즉시 호출 (유저 제스처 컨텍스트 유지)
        audio.play()
            .then(() => this._fadeIn(audio, target, 800))
            .catch(() => {
                // 즉시 재생 실패 시 → 로드 완료 후 재시도
                audio.addEventListener('canplaythrough', () => {
                    if (this.bgmAudio !== audio) return;
                    audio.play()
                        .then(() => this._fadeIn(audio, target, 800))
                        .catch(() => { /* 최종 실패 무시 */ });
                }, { once: true });
            });
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.src = '';
            this.bgmAudio = null;
            this.currentBGM = null;
        }
    }

    // ─── 볼륨 조절 (Ducking/Restore) ───────────────────────────
    private originalBgmVolume: number | null = null;

    duckBGM(targetVol: number = 0.05, ms: number = 800) {
        if (!this.bgmAudio || this.muted) return;
        this.originalBgmVolume = this.bgmAudio.volume;
        this._fadeTo(this.bgmAudio, targetVol, ms);
    }

    restoreBGM(ms: number = 1000) {
        if (!this.bgmAudio || this.muted || this.originalBgmVolume === null) return;
        this._fadeTo(this.bgmAudio, this.originalBgmVolume, ms);
        this.originalBgmVolume = null;
    }

    // ─── SFX (Web Audio API 합성 — 파일 없이 동작!) ──────────────
    private _ctx: AudioContext | null = null;
    private sfxLastPlayed: Partial<Record<SFXKey, number>> = {};

    private get ctx(): AudioContext {
        if (!this._ctx) this._ctx = new AudioContext();
        if (this._ctx.state === 'suspended' && this.userInteracted) {
            this._ctx.resume();
        }
        return this._ctx;
    }

    playSFX(key: SFXKey) {
        if (this.muted || !this.userInteracted) return;

        // 너무 빠른 효과음 중복 실행 방지 (쓰로틀링)
        const now = Date.now();
        if (this.sfxLastPlayed[key] && now - this.sfxLastPlayed[key]! < 80) return;
        this.sfxLastPlayed[key] = now;

        try {
            const vol = this.sfxVolume;
            switch (key) {
                case 'click': this._synthClick(vol); break;
                case 'buy': this._synthBuy(vol); break;
                case 'xp': this._synthXP(vol); break;
                case 'phase': this._synthPhase(vol); break;
                case 'seal': this._synthSeal(vol); break;
                case 'error': this._synthError(vol); break;
                case 'crystal': this._synthCrystal(vol); break;
                case 'reveal': this._synthReveal(vol); break;
                case 'whoosh': this._synthWhoosh(vol); break;
            }
        } catch { /* 오디오 비활성화 환경 무시 */ }
    }

    // 🖱️ 클릭 — 짧고 경쾌한 틱
    private _synthClick(vol: number) {
        const g = this.ctx.createGain();
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(vol * 0.3, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);
        const o = this.ctx.createOscillator();
        o.connect(g);
        o.type = 'sine';
        o.frequency.setValueAtTime(1200, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);
        o.start(); o.stop(this.ctx.currentTime + 0.08);
    }

    // 🛒 구매 — 동전 소리 느낌 (밝은 2음)
    private _synthBuy(vol: number) {
        const now = this.ctx.currentTime;
        [0, 0.1].forEach((delay, i) => {
            const g = this.ctx.createGain();
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0, now + delay);
            g.gain.linearRampToValueAtTime(vol * 0.5, now + delay + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.25);
            const o = this.ctx.createOscillator();
            o.connect(g);
            o.type = 'triangle';
            o.frequency.setValueAtTime(i === 0 ? 880 : 1100, now + delay);
            o.start(now + delay); o.stop(now + delay + 0.3);
        });
    }

    // ⚡ XP 획득 — 상승하는 반짝이 효과
    private _synthXP(vol: number) {
        const now = this.ctx.currentTime;
        const freqs = [660, 880, 1100, 1320];
        freqs.forEach((freq, i) => {
            const delay = i * 0.07;
            const g = this.ctx.createGain();
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0, now + delay);
            g.gain.linearRampToValueAtTime(vol * 0.4, now + delay + 0.03);
            g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.2);
            const o = this.ctx.createOscillator();
            o.connect(g);
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now + delay);
            o.start(now + delay); o.stop(now + delay + 0.25);
        });
    }

    // 🎭 Phase 전환 — 웅장한 코드 전환음
    private _synthPhase(vol: number) {
        const now = this.ctx.currentTime;
        // 저음 + 고음 화음
        [[220, 0], [440, 0.05], [660, 0.1], [880, 0.18]].forEach(([freq, delay]) => {
            const g = this.ctx.createGain();
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0, now + delay);
            g.gain.linearRampToValueAtTime(vol * 0.35, now + delay + 0.05);
            g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.7);
            const o = this.ctx.createOscillator();
            o.connect(g);
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now + delay);
            o.start(now + delay); o.stop(now + delay + 0.8);
        });
        // 노이즈 레이어(whoosh 느낌)
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass'; filter.frequency.value = 800;
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(vol * 0.3, now);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        src.connect(filter); filter.connect(ng); ng.connect(this.ctx.destination);
        src.start(now); src.stop(now + 0.35);
    }

    // 🏅 황금 인장 — 화려한 팡파르
    private _synthSeal(vol: number) {
        const now = this.ctx.currentTime;
        // 상승 아르페지오
        const melody = [523, 659, 784, 1047, 1319];
        melody.forEach((freq, i) => {
            const delay = i * 0.08;
            const g = this.ctx.createGain();
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0, now + delay);
            g.gain.linearRampToValueAtTime(vol * 0.5, now + delay + 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.4);
            const o = this.ctx.createOscillator();
            o.connect(g);
            o.type = i % 2 === 0 ? 'sine' : 'triangle';
            o.frequency.setValueAtTime(freq, now + delay);
            o.start(now + delay); o.stop(now + delay + 0.5);
        });
        // 마지막 롱 노트
        const lg = this.ctx.createGain();
        lg.connect(this.ctx.destination);
        lg.gain.setValueAtTime(0, now + 0.5);
        lg.gain.linearRampToValueAtTime(vol * 0.6, now + 0.55);
        lg.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        const lo = this.ctx.createOscillator();
        lo.connect(lg); lo.type = 'sine';
        lo.frequency.setValueAtTime(1319, now + 0.5);
        lo.start(now + 0.5); lo.stop(now + 1.3);
    }

    // ❌ 에러 — 낮고 불협화음
    private _synthError(vol: number) {
        const now = this.ctx.currentTime;
        [220, 207].forEach((freq, i) => {
            const g = this.ctx.createGain();
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(vol * 0.4, now + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.3);
            const o = this.ctx.createOscillator();
            o.connect(g); o.type = 'sawtooth';
            o.frequency.setValueAtTime(freq, now + i * 0.15);
            o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.35);
        });
    }


    // 🔮 수정구슬 — 긴장감 있는 드론 + 점점 빨라지는 틱
    private _synthCrystal(vol: number) {
        const now = this.ctx.currentTime;
        const dur = 3.5;
        // 저음 드론 (불안한 긴장감)
        const drone = this.ctx.createOscillator();
        const droneG = this.ctx.createGain();
        drone.connect(droneG); droneG.connect(this.ctx.destination);
        drone.type = 'sine';
        drone.frequency.setValueAtTime(110, now);
        drone.frequency.linearRampToValueAtTime(165, now + dur); // 서서히 상승
        droneG.gain.setValueAtTime(0, now);
        droneG.gain.linearRampToValueAtTime(vol * 0.3, now + 0.5);
        droneG.gain.setValueAtTime(vol * 0.3, now + dur - 0.3);
        droneG.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        drone.start(now); drone.stop(now + dur + 0.1);
        // 두 번째 드론 (5도 위, 불협화 긴장)
        const drone2 = this.ctx.createOscillator();
        const drone2G = this.ctx.createGain();
        drone2.connect(drone2G); drone2G.connect(this.ctx.destination);
        drone2.type = 'triangle';
        drone2.frequency.setValueAtTime(164, now);
        drone2.frequency.linearRampToValueAtTime(220, now + dur);
        drone2G.gain.setValueAtTime(0, now);
        drone2G.gain.linearRampToValueAtTime(vol * 0.15, now + 1.0);
        drone2G.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        drone2.start(now); drone2.stop(now + dur + 0.1);
        // 점점 빨라지는 틱 사운드 (심장박동 느낌)
        const tickCount = 16;
        for (let i = 0; i < tickCount; i++) {
            // 간격이 점점 줄어듦: 0.4s → 0.08s
            const t = (i / tickCount);
            const delay = t * t * dur * 0.85; // 가속 곡선
            const g = this.ctx.createGain();
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0, now + delay);
            g.gain.linearRampToValueAtTime(vol * (0.15 + t * 0.25), now + delay + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.08);
            const o = this.ctx.createOscillator();
            o.connect(g); o.type = 'sine';
            o.frequency.setValueAtTime(800 + t * 600, now + delay); // 피치도 상승
            o.start(now + delay); o.stop(now + delay + 0.1);
        }
    }

    // ✨ 캐릭터 공개 — 신성한 차임 + 부드러운 패드 코드
    private _synthReveal(vol: number) {
        const now = this.ctx.currentTime;
        // 부드러운 패드 코드 (C장조 화음: C4-E4-G4)
        [262, 330, 392].forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(vol * 0.2, now + 0.3 + i * 0.1);
            g.gain.setValueAtTime(vol * 0.2, now + 1.5);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
            o.start(now); o.stop(now + 3.1);
        });
        // 높은 벨/차임 음 (신성한 느낌)
        const chimes = [1047, 1319, 1568, 2093]; // C5-E5-G5-C6
        chimes.forEach((freq, i) => {
            const delay = 0.1 + i * 0.2;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now + delay);
            g.gain.setValueAtTime(0, now + delay);
            g.gain.linearRampToValueAtTime(vol * 0.3, now + delay + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.5);
            o.start(now + delay); o.stop(now + delay + 1.6);
            // 옥타브 위 하모닉 (공명감)
            const h = this.ctx.createOscillator();
            const hg = this.ctx.createGain();
            h.connect(hg); hg.connect(this.ctx.destination);
            h.type = 'sine';
            h.frequency.setValueAtTime(freq * 2, now + delay);
            hg.gain.setValueAtTime(0, now + delay);
            hg.gain.linearRampToValueAtTime(vol * 0.08, now + delay + 0.02);
            hg.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.0);
            h.start(now + delay); h.stop(now + delay + 1.1);
        });
        // 마지막 서스테인 화음 (장엄한 마무리)
        [523, 659, 784].forEach(freq => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            o.type = 'triangle';
            o.frequency.setValueAtTime(freq, now + 1.0);
            g.gain.setValueAtTime(0, now + 1.0);
            g.gain.linearRampToValueAtTime(vol * 0.15, now + 1.3);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
            o.start(now + 1.0); o.stop(now + 3.6);
        });
    }

    // 💨 워시 — 카드 셔플/전환 효과
    private _synthWhoosh(vol: number) {
        const now = this.ctx.currentTime;
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.25, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.2;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
        filter.Q.value = 2;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol * 0.4, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        src.connect(filter); filter.connect(g); g.connect(this.ctx.destination);
        src.start(now); src.stop(now + 0.3);
    }

    // ─── 볼륨/음소거 ───────────────────────────────────────────
    setMuted(muted: boolean) {
        this.muted = muted;
        if (this.bgmAudio) {
            this.bgmAudio.volume = muted ? 0 : this.bgmVolume;
        }
        this._saveSettings();
    }

    setBGMVolume(vol: number) {
        this.bgmVolume = Math.max(0, Math.min(1, vol));
        if (this.bgmAudio && !this.muted) {
            this.bgmAudio.volume = this.bgmVolume;
        }
        this._saveSettings();
    }

    setSFXVolume(vol: number) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
        this._saveSettings();
    }

    get isMuted() { return this.muted; }
    get bgmVolumeLevel() { return this.bgmVolume; }
    get sfxVolumeLevel() { return this.sfxVolume; }

    // ─── 유틸 ─────────────────────────────────────────────────
    private _fadeIn(audio: HTMLAudioElement, target: number, ms: number) {
        this._fadeTo(audio, target, ms);
    }

    private _fadeTo(audio: HTMLAudioElement, target: number, ms: number) {
        const startVol = audio.volume;
        const diff = target - startVol;
        if (diff === 0) return;
        const steps = 20;
        const stepTime = ms / steps;
        const stepVol = diff / steps;

        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            if (!audio) { clearInterval(timer); return; }
            const nextVol = startVol + (stepVol * currentStep);
            audio.volume = Math.max(0, Math.min(1, nextVol));
            if (currentStep >= steps) {
                audio.volume = Math.max(0, Math.min(1, target));
                clearInterval(timer);
            }
        }, stepTime);
    }

    private _saveSettings() {
        localStorage.setItem('fair-factory-audio', JSON.stringify({
            muted: this.muted,
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
        }));
    }
}

// 싱글톤 인스턴스
export const audioManager = new AudioManager();
