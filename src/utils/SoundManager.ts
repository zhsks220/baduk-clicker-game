
// Sound Assets
import bgmCasual from '../assets/sounds/bgm_casual.mp3';
import seHit from '../assets/sounds/se_hit.wav';
import seDestroy from '../assets/sounds/se_destroy.wav';
import seCoin from '../assets/sounds/se_coin.wav';
import seSuccess from '../assets/sounds/se_enhance_success.wav';
import seFail from '../assets/sounds/se_enhance_fail.wav';
import seClick from '../assets/sounds/se_ui_click.wav';

type SoundType = 'bgm' | 'hit' | 'destroy' | 'coin' | 'success' | 'fail' | 'click';

const STORAGE_KEY = 'pony-game-sound-settings';

// 오디오 풀 설정: 각 사운드별 인스턴스 수
const POOL_SIZE: Record<Exclude<SoundType, 'bgm'>, number> = {
    hit: 5,      // 빠른 연타용
    destroy: 3,
    coin: 4,
    success: 2,
    fail: 2,
    click: 3,
};

interface SoundSettings {
    bgmMuted: boolean;
    sfxMuted: boolean;
    bgmVolume: number;
    sfxVolume: number;
}

class SoundManager {
    private bgm: HTMLAudioElement;
    private soundPools: Record<Exclude<SoundType, 'bgm'>, HTMLAudioElement[]>;
    private poolIndex: Record<Exclude<SoundType, 'bgm'>, number>;
    private bgmMuted: boolean = false;
    private sfxMuted: boolean = false;
    private bgmVolume: number = 0.3;
    private sfxVolume: number = 0.5;
    private bgmPlaying: boolean = false;

    // 사운드 소스 매핑
    private soundSources: Record<Exclude<SoundType, 'bgm'>, string> = {
        hit: seHit,
        destroy: seDestroy,
        coin: seCoin,
        success: seSuccess,
        fail: seFail,
        click: seClick,
    };

    constructor() {
        // BGM 설정
        this.bgm = new Audio(bgmCasual);
        this.bgm.loop = true;
        this.bgm.volume = this.bgmVolume;
        this.bgm.load();

        // 오디오 풀 초기화
        this.soundPools = {} as Record<Exclude<SoundType, 'bgm'>, HTMLAudioElement[]>;
        this.poolIndex = {} as Record<Exclude<SoundType, 'bgm'>, number>;

        const sfxTypes: Exclude<SoundType, 'bgm'>[] = ['hit', 'destroy', 'coin', 'success', 'fail', 'click'];

        sfxTypes.forEach(type => {
            const poolSize = POOL_SIZE[type];
            this.soundPools[type] = [];
            this.poolIndex[type] = 0;

            // 풀에 오디오 인스턴스 생성
            for (let i = 0; i < poolSize; i++) {
                const audio = new Audio(this.soundSources[type]);
                audio.volume = this.sfxVolume;
                audio.load();
                this.soundPools[type].push(audio);
            }
        });

        // 저장된 설정 로드
        this.loadSettings();
    }

    private loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const settings: SoundSettings = JSON.parse(saved);
                this.bgmMuted = settings.bgmMuted ?? false;
                this.sfxMuted = settings.sfxMuted ?? false;
                this.bgmVolume = settings.bgmVolume ?? 0.3;
                this.sfxVolume = settings.sfxVolume ?? 0.5;
                this.bgm.volume = this.bgmVolume;
                this.updatePoolVolumes();
            }
        } catch (e) {
            console.error('Failed to load sound settings:', e);
        }
    }

    private saveSettings() {
        const settings: SoundSettings = {
            bgmMuted: this.bgmMuted,
            sfxMuted: this.sfxMuted,
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    // 풀의 모든 오디오 볼륨 업데이트
    private updatePoolVolumes() {
        const sfxTypes: Exclude<SoundType, 'bgm'>[] = ['hit', 'destroy', 'coin', 'success', 'fail', 'click'];
        sfxTypes.forEach(type => {
            this.soundPools[type].forEach(audio => {
                audio.volume = this.sfxVolume;
            });
        });
    }

    play(type: SoundType) {
        if (type === 'bgm') {
            if (this.bgmMuted) return;
            if (!this.bgmPlaying) {
                this.bgm.play().catch(e => console.log("Audio play failed (user interaction needed):", e));
                this.bgmPlaying = true;
            }
            return;
        }

        // SFX
        if (this.sfxMuted) return;

        // 오디오 풀에서 다음 인스턴스 가져오기 (라운드 로빈)
        const pool = this.soundPools[type];
        const index = this.poolIndex[type];
        const audio = pool[index];

        // 다음 인덱스로 이동 (순환)
        this.poolIndex[type] = (index + 1) % pool.length;

        // 재생 중이면 처음부터 다시 재생
        audio.currentTime = 0;
        audio.play().catch(e => console.log("SFX play failed:", e));
    }

    stopBgm() {
        this.bgm.pause();
        this.bgm.currentTime = 0;
        this.bgmPlaying = false;
    }

    // BGM 음소거 토글
    toggleBgmMute(): boolean {
        this.bgmMuted = !this.bgmMuted;
        if (this.bgmMuted) {
            this.bgm.pause();
        } else {
            if (this.bgmPlaying) this.bgm.play();
        }
        this.saveSettings();
        return this.bgmMuted;
    }

    // SFX 음소거 토글
    toggleSfxMute(): boolean {
        this.sfxMuted = !this.sfxMuted;
        this.saveSettings();
        return this.sfxMuted;
    }

    // 전체 음소거 토글 (기존 호환)
    toggleMute(): boolean {
        const newMuted = !this.bgmMuted || !this.sfxMuted;
        this.bgmMuted = newMuted;
        this.sfxMuted = newMuted;
        if (this.bgmMuted) {
            this.bgm.pause();
        } else {
            if (this.bgmPlaying) this.bgm.play();
        }
        this.saveSettings();
        return newMuted;
    }

    // BGM 볼륨 설정 (0 ~ 1)
    setBgmVolume(volume: number) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        this.bgm.volume = this.bgmVolume;
        this.saveSettings();
    }

    // SFX 볼륨 설정 (0 ~ 1)
    setSfxVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updatePoolVolumes();
        this.saveSettings();
    }

    // Getters
    isBgmMuted(): boolean {
        return this.bgmMuted;
    }

    isSfxMuted(): boolean {
        return this.sfxMuted;
    }

    getBgmVolume(): number {
        return this.bgmVolume;
    }

    getSfxVolume(): number {
        return this.sfxVolume;
    }
}

export const soundManager = new SoundManager();
