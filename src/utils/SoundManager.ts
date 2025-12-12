import { Howl, Howler } from 'howler';

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
    private bgm: Howl;
    private sounds: Record<Exclude<SoundType, 'bgm'>, Howl>;
    private bgmMuted: boolean = false;
    private sfxMuted: boolean = false;
    private bgmVolume: number = 0.3;
    private sfxVolume: number = 0.5;
    private bgmPlaying: boolean = false;

    constructor() {
        // BGM 설정 (HTML5 Audio로 스트리밍 - 긴 파일에 적합)
        this.bgm = new Howl({
            src: [bgmCasual],
            loop: true,
            volume: this.bgmVolume,
            html5: true, // 스트리밍으로 메모리 절약
            preload: true,
        });

        // SFX 설정 (Web Audio API - 빠른 재생, 낮은 지연)
        this.sounds = {
            hit: new Howl({
                src: [seHit],
                volume: this.sfxVolume,
                preload: true,
                pool: 5, // 동시 재생 가능 수
            }),
            destroy: new Howl({
                src: [seDestroy],
                volume: this.sfxVolume,
                preload: true,
                pool: 3,
            }),
            coin: new Howl({
                src: [seCoin],
                volume: this.sfxVolume,
                preload: true,
                pool: 4,
            }),
            success: new Howl({
                src: [seSuccess],
                volume: this.sfxVolume,
                preload: true,
                pool: 2,
            }),
            fail: new Howl({
                src: [seFail],
                volume: this.sfxVolume,
                preload: true,
                pool: 2,
            }),
            click: new Howl({
                src: [seClick],
                volume: this.sfxVolume,
                preload: true,
                pool: 3,
            }),
        };

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

                // 볼륨 적용
                this.bgm.volume(this.bgmVolume);
                this.updateSfxVolumes();
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

    private updateSfxVolumes() {
        Object.values(this.sounds).forEach(sound => {
            sound.volume(this.sfxVolume);
        });
    }

    play(type: SoundType) {
        if (type === 'bgm') {
            if (this.bgmMuted) return;
            if (!this.bgmPlaying) {
                this.bgm.play();
                this.bgmPlaying = true;
            }
            return;
        }

        // SFX
        if (this.sfxMuted) return;
        this.sounds[type].play();
    }

    stopBgm() {
        this.bgm.stop();
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
        this.bgm.volume(this.bgmVolume);
        this.saveSettings();
    }

    // SFX 볼륨 설정 (0 ~ 1)
    setSfxVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateSfxVolumes();
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

    // 전체 오디오 컨텍스트 음소거 (앱 백그라운드 시 유용)
    muteAll() {
        Howler.mute(true);
    }

    unmuteAll() {
        Howler.mute(false);
    }
}

export const soundManager = new SoundManager();
