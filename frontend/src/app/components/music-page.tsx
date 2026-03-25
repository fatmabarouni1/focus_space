import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';
import { ExternalLink, Headphones, Pause, Play } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { useFocusAudio } from '@/app/hooks/use-focus-audio';

type MusicPlatform = {
  id: string;
  name: string;
  logo: ReactNode;
  url: string;
  accent: string;
};

function SpotifyLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#1DB954" />
      <path d="M7.4 9.3c3.4-1 6.8-.8 10 .8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.4 12c2.6-.7 5.2-.5 7.5.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 14.6c2-.5 3.8-.4 5.5.4" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function YouTubeLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="4" fill="#FF0033" />
      <path d="M10 9.2 15.3 12 10 14.8Z" fill="#fff" />
    </svg>
  );
}

function YouTubeMusicLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#FF0033" />
      <circle cx="12" cy="12" r="5.6" fill="none" stroke="#fff" strokeWidth="1.7" />
      <path d="M11 9.3 14.6 12 11 14.7Z" fill="#fff" />
    </svg>
  );
}

function AppleMusicLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <defs>
        <linearGradient id="apple-music-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FA233B" />
          <stop offset="100%" stopColor="#FB5C74" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#apple-music-gradient)" />
      <path d="M15.5 7.6v7.1a1.9 1.9 0 1 1-1.2-1.8V9.1l-4 1v5.1a1.9 1.9 0 1 1-1.2-1.8V8.4c0-.3.2-.6.5-.7l5.4-1.3c.3-.1.5.1.5.4Z" fill="#fff" />
    </svg>
  );
}

function SoundCloudLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M9.1 17.5h8.2a3.2 3.2 0 0 0 .4-6.3 4.7 4.7 0 0 0-9-1.5 2.9 2.9 0 0 0-.8-.1 3.1 3.1 0 0 0-3.1 3.1 2.9 2.9 0 0 0 2.8 2.9h1.5Z" fill="#FF6A00" />
      <path d="M6.3 10.2h1v7.3h-1zm-1.8.8h1v6.5h-1zm3.6-1.2h1v7.7h-1z" fill="#FF6A00" />
    </svg>
  );
}

const platforms: MusicPlatform[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    logo: <SpotifyLogo />,
    url: 'https://open.spotify.com',
    accent: '#1DB954',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    logo: <YouTubeLogo />,
    url: 'https://www.youtube.com',
    accent: '#FF0033',
  },
  {
    id: 'youtube-music',
    name: 'YouTube Music',
    logo: <YouTubeMusicLogo />,
    url: 'https://music.youtube.com',
    accent: '#FF0033',
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    logo: <AppleMusicLogo />,
    url: 'https://music.apple.com',
    accent: '#FA233B',
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    logo: <SoundCloudLogo />,
    url: 'https://soundcloud.com',
    accent: '#FF6A00',
  },
];

export function MusicPage() {
  const { sounds, activeSoundId, isPlaying, volume, toggleSound, setVolume } = useFocusAudio();

  const currentAmbience = useMemo(
    () => sounds.find((ambience) => ambience.id === activeSoundId) ?? null,
    [activeSoundId, sounds]
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--focus-light)' }}
        >
          <Headphones className="h-6 w-6" style={{ color: 'var(--focus-primary)' }} />
        </div>
        <div>
          <h1 className="text-3xl">Focus Audio</h1>
          <p className="text-muted-foreground">
            Ambient focus sounds and quick links to your favorite platforms.
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg">Ambient Sounds</h3>
            <p className="text-sm text-muted-foreground">Quick play / pause without distractions.</p>
          </div>
        </div>
        <div className="space-y-2">
          {sounds.map((ambience) => {
            const isActive = activeSoundId === ambience.id;
            const isActivePlaying = isActive && isPlaying;
            return (
              <div
                key={ambience.id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  isActive ? 'border-primary/40 bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: ambience.color }}
                  />
                  <div>
                    <div className="text-sm font-medium">{ambience.name}</div>
                    <div className="text-xs text-muted-foreground">{ambience.description}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSound(ambience.id)}
                >
                  {isActivePlaying ? (
                    <>
                      <Pause className="mr-2 h-3 w-3" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-3 w-3" />
                      Play
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span>Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="h-1 w-full max-w-xs"
          />
          <span>{volume}%</span>
        </div>
        {currentAmbience ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Now playing: {currentAmbience.name}
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Select an ambience to begin.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg">Audio Platforms</h3>
            <p className="text-sm text-muted-foreground">
              Open your favorite music apps in a new tab.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => {
            const platformStyle = {
              '--platform-accent': platform.accent,
            } as CSSProperties;

            return (
              <div
                key={platform.id}
                style={platformStyle}
                className="group flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-[color:var(--platform-accent)] hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_14px_rgba(15,23,42,0.06)] transition-all duration-200 group-hover:scale-105 group-hover:border-[color:var(--platform-accent)] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_18px_rgba(15,23,42,0.10)]">
                    {platform.logo}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{platform.name}</div>
                    <div className="text-xs text-muted-foreground">Open platform</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-3 shrink-0 rounded-full border-border/70 transition-all duration-200 group-hover:border-[color:var(--platform-accent)] group-hover:text-foreground"
                  onClick={() => window.open(platform.url, '_blank', 'noreferrer')}
                >
                  Open
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          All trademarks belong to their respective owners.
        </p>
      </Card>
    </div>
  );
}
