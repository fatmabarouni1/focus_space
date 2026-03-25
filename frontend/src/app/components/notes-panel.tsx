import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Plus, Save, Trash2 } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { createNote, deleteNote, fetchNotes, updateNote } from '@/app/api/notes';
import { NoteCard } from '@/app/components/note-card';
import { BaseCard } from '@/app/components/base-card';
import { EmptyState } from '@/app/components/empty-state';
import { PrimaryButton, SecondaryButton } from '@/app/components/button-kit';

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

interface NotesPanelProps {
  authToken: string;
  searchTerm: string;
  createSignal: number;
}

export function NotesPanel({ authToken, searchTerm, createSignal }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const createSignalRef = useRef(createSignal);

  const currentNote = notes.find((n) => n.id === selectedNote);

  const mapNote = (note: { _id: string; title: string; content: string; created_at?: string }): Note => ({
    id: note._id,
    title: note.title || 'Untitled Note',
    content: note.content ?? '',
    timestamp: note.created_at ? new Date(note.created_at).getTime() : Date.now(),
  });

  const loadNotes = async () => {
    if (!authToken) return;
    setLoading(true);
    setError('');
    try {
      const loadedNotes = await fetchNotes(authToken);
      const mappedNotes = loadedNotes.map(mapNote);
      setNotes(mappedNotes);
      if (mappedNotes.length > 0) {
        setSelectedNote(mappedNotes[0].id);
        setEditingTitle(mappedNotes[0].title);
        setEditingContent(mappedNotes[0].content);
      } else {
        setSelectedNote(null);
        setEditingTitle('');
        setEditingContent('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [authToken]);

  useEffect(() => {
    if (createSignalRef.current !== createSignal) {
      createSignalRef.current = createSignal;
      createNewNote(true);
    }
  }, [createSignal]);

  const createNewNote = (openEditor = false) => {
    setError('');
    const newNote: Note = {
      id: `draft-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      timestamp: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote.id);
    setEditingTitle(newNote.title);
    setEditingContent(newNote.content);
    if (openEditor) {
      setIsEditorOpen(true);
    }
  };

  const removeNote = async (id: string) => {
    if (!authToken) {
      setError('Please sign in to manage notes.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (!id.startsWith('draft-')) {
        await deleteNote(authToken, id);
      }
      const newNotes = notes.filter((n) => n.id !== id);
      setNotes(newNotes);
      if (selectedNote === id) {
        setSelectedNote(newNotes[0]?.id || null);
        setEditingTitle(newNotes[0]?.title || '');
        setEditingContent(newNotes[0]?.content || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete note.');
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (!selectedNote) return;
    if (!authToken) {
      setError('Please sign in to manage notes.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (selectedNote.startsWith('draft-')) {
        const created = await createNote(authToken, {
          title: editingTitle.trim() || 'Untitled Note',
          content: editingContent,
        });
        const savedNote = mapNote(created);
        setNotes((prev) => [savedNote, ...prev.filter((n) => n.id !== selectedNote)]);
        setSelectedNote(savedNote.id);
      } else {
        const updated = await updateNote(authToken, selectedNote, {
          title: editingTitle.trim() || 'Untitled Note',
          content: editingContent,
        });
        const savedNote = mapNote(updated);
        setNotes((prev) =>
          prev.map((note) => (note.id === selectedNote ? savedNote : note))
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  // Update editing state when selecting a different note
  const selectNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) {
      setSelectedNote(id);
      setEditingTitle(note.title);
      setEditingContent(note.content);
      setIsEditorOpen(true);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotes = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return notes;
    return notes.filter((note) => {
      const inTitle = note.title.toLowerCase().includes(normalized);
      const inContent = note.content.toLowerCase().includes(normalized);
      return inTitle || inContent;
    });
  }, [notes, searchTerm]);

  const getTitleAndPreview = (note: Note) => {
    const lines = note.content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const hasCustomTitle = note.title.trim() && note.title.trim() !== 'Untitled Note';
    const title = hasCustomTitle ? note.title : lines[0] || 'Untitled Note';
    const previewSource = hasCustomTitle ? lines : lines.slice(1);
    const preview =
      previewSource.join(' ').trim() || 'Capture your thoughts before they slip away.';
    return { title, preview };
  };

  return (
    <>
      <BaseCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Your notebook</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading notes...' : `${filteredNotes.length} notes`}
            </p>
          </div>
          <SecondaryButton size="sm" onClick={() => createNewNote(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New note
          </SecondaryButton>
        </div>

        {error && <div className="mt-4 text-sm text-destructive">{error}</div>}

        <div className="mt-6">
          {notes.length === 0 && !loading ? (
            <div className="py-12">
              <EmptyState
                icon={<FileText className="h-6 w-6 text-muted-foreground" />}
                title="No notes yet"
                description="Create your first note to get started."
                action={
                  <PrimaryButton onClick={() => createNewNote(true)}>
                    Create your first note
                  </PrimaryButton>
                }
              />
            </div>
          ) : filteredNotes.length === 0 && !loading ? (
            <EmptyState
              icon={<FileText className="h-6 w-6 text-muted-foreground" />}
              title="No matching notes"
              description="Try a different search or start a new note."
              action={<PrimaryButton onClick={() => createNewNote(true)}>New Note</PrimaryButton>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredNotes.map((note) => {
                const { title, preview } = getTitleAndPreview(note);
                return (
                  <NoteCard
                    key={note.id}
                    title={title}
                    preview={preview}
                    timeLabel={`Edited ${formatTime(note.timestamp)}`}
                    onOpen={() => selectNote(note.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </BaseCard>

      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          {currentNote ? (
            <>
              <SheetHeader className="space-y-2">
                <SheetTitle>Note editor</SheetTitle>
                <SheetDescription>Refine your ideas and save when ready.</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-auto px-4 pb-4">
                <div className="space-y-4">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder="Note title"
                    className="text-lg font-semibold"
                    disabled={saving}
                  />
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    placeholder="Start typing your notes..."
                    className="min-h-[320px] resize-none"
                    disabled={saving}
                  />
                </div>
              </div>
              {error && <div className="px-4 pb-2 text-sm text-destructive">{error}</div>}
              <SheetFooter className="border-t border-border">
                <div className="flex w-full items-center justify-between">
                  <SecondaryButton
                    onClick={() => removeNote(currentNote.id)}
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </SecondaryButton>
                  <PrimaryButton onClick={saveNote} size="sm" disabled={saving || loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </PrimaryButton>
                </div>
              </SheetFooter>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {loading ? 'Loading notes...' : 'Select a note to start editing.'}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
