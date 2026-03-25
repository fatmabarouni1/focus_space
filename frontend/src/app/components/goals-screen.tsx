import { useState, useEffect } from 'react';
import { ArrowLeft, Target, Calendar, Clock, TrendingUp, Edit2, Check, Plus, Trash2, Award } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { motion } from 'motion/react';
import { createGoal, deleteGoal, fetchGoals, updateGoal } from '@/app/api/goals';
import { fetchDashboard, updateDashboardTargets, type DashboardPayload } from '@/app/api/dashboard';

interface Goal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  metric: 'sessions' | 'focusTime';
  target: number;
  current: number;
  createdAt: string;
}

interface CustomGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  deadline?: string;
}

interface GoalsScreenProps {
  authToken: string;
  onBack: () => void;
}

export function GoalsScreen({ authToken, onBack }: GoalsScreenProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [customGoals, setCustomGoals] = useState<CustomGoal[]>([]);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [customGoalError, setCustomGoalError] = useState('');
  const [loadingCustomGoals, setLoadingCustomGoals] = useState(false);
  const [savingCustomGoal, setSavingCustomGoal] = useState(false);
  const [unitChoice, setUnitChoice] = useState('pages');
  const [customUnit, setCustomUnit] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [dashboardError, setDashboardError] = useState('');

  const unitOptions = [
    'pages',
    'chapters',
    'minutes',
    'hours',
    'sessions',
    'tasks',
    'problems',
    'exercises',
    'flashcards',
    'videos',
    'lessons',
  ];

  useEffect(() => {
    loadDashboardData();
    loadCustomGoals();
  }, [authToken]);

  const loadDashboardData = async () => {
    if (!authToken) {
      setDashboardData(null);
      return;
    }
    setDashboardError('');
    try {
      const data = await fetchDashboard(authToken);
      setDashboardData(data);
    } catch (error: any) {
      setDashboardError(error.message || 'Failed to load goal targets.');
    }
  };

  useEffect(() => {
    if (!dashboardData) return;
    const defaultGoals: Goal[] = [
      {
        id: 'daily-sessions',
        type: 'daily',
        metric: 'sessions',
        target: dashboardData.targets.dailySessionsTarget,
        current: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'weekly-sessions',
        type: 'weekly',
        metric: 'sessions',
        target: dashboardData.targets.weeklySessionsTarget,
        current: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'daily-time',
        type: 'daily',
        metric: 'focusTime',
        target: dashboardData.targets.dailyFocusMinutesTarget,
        current: 0,
        createdAt: new Date().toISOString(),
      },
    ];
    setGoals(defaultGoals);
  }, [dashboardData]);

  const mapCustomGoal = (goal: {
    _id: string;
    title: string;
    description?: string;
    target: number;
    current?: number;
    unit: string;
    deadline?: string | null;
  }): CustomGoal => ({
    id: goal._id,
    title: goal.title || 'Untitled Goal',
    description: goal.description || '',
    target: goal.target,
    current: goal.current ?? 0,
    unit: goal.unit,
    deadline: goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : undefined,
  });

  const loadCustomGoals = async () => {
    if (!authToken) {
      setCustomGoals([]);
      return;
    }
    setLoadingCustomGoals(true);
    setCustomGoalError('');
    try {
      const goals = await fetchGoals(authToken);
      setCustomGoals(goals.map(mapCustomGoal));
    } catch (error: any) {
      setCustomGoalError(error.message || 'Failed to load custom goals.');
    } finally {
      setLoadingCustomGoals(false);
    }
  };

  const updateGoalTarget = async (goalId: string, newTarget: number) => {
    if (!authToken) {
      setDashboardError('Please sign in to update targets.');
      return;
    }
    setDashboardError('');
    const updatedGoals = goals.map(goal =>
      goal.id === goalId ? { ...goal, target: newTarget } : goal
    );
    setGoals(updatedGoals);

    const payload =
      goalId === 'daily-sessions'
        ? { dailySessionsTarget: newTarget }
        : goalId === 'weekly-sessions'
          ? { weeklySessionsTarget: newTarget }
          : { dailyFocusMinutesTarget: newTarget };

    try {
      const targets = await updateDashboardTargets(authToken, payload);
      setDashboardData((prev) =>
        prev
          ? {
              ...prev,
              targets: {
                dailySessionsTarget: targets.dailySessionsTarget,
                weeklySessionsTarget: targets.weeklySessionsTarget,
                dailyFocusMinutesTarget: targets.dailyFocusMinutesTarget,
              },
            }
          : prev
      );
      setEditingGoal(null);
    } catch (error: any) {
      setDashboardError(error.message || 'Failed to update targets.');
    }
  };

  const addCustomGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authToken) {
      setCustomGoalError('Please sign in to create goals.');
      return;
    }
    setSavingCustomGoal(true);
    setCustomGoalError('');
    const formData = new FormData(e.currentTarget);
    const resolvedUnit = unitChoice === 'custom' ? customUnit.trim() : unitChoice;

    if (!resolvedUnit) {
      setCustomGoalError('Please choose a unit or enter a custom unit.');
      setSavingCustomGoal(false);
      return;
    }

    try {
      const created = await createGoal(authToken, {
        title: (formData.get('title') as string) || 'Untitled Goal',
        description: (formData.get('description') as string) || '',
        target: Number(formData.get('target')),
        unit: resolvedUnit,
        deadline: (formData.get('deadline') as string) || undefined,
      });
      setCustomGoals((prev) => [mapCustomGoal(created), ...prev]);
      setNewGoalOpen(false);
      setUnitChoice('pages');
      setCustomUnit('');
    } catch (error: any) {
      setCustomGoalError(error.message || 'Failed to create custom goal.');
    } finally {
      setSavingCustomGoal(false);
    }
  };

  const updateCustomGoalProgress = async (goalId: string, progress: number) => {
    const updated = customGoals.map(goal =>
      goal.id === goalId ? { ...goal, current: progress } : goal
    );
    setCustomGoals(updated);

    if (!authToken) {
      setCustomGoalError('Please sign in to update goals.');
      return;
    }
    try {
      await updateGoal(authToken, goalId, { current: progress });
    } catch (error: any) {
      setCustomGoalError(error.message || 'Failed to update goal progress.');
    }
  };

  const deleteCustomGoal = async (goalId: string) => {
    if (!authToken) {
      setCustomGoalError('Please sign in to delete goals.');
      return;
    }
    setSavingCustomGoal(true);
    setCustomGoalError('');
    try {
      await deleteGoal(authToken, goalId);
      setCustomGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    } catch (error: any) {
      setCustomGoalError(error.message || 'Failed to delete custom goal.');
    } finally {
      setSavingCustomGoal(false);
    }
  };

  const getGoalProgress = (goal: Goal) => {
    if (!dashboardData) return 0;
    if (goal.type === 'daily') {
      return goal.metric === 'sessions'
        ? dashboardData.stats.sessionsToday
        : dashboardData.stats.focusMinutesToday;
    }
    return goal.metric === 'sessions'
      ? dashboardData.stats.sessionsThisWeek
      : dashboardData.stats.focusMinutesToday;
  };

  const formatGoalTitle = (goal: Goal) => {
    const typeLabel = goal.type.charAt(0).toUpperCase() + goal.type.slice(1);
    const metricLabel = goal.metric === 'sessions' ? 'Sessions' : 'Focus Time';
    return `${typeLabel} ${metricLabel}`;
  };

  const formatMetricValue = (value: number, metric: 'sessions' | 'focusTime') => {
    if (metric === 'sessions') {
      return `${value} session${value !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(value / 60);
    const mins = value % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'var(--success)';
    if (percentage >= 75) return 'var(--focus-primary)';
    if (percentage >= 50) return 'var(--break-primary)';
    return 'var(--muted-foreground)';
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const target = new Date(deadline);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="app-ambient min-h-screen bg-background/80">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--focus-light)' }}
            >
              <Target className="h-6 w-6" style={{ color: 'var(--focus-primary)' }} />
            </div>
            <div>
              <h1 className="text-3xl">Progress</h1>
              <p className="text-muted-foreground">Set targets and track your progress</p>
            </div>
          </div>
          {dashboardError && (
            <div className="text-sm text-destructive">{dashboardError}</div>
          )}
        </div>

        {/* Default Goals */}
        <div className="mb-12">
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Productivity Goals
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const current = getGoalProgress(goal);
              const percentage = Math.min((current / goal.target) * 100, 100);
              const isEditing = editingGoal === goal.id;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: 'var(--focus-light)' }}
                        >
                          {goal.type === 'daily' && <Calendar className="h-5 w-5" style={{ color: 'var(--focus-primary)' }} />}
                          {goal.type === 'weekly' && <TrendingUp className="h-5 w-5" style={{ color: 'var(--focus-primary)' }} />}
                          {goal.type === 'monthly' && <Award className="h-5 w-5" style={{ color: 'var(--focus-primary)' }} />}
                        </div>
                        <div>
                          <h3 className="font-medium">{formatGoalTitle(goal)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatMetricValue(current, goal.metric)} / {formatMetricValue(goal.target, goal.metric)}
                          </p>
                        </div>
                      </div>
                      
                      {!isEditing ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingGoal(goal.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingGoal(null)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <Label>Target</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="1"
                            defaultValue={goal.target}
                            id={`goal-${goal.id}`}
                          />
                          <Button
                            onClick={() => {
                              const input = document.getElementById(`goal-${goal.id}`) as HTMLInputElement;
                              updateGoalTarget(goal.id, Number(input.value));
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Progress bar */}
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: getProgressColor(percentage),
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {percentage.toFixed(0)}% complete
                            </span>
                            {percentage >= 100 && (
                              <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                                ✓ Goal achieved!
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Custom Goals */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl flex items-center gap-2">
              <Award className="h-5 w-5" />
              Custom Goals
            </h2>
            
            <Dialog open={newGoalOpen} onOpenChange={setNewGoalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Custom Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={addCustomGoal} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Goal Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Complete 3 chapters"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Add details about your goal"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="target">Goal amount</Label>
                      <Input
                        id="target"
                        name="target"
                        type="number"
                        min="1"
                        defaultValue="10"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        How many you want to reach (ex: 10).
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={unitChoice} onValueChange={setUnitChoice}>
                        <SelectTrigger id="unit">
                          <SelectValue placeholder="Pick a unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">custom...</SelectItem>
                        </SelectContent>
                      </Select>
                      {unitChoice === 'custom' ? (
                        <Input
                          placeholder="Type your unit"
                          value={customUnit}
                          onChange={(event) => setCustomUnit(event.target.value)}
                          required
                        />
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline (optional)</Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="date"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={savingCustomGoal}>
                    {savingCustomGoal ? 'Saving...' : 'Create Goal'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {customGoalError && (
            <div className="mb-4 text-sm text-destructive">{customGoalError}</div>
          )}

          {loadingCustomGoals ? (
            <Card className="p-12 text-center text-muted-foreground">
              Loading custom goals...
            </Card>
          ) : customGoals.length === 0 ? (
            <Card className="p-12 text-center">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg mb-2">No custom goals yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create personalized goals to track any aspect of your productivity
              </p>
              <Button onClick={() => setNewGoalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {customGoals.map((goal) => {
                const percentage = Math.min((goal.current / goal.target) * 100, 100);
                const daysLeft = getDaysUntilDeadline(goal.deadline);

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{goal.title}</h3>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {goal.description}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {goal.current} / {goal.target} {goal.unit}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCustomGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Progress control */}
                      <div className="space-y-3 mb-4">
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={goal.target}
                            value={goal.current}
                            onChange={(e) => updateCustomGoalProgress(goal.id, Number(e.target.value))}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={() => updateCustomGoalProgress(goal.id, goal.current + 1)}
                            disabled={goal.current >= goal.target}
                          >
                            +1
                          </Button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: getProgressColor(percentage),
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {percentage.toFixed(0)}% complete
                          </span>
                          {daysLeft !== null && daysLeft >= 0 && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                            </span>
                          )}
                        </div>
                      </div>

                      {percentage >= 100 && (
                        <div 
                          className="mt-4 p-3 rounded-lg text-sm font-medium text-center"
                          style={{ 
                            backgroundColor: 'var(--success-light)',
                            color: 'var(--success)'
                          }}
                        >
                          🎉 Goal completed!
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Motivational section */}
        <Card className="mt-8 p-6 bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-accent">
          <div className="flex items-start gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--focus-light)' }}
            >
              <Award className="h-6 w-6" style={{ color: 'var(--focus-primary)' }} />
            </div>
            <div>
              <h3 className="mb-2">Tips for Effective Goal Setting</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Set specific, measurable targets that challenge you without overwhelming</li>
                <li>• Review and adjust your goals regularly based on your progress</li>
                <li>• Celebrate small wins along the way to stay motivated</li>
                <li>• Break larger goals into smaller, achievable milestones</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
