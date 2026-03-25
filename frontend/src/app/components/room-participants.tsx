import { useEffect, useState } from 'react';
import { Clock, Users } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import type { RoomParticipant } from '@/app/api/rooms';

interface RoomParticipantsProps {
  participants: RoomParticipant[];
}

const colors = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

const formatElapsed = (joinedAt: string, now: number) => {
  const diffSeconds = Math.max(0, Math.floor((now - new Date(joinedAt).getTime()) / 1000));
  const mins = Math.floor(diffSeconds / 60);
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hrs > 0) {
    return `${hrs}h ${remainingMins}m`;
  }
  return `${mins}m`;
};

export function RoomParticipants({ participants }: RoomParticipantsProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const focusCount = participants.filter((p) => p.status === 'focus').length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3>Participants</h3>
        </div>
        <Badge variant="secondary">
          {focusCount} focusing now
        </Badge>
      </div>

      <div className="space-y-3">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <Avatar className={`h-10 w-10 ${colors[index % colors.length]}`}>
              <AvatarFallback className={colors[index % colors.length]}>
                {participant.name?.[0] ?? 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">{participant.name}</span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    participant.status === 'focus'
                      ? 'bg-green-500'
                      : participant.status === 'break'
                        ? 'bg-amber-500'
                        : 'bg-gray-400'
                  }`}
                  title={
                    participant.status === 'focus'
                      ? 'Focusing'
                      : participant.status === 'break'
                        ? 'On break'
                        : 'Idle'
                  }
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatElapsed(participant.joinedAt, now)}
              </div>
            </div>

            <div className="text-xs text-muted-foreground capitalize">
              {participant.status}
            </div>
          </div>
        ))}
      </div>

      {participants.length === 0 ? (
        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-dashed border-border">
          <p className="text-xs text-center text-muted-foreground">
            Waiting for students to join...
          </p>
        </div>
      ) : null}
    </Card>
  );
}
