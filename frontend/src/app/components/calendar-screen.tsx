import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Target, Edit2, Trash2, Check } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { createEvent, deleteEvent, fetchEvents, updateEvent } from '@/app/api/events';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  type: 'session' | 'deadline' | 'task';
  completed?: boolean;
  duration?: number; // in minutes for sessions
}

interface CalendarScreenProps {
  authToken: string;
  onBack: () => void;
}

export function CalendarScreen({ authToken, onBack }: CalendarScreenProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventError, setEventError] = useState('');

  useEffect(() => {
    loadEvents();
  }, [authToken]);

  const mapEvent = (event: {
    _id: string;
    title: string;
    description?: string;
    date: string;
    time?: string;
    type: 'session' | 'deadline' | 'task';
    completed?: boolean;
    duration?: number | null;
  }): CalendarEvent => ({
    id: event._id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time || undefined,
    type: event.type,
    completed: event.completed ?? false,
    duration: event.duration ?? undefined,
  });

  const loadEvents = async () => {
    if (!authToken) {
      setEvents([]);
      return;
    }
    setLoadingEvents(true);
    setEventError('');
    try {
      const loaded = await fetchEvents(authToken);
      setEvents(loaded.map(mapEvent));
    } catch (error: any) {
      setEventError(error.message || 'Failed to load events.');
    } finally {
      setLoadingEvents(false);
    }
  };

  const addEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authToken) {
      setEventError('Please sign in to create events.');
      return;
    }
    setEventError('');
    const formData = new FormData(e.currentTarget);
    
    try {
      const created = await createEvent(authToken, {
        title: (formData.get('title') as string) || 'Untitled Event',
        description: (formData.get('description') as string) || '',
        date: formData.get('date') as string,
        time: (formData.get('time') as string) || undefined,
        type: formData.get('type') as 'session' | 'deadline' | 'task',
        duration: formData.get('duration') ? Number(formData.get('duration')) : undefined,
      });
      setEvents((prev) => [...prev, mapEvent(created)]);
      setNewEventOpen(false);
    } catch (error: any) {
      setEventError(error.message || 'Failed to create event.');
    }
  };

  const toggleEventComplete = async (eventId: string) => {
    if (!authToken) {
      setEventError('Please sign in to update events.');
      return;
    }
    setEventError('');
    const targetEvent = events.find((event) => event.id === eventId);
    if (!targetEvent) return;
    const nextCompleted = !targetEvent.completed;
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, completed: nextCompleted } : event
      )
    );
    try {
      await updateEvent(authToken, eventId, { completed: nextCompleted });
    } catch (error: any) {
      setEventError(error.message || 'Failed to update event.');
    }
  };

  const removeEvent = async (eventId: string) => {
    if (!authToken) {
      setEventError('Please sign in to delete events.');
      return;
    }
    setEventError('');
    try {
      await deleteEvent(authToken, eventId);
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error: any) {
      setEventError(error.message || 'Failed to delete event.');
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDateToString(date);
    return events.filter(event => event.date === dateStr);
  };

  const formatDateToString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSameDate = (date1: Date | null, date2: Date) => {
    if (!date1) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'session':
        return 'var(--focus-primary)';
      case 'deadline':
        return 'var(--destructive)';
      case 'task':
        return 'var(--break-primary)';
      default:
        return 'var(--muted-foreground)';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'session':
        return Clock;
      case 'deadline':
        return Target;
      case 'task':
        return Check;
      default:
        return CalendarIcon;
    }
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="app-ambient min-h-screen bg-background/80">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--focus-light)' }}
            >
              <CalendarIcon className="h-6 w-6" style={{ color: 'var(--focus-primary)' }} />
            </div>
            <div>
              <h1 className="text-3xl">Planner</h1>
              <p className="text-muted-foreground">Schedule sessions and track deadlines</p>
            </div>
          </div>

          <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={addEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Study Session"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Event Type</Label>
                  <select
                    id="type"
                    name="type"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="session">Study Session</option>
                    <option value="task">Task</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      defaultValue={selectedDate ? formatDateToString(selectedDate) : formatDateToString(new Date())}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time (optional)</Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes, optional)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="5"
                    placeholder="e.g., 25"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Add details..."
                  />
                </div>

                {eventError && (
                  <div className="text-sm text-destructive">{eventError}</div>
                )}
                <Button type="submit" className="w-full">Create Event</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {eventError && (
                <div className="mb-4 text-sm text-destructive">{eventError}</div>
              )}
              {/* Calendar header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl">{monthName}</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dayEvents = getEventsForDate(date);
                  const isSelected = isSameDate(selectedDate, date);
                  const isTodayDate = isToday(date);

                  return (
                    <motion.button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`aspect-square rounded-lg border transition-all relative p-2 text-left hover:border-primary ${
                        isSelected ? 'border-primary bg-primary/10' : 'border-border'
                      } ${isTodayDate ? 'bg-accent' : ''}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className={`text-sm ${isSelected ? 'font-bold' : ''} ${isTodayDate ? 'font-semibold' : ''}`}>
                        {date.getDate()}
                      </span>

                      {/* Event indicators */}
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 flex-wrap">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: getEventColor(event.type) }}
                            />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </Card>

            {/* Quick add section */}
            <Card className="p-6 mt-6">
              <h3 className="mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Quick Add
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => setNewEventOpen(true)}
                >
                  <Clock className="h-5 w-5 mb-2" style={{ color: 'var(--focus-primary)' }} />
                  <span className="text-sm">Study Session</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => setNewEventOpen(true)}
                >
                  <Check className="h-5 w-5 mb-2" style={{ color: 'var(--break-primary)' }} />
                  <span className="text-sm">Task</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => setNewEventOpen(true)}
                >
                  <Target className="h-5 w-5 mb-2" style={{ color: 'var(--destructive)' }} />
                  <span className="text-sm">Deadline</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Events sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="mb-4">
                {selectedDate
                  ? selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric' })
                  : 'Select a date'}
              </h3>

              <AnimatePresence mode="wait">
                {loadingEvents ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading events...
                  </motion.div>
                ) : selectedDateEvents.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: 'var(--muted)' }}
                    >
                      <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No events scheduled
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      onClick={() => setNewEventOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="events"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {selectedDateEvents.map(event => {
                      const Icon = getEventIcon(event.type);
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 rounded-lg border-l-4 bg-card ${
                            event.completed ? 'opacity-60' : ''
                          }`}
                          style={{ borderLeftColor: getEventColor(event.type) }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-start gap-2 flex-1">
                              <Icon
                                className="h-4 w-4 mt-0.5 flex-shrink-0"
                                style={{ color: getEventColor(event.type) }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm ${event.completed ? 'line-through' : ''}`}>
                                  {event.title}
                                </h4>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {event.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  {event.time && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {event.time}
                                    </span>
                                  )}
                                  {event.duration && (
                                    <span>{event.duration}min</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {event.type !== 'deadline' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleEventComplete(event.id)}
                                >
                                  <Check className={`h-3 w-3 ${event.completed ? 'text-success' : ''}`} />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeEvent(event.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Upcoming deadlines */}
            <Card className="p-6 mt-4">
              <h3 className="mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" style={{ color: 'var(--destructive)' }} />
                Upcoming Deadlines
              </h3>
              {events
                .filter(event => event.type === 'deadline' && new Date(event.date) >= new Date())
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 3)
                .map(event => (
                  <div key={event.id} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-b-0">
                    <h4 className="text-sm font-medium">{event.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))
              }
              {events.filter(event => event.type === 'deadline' && new Date(event.date) >= new Date()).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming deadlines
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
