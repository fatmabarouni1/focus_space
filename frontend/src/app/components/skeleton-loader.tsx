import { BaseCard } from '@/app/components/base-card';
import { Skeleton } from '@/app/components/ui/skeleton';

interface SkeletonLoaderProps {
  count?: number;
}

export function SkeletonLoader({ count = 6 }: SkeletonLoaderProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <BaseCard key={`skeleton-${index}`} className="bg-card/60">
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-3 w-1/3" />
            <div className="flex items-center justify-between pt-3">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </BaseCard>
      ))}
    </div>
  );
}
