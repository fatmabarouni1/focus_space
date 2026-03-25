import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { NotesPanel } from './notes-panel';
import { PageHeader } from './page-header';
import { SearchInput } from './search-input';
import { PrimaryButton } from './button-kit';

interface NotesPageProps {
  authToken: string;
  onBack: () => void;
}

export function NotesPage({ authToken, onBack }: NotesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createSignal, setCreateSignal] = useState(0);

  return (
    <div className="app-ambient min-h-screen bg-background/80">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <PrimaryButton variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Home
          </PrimaryButton>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <PageHeader
          title="Notebook"
          subtitle="Quick ideas, drafts, and study thoughts"
          actions={
            <>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search notebook..."
                className="md:w-64"
              />
              <PrimaryButton onClick={() => setCreateSignal((prev) => prev + 1)} className="md:self-stretch">
                New Note
              </PrimaryButton>
            </>
          }
        />

        <div className="min-h-[60vh]">
          <NotesPanel authToken={authToken} searchTerm={searchTerm} createSignal={createSignal} />
        </div>
      </main>
    </div>
  );
}
