import type { ReactNode } from 'react';
import { BaseCard } from '@/app/components/base-card';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <BaseCard className="p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? (
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            {actions}
          </div>
        ) : null}
      </div>
    </BaseCard>
  );
}
