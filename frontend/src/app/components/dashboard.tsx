import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StudyTimer } from '@/app/components/study-timer';
import { StudyRoom } from '@/app/components/study-room';
import { fetchDashboard, useFreezeToken, type DashboardPayload } from '@/app/api/dashboard';
import { completeSession } from '@/app/api/sessions';
import { BaseCard } from '@/app/components/base-card';
import { SecondaryButton } from '@/app/components/button-kit';
import { Pill } from '@/app/components/pill';
import { usePomodoro } from '@/app/context/pomodoro-context';
import { useFocusAudio } from '@/app/hooks/use-focus-audio';
import {
  Calendar,
  Clock,
  Sparkles,
  Target,
} from 'lucide-react';

interface DashboardProps {
  userName: string;
  authToken: string;
  onOpenTimer: () => void;
  onOpenGoals: () => void;
  onOpenCalendar: () => void;
  onOpenNotes: () => void;
  onOpenRooms: () => void;
  onJoinRoom: (roomId: string) => void;
}

export function Dashboard({
  userName,
  authToken,
  onOpenTimer,
  onOpenGoals,
  onOpenCalendar,
  onOpenNotes,
  onOpenRooms,
  onJoinRoom,
}: DashboardProps) {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [dashboardError, setDashboardError] = useState("");
  const { mode, setMode, soundEnabled, setSoundEnabled } = usePomodoro();
  const { activeSoundId, playSound, stopSound } = useFocusAudio();

  useEffect(() => {
    loadDashboard();
  }, [authToken]);

  const loadDashboard = async () => {
    if (!authToken) {
      setDashboardData(null);
      return;
    }
    setDashboardError("");
    try {
      const data = await fetchDashboard(authToken);
      setDashboardData(data);
    } catch (error: any) {
      setDashboardError(error.message || t('dashboard.suggestionsUnavailable'));
    } finally {
    }
  };

  const handleSessionComplete = async (durationMinutes: number) => {
    if (!authToken) return;
    try {
      await completeSession(authToken, { durationMinutes });
      await loadDashboard();
    } catch (error: any) {
      setDashboardError(error.message || t('dashboard.suggestionsUnavailable'));
    }
  };

  const handleUseFreezeToken = async () => {
    if (!authToken) return;
    try {
      const updatedStreaks = await useFreezeToken(authToken);
      setDashboardData((prev) => (prev ? { ...prev, streaks: updatedStreaks } : prev));
    } catch (error: any) {
      setDashboardError(error.message || t('dashboard.suggestionsUnavailable'));
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 18) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getProgressPercent = (value: number, target: number) => {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((value / target) * 100));
  };

  const getDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const getFormattedDate = () => {
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'long' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const stats = dashboardData?.stats;
  const targets = dashboardData?.targets;
  const streaks = dashboardData?.streaks;

  const sessionsToday = stats?.sessionsToday ?? 0;
  const sessionsTarget = targets?.dailySessionsTarget ?? 0;
  const focusMinutesToday = stats?.focusMinutesToday ?? 0;
  const focusMinutesTarget = targets?.dailyFocusMinutesTarget ?? 0;
  const sessionsProgress = getProgressPercent(sessionsToday, sessionsTarget);
  const focusProgress = getProgressPercent(focusMinutesToday, focusMinutesTarget);

  return (
    <div className="space-y-8">
      <BaseCard className="p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {getDayOfWeek()}, {getFormattedDate()}
            </div>
            <h2 className="mt-2 text-3xl font-semibold">
              {getGreeting()}, {userName}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Pill className="bg-muted text-muted-foreground">
              {t('dashboard.streak', { count: streaks?.streakCount ?? 0 })}
            </Pill>
            {streaks?.streakStatus === 'frozen' ? (
              <Pill className="bg-muted text-muted-foreground">{t('dashboard.freezeUsed')}</Pill>
            ) : null}
            {streaks?.warningActive ? (
              <Pill className="bg-amber-100 text-amber-700">{t('dashboard.streakAtRisk')}</Pill>
            ) : null}
            {streaks?.warningActive && (streaks?.freezeTokens ?? 0) > 0 ? (
              <SecondaryButton size="sm" onClick={handleUseFreezeToken}>
                {t('dashboard.useFreezeToken')}
              </SecondaryButton>
            ) : null}
          </div>
        </div>
      </BaseCard>

      {dashboardError ? <div className="text-sm text-destructive">{dashboardError}</div> : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr,1fr]">
          <BaseCard className="p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  {t('dashboard.primaryFocus')}
                </div>
                <h3 className="mt-2 text-2xl font-semibold">{t('dashboard.focusTimer')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton
                  size="sm"
                  variant={mode === 'focus' ? 'default' : 'outline'}
                  onClick={() => setMode('focus')}
                >
                  {t('dashboard.focus')}
                </SecondaryButton>
                <SecondaryButton
                  size="sm"
                  variant={mode === 'break' ? 'default' : 'outline'}
                  onClick={() => setMode('break')}
                >
                  {t('dashboard.break')}
                </SecondaryButton>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{t('dashboard.ambientSound')}</span>
              <SecondaryButton
                size="sm"
                variant={!activeSoundId ? 'default' : 'outline'}
                onClick={() => {
                  stopSound();
                  setSoundEnabled(false);
                }}
              >
                {t('dashboard.silence')}
              </SecondaryButton>
              <SecondaryButton
                size="sm"
                variant={activeSoundId === 'rain' ? 'default' : 'outline'}
                onClick={() => {
                  playSound('rain');
                  setSoundEnabled(true);
                }}
              >
                {t('dashboard.rain')}
              </SecondaryButton>
              <SecondaryButton
                size="sm"
                variant={activeSoundId === 'cafe' ? 'default' : 'outline'}
                onClick={() => {
                  playSound('cafe');
                  setSoundEnabled(true);
                }}
              >
                {t('dashboard.cafe')}
              </SecondaryButton>
              <Pill className="bg-muted text-muted-foreground">
                {soundEnabled ? t('dashboard.alertsOn') : t('dashboard.alertsOff')}
              </Pill>
            </div>

            <StudyTimer
              embedded
              className="pt-2"
              onSessionComplete={handleSessionComplete}
              onFullscreen={onOpenTimer}
            />
          </div>
          </BaseCard>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BaseCard className="rounded-[28px] border border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[var(--focus-light)]">
                        <Target className="h-4 w-4" style={{ color: 'var(--focus-primary)' }} />
                      </div>
                      {t('dashboard.sessionsToday')}
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-semibold leading-none">{sessionsToday}</div>
                      <div className="pb-0.5 text-sm text-muted-foreground">/ {sessionsTarget || 0}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sessionsTarget > 0
                        ? t('dashboard.dailyTargetReached', { percent: sessionsProgress })
                        : t('dashboard.setDailyTarget')}
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background text-sm font-medium text-foreground/80">
                    {sessionsProgress}%
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted/70">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${sessionsProgress}%`,
                      backgroundColor: 'var(--focus-primary)',
                    }}
                  />
                </div>
              </BaseCard>

              <BaseCard className="rounded-[28px] border border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-muted/50">
                        <Clock className="h-4 w-4" style={{ color: 'var(--break-primary)' }} />
                      </div>
                      {t('dashboard.focusTimeToday')}
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-semibold leading-none">{formatMinutes(focusMinutesToday)}</div>
                      <div className="pb-0.5 text-sm text-muted-foreground">/ {formatMinutes(focusMinutesTarget || 0)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {focusMinutesTarget > 0
                        ? t('dashboard.targetTimeReached', { percent: focusProgress })
                        : t('dashboard.setFocusTarget')}
                    </div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-background text-sm font-medium text-foreground/80">
                    {focusProgress}%
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted/70">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${focusProgress}%`,
                      backgroundColor: 'var(--break-primary)',
                    }}
                  />
                </div>
              </BaseCard>
            </div>

            <StudyRoom authToken={authToken} onOpenRooms={onOpenRooms} onJoinRoom={onJoinRoom} />
          </div>
        </div>
    </div>
  );
}
