import React, { Suspense, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAppStore from './store/useAppStore';
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionBanner from './components/ConnectionBanner';
import Toast from './components/Toast';
import BottomNav from './components/BottomNav';
import MicPermissionModal from './components/MicPermissionModal';

import Onboarding from './pages/Onboarding.tsx';
import Home from './pages/Home.tsx';
import Chat from './pages/Chat.tsx';
import Leaderboard from './pages/Leaderboard.tsx';
import Invite from './pages/Invite.tsx';
import Reviews from './pages/Reviews.tsx';
import Profile from './pages/Profile.tsx';
import Settings from './pages/Settings.tsx';
import Premium from './pages/Premium.tsx';
import Statistics from './pages/Statistics.tsx';
import Matching from './pages/Matching.tsx';
import SessionEnd from './pages/SessionEnd.tsx';
import Listings from './pages/Listings.tsx';



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const SCREENS: Record<string, React.ComponentType<any>> = {
  onboarding: Onboarding,
  home: Home,
  listings: Listings,
  leaderboard: Leaderboard,
  invite: Invite,
  reviews: Reviews,
  profile: Profile,
  settings: Settings,
  premium: Premium,
  statistics: Statistics,
  matching: Matching,
  chat: Chat,
  session_end: SessionEnd,
};

const TAB_SCREENS = ['home', 'listings', 'leaderboard', 'profile'];

function AuthErrorScreen({
  message,
  action,
}: {
  message: string;
  action: 'reload' | 'reopen';
}) {
  // Closing is the only thing that gets Telegram to hand out a fresh launch, so when
  // that is the fix it has to be the button — a reload here would put the person back
  // on this same screen. If the close call is unavailable, reloading is still better
  // than a dead button.
  const reopen = () => {
    const webApp = window.Telegram?.WebApp;
    if (webApp?.close) webApp.close();
    else window.location.reload();
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '16px',
        background: 'var(--bg, #fff)',
        color: 'var(--text-primary, #000)',
        textAlign: 'center',
        minHeight: '100dvh',
      }}
    >
      <AlertTriangle size={44} strokeWidth={1.75} color="var(--danger, #FF453A)" aria-hidden="true" />
      <p style={{ fontSize: 16, lineHeight: 1.5, maxWidth: 280 }}>{message}</p>
      <button
        onClick={action === 'reopen' ? reopen : () => window.location.reload()}
        style={{
          marginTop: 8,
          minHeight: 44,
          padding: '12px 28px',
          borderRadius: 12,
          border: 'none',
          background: 'var(--btn-bg, #00A8FF)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {action === 'reopen' ? 'Close the app' : 'Try again'}
      </button>
    </div>
  );
}

function TelegramApp() {
  const { screen, navigate, isAuthLoading, appError, appErrorAction, user, isSubscribed, setIsSubscribed } =
    useAppStore();
  useAuth();
  useSocket();

  if (isAuthLoading) return <LoadingScreen />;

  // Auth xato bo'ldi va user yo'q — retry screen ko'rsat
  if (appError && !user) return <AuthErrorScreen message={appError} action={appErrorAction} />;

  const ScreenComponent = SCREENS[screen] || Home;
  const showTabs = TAB_SCREENS.includes(screen);

  return (
    <>
      <ConnectionBanner />
      <Toast />
      <MicPermissionModal />
      <ErrorBoundary resetKey={screen}>
        <Suspense fallback={<LoadingScreen />}>
          {showTabs ? (
            <div className="tab-shell">
              <div className="tab-shell__content">
                <ScreenComponent navigate={navigate} />
              </div>
              <BottomNav active={screen} />
            </div>
          ) : (
            <ScreenComponent navigate={navigate} />
          )}
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default function App() {
  /**
   * No router.
   *
   * There was a BrowserRouter wrapping a single `path="*"` route, which matched
   * everything and rendered the same component either way — navigation is the `screen`
   * string in the store and always has been. It was ~20kB of react-router-dom shipped
   * to every user to do nothing, plus a second Suspense boundary around a component
   * that is not lazy.
   */
  return (
    <QueryClientProvider client={queryClient}>
      <TelegramApp />
    </QueryClientProvider>
  );
}
