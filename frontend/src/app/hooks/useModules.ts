import { useCallback, useEffect, useState } from 'react';
import { fetchModulesPage, type RevisionModule } from '@/app/api/revision';
import { useErrorHandler } from '@/app/hooks/useErrorHandler';

export function useModules(authToken: string, limit = 20) {
  const [modules, setModules] = useState<RevisionModule[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const { error, isLoading, execute } = useErrorHandler(fetchModulesPage);

  const loadInitial = useCallback(async () => {
    if (!authToken) {
      setModules([]);
      setHasMore(false);
      setNextCursor(null);
      return;
    }

    const response = await execute(authToken, { limit });
    setModules(response.data);
    setHasMore(response.pagination.hasMore);
    setNextCursor(response.pagination.nextCursor);
  }, [authToken, execute, limit]);

  const loadMore = useCallback(async () => {
    if (!authToken || !nextCursor || isLoading) {
      return;
    }

    const response = await execute(authToken, {
      limit,
      cursor: nextCursor,
    });

    setModules((prev) => [...prev, ...response.data]);
    setHasMore(response.pagination.hasMore);
    setNextCursor(response.pagination.nextCursor);
  }, [authToken, execute, isLoading, limit, nextCursor]);

  const prependModule = useCallback((module: RevisionModule) => {
    setModules((prev) => [module, ...prev]);
  }, []);

  const removeModule = useCallback((moduleId: string) => {
    setModules((prev) => prev.filter((module) => module._id !== moduleId));
  }, []);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return {
    modules,
    hasMore,
    nextCursor,
    isLoading,
    error,
    loadInitial,
    loadMore,
    prependModule,
    removeModule,
  };
}
