import { Howl } from "howler";

export type FocusSoundId = "rain" | "water" | "nature" | "cafe";

export type FocusSoundDefinition = {
  id: FocusSoundId;
  name: string;
  description: string;
  color: string;
  icon: string;
  src: string;
};

type FocusAudioState = {
  activeSoundId: FocusSoundId | null;
  isPlaying: boolean;
  volume: number;
};

type Listener = (state: FocusAudioState) => void;

const STORAGE_SOUND_KEY = "focusspace_music_ambience";
const STORAGE_VOLUME_KEY = "focusspace_music_volume";
const DEFAULT_VOLUME = 0.5;
const FADE_DURATION_MS = 350;

export const FOCUS_SOUNDS: FocusSoundDefinition[] = [
  {
    id: "rain",
    name: "Rain",
    description: "Soft rain to calm the mind.",
    color: "#5b7c99",
    icon: "🌧️",
    src: "/audio/rain.mp3",
  },
  {
    id: "water",
    name: "Water",
    description: "Ocean and flowing water textures.",
    color: "#8fa8c4",
    icon: "🌊",
    src: "/audio/water.mp3",
  },
  {
    id: "nature",
    name: "Nature",
    description: "Forest ambience and birds.",
    color: "#7fa08f",
    icon: "🌿",
    src: "/audio/nature.mp3",
  },
  {
    id: "cafe",
    name: "Cafe",
    description: "Cozy cafe background chatter.",
    color: "#a98fb4",
    icon: "☕",
    src: "/audio/cafe.mp3",
  },
];

const getStoredVolume = () => {
  if (typeof window === "undefined") {
    return DEFAULT_VOLUME;
  }
  const raw = Number(window.localStorage.getItem(STORAGE_VOLUME_KEY));
  if (Number.isNaN(raw)) {
    return DEFAULT_VOLUME;
  }
  return Math.min(1, Math.max(0, raw / 100));
};

const getStoredSound = (): FocusSoundId | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_SOUND_KEY);
  return FOCUS_SOUNDS.some((sound) => sound.id === raw) ? (raw as FocusSoundId) : null;
};

class FocusAudioManager {
  private howls = new Map<FocusSoundId, Howl>();
  private listeners = new Set<Listener>();
  private state: FocusAudioState = {
    activeSoundId: getStoredSound(),
    isPlaying: false,
    volume: getStoredVolume(),
  };

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private persist() {
    if (typeof window === "undefined") {
      return;
    }
    if (this.state.activeSoundId) {
      window.localStorage.setItem(STORAGE_SOUND_KEY, this.state.activeSoundId);
    } else {
      window.localStorage.removeItem(STORAGE_SOUND_KEY);
    }
    window.localStorage.setItem(STORAGE_VOLUME_KEY, String(Math.round(this.state.volume * 100)));
  }

  private getHowl(soundId: FocusSoundId) {
    const existing = this.howls.get(soundId);
    if (existing) {
      existing.volume(this.state.volume);
      return existing;
    }

    const sound = FOCUS_SOUNDS.find((item) => item.id === soundId);
    if (!sound) {
      throw new Error(`Unknown sound: ${soundId}`);
    }

    const howl = new Howl({
      src: [sound.src],
      html5: true,
      loop: true,
      volume: this.state.volume,
      preload: true,
      onstop: () => {
        if (this.state.activeSoundId === soundId) {
          this.state = { ...this.state, isPlaying: false };
          this.emit();
        }
      },
      onpause: () => {
        if (this.state.activeSoundId === soundId) {
          this.state = { ...this.state, isPlaying: false };
          this.emit();
        }
      },
      onplay: () => {
        if (this.state.activeSoundId === soundId) {
          this.state = { ...this.state, isPlaying: true };
          this.emit();
        }
      },
      onloaderror: (_id, error) => {
        console.error(`[FocusAudio] Failed to load ${soundId}`, error);
      },
      onplayerror: (_id, error) => {
        console.error(`[FocusAudio] Failed to play ${soundId}`, error);
      },
    });

    this.howls.set(soundId, howl);
    return howl;
  }

  private fadeOutAndStop(soundId: FocusSoundId) {
    const howl = this.howls.get(soundId);
    if (!howl || !howl.playing()) {
      return;
    }
    const currentVolume = howl.volume();
    howl.off("fade");
    howl.once("fade", () => {
      howl.stop();
      howl.volume(this.state.volume);
    });
    howl.fade(currentVolume, 0, FADE_DURATION_MS);
  }

  play(soundId: FocusSoundId) {
    const previousSoundId = this.state.activeSoundId;
    if (previousSoundId && previousSoundId !== soundId) {
      this.fadeOutAndStop(previousSoundId);
    }

    const howl = this.getHowl(soundId);
    this.state = {
      ...this.state,
      activeSoundId: soundId,
    };
    this.persist();

    if (!howl.playing()) {
      howl.volume(0);
      howl.play();
      howl.fade(0, this.state.volume, FADE_DURATION_MS);
    } else {
      howl.fade(howl.volume(), this.state.volume, FADE_DURATION_MS);
    }

    this.state = {
      ...this.state,
      isPlaying: true,
    };
    this.emit();
  }

  pause() {
    if (!this.state.activeSoundId) {
      return;
    }
    const howl = this.howls.get(this.state.activeSoundId);
    if (!howl || !howl.playing()) {
      return;
    }
    const currentSoundId = this.state.activeSoundId;
    howl.off("fade");
    howl.once("fade", () => {
      howl.pause();
      howl.volume(this.state.volume);
      if (this.state.activeSoundId === currentSoundId) {
        this.state = { ...this.state, isPlaying: false };
        this.emit();
      }
    });
    howl.fade(howl.volume(), 0, FADE_DURATION_MS);
  }

  stop() {
    if (!this.state.activeSoundId) {
      return;
    }
    this.fadeOutAndStop(this.state.activeSoundId);
    this.state = {
      ...this.state,
      activeSoundId: null,
      isPlaying: false,
    };
    this.persist();
    this.emit();
  }

  toggle(soundId: FocusSoundId) {
    if (this.state.activeSoundId === soundId) {
      if (this.state.isPlaying) {
        this.pause();
      } else {
        this.play(soundId);
      }
      return;
    }
    this.play(soundId);
  }

  setVolume(nextVolumePercent: number) {
    const nextVolume = Math.min(1, Math.max(0, nextVolumePercent / 100));
    this.state = { ...this.state, volume: nextVolume };
    for (const howl of this.howls.values()) {
      howl.volume(nextVolume);
    }
    this.persist();
    this.emit();
  }

  unload() {
    for (const howl of this.howls.values()) {
      howl.unload();
    }
    this.howls.clear();
    this.listeners.clear();
  }
}

export const focusAudioManager = new FocusAudioManager();
