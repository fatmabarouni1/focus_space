import { createRoot } from 'react-dom/client';
import './app/i18n.ts';
import App from './app/App.tsx';
import { ErrorBoundary } from './app/components/ErrorBoundary.tsx';
import { AppSettingsProvider } from './app/context/app-settings-context.tsx';
import { AuthProvider } from './app/context/auth-context.tsx';
import './styles/index.css';

window.addEventListener('unhandledrejection', (event) => {
  if (import.meta.env.DEV) {
    console.error('[Focus Space] Unhandled promise rejection', event.reason);
  }

  event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary
    onError={(error, errorInfo) => {
      if (import.meta.env.DEV) {
        console.error('[Focus Space] Top-level render error', error, errorInfo);
      }
    }}
  >
    <AppSettingsProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppSettingsProvider>
  </ErrorBoundary>
);
