import type { ReactNode } from 'react';
import { Card } from '@/app/components/ui/card';
import { cn } from '@/app/components/ui/utils';

interface BaseCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function BaseCard({ children, className, hoverable = false, onClick }: BaseCardProps) {
  return (
    <Card
      className={cn(
        'rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm',
        hoverable && 'transition-all hover:-translate-y-1 hover:border-border hover:shadow-lg',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}
