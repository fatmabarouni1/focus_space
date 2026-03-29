import { Home, RefreshCcw } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error | null;
  onRetry: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[32px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))] p-8 text-slate-700 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="w-full max-w-xl space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200/70 text-slate-600">
          <RefreshCcw className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-800">
            Something went wrong
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            Focus Space hit an unexpected problem on this screen. You can try again
            or return to the home page.
          </p>
        </div>

        {!import.meta.env.PROD && error?.message ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-950/[0.04] p-4 text-left">
            <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              Error
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-600">
              {error.message}
            </pre>
          </div>
        ) : null}

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-full bg-slate-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/70 px-5 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-800"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to home
          </a>
        </div>
      </div>
    </div>
  );
}

export type { ErrorFallbackProps };
