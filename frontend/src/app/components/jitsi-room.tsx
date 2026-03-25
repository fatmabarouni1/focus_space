import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: {
      roomName: string;
      parentNode: HTMLElement;
      width?: string | number;
      height?: string | number;
      configOverwrite?: Record<string, unknown>;
      interfaceConfigOverwrite?: Record<string, unknown>;
      userInfo?: Record<string, unknown>;
    }) => { dispose: () => void };
  }
}

const JITSI_SCRIPT_ID = 'jitsi-external-api';
const JITSI_SCRIPT_SRC = 'https://meet.jit.si/external_api.js';

const loadJitsiScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

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

interface JitsiRoomProps {
  roomName: string;
  displayName?: string;
}

export function JitsiRoom({ roomName, displayName }: JitsiRoomProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<{ dispose: () => void } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const startMeeting = async () => {
      try {
        await loadJitsiScript();
        if (!mounted || !containerRef.current || !window.JitsiMeetExternalAPI) return;

        apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
          },
          userInfo: displayName ? { displayName } : undefined,
        });
      } catch (error: any) {
        if (mounted) {
          setLoadError(error?.message || 'Unable to load the meeting room.');
        }
      }
    };

    startMeeting();

    return () => {
      mounted = false;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, displayName]);

  if (loadError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={containerRef} className="h-[540px] w-full overflow-hidden rounded-2xl border border-border bg-muted" />
    </div>
  );
}
