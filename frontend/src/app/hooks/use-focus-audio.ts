import { useEffect, useState } from "react";
import {
  FOCUS_SOUNDS,
  focusAudioManager,
  type FocusSoundId,
} from "@/app/lib/focus-audio-manager";

export function useFocusAudio() {
  const [state, setState] = useState(focusAudioManager.getState());

  useEffect(() => {
    return focusAudioManager.subscribe(setState);
  }, []);

  return {
    sounds: FOCUS_SOUNDS,
    activeSoundId: state.activeSoundId,
    isPlaying: state.isPlaying,
    volume: Math.round(state.volume * 100),
    playSound: focusAudioManager.play.bind(focusAudioManager),
    pauseSound: focusAudioManager.pause.bind(focusAudioManager),
    stopSound: focusAudioManager.stop.bind(focusAudioManager),
    toggleSound: (soundId: FocusSoundId) => focusAudioManager.toggle(soundId),
    setVolume: (value: number) => focusAudioManager.setVolume(value),
  };
}
