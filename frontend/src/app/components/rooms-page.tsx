import { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  createRoom,
  fetchRooms,
  type RoomListItem,
  type RoomStatus,
} from '@/app/api/rooms';
import { useRoomCall } from '@/app/context/room-call-context';
import { CreateRoomModal } from '@/app/components/create-room-modal';
import { RoomCard } from '@/app/components/room-card';

interface RoomsPageProps {
  authToken: string;
  onJoinRoom: (roomId: string) => void;
}

const statusTabs: { label: string; value: RoomStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Focus', value: 'focus' },
  { label: 'Break', value: 'break' },
];

export function RoomsPage({ authToken, onJoinRoom }: RoomsPageProps) {
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RoomStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { activeRoomId, isInRoom, joinRoom } = useRoomCall();

  const loadRooms = async () => {
    if (!authToken) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchRooms(authToken);
      setRooms(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [authToken]);

  const filteredRooms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rooms.filter((room) => {
      if (statusFilter !== 'all' && room.status !== statusFilter) return false;
      if (!term) return true;
      return (
        room.title.toLowerCase().includes(term) ||
        (room.host?.name ?? '').toLowerCase().includes(term)
      );
    });
  }, [rooms, statusFilter, searchTerm]);

  const handleCreateRoom = async (title: string) => {
    setCreating(true);
    setCreateError('');
    try {
      const result = await createRoom(authToken, title.trim());
      setRooms((prev) => [result.room, ...prev]);
      setIsCreateOpen(false);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (roomId: string, title: string) => {
    if (isInRoom && activeRoomId && activeRoomId !== roomId) {
      setJoinError('You are already in another room. Leave it before joining a new one.');
      return;
    }
    setJoinError('');
    const result = await joinRoom(roomId, title);
    if (!result.ok) {
      setJoinError(result.message || 'Unable to join the room.');
      return;
    }
    onJoinRoom(roomId);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card/60 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Focus Space
            </div>
            <h2 className="mt-3 text-3xl font-semibold">Co-Study</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Study together. Stay accountable.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search co-study rooms"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="md:self-stretch">
              Start a room
            </Button>
            <Button variant="ghost" size="sm" onClick={loadRooms} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <Button
              key={tab.value}
              size="sm"
              variant={statusFilter === tab.value ? 'default' : 'ghost'}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}
      {joinError ? <div className="text-sm text-destructive">{joinError}</div> : null}

      {loading ? (
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
          Loading rooms...
        </div>
      ) : null}

      {!loading && filteredRooms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-background/70 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Sparkles className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No active co-study rooms right now</h3>
          <p className="mt-2 text-sm text-muted-foreground">Be the first to start one.</p>
          <Button className="mt-5" onClick={() => setIsCreateOpen(true)}>
            Start a room
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              onJoin={() => handleJoinRoom(room._id, room.title)}
            />
          ))}
        </div>
      )}

      <CreateRoomModal
        open={isCreateOpen}
        onOpenChange={(nextOpen) => {
          setIsCreateOpen(nextOpen);
          if (!nextOpen) {
            setCreateError('');
          }
        }}
        onCreate={handleCreateRoom}
        creating={creating}
        createError={createError}
      />
    </div>
  );
}
