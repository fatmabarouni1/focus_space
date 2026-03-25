import { useEffect, useState } from 'react';
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
import {
  BookOpen,
  Calendar,
  Goal,
  LayoutDashboard,
  LogOut,
  Headphones,
  LibraryBig,
  StickyNote,
  Timer,
  Video,
  Shield,
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
  | 'admin';

interface User {
  name: string;
  email: string;
  token: string;
  role: 'user' | 'admin';
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

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
    admin: '/admin',
  };

  const getScreenFromPath = (pathname: string): Screen => {
    switch (pathname) {
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
      case '/admin':
        return 'admin';
      case '/dashboard':
      default:
        return 'dashboard';
    }
  };

  const navigateTo = (screen: Screen, moduleId?: string) => {
    setCurrentScreen(screen);
    const nextPath =
      screen === 'module' && moduleId
        ? `/revision/${moduleId}`
        : screenRoutes[screen] || '/';
    window.history.pushState({}, '', nextPath);
    if (screen === 'module' && moduleId) {
      setActiveModuleId(moduleId);
    }
    if (screen === 'rooms') {
      setActiveRoomId(null);
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('focusspace_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser?.token) {
        setUser({ role: 'user', ...parsedUser });
        const initialPath = window.location.pathname;
        if (initialPath.startsWith('/revision/')) {
          const moduleId = initialPath.split('/revision/')[1];
          if (moduleId) {
            setActiveModuleId(moduleId);
            setCurrentScreen('module');
            return;
          }
        }
        if (initialPath.startsWith('/dashboard/rooms/')) {
          const roomId = initialPath.split('/dashboard/rooms/')[1];
          if (roomId) {
            setActiveRoomId(roomId);
            setCurrentScreen('room');
            return;
          }
        }
        setCurrentScreen(getScreenFromPath(initialPath));
      } else {
        localStorage.removeItem('focusspace_user');
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (!user) return;
      const path = window.location.pathname;
      if (path.startsWith('/revision/')) {
        const moduleId = path.split('/revision/')[1];
        if (moduleId) {
          setActiveModuleId(moduleId);
          setCurrentScreen('module');
          return;
        }
      }
      if (path.startsWith('/dashboard/rooms/')) {
        const roomId = path.split('/dashboard/rooms/')[1];
        if (roomId) {
          setActiveRoomId(roomId);
          setCurrentScreen('room');
          return;
        }
      }
      setCurrentScreen(getScreenFromPath(path));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const handleAuthenticated = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('focusspace_user', JSON.stringify(authenticatedUser));
    navigateTo('dashboard');
  };

  const handleSignOut = () => {
    localStorage.removeItem('focusspace_user');
    setUser(null);
    window.history.pushState({}, '', '/');
    setCurrentScreen('landing');
  };

  if (currentScreen === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentScreen('auth')} />;
  }

  if (currentScreen === 'auth') {
    return (
      <AuthScreen 
        onAuthenticated={handleAuthenticated}
        onBack={() => setCurrentScreen('landing')}
      />
    );
  }

  const navItems = [
    { label: 'Home', screen: 'dashboard', icon: LayoutDashboard },
    { label: 'Pomodoro', screen: 'timer', icon: Timer },
    { label: 'Progress', screen: 'goals', icon: Goal },
    { label: 'Planner', screen: 'calendar', icon: Calendar },
    { label: 'Notebook', screen: 'notes', icon: StickyNote },
    { label: 'Focus Audio', screen: 'music', icon: Headphones },
    { label: 'Modules', screen: 'revision', icon: LibraryBig },
    { label: 'Co-Study', screen: 'rooms', icon: Video },
    ...(user?.role === 'admin'
      ? [{ label: 'Admin', screen: 'admin', icon: Shield }]
      : []),
  ] as const;

  const renderAuthedScreen = () => {
    switch (currentScreen) {
      case 'timer':
        return <TimerScreen onBack={() => navigateTo('dashboard')} />;
      case 'goals':
        return (
          <GoalsScreen
            authToken={user?.token || ''}
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'calendar':
        return (
          <CalendarScreen
            authToken={user?.token || ''}
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'notes':
        return (
          <NotesPage
            authToken={user?.token || ''}
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'music':
        return <MusicPage />;
      case 'revision':
        return (
          <RevisionPage
            authToken={user?.token || ''}
            onOpenModule={(moduleId) => navigateTo('module', moduleId)}
          />
        );
      case 'module':
        return activeModuleId ? (
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
        );
      case 'rooms':
        return (
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
        return activeRoomId ? (
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
        );
      case 'admin':
        return <AdminScreen />;
      case 'dashboard':
      default:
        return (
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

  if (currentScreen === 'timer') {
    return (
      <PomodoroProvider>
        <RoomCallProvider authToken={user?.token || ''} displayName={user?.name}>
          <TimerScreen onBack={() => navigateTo('dashboard')} />
          <RoomCallMiniPanel
            onReturnToRoom={handleReturnToRoom}
            onLeaveRoom={handleLeaveRoomFromPanel}
          />
        </RoomCallProvider>
      </PomodoroProvider>
    );
  }

  return (
    <PomodoroProvider>
      <RoomCallProvider authToken={user?.token || ''} displayName={user?.name}>
        <SidebarProvider>
        <SidebarOverlay />
        <Sidebar collapsible="offcanvas">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Focus Space</SidebarGroupLabel>
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
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut}>
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="app-ambient bg-background/80">
        {usesDashboardLayout ? (
          <>
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
              <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="h-10 w-10 rounded-2xl border border-border/70 bg-background/80 shadow-sm" />
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'var(--focus-light)' }}
                    >
                      <BookOpen className="h-5 w-5" style={{ color: 'var(--focus-primary)' }} />
                    </div>
                    <div>
                      <h1 className="text-xl">Focus Space</h1>
                      <p className="text-sm text-muted-foreground">Your peaceful productivity companion</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </header>

            <main className="container mx-auto px-6 py-8">
              <RoomCallViewport />
              {renderAuthedScreen()}
            </main>

            <footer className="border-t border-border mt-12">
              <div className="container mx-auto px-6 py-6">
                <p className="text-center text-sm text-muted-foreground">
                  Stay focused, stay present, achieve your goals バ"
                </p>
              </div>
            </footer>
          </>
        ) : (
          <>
            <div className="pointer-events-none fixed top-4 left-4 z-40 md:block">
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
  );
}
