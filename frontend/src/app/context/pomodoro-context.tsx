import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type TimerMode = 'focus' | 'break';

type PomodoroSettings = {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
};

type PomodoroContextValue = {
  remainingSeconds: number;
  currentDurationSeconds: number;
  isRunning: boolean;
  mode: TimerMode;
  settings: PomodoroSettings;
  sessionCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setMode: (mode: TimerMode) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  updateSettings: (updates: Partial<PomodoroSettings>) => void;
  registerSessionComplete: (handler: (durationMinutes: number) => void) => () => void;
};

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

const toFocusSeconds = (settings: PomodoroSettings) => settings.focusDuration * 60;
const toBreakSeconds = (settings: PomodoroSettings, nextSessionCount: number) => {
  const useLongBreak = nextSessionCount % settings.sessionsBeforeLongBreak === 0;
  return (useLongBreak ? settings.longBreakDuration : settings.breakDuration) * 60;
};

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [remainingSeconds, setRemainingSeconds] = useState(() => toFocusSeconds(DEFAULT_SETTINGS));
  const [currentDurationSeconds, setCurrentDurationSeconds] = useState(() => toFocusSeconds(DEFAULT_SETTINGS));
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const sessionCompleteRef = useRef<((durationMinutes: number) => void) | null>(null);

  const registerSessionComplete = useCallback((handler: (durationMinutes: number) => void) => {
    sessionCompleteRef.current = handler;
    return () => {
      if (sessionCompleteRef.current === handler) {
        sessionCompleteRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback((nextMode: TimerMode) => {
    if (!soundEnabled) {
      return;
    }
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = nextMode === 'focus' ? 528 : 440;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
  }, [soundEnabled]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);

    if (mode === 'focus') {
      const nextSessionCount = sessionCount + 1;
      setSessionCount(nextSessionCount);

      const today = new Date().toDateString();
      const statsKey = `focusspace_stats_${today}`;
      const currentStats = JSON.parse(
        localStorage.getItem(statsKey) || '{"sessions": 0, "focusTime": 0}'
      );
      currentStats.sessions += 1;
      currentStats.focusTime += settings.focusDuration;
      localStorage.setItem(statsKey, JSON.stringify(currentStats));

      if (sessionCompleteRef.current) {
        sessionCompleteRef.current(settings.focusDuration);
      }

      const nextDuration = toBreakSeconds(settings, nextSessionCount);
      setMode('break');
      setCurrentDurationSeconds(nextDuration);
      setRemainingSeconds(nextDuration);
      playNotificationSound('break');
    } else {
      const nextDuration = toFocusSeconds(settings);
      setMode('focus');
      setCurrentDurationSeconds(nextDuration);
      setRemainingSeconds(nextDuration);
      playNotificationSound('focus');
    }
  }, [mode, sessionCount, settings, playNotificationSound]);

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => prev - 1);
      }, 1000);
    } else if (remainingSeconds === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, remainingSeconds, handleTimerComplete]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    const nextDuration =
      mode === 'focus' ? toFocusSeconds(settings) : toBreakSeconds(settings, sessionCount);
    setCurrentDurationSeconds(nextDuration);
    setRemainingSeconds(nextDuration);
  }, [mode, settings, sessionCount]);

  const setModeManually = useCallback(
    (nextMode: TimerMode) => {
      setIsRunning(false);
      setMode(nextMode);
      const nextDuration =
        nextMode === 'focus' ? toFocusSeconds(settings) : toBreakSeconds(settings, sessionCount);
      setCurrentDurationSeconds(nextDuration);
      setRemainingSeconds(nextDuration);
    },
    [settings, sessionCount]
  );

  const updateSettings = useCallback(
    (updates: Partial<PomodoroSettings>) => {
      setSettings((prev) => {
        const nextSettings = { ...prev, ...updates };
        if (!isRunning) {
          const nextDuration =
            mode === 'focus' ? toFocusSeconds(nextSettings) : toBreakSeconds(nextSettings, sessionCount);
          setCurrentDurationSeconds(nextDuration);
          setRemainingSeconds(nextDuration);
        }
        return nextSettings;
      });
    },
    [isRunning, mode, sessionCount]
  );

  const value = useMemo<PomodoroContextValue>(
    () => ({
      remainingSeconds,
      currentDurationSeconds,
      isRunning,
      mode,
      settings,
      sessionCount,
      soundEnabled,
      setSoundEnabled,
      setMode: setModeManually,
      start,
      pause,
      reset,
      updateSettings,
      registerSessionComplete,
    }),
    [
      remainingSeconds,
      currentDurationSeconds,
      isRunning,
      mode,
      settings,
      sessionCount,
      soundEnabled,
      start,
      pause,
      reset,
      setModeManually,
      updateSettings,
      registerSessionComplete,
    ]
  );

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
