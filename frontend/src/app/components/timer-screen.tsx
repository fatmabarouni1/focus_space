import { useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, ArrowLeft, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { CompactMusicPlayer } from '@/app/components/compact-music-player';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { motion } from 'motion/react';
import { usePomodoro } from '@/app/context/pomodoro-context';

interface TimerScreenProps {
  onBack: () => void;
}

export function TimerScreen({ onBack }: TimerScreenProps) {
  const {
    remainingSeconds,
    currentDurationSeconds,
    isRunning,
    mode,
    settings,
    sessionCount,
    soundEnabled,
    setSoundEnabled,
    start,
    pause,
    reset,
    updateSettings,
  } = usePomodoro();

  // Update document title with time
  useEffect(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    document.title = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} - Focus Space`;
    
    return () => {
      document.title = 'Focus Space';
    };
  }, [remainingSeconds]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBack]);

  const toggleTimer = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      minutes: mins.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0'),
    };
  };

  const progress = currentDurationSeconds
    ? ((currentDurationSeconds - remainingSeconds) / currentDurationSeconds) * 100
    : 0;

  const handleSettingsSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSettings = {
      focusDuration: Number(formData.get('focusDuration')),
      breakDuration: Number(formData.get('breakDuration')),
      longBreakDuration: Number(formData.get('longBreakDuration')),
      sessionsBeforeLongBreak: Number(formData.get('sessionsBeforeLongBreak')),
    };
    updateSettings(newSettings);
  };

  const time = formatTime(remainingSeconds);
  const timerShellSize = 'min(24rem, 50vh, 88vw)';
  const minutesFontSize = 'clamp(4rem, 14vw, 5.75rem)';
  const colonFontSize = 'clamp(2.75rem, 9vw, 4.5rem)';

  return (
    <div className="fixed inset-0 z-[80] h-screen w-screen overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: mode === 'focus'
              ? 'radial-gradient(circle at 30% 40%, rgba(91, 124, 153, 0.15), transparent 60%), radial-gradient(circle at 70% 60%, rgba(91, 124, 153, 0.1), transparent 60%)'
              : 'radial-gradient(circle at 30% 40%, rgba(169, 143, 180, 0.15), transparent 60%), radial-gradient(circle at 70% 60%, rgba(169, 143, 180, 0.1), transparent 60%)',
          }}
          transition={{ duration: 2 }}
        />
        
        {/* Animated particles */}
        {isRunning && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full opacity-20"
                style={{
                  backgroundColor: mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)',
                  left: `${20 + i * 15}%`,
                  top: `${30 + i * 10}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  x: [-10, 10, -10],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </>
        )}
      </div>

      <div className="relative flex h-full w-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-5">
          <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full px-3">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Timer Settings</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSettingsSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="focusDuration">Focus Duration (minutes)</Label>
                    <Input
                      id="focusDuration"
                      name="focusDuration"
                      type="number"
                      min="1"
                      max="120"
                      defaultValue={settings.focusDuration}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breakDuration">Short Break (minutes)</Label>
                    <Input
                      id="breakDuration"
                      name="breakDuration"
                      type="number"
                      min="1"
                      max="30"
                      defaultValue={settings.breakDuration}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longBreakDuration">Long Break (minutes)</Label>
                    <Input
                      id="longBreakDuration"
                      name="longBreakDuration"
                      type="number"
                      min="1"
                      max="60"
                      defaultValue={settings.longBreakDuration}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionsBeforeLongBreak">Sessions before long break</Label>
                    <Input
                      id="sessionsBeforeLongBreak"
                      name="sessionsBeforeLongBreak"
                      type="number"
                      min="2"
                      max="10"
                      defaultValue={settings.sessionsBeforeLongBreak}
                    />
                  </div>
                  <Button type="submit" className="w-full">Save Settings</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-4 sm:px-6 sm:pb-8">
          <div className="flex w-full max-w-5xl flex-col items-center justify-center">
            <motion.div
              className="mb-4 flex items-center gap-3 sm:mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                className="h-4 w-4 rounded-full"
                style={{
                  backgroundColor: mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)',
                }}
                animate={{
                  scale: isRunning ? [1, 1.2, 1] : 1,
                  boxShadow: isRunning
                    ? [
                        `0 0 10px ${mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)'}`,
                        `0 0 20px ${mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)'}`,
                        `0 0 10px ${mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)'}`,
                      ]
                    : 'none',
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-base text-muted-foreground sm:text-lg">
                {mode === 'focus' ? 'Focus Session' : 'Break Time'}
              </span>
            </motion.div>

            <div className="relative mb-5 sm:mb-8">
              <svg
                className="absolute inset-0 mx-auto -rotate-90"
                style={{ width: timerShellSize, height: timerShellSize }}
              >
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/30"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  className="transition-colors duration-1000"
                  style={{
                    color: mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)',
                    strokeDasharray: '283%',
                    strokeDashoffset: `${283 - (progress / 100) * 283}%`,
                  }}
                  initial={{ strokeDashoffset: '283%' }}
                  animate={{ strokeDashoffset: `${283 - (progress / 100) * 283}%` }}
                  transition={{ duration: 0.5 }}
                />
              </svg>

              <div
                className="relative z-10 flex items-center justify-center"
                style={{ width: timerShellSize, height: timerShellSize }}
              >
                <motion.div
                  className="text-center"
                  animate={{
                    scale: isRunning && remainingSeconds % 2 === 0 ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="mb-4 flex items-baseline justify-center gap-1 sm:gap-2"
                    style={{ color: mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)' }}
                  >
                    <span className="font-light tracking-tight" style={{ fontSize: minutesFontSize }}>
                      {time.minutes}
                    </span>
                    <span className="font-light opacity-50" style={{ fontSize: colonFontSize }}>:</span>
                    <span className="font-light tracking-tight" style={{ fontSize: minutesFontSize }}>
                      {time.seconds}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="mb-5 w-full max-w-md sm:mb-7">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)',
                  }}
                />
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-center gap-3 sm:mb-8 sm:gap-4">
              <Button
                onClick={toggleTimer}
                size="lg"
                className="h-12 w-32 text-base shadow-lg transition-all hover:shadow-xl sm:h-14 sm:w-40 sm:text-lg"
                style={{
                  backgroundColor: mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)',
                  color: 'white',
                }}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-6 w-6" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-6 w-6" />
                    Start
                  </>
                )}
              </Button>

              <Button onClick={reset} variant="outline" size="lg" className="h-12 w-12 sm:h-14 sm:w-14">
                <RotateCcw className="h-6 w-6" />
              </Button>
            </div>

            <div className="text-center">
              <p className="mb-2 text-sm text-muted-foreground">
                Sessions completed today
              </p>
              <div className="flex items-center justify-center gap-2">
                {[...Array(Math.max(4, sessionCount))].map((_, i) => (
                  <div
                    key={i}
                    className="h-3 w-3 rounded-full transition-all"
                    style={{
                      backgroundColor: i < sessionCount ? 'var(--focus-primary)' : 'var(--muted)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-3 text-center sm:pb-6">
          <p className="text-sm text-muted-foreground">
            {mode === 'focus'
              ? 'Stay focused and eliminate distractions'
              : 'Take a break, you deserve it'}
          </p>
        </div>

        <CompactMusicPlayer />
      </div>
    </div>
  );
}
