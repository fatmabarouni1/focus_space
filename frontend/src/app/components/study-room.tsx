import { useEffect, useState } from 'react';
import { ArrowRight, Plus, Users } from 'lucide-react';
import { BaseCard } from '@/app/components/base-card';
import { Pill } from '@/app/components/pill';
import { PrimaryButton, SecondaryButton } from '@/app/components/button-kit';
import { fetchRooms, type RoomListItem } from '@/app/api/rooms';
import { useRoomCall } from '@/app/context/room-call-context';

interface StudyRoomProps {
  authToken: string;
  onOpenRooms: () => void;
  onJoinRoom: (roomId: string) => void;
}

const statusBadgeStyles: Record<string, string> = {
  focus: 'bg-green-100 text-green-700',
  break: 'bg-amber-100 text-amber-700',
  idle: 'bg-gray-100 text-gray-600',
};

export function StudyRoom({ authToken, onOpenRooms, onJoinRoom }: StudyRoomProps) {
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  const { activeRoomId, isInRoom, joinRoom } = useRoomCall();

  useEffect(() => {
    const loadRooms = async () => {
      if (!authToken) return;
      setLoading(true);
      setError('');
      try {
        const data = await fetchRooms(authToken);
        setRooms(data.slice(0, 3));
      } catch (err: any) {
        setError(err.message || 'Failed to load rooms.');
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [authToken]);

  return (
    <BaseCard className="space-y-4 rounded-[28px] border border-border/70 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--focus-light)]">
            <Users className="h-5 w-5" style={{ color: 'var(--focus-primary)' }} />
          </div>
          <div>
            <h3 className="text-base font-semibold">Co-Study</h3>
            <p className="text-xs text-muted-foreground">Drop into a live room or start one with your study circle.</p>
          </div>
        </div>
        <SecondaryButton variant="ghost" size="sm" onClick={onOpenRooms}>
          View all
        </SecondaryButton>
      </div>

      {error ? (
        <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">Rooms are unavailable right now</div>
          <div className="mt-1">{error}</div>
        </div>
      ) : null}
      {joinError ? (
        <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">Could not join this room</div>
          <div className="mt-1">{joinError}</div>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[24px] border border-border/70 bg-muted/20 p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-12 rounded-2xl bg-muted" />
            <div className="h-12 rounded-2xl bg-muted" />
          </div>
        </div>
      ) : null}

      {!loading && rooms.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-border/70 bg-muted/15 p-5">
          <div className="text-sm font-medium text-foreground">No live rooms yet</div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Be the first to open a room, invite classmates, or browse public sessions to study together.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton size="sm" onClick={onOpenRooms}>
              <Plus className="mr-2 h-4 w-4" />
              Create room
            </PrimaryButton>
            <SecondaryButton size="sm" onClick={onOpenRooms}>
              Browse rooms
            </SecondaryButton>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {rooms.map((room) => (
          <div
            key={room._id}
            className="flex items-center justify-between gap-3 rounded-[24px] border border-border/70 bg-muted/15 px-4 py-4 transition-all hover:border-[var(--focus-primary)]/30 hover:bg-background"
          >
            <div>
              <div className="font-medium">{room.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Host: {room.host?.name ?? 'Unknown'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Pill className={statusBadgeStyles[room.status]}>
                {room.status}
              </Pill>
              <PrimaryButton
                size="sm"
                onClick={async () => {
                  if (isInRoom && activeRoomId && activeRoomId !== room._id) {
                    setJoinError('You are already in another room. Leave it before joining.');
                    return;
                  }
                  setJoinError('');
                  const result = await joinRoom(room._id, room.title);
                  if (!result.ok) {
                    setJoinError(result.message || 'Unable to join the room.');
                    return;
                  }
                  onJoinRoom(room._id);
                }}
              >
                Join
                <ArrowRight className="ml-2 h-4 w-4" />
              </PrimaryButton>
            </div>
          </div>
        ))}
      </div>
    </BaseCard>
  );
}
