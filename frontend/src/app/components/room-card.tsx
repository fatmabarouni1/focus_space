import { useMemo } from 'react';
import { Clock3, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import type { RoomListItem } from '@/app/api/rooms';

interface RoomCardProps {
  room: RoomListItem;
  onJoin: () => void;
}

const statusStyles: Record<RoomListItem['status'], string> = {
  focus: 'bg-emerald-100 text-emerald-700',
  break: 'bg-amber-100 text-amber-700',
  idle: 'bg-slate-100 text-slate-600',
};

const statusLabels: Record<RoomListItem['status'], string> = {
  focus: 'Focus',
  break: 'Break',
  idle: 'Idle',
};

const formatDuration = (start: Date) => {
  const diff = Date.now() - start.getTime();
  if (diff < 60_000) return 'Just started';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m in`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m in` : `${hours}h in`;
};

export function RoomCard({ room, onJoin }: RoomCardProps) {
  const hostName = room.host?.name ?? 'Unknown host';
  const initials = hostName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const timeLabel = useMemo(() => {
    const created = new Date(room.createdAt);
    if (Number.isNaN(created.getTime())) return 'Active now';
    return formatDuration(created);
  }, [room.createdAt]);

  return (
    <div className="group rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-border hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{room.title}</h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px] font-medium">
                {initials || 'SR'}
              </AvatarFallback>
            </Avatar>
            <span>{hostName}</span>
          </div>
        </div>
        <Badge className={statusStyles[room.status]}>{statusLabels[room.status]}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {room.participantsCount} studying
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          {timeLabel}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Updated {new Date(room.updatedAt).toLocaleTimeString()}
        </div>
        <Button size="sm" onClick={onJoin}>
          Join room
        </Button>
      </div>
    </div>
  );
}
