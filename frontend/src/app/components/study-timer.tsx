import { useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, Maximize2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { BaseCard } from '@/app/components/base-card';
import { cn } from '@/app/components/ui/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { usePomodoro } from '@/app/context/pomodoro-context';

interface StudyTimerProps {
  onSessionComplete?: (durationMinutes: number) => void;
  onFullscreen?: () => void;
  className?: string;
  embedded?: boolean;
}

export function StudyTimer({ onSessionComplete, onFullscreen, className, embedded = false }: StudyTimerProps) {
  const {
    remainingSeconds,
    currentDurationSeconds,
    isRunning,
    mode,
    settings,
    sessionCount,
    start,
    pause,
    reset,
    updateSettings,
    registerSessionComplete,
  } = usePomodoro();

  useEffect(() => {
    if (!onSessionComplete) {
      return;
    }
    return registerSessionComplete(onSessionComplete);
  }, [onSessionComplete, registerSessionComplete]);

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
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    };
    updateSettings(newSettings);
  };

  const Container = embedded ? 'div' : BaseCard;
  const containerClassName = cn(
    embedded ? 'relative overflow-hidden' : 'p-8 relative overflow-hidden',
    className
  );

  return (
    <Container className={containerClassName}>
      {/* Background gradient based on mode */}
      <div 
        className="absolute inset-0 opacity-10 transition-all duration-1000"
        style={{
          background: mode === 'focus' 
            ? 'radial-gradient(circle at 50% 50%, var(--focus-primary), transparent)'
            : 'radial-gradient(circle at 50% 50%, var(--break-primary), transparent)'
        }}
      />
      
      <div className="relative z-10">
        {/* Mode indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)',
                boxShadow: `0 0 10px ${mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)'}`
              }}
            />
            <span className="text-muted-foreground">
              {mode === 'focus' ? 'Focus Session' : 'Break Time'}
            </span>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
                  <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                  <Input
                    id="breakDuration"
                    name="breakDuration"
                    type="number"
                    min="1"
                    max="60"
                    defaultValue={settings.breakDuration}
                  />
                </div>
                <Button type="submit" className="w-full">Save Settings</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Timer display */}
        <div className="text-center mb-8">
          <div 
            className="text-8xl mb-4 transition-colors duration-500"
            style={{
              color: mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)'
            }}
          >
            {formatTime(remainingSeconds)}
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-1000 ease-linear"
              style={{
                width: `${progress}%`,
                backgroundColor: mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)'
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={toggleTimer}
            size="lg"
            className="w-32"
            style={{
              backgroundColor: mode === 'focus' ? 'var(--focus-primary)' : 'var(--break-primary)',
              color: 'white'
            }}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start
              </>
            )}
          </Button>
          
          <Button onClick={reset} variant="outline" size="lg">
            <RotateCcw className="h-5 w-5" />
          </Button>
          
          <Button onClick={onFullscreen} variant="outline" size="lg">
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Session count */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Completed sessions today: <span className="font-medium">{sessionCount}</span>
          </p>
        </div>
      </div>
    </Container>
  );
}
