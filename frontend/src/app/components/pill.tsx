import type { ReactNode } from 'react';
import { Badge } from '@/app/components/ui/badge';
import { cn } from '@/app/components/ui/utils';

interface PillProps {
  children: ReactNode;
  className?: string;
}

export function Pill({ children, className }: PillProps) {
  return (
    <Badge className={cn('rounded-full px-2.5 py-1 text-xs font-medium', className)}>
      {children}
    </Badge>
  );
}
