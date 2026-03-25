import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';

interface CreateRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string) => void;
  creating: boolean;
  createError: string;
}

const modeOptions = [
  { label: 'Focus', value: 'focus' },
  { label: 'Break', value: 'break' },
];

export function CreateRoomModal({
  open,
  onOpenChange,
  onCreate,
  creating,
  createError,
}: CreateRoomModalProps) {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) {
      setTitle('');
      setMode('focus');
      setDescription('');
      setLocalError('');
    }
  }, [open]);

  const helperText = useMemo(() => {
    if (!title.trim()) return 'Give your room a short, friendly title.';
    if (title.trim().length < 3) return 'Titles should be at least 3 characters.';
    return `${title.trim().length}/60 characters`;
  }, [title]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setLocalError('Room title is required.');
      return;
    }
    if (trimmed.length < 3) {
      setLocalError('Room title should be at least 3 characters.');
      return;
    }
    setLocalError('');
    onCreate(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Start a room</DialogTitle>
          <DialogDescription>
            Create a cozy focus space and invite others to join in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Room title</label>
            <Input
              placeholder="e.g. Calculus sprint session"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={creating}
            />
            <p className="text-xs text-muted-foreground">{helperText}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mode</label>
            <div className="flex flex-wrap gap-2">
              {modeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={mode === option.value ? 'default' : 'outline'}
                  onClick={() => setMode(option.value as 'focus' | 'break')}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Share what you're studying or your session goal."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={creating}
            />
          </div>
        </div>

        {(localError || createError) && (
          <div className="text-sm text-destructive">{localError || createError}</div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={creating}>
            {creating ? 'Creating...' : 'Create room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
