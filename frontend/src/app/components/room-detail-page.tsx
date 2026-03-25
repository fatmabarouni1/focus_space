import { useEffect, useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { RoomParticipants } from '@/app/components/room-participants';
import {
  fetchRoom,
  type RoomListItem,
  type RoomParticipant,
} from '@/app/api/rooms';
import { useRoomCall } from '@/app/context/room-call-context';

interface RoomDetailPageProps {
  authToken: string;
  roomId: string;
  onBack: () => void;
}

export function RoomDetailPage({ authToken, roomId, onBack }: RoomDetailPageProps) {
  const [room, setRoom] = useState<RoomListItem | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [blockedByOtherRoom, setBlockedByOtherRoom] = useState(false);
  const {
    activeRoomId,
    isInRoom,
    joinRoom,
    leaveRoom: leaveCall,
    setRoomViewActive,
    setRoomTitle,
  } = useRoomCall();

  const loadRoom = async () => {
    if (!authToken) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchRoom(authToken, roomId);
      setRoom(data.room);
      setParticipants(data.participants);
    } catch (err: any) {
      setError(err.message || 'Failed to load room.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoom();
  }, [authToken, roomId]);

  useEffect(() => {
    if (activeRoomId && activeRoomId !== roomId) {
      setRoomViewActive(false);
    } else {
      setRoomViewActive(true);
    }
    return () => setRoomViewActive(false);
  }, [activeRoomId, roomId, setRoomViewActive]);

  useEffect(() => {
    if (isInRoom && activeRoomId && activeRoomId !== roomId) {
      setBlockedByOtherRoom(true);
      setError('You are already in another room. Leave it to join this one.');
      return;
    }
    setBlockedByOtherRoom(false);
    setError('');
    joinRoom(roomId);
  }, [activeRoomId, isInRoom, joinRoom, roomId]);

  useEffect(() => {
    if (room?.title) {
      setRoomTitle(room.title);
    }
  }, [room, setRoomTitle]);

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leaveCall();
      onBack();
    } catch (err: any) {
      setError(err.message || 'Failed to leave room.');
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Co-Study
          </Button>
          <h2 className="text-3xl mt-3">{room?.title ?? 'Co-Study Room'}</h2>
          <p className="text-sm text-muted-foreground">
            Host: {room?.host?.name ?? 'Unknown'}
          </p>
        </div>
        {room ? (
          <Badge variant="secondary">{room.status}</Badge>
        ) : null}
      </div>

      {error ? (
        <Card className="p-4 text-sm text-destructive">{error}</Card>
      ) : null}

      {loading ? (
        <Card className="p-4 text-sm text-muted-foreground">Loading room...</Card>
      ) : null}

      {!loading ? (
        <div className="space-y-6">
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {participants.length} participants
            </div>
            <Button variant="outline" onClick={handleLeave} disabled={leaving || blockedByOtherRoom}>
              {leaving ? 'Leaving...' : 'Leave room'}
            </Button>
          </Card>

          <RoomParticipants participants={participants} />
        </div>
      ) : null}
    </div>
  );
}
