import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { useRoomCall } from '@/app/context/room-call-context';

interface RoomCallMiniPanelProps {
  onReturnToRoom: (roomId: string) => void;
  onLeaveRoom: () => void;
}

export function RoomCallMiniPanel({ onReturnToRoom, onLeaveRoom }: RoomCallMiniPanelProps) {
  const {
    isInRoom,
    activeRoomId,
    roomTitle,
    joinedAt,
    isMuted,
    isCameraOff,
    resumeCandidate,
    resumeRoom,
    dismissResume,
    leaveRoom,
    toggleMute,
    toggleCamera,
  } = useRoomCall();

  if (!isInRoom && !resumeCandidate) {
    return null;
  }

  if (resumeCandidate && !isInRoom) {
    return (
      <Card className="fixed bottom-6 right-6 z-40 w-[320px] p-4 shadow-lg">
        <div className="text-sm font-medium">Resume room?</div>
        <div className="text-xs text-muted-foreground mt-1">
          {resumeCandidate.roomTitle}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" onClick={resumeRoom}>
            Resume
          </Button>
          <Button size="sm" variant="ghost" onClick={dismissResume}>
            Dismiss
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-40 w-[360px] p-4 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">In Room</div>
          <div className="text-sm font-medium">{roomTitle || 'Study Room'}</div>
          {joinedAt ? (
            <div className="text-xs text-muted-foreground mt-1">
              Joined {joinedAt.toLocaleTimeString()}
            </div>
          ) : null}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (activeRoomId) {
              onReturnToRoom(activeRoomId);
            }
          }}
        >
          Return
        </Button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={toggleMute} aria-label="Toggle mute">
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={toggleCamera} aria-label="Toggle camera">
          {isCameraOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="ml-auto"
          onClick={async () => {
            await leaveRoom();
            onLeaveRoom();
          }}
        >
          Leave Room
        </Button>
      </div>
    </Card>
  );
}
