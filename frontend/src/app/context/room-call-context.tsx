import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { joinRoom as joinRoomApi, leaveRoom as leaveRoomApi } from '@/app/api/rooms';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: {
        roomName: string;
        parentNode: HTMLElement;
        width?: string | number;
        height?: string | number;
        configOverwrite?: Record<string, unknown>;
        interfaceConfigOverwrite?: Record<string, unknown>;
        userInfo?: Record<string, unknown>;
      }
    ) => {
      dispose: () => void;
      executeCommand?: (command: string) => void;
    };
  }
}

type ResumeCandidate = {
  roomId: string;
  roomTitle: string;
};

type RoomCallContextValue = {
  activeRoomId: string | null;
  roomTitle: string;
  isInRoom: boolean;
  joinedAt: Date | null;
  jitsiApiInstance: { dispose: () => void; executeCommand?: (command: string) => void } | null;
  isRoomViewActive: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  resumeCandidate: ResumeCandidate | null;
  error: string | null;
  joinRoom: (roomId: string, roomTitle?: string) => Promise<{ ok: boolean; message?: string }>;
  leaveRoom: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  setRoomViewActive: (active: boolean) => void;
  setRoomTitle: (title: string) => void;
  resumeRoom: () => Promise<void>;
  dismissResume: () => void;
  registerVideoContainer: (node: HTMLDivElement | null) => void;
};

const RoomCallContext = createContext<RoomCallContextValue | null>(null);

const JITSI_SCRIPT_ID = 'jitsi-external-api';
const JITSI_SCRIPT_SRC = 'https://meet.jit.si/external_api.js';
const STORAGE_KEY = 'focusspace_active_room';

let jitsiScriptPromise: Promise<void> | null = null;

const loadJitsiScript = () => {
  if (window.JitsiMeetExternalAPI) {
    return Promise.resolve();
  }
  if (jitsiScriptPromise) {
    return jitsiScriptPromise;
  }
  jitsiScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(JITSI_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Jitsi script.')));
      return;
    }

    const script = document.createElement('script');
    script.id = JITSI_SCRIPT_ID;
    script.src = JITSI_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Jitsi script.'));
    document.body.appendChild(script);
  });
  return jitsiScriptPromise;
};

const readResumeCandidate = (): ResumeCandidate | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ResumeCandidate;
    if (!parsed?.roomId || !parsed?.roomTitle) return null;
    return parsed;
  } catch {
    return null;
  }
};

export function RoomCallProvider({
  children,
  authToken,
  displayName,
}: {
  children: React.ReactNode;
  authToken: string;
  displayName?: string;
}) {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomTitle, setRoomTitleState] = useState('');
  const [joinedAt, setJoinedAt] = useState<Date | null>(null);
  const [jitsiApiInstance, setJitsiApiInstance] = useState<RoomCallContextValue['jitsiApiInstance']>(null);
  const [isRoomViewActive, setRoomViewActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [resumeCandidate, setResumeCandidate] = useState<ResumeCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingJoinRef = useRef(false);

  const isInRoom = Boolean(activeRoomId);

  useEffect(() => {
    setResumeCandidate(readResumeCandidate());
  }, []);

  const saveResumeCandidate = useCallback((roomId: string, title: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId, roomTitle: title }));
  }, []);

  const clearResumeCandidate = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setResumeCandidate(null);
  }, []);

  const initializeJitsi = useCallback(
    async (roomId: string, title: string) => {
      if (!containerRef.current) {
        pendingJoinRef.current = true;
        return;
      }

      try {
        await loadJitsiScript();
        if (!containerRef.current || !window.JitsiMeetExternalAPI) {
          return;
        }
        if (jitsiApiInstance) {
          return;
        }
        const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName: roomId,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
          },
          userInfo: displayName ? { displayName } : undefined,
        });
        setJitsiApiInstance(api);
        setIsMuted(true);
        setIsCameraOff(true);
        saveResumeCandidate(roomId, title);
      } catch (err: any) {
        setError(err?.message || 'Unable to load the meeting room.');
      }
    },
    [displayName, jitsiApiInstance, saveResumeCandidate]
  );

  const joinRoom = useCallback(
    async (roomId: string, title?: string) => {
      if (activeRoomId && activeRoomId !== roomId) {
        return { ok: false, message: 'You are already in another room.' };
      }
      if (activeRoomId === roomId) {
        if (title) {
          setRoomTitleState(title);
          saveResumeCandidate(roomId, title);
        }
        if (!jitsiApiInstance) {
          await initializeJitsi(roomId, title ?? roomTitle);
        }
        return { ok: true };
      }

      setError(null);
      setActiveRoomId(roomId);
      setRoomTitleState(title ?? roomTitle);
      setJoinedAt(new Date());

      if (authToken) {
        try {
          await joinRoomApi(authToken, roomId);
        } catch {
          // Backend join failures should not block the call.
        }
      }

      await initializeJitsi(roomId, title ?? roomTitle);
      return { ok: true };
    },
    [activeRoomId, authToken, initializeJitsi, roomTitle, saveResumeCandidate]
  );

  const leaveRoom = useCallback(async () => {
    if (!activeRoomId) return;
    if (authToken) {
      try {
        await leaveRoomApi(authToken, activeRoomId);
      } catch {
        // Ignore backend leave errors; user explicitly left.
      }
    }
    if (jitsiApiInstance) {
      jitsiApiInstance.dispose();
    }
    setJitsiApiInstance(null);
    setActiveRoomId(null);
    setRoomTitleState('');
    setJoinedAt(null);
    setIsMuted(true);
    setIsCameraOff(true);
    setRoomViewActive(false);
    clearResumeCandidate();
  }, [activeRoomId, authToken, clearResumeCandidate, jitsiApiInstance]);

  useEffect(() => {
    return () => {
      if (jitsiApiInstance) {
        jitsiApiInstance.dispose();
      }
    };
  }, [jitsiApiInstance]);

  const toggleMute = useCallback(() => {
    if (!jitsiApiInstance?.executeCommand) return;
    jitsiApiInstance.executeCommand('toggleAudio');
    setIsMuted((prev) => !prev);
  }, [jitsiApiInstance]);

  const toggleCamera = useCallback(() => {
    if (!jitsiApiInstance?.executeCommand) return;
    jitsiApiInstance.executeCommand('toggleVideo');
    setIsCameraOff((prev) => !prev);
  }, [jitsiApiInstance]);

  const setRoomTitle = useCallback(
    (title: string) => {
      setRoomTitleState(title);
      if (activeRoomId) {
        saveResumeCandidate(activeRoomId, title);
      }
    },
    [activeRoomId, saveResumeCandidate]
  );

  const resumeRoom = useCallback(async () => {
    if (!resumeCandidate) return;
    await joinRoom(resumeCandidate.roomId, resumeCandidate.roomTitle);
    setResumeCandidate(null);
  }, [joinRoom, resumeCandidate]);

  const dismissResume = useCallback(() => {
    clearResumeCandidate();
  }, [clearResumeCandidate]);

  const registerVideoContainer = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (node && pendingJoinRef.current && activeRoomId) {
        pendingJoinRef.current = false;
        initializeJitsi(activeRoomId, roomTitle);
      }
    },
    [activeRoomId, initializeJitsi, roomTitle]
  );

  const value = useMemo<RoomCallContextValue>(
    () => ({
      activeRoomId,
      roomTitle,
      isInRoom,
      joinedAt,
      jitsiApiInstance,
      isRoomViewActive,
      isMuted,
      isCameraOff,
      resumeCandidate,
      error,
      joinRoom,
      leaveRoom,
      toggleMute,
      toggleCamera,
      setRoomViewActive,
      setRoomTitle,
      resumeRoom,
      dismissResume,
      registerVideoContainer,
    }),
    [
      activeRoomId,
      roomTitle,
      isInRoom,
      joinedAt,
      jitsiApiInstance,
      isRoomViewActive,
      isMuted,
      isCameraOff,
      resumeCandidate,
      error,
      joinRoom,
      leaveRoom,
      toggleMute,
      toggleCamera,
      setRoomViewActive,
      setRoomTitle,
      resumeRoom,
      dismissResume,
      registerVideoContainer,
    ]
  );

  return <RoomCallContext.Provider value={value}>{children}</RoomCallContext.Provider>;
}

export function useRoomCall() {
  const context = useContext(RoomCallContext);
  if (!context) {
    throw new Error('useRoomCall must be used within a RoomCallProvider');
  }
  return context;
}
