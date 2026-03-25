import { Clock3 } from 'lucide-react';
import { BaseCard } from './base-card';

interface NoteCardProps {
  title: string;
  preview: string;
  timeLabel: string;
  onOpen: () => void;
}

export function NoteCard({ title, preview, timeLabel, onOpen }: NoteCardProps) {
  return (
    <BaseCard hoverable className="group cursor-pointer" onClick={onOpen}>
      <div className="flex h-full flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground line-clamp-1">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {preview}
          </p>
        </div>
        <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          <span>{timeLabel}</span>
        </div>
      </div>
    </BaseCard>
  );
}
