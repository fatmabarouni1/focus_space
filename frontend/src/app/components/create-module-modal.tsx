import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { PrimaryButton, SecondaryButton } from '@/app/components/button-kit';

interface CreateModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string, description?: string) => void;
  creating: boolean;
  createError: string;
}

export function CreateModuleModal({
  open,
  onOpenChange,
  onCreate,
  creating,
  createError,
}: CreateModuleModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setLocalError('');
    }
  }, [open]);

  const helperText = useMemo(() => {
    if (!title.trim()) return 'Give this module a short, clear name.';
    if (title.trim().length < 3) return 'Titles should be at least 3 characters.';
    if (title.trim().length > 60) return 'Titles should be 60 characters or less.';
    return `${title.trim().length}/60 characters`;
  }, [title]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setLocalError('Module title is required.');
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 60) {
      setLocalError('Module title should be 3-60 characters.');
      return;
    }
    setLocalError('');
    onCreate(trimmed, description.trim() || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New module</DialogTitle>
          <DialogDescription>
            Add a module to organize notes, links, and documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Module title</label>
            <Input
              placeholder="e.g. Calculus midterm prep"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={creating}
            />
            <p className="text-xs text-muted-foreground">{helperText}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Short summary or focus area for this module."
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
          <SecondaryButton type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleSubmit} disabled={creating}>
            {creating ? 'Creating...' : 'Create module'}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
