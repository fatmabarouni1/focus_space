import { Clock3, Trash2 } from 'lucide-react';
import { BaseCard } from '@/app/components/base-card';
import { PrimaryButton, SecondaryButton } from '@/app/components/button-kit';
import type { RevisionModule } from '@/app/api/revision';

interface ModuleCardProps {
  module: RevisionModule;
  onOpen: () => void;
  onDelete: () => void;
}

const formatRelativeTime = (dateValue?: string) => {
  if (!dateValue) return 'Updated today';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Updated recently';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Updated ${days}d ago`;
  return `Updated ${date.toLocaleDateString()}`;
};

const getMetaLine = (module: RevisionModule) => {
  const meta: string[] = [];
  const anyModule = module as RevisionModule & {
    documentsCount?: number;
    linksCount?: number;
    resourcesCount?: number;
  };
  if (typeof anyModule.documentsCount === 'number') {
    meta.push(`${anyModule.documentsCount} docs`);
  }
  if (typeof anyModule.linksCount === 'number') {
    meta.push(`${anyModule.linksCount} links`);
  }
  if (typeof anyModule.resourcesCount === 'number') {
    meta.push(`${anyModule.resourcesCount} AI resources`);
  }
  return meta.length ? meta.join(' • ') : '';
};

export function ModuleCard({ module, onOpen, onDelete }: ModuleCardProps) {
  const metaLine = getMetaLine(module);
  const updatedTime = formatRelativeTime(module.updated_at ?? module.created_at);

  return (
    <BaseCard hoverable className="group">
      <div className="flex h-full flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{module.title}</h3>
          {module.description ? (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {module.description}
            </p>
          ) : null}
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5" />
          {updatedTime}
        </div>

        {metaLine ? (
          <div className="text-xs text-muted-foreground">{metaLine}</div>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-2">
          <PrimaryButton size="sm" onClick={onOpen}>
            Open
          </PrimaryButton>
          <SecondaryButton variant="ghost" size="icon" onClick={onDelete} aria-label="Delete module">
            <Trash2 className="h-4 w-4" />
          </SecondaryButton>
        </div>
      </div>
    </BaseCard>
  );
}
