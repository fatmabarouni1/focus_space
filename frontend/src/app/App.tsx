import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { LandingPage } from '@/app/components/landing-page';
import { AuthScreen } from '@/app/components/auth-screen';
import { Dashboard } from '@/app/components/dashboard';
import { TimerScreen } from '@/app/components/timer-screen';
import { GoalsScreen } from '@/app/components/goals-screen';
import { CalendarScreen } from '@/app/components/calendar-screen';
import { NotesPage } from '@/app/components/notes-page';
import { MusicPage } from '@/app/components/music-page';
import { RevisionPage } from '@/app/components/revision-page';
import { ModulePage } from '@/app/components/module-page';
import { RoomsPage } from '@/app/components/rooms-page';
import { RoomDetailPage } from '@/app/components/room-detail-page';
import { RoomCallMiniPanel } from '@/app/components/room-call-mini-panel';
import { RoomCallViewport } from '@/app/components/room-call-viewport';
import { AdminScreen } from '@/app/components/admin-screen';
import { SettingsScreen } from '@/app/components/settings-screen';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { LanguageSelector } from '@/app/components/language-selector';
import {
  Calendar,
  Goal,
  Headphones,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Settings,
  Shield,
  StickyNote,
  Timer,
  Video,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarOverlay,
  SidebarProvider,
  SidebarTrigger,
} from '@/app/components/ui/sidebar';
import { PomodoroProvider } from '@/app/context/pomodoro-context';
import { RoomCallProvider } from '@/app/context/room-call-context';
import { useAuth } from '@/app/context/auth-context';
import { useTranslation } from 'react-i18next';

type Screen =
  | 'landing'
  | 'auth'
  | 'dashboard'
  | 'timer'
  | 'goals'
  | 'calendar'
  | 'notes'
  | 'music'
  | 'revision'
  | 'module'
  | 'rooms'
  | 'room'
  | 'settings'
  | 'admin';

const screenRoutes: Record<Screen, string> = {
  landing: '/',
  auth: '/auth',
  dashboard: '/dashboard',
  timer: '/timer',
  goals: '/goals',
  calendar: '/calendar',
  notes: '/notes',
  music: '/music',
  revision: '/revision',
  module: '/revision',
  rooms: '/dashboard/rooms',
  room: '/dashboard/rooms',
  settings: '/settings',
  admin: '/admin',
};

const getScreenFromPath = (pathname: string): Screen => {
  switch (pathname) {
    case '/auth':
      return 'auth';
    case '/timer':
      return 'timer';
    case '/goals':
      return 'goals';
    case '/calendar':
      return 'calendar';
    case '/notes':
      return 'notes';
    case '/music':
      return 'music';
    case '/revision':
      return 'revision';
    case '/dashboard/rooms':
      return 'rooms';
    case '/settings':
      return 'settings';
    case '/admin':
      return 'admin';
    case '/dashboard':
      return 'dashboard';
    case '/':
    default:
      return 'landing';
  }
};

const screenErrorLog =
  (screen: Screen) => (error: Error, errorInfo: { componentStack: string }) => {
    if (import.meta.env.DEV) {
      console.error(`[Focus Space] Screen boundary error (${screen})`, error, errorInfo);
    }
  };

function AppContent() {
  const { t } = useTranslation();
  const { user, setAuthenticatedUser, clearAuth } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const navigateTo = (screen: Screen, moduleId?: string) => {
    setCurrentScreen(screen);
    const nextPath =
      screen === 'module' && moduleId ? `/revision/${moduleId}` : screenRoutes[screen] || '/';
    window.history.pushState({}, '', nextPath);
    if (screen === 'module' && moduleId) {
      setActiveModuleId(moduleId);
    }
    if (screen === 'rooms') {
      setActiveRoomId(null);
    }
  };

  useEffect(() => {
    const initialPath = window.location.pathname;

    if (initialPath.startsWith('/revision/')) {
      const moduleId = initialPath.split('/revision/')[1];
      if (moduleId && user) {
        setActiveModuleId(moduleId);
        setCurrentScreen('module');
        return;
      }
    }

    if (initialPath.startsWith('/dashboard/rooms/')) {
      const roomId = initialPath.split('/dashboard/rooms/')[1];
      if (roomId && user) {
        setActiveRoomId(roomId);
        setCurrentScreen('room');
        return;
      }
    }

    if (!user) {
      setCurrentScreen(initialPath === '/auth' ? 'auth' : 'landing');
      return;
    }

    const nextScreen = getScreenFromPath(initialPath);
    setCurrentScreen(nextScreen === 'landing' ? 'dashboard' : nextScreen);
  }, [user]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;

      if (path.startsWith('/revision/') && user) {
        const moduleId = path.split('/revision/')[1];
        if (moduleId) {
          setActiveModuleId(moduleId);
          setCurrentScreen('module');
          return;
        }
      }

      if (path.startsWith('/dashboard/rooms/') && user) {
        const roomId = path.split('/dashboard/rooms/')[1];
        if (roomId) {
          setActiveRoomId(roomId);
          setCurrentScreen('room');
          return;
        }
      }

      if (!user) {
        setCurrentScreen(path === '/auth' ? 'auth' : 'landing');
        return;
      }

      const nextScreen = getScreenFromPath(path);
      setCurrentScreen(nextScreen === 'landing' ? 'dashboard' : nextScreen);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const handleAuthenticated = (authenticatedUser: Parameters<typeof setAuthenticatedUser>[0]) => {
    setAuthenticatedUser(authenticatedUser);
    navigateTo('dashboard');
  };

  const handleSignOut = () => {
    clearAuth();
    setActiveModuleId(null);
    setActiveRoomId(null);
    window.history.pushState({}, '', '/');
    setCurrentScreen('landing');
  };

  const wrapScreen = (screen: Screen, node: ReactNode) => (
    <ErrorBoundary key={screen} onError={screenErrorLog(screen)}>
      {node}
    </ErrorBoundary>
  );

  const navItems = useMemo(
    () =>
      [
        { label: t('nav.home'), screen: 'dashboard', icon: LayoutDashboard },
        { label: t('nav.pomodoro'), screen: 'timer', icon: Timer },
        { label: t('nav.progress'), screen: 'goals', icon: Goal },
        { label: t('nav.planner'), screen: 'calendar', icon: Calendar },
        { label: t('nav.notebook'), screen: 'notes', icon: StickyNote },
        { label: t('nav.focusAudio'), screen: 'music', icon: Headphones },
        { label: t('nav.modules'), screen: 'revision', icon: LibraryBig },
        { label: t('nav.coStudy'), screen: 'rooms', icon: Video },
        { label: t('nav.settings'), screen: 'settings', icon: Settings },
        ...(user?.role === 'admin'
          ? [{ label: t('nav.admin'), screen: 'admin', icon: Shield }]
          : []),
      ] as const,
    [t, user?.role]
  );

  const renderAuthedScreen = () => {
    switch (currentScreen) {
      case 'timer':
        return wrapScreen('timer', <TimerScreen onBack={() => navigateTo('dashboard')} />);
      case 'goals':
        return wrapScreen(
          'goals',
          <GoalsScreen authToken={user?.token || ''} onBack={() => navigateTo('dashboard')} />
        );
      case 'calendar':
        return wrapScreen(
          'calendar',
          <CalendarScreen authToken={user?.token || ''} onBack={() => navigateTo('dashboard')} />
        );
      case 'notes':
        return wrapScreen(
          'notes',
          <NotesPage authToken={user?.token || ''} onBack={() => navigateTo('dashboard')} />
        );
      case 'music':
        return wrapScreen('music', <MusicPage />);
      case 'revision':
        return wrapScreen(
          'revision',
          <RevisionPage
            authToken={user?.token || ''}
            onOpenModule={(moduleId) => navigateTo('module', moduleId)}
          />
        );
      case 'module':
        return wrapScreen(
          'module',
          activeModuleId ? (
            <ModulePage
              authToken={user?.token || ''}
              moduleId={activeModuleId}
              onBack={() => navigateTo('revision')}
            />
          ) : (
            <RevisionPage
              authToken={user?.token || ''}
              onOpenModule={(moduleId) => navigateTo('module', moduleId)}
            />
          )
        );
      case 'rooms':
        return wrapScreen(
          'rooms',
          <RoomsPage
            authToken={user?.token || ''}
            onJoinRoom={(roomId) => {
              setActiveRoomId(roomId);
              setCurrentScreen('room');
              window.history.pushState({}, '', `/dashboard/rooms/${roomId}`);
            }}
          />
        );
      case 'room':
        return wrapScreen(
          'room',
          activeRoomId ? (
            <RoomDetailPage
              authToken={user?.token || ''}
              roomId={activeRoomId}
              onBack={() => {
                setActiveRoomId(null);
                setCurrentScreen('rooms');
                window.history.pushState({}, '', '/dashboard/rooms');
              }}
            />
          ) : (
            <RoomsPage
              authToken={user?.token || ''}
              onJoinRoom={(roomId) => {
                setActiveRoomId(roomId);
                setCurrentScreen('room');
                window.history.pushState({}, '', `/dashboard/rooms/${roomId}`);
              }}
            />
          )
        );
      case 'settings':
        return wrapScreen('settings', <SettingsScreen />);
      case 'admin':
        return wrapScreen('admin', <AdminScreen />);
      case 'dashboard':
      default:
        return wrapScreen(
          'dashboard',
          <Dashboard
            userName={user?.name || 'User'}
            authToken={user?.token || ''}
            onOpenTimer={() => navigateTo('timer')}
            onOpenGoals={() => navigateTo('goals')}
            onOpenCalendar={() => navigateTo('calendar')}
            onOpenNotes={() => navigateTo('notes')}
            onOpenRooms={() => navigateTo('rooms')}
            onJoinRoom={(roomId) => {
              setActiveRoomId(roomId);
              setCurrentScreen('room');
              window.history.pushState({}, '', `/dashboard/rooms/${roomId}`);
            }}
          />
        );
    }
  };

  const usesDashboardLayout =
    currentScreen === 'dashboard' ||
    currentScreen === 'music' ||
    currentScreen === 'revision' ||
    currentScreen === 'module' ||
    currentScreen === 'rooms' ||
    currentScreen === 'room' ||
    currentScreen === 'settings' ||
    currentScreen === 'admin';

  const handleReturnToRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setCurrentScreen('room');
    window.history.pushState({}, '', `/dashboard/rooms/${roomId}`);
  };

  const handleLeaveRoomFromPanel = () => {
    setActiveRoomId(null);
    if (currentScreen === 'room') {
      setCurrentScreen('rooms');
      window.history.pushState({}, '', '/dashboard/rooms');
    }
  };

  if (!user && currentScreen === 'landing') {
    return wrapScreen(
      'landing',
      <LandingPage onGetStarted={() => setCurrentScreen('auth')} />
    );
  }

  if (!user && currentScreen === 'auth') {
    return wrapScreen(
      'auth',
      <AuthScreen onAuthenticated={handleAuthenticated} onBack={() => setCurrentScreen('landing')} />
    );
  }

  if (currentScreen === 'timer') {
    return (
      <PomodoroProvider>
        <RoomCallProvider authToken={user?.token || ''} displayName={user?.name}>
          <ErrorBoundary onError={screenErrorLog('timer')}>
            <TimerScreen onBack={() => navigateTo('dashboard')} />
          </ErrorBoundary>
          <RoomCallMiniPanel
            onReturnToRoom={handleReturnToRoom}
            onLeaveRoom={handleLeaveRoomFromPanel}
          />
        </RoomCallProvider>
      </PomodoroProvider>
    );
  }

  return (
    <ErrorBoundary onError={screenErrorLog(currentScreen)}>
      <PomodoroProvider>
        <RoomCallProvider authToken={user?.token || ''} displayName={user?.name}>
          <SidebarProvider>
            <SidebarOverlay />
            <Sidebar collapsible="offcanvas">
              <SidebarContent>
                  <SidebarGroup>
                  <SidebarGroupLabel>{t('app.brand')}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton
                              isActive={currentScreen === item.screen}
                              onClick={() => navigateTo(item.screen)}
                            >
                              <Icon />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter>
                <div className="px-2 pb-2">
                  <LanguageSelector />
                </div>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleSignOut}>
                      <LogOut />
                      <span>{t('app.signOut')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>
            <SidebarInset className="app-ambient bg-background/80">
              {usesDashboardLayout ? (
                <>
                  <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
                    <div className="container mx-auto px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SidebarTrigger className="h-10 w-10 rounded-2xl border border-border/70 bg-background/80 shadow-sm" />
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ backgroundColor: 'var(--focus-light)' }}
                          >
                            <LibraryBig className="h-5 w-5 text-[var(--focus-primary)]" />
                          </div>
                          <div>
                            <h1 className="text-xl">{t('app.brand')}</h1>
                            <p className="text-sm text-muted-foreground">
                              {t('app.tagline')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-36">
                            <LanguageSelector />
                          </div>
                          <Button variant="ghost" size="sm" onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            {t('app.signOut')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </header>

                  <main className="container mx-auto px-6 py-8">
                    <RoomCallViewport />
                    {renderAuthedScreen()}
                  </main>

                  <footer className="mt-12 border-t border-border">
                    <div className="container mx-auto px-6 py-6">
                      <p className="text-center text-sm text-muted-foreground">
                        {t('app.footer')}
                      </p>
                    </div>
                  </footer>
                </>
              ) : (
                <>
                  <div className="pointer-events-none fixed left-4 top-4 z-40 md:block">
                    <div className="pointer-events-auto">
                      <SidebarTrigger className="h-10 w-10 rounded-2xl border border-border/70 bg-background/85 shadow-sm" />
                    </div>
                  </div>
                  <RoomCallViewport />
                  {renderAuthedScreen()}
                </>
              )}
              <RoomCallMiniPanel
                onReturnToRoom={handleReturnToRoom}
                onLeaveRoom={handleLeaveRoomFromPanel}
              />
            </SidebarInset>
          </SidebarProvider>
        </RoomCallProvider>
      </PomodoroProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return <AppContent />;
}
