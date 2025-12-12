
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

interface SoundSettings {
    bgmMuted: boolean;
    sfxMuted: boolean;
    bgmVolume: number;
    sfxVolume: number;
}

class SoundManager {
    private sounds: Record<SoundType, HTMLAudioElement>;
    private bgmMuted: boolean = false;
    private sfxMuted: boolean = false;
    private bgmVolume: number = 0.3;
    private sfxVolume: number = 0.5;
    private bgmPlaying: boolean = false;

    constructor() {
        this.sounds = {
            bgm: new Audio(bgmCasual),
            hit: new Audio(seHit),
            destroy: new Audio(seDestroy),
            coin: new Audio(seCoin),
            success: new Audio(seSuccess),
            fail: new Audio(seFail),
            click: new Audio(seClick),
        };

        // Configure BGM
        this.sounds.bgm.loop = true;
        this.sounds.bgm.volume = this.bgmVolume;

        // Preload sounds
        Object.values(this.sounds).forEach(audio => {
            audio.load();
        });

        // Load saved settings
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
                this.sounds.bgm.volume = this.bgmVolume;
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

    play(type: SoundType) {
        if (type === 'bgm') {
            if (this.bgmMuted) return;
            if (!this.bgmPlaying) {
                this.sounds.bgm.play().catch(e => console.log("Audio play failed (user interaction needed):", e));
                this.bgmPlaying = true;
            }
            return;
        }

        // SFX
        if (this.sfxMuted) return;

        // For SFX, clone node to allow overlapping sounds
        const sound = this.sounds[type].cloneNode() as HTMLAudioElement;
        sound.volume = this.sfxVolume;
        sound.play().catch(e => console.log("SFX play failed:", e));
    }

    stopBgm() {
        this.sounds.bgm.pause();
        this.sounds.bgm.currentTime = 0;
        this.bgmPlaying = false;
    }

    // BGM 음소거 토글
    toggleBgmMute(): boolean {
        this.bgmMuted = !this.bgmMuted;
        if (this.bgmMuted) {
            this.sounds.bgm.pause();
        } else {
            if (this.bgmPlaying) this.sounds.bgm.play();
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
            this.sounds.bgm.pause();
        } else {
            if (this.bgmPlaying) this.sounds.bgm.play();
        }
        this.saveSettings();
        return newMuted;
    }

    // BGM 볼륨 설정 (0 ~ 1)
    setBgmVolume(volume: number) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        this.sounds.bgm.volume = this.bgmVolume;
        this.saveSettings();
    }

    // SFX 볼륨 설정 (0 ~ 1)
    setSfxVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
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
