import {
  RoomShell,
  useBaseRoomShellStore,
} from '@sqlrooms/room-shell';
import { cn } from '@sqlrooms/ui';
import { Toaster } from 'sonner';
import { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { FC } from 'react';
import { roomStore } from './store';
import { LanguageProvider } from './i18n/LanguageContext';
import { PremiumSidebar } from './components/PremiumSidebar';

/* ── Router sync — URL ↔ panel ─────────────────────────────── */

/**
 * Syncs the browser URL with the active RoomShell panel.
 * - Navigating to / or /tajneed sets the corresponding panel.
 * - Clicking a sidebar button updates the URL.
 * - Case-insensitive path matching.
 * Uses a ref to avoid infinite loops between URL→panel and panel→URL.
 */
const RouterSync: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialized = useBaseRoomShellStore((s) => s.room.initialized);
  const nodes = useBaseRoomShellStore((s) => s.layout.config?.nodes);
  const setConfig = useBaseRoomShellStore((s) => s.layout.setConfig);
  const syncing = useRef(false);

  // URL → panel (only after the store is initialized)
  useEffect(() => {
    if (!initialized) return;
    const path = location.pathname.replace(/\/+$/, '') || '/';
    let target: string;
    switch (path.toLowerCase()) {
      case '/tajneed/data':
        target = 'tajneed-data';
        break;
      case '/tajneed/analytics':
        target = 'tajneed-analytics';
        break;
      case '/tajneed':
      case '/tajneed/':
        target = 'tajneed-menu';
        break;
      case '/census/analytics':
        target = 'census-analytics';
        break;
      case '/census/data':
        target = 'census-data';
        break;
      case '/census':
      case '/census/':
        target = 'census-menu';
        break;
      case '/markaz/data':
        target = 'markaz-data';
        break;
      case '/markaz':
      case '/markaz/':
        target = 'markaz-menu';
        break;
      default:
        target = 'main';
    }
    if (target !== nodes) {
      syncing.current = true;
      setConfig({ type: 'mosaic', nodes: target });
      requestAnimationFrame(() => { syncing.current = false; });
    }
  }, [location.pathname, initialized]);

  // panel → URL
  useEffect(() => {
    if (!initialized || syncing.current) return;
    let target: string;
    switch (nodes) {
      case 'tajneed-menu':
        target = '/tajneed/';
        break;
      case 'tajneed-data':
        target = '/tajneed/data';
        break;
      case 'tajneed-analytics':
        target = '/tajneed/analytics';
        break;
      case 'census-menu':
        target = '/census/';
        break;
      case 'census-data':
        target = '/census/data';
        break;
      case 'census-analytics':
        target = '/census/analytics';
        break;
      case 'markaz-menu':
        target = '/markaz/';
        break;
      case 'markaz-data':
        target = '/markaz/data';
        break;
      default:
        target = '/';
    }
    const current = location.pathname.replace(/\/+$/, '') || '/';
    if (current.toLowerCase() !== target.replace(/\/+$/, '')) {
      navigate(target, { replace: true });
    }
  }, [nodes, initialized]);

  return null;
};

/* ── App ────────────────────────────────────────────────────── */

const App: FC = () => (
  <LanguageProvider>
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: { fontFamily: 'var(--wn-font-sans)' },
      }}
    />
    <RoomShell className="h-screen" roomStore={roomStore}>
      <RouterSync />
      <RoomShell.Sidebar
        className={cn(
          '!w-56 !items-stretch !gap-0 !px-0 !py-3',
          'bg-white/90 backdrop-blur-xl dark:bg-slate-900/90',
          'ltr:border-r rtl:border-l border-slate-200 dark:border-slate-700',
          /* Hide the auto-generated RoomShellSidebarButtons */
          '[&>:first-child]:hidden',
        )}
      >
        <PremiumSidebar />
      </RoomShell.Sidebar>
      <RoomShell.LayoutComposer />
      <RoomShell.LoadingProgress />
      <RoomShell.CommandPalette />
    </RoomShell>
  </LanguageProvider>
);

export default App;
