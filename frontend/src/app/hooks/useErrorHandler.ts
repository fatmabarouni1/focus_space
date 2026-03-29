import { useCallback, useState } from 'react';
import { useAuth } from '@/app/context/auth-context';

type MaybeAxiosError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const maybeAxiosError = error as MaybeAxiosError;
  return (
    maybeAxiosError?.response?.data?.message ||
    maybeAxiosError?.response?.data?.error ||
    maybeAxiosError?.message ||
    fallback
  );
};

const getErrorStatus = (error: unknown): number | null => {
  const maybeAxiosError = error as MaybeAxiosError;
  const status = maybeAxiosError?.response?.status;
  return typeof status === 'number' ? status : null;
};

export function useErrorHandler<TArgs extends unknown[], TResult>(
  asyncFunction: (...args: TArgs) => Promise<TResult>,
  options?: {
    loginPath?: string;
  }
) {
  const { clearAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: TArgs) => {
      setIsLoading(true);
      setError(null);

      try {
        return await asyncFunction(...args);
      } catch (err) {
        const status = getErrorStatus(err);

        if (status === 401) {
          clearAuth();
          window.history.pushState({}, '', options?.loginPath || '/auth');
          window.dispatchEvent(new PopStateEvent('popstate'));
          setError('Your session expired. Please sign in again.');
        } else if (status === 403) {
          setError('You do not have permission to access this action.');
        } else if (status && status >= 500) {
          setError('The server is having trouble right now. Please try again.');
        } else if (status === null) {
          setError('Network error. Check your connection and try again.');
        } else {
          setError(getErrorMessage(err, 'Something went wrong.'));
        }

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction, clearAuth, options?.loginPath]
  );

  return {
    error,
    isLoading,
    execute,
  };
}
