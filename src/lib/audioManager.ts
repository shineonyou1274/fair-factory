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
type SFXKey = 'buy' | 'xp' | 'phase' | 'seal' | 'click' | 'error';

const BGM_PATHS: Record<BGMKey, string> = {
    landing: '/audio/bgm_landing.mp3',
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
    private sfxCache: Map<string, HTMLAudioElement> = new Map(); // BGM 캐시용 (SFX는 Web Audio API)
    private userInteracted: boolean = false;
    private pendingBGM: string | null = null;

    constructor() {
        // 첫 사용자 인터랙션 감지 (브라우저 자동재생 정책 대응)
        const onInteract = () => {
            this.userInteracted = true;
            if (this.pendingBGM) {
                this._startBGM(this.pendingBGM);
                this.pendingBGM = null;
            }
            document.removeEventListener('click', onInteract);
            document.removeEventListener('keydown', onInteract);
            document.removeEventListener('touchstart', onInteract);
        };
        document.addEventListener('click', onInteract);
        document.addEventListener('keydown', onInteract);
        document.addEventListener('touchstart', onInteract);

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
        // 페이드 아웃 후 교체
        if (this.bgmAudio) {
            const old = this.bgmAudio;
            this._fadeOut(old, 800, () => old.pause());
        }

        const audio = new Audio(path);
        audio.loop = true;
        audio.volume = this.muted ? 0 : this.bgmVolume;
        audio.play().catch(() => {
            // 자동재생 차단 시 조용히 무시
        });

        this.bgmAudio = audio;
        this.currentBGM = path;

        // 페이드 인
        audio.volume = 0;
        this._fadeIn(audio, this.muted ? 0 : this.bgmVolume, 1200);
    }

    stopBGM() {
        if (this.bgmAudio) {
            this._fadeOut(this.bgmAudio, 600, () => {
                this.bgmAudio?.pause();
                this.bgmAudio = null;
                this.currentBGM = null;
            });
        }
    }

    // ─── SFX (Web Audio API 합성 — 파일 없이 동작!) ──────────────
    private _ctx: AudioContext | null = null;

    private get ctx(): AudioContext {
        if (!this._ctx) this._ctx = new AudioContext();
        return this._ctx;
    }

    playSFX(key: SFXKey) {
        if (this.muted) return;
        try {
            const vol = this.sfxVolume;
            switch (key) {
                case 'click': this._synthClick(vol); break;
                case 'buy': this._synthBuy(vol); break;
                case 'xp': this._synthXP(vol); break;
                case 'phase': this._synthPhase(vol); break;
                case 'seal': this._synthSeal(vol); break;
                case 'error': this._synthError(vol); break;
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
        const step = target / (ms / 50);
        const timer = setInterval(() => {
            if (!audio) { clearInterval(timer); return; }
            if (audio.volume + step >= target) {
                audio.volume = target;
                clearInterval(timer);
            } else {
                audio.volume = Math.min(audio.volume + step, target);
            }
        }, 50);
    }

    private _fadeOut(audio: HTMLAudioElement, ms: number, onDone: () => void) {
        const initial = audio.volume;
        const step = initial / (ms / 50);
        const timer = setInterval(() => {
            if (audio.volume - step <= 0) {
                audio.volume = 0;
                clearInterval(timer);
                onDone();
            } else {
                audio.volume = Math.max(audio.volume - step, 0);
            }
        }, 50);
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
