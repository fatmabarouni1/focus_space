import { useEffect, useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { fetchModules, createModule, deleteModule, type RevisionModule } from '@/app/api/revision';
import { PageHeader } from '@/app/components/page-header';
import { CreateModuleModal } from '@/app/components/create-module-modal';
import { ModuleCard } from '@/app/components/module-card';
import { EmptyState } from '@/app/components/empty-state';
import { SkeletonLoader } from '@/app/components/skeleton-loader';
import { PrimaryButton } from '@/app/components/button-kit';
import { SearchInput } from '@/app/components/search-input';

interface RevisionPageProps {
  authToken: string;
  onOpenModule: (moduleId: string) => void;
}

export function RevisionPage({ authToken, onOpenModule }: RevisionPageProps) {
  const [modules, setModules] = useState<RevisionModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadModules();
  }, [authToken]);

  const loadModules = async () => {
    if (!authToken) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchModules(authToken);
      setModules(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load modules.');
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return modules;
    return modules.filter((module) => {
      const titleMatch = module.title.toLowerCase().includes(term);
      const descriptionMatch = (module.description ?? '').toLowerCase().includes(term);
      return titleMatch || descriptionMatch;
    });
  }, [modules, searchTerm]);

  const handleCreateModule = async (title: string, description?: string) => {
    if (!authToken) return;
    setCreating(true);
    setCreateError('');
    try {
      const created = await createModule(authToken, {
        title,
        description,
      });
      setModules((prev) => [created, ...prev]);
      setIsCreateOpen(false);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create module.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (moduleId: string) => {
    if (!authToken) return;
    setError('');
    try {
      await deleteModule(authToken, moduleId);
      setModules((prev) => prev.filter((module) => module._id !== moduleId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete module.');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Modules"
        subtitle="Organize modules, documents, and AI resources"
        actions={
          <>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search modules..."
              className="md:w-64"
            />
            <PrimaryButton onClick={() => setIsCreateOpen(true)} className="md:self-stretch">
              New Module
            </PrimaryButton>
          </>
        }
      />

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      {loading ? (
        <SkeletonLoader />
      ) : modules.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6 text-muted-foreground" />}
          title="No modules yet"
          description="Create your first revision module to get started."
          action={
            <PrimaryButton onClick={() => setIsCreateOpen(true)}>
              Create your first module
            </PrimaryButton>
          }
        />
      ) : filteredModules.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6 text-muted-foreground" />}
          title="No matching modules"
          description="Try a different search or start a new module."
          action={<PrimaryButton onClick={() => setIsCreateOpen(true)}>New Module</PrimaryButton>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredModules.map((module) => (
            <ModuleCard
              key={module._id}
              module={module}
              onOpen={() => onOpenModule(module._id)}
              onDelete={() => handleDelete(module._id)}
            />
          ))}
        </div>
      )}

      <CreateModuleModal
        open={isCreateOpen}
        onOpenChange={(nextOpen) => {
          setIsCreateOpen(nextOpen);
          if (!nextOpen) {
            setCreateError('');
          }
        }}
        onCreate={handleCreateModule}
        creating={creating}
        createError={createError}
      />
    </div>
  );
}
