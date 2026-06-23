import { RoomShell, useBaseRoomShellStore } from '@sqlrooms/room-shell';
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from '@sqlrooms/ui';
import { ThemeProvider, ThemeSwitch } from '@sqlrooms/ui';
import { roomStore } from './store';
import { LanguageProvider } from './i18n/LanguageContext';
import { LanguageToggle } from './components/LanguageToggle';
import { LayoutDashboard, TableIcon } from 'lucide-react';
import type { FC } from 'react';

/**
 * Sidebar button that switches the main view to a specific panel.
 * Replaces the panel's toggle behavior (which splits the mosaic)
 * with a direct page switch — only one panel is ever shown at a time.
 */
const PageButton: FC<{ panelType: string; label: string; icon: FC<{ className?: string }> }> = ({
  panelType,
  label,
  icon: Icon,
}) => {
  const initialized = useBaseRoomShellStore((s) => s.room.initialized);
  const nodes = useBaseRoomShellStore((s) => s.layout.config?.nodes);
  const setConfig = useBaseRoomShellStore((s) => s.layout.setConfig);

  const isActive = nodes === panelType;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-10 w-10 rounded-none',
            isActive ? 'bg-secondary' : 'hover:bg-secondary/50',
          )}
          disabled={!initialized}
          onClick={() => {
            if (!isActive) {
              setConfig({ type: 'mosaic', nodes: panelType });
            }
          }}
        >
          <Icon className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const App: FC = () => (
  <LanguageProvider>
    <ThemeProvider defaultTheme="light" storageKey="waqfenau-reports-theme">
      <RoomShell className="h-screen" roomStore={roomStore}>
        <RoomShell.Sidebar>
          <RoomShell.CommandPalette.Button />
          <PageButton panelType="main" label="Dashboard" icon={LayoutDashboard} />
          <PageButton panelType="tajneed" label="Tajneed" icon={TableIcon} />
          <LanguageToggle />
          <ThemeSwitch />
        </RoomShell.Sidebar>
        <RoomShell.LayoutComposer />
        <RoomShell.LoadingProgress />
        <RoomShell.CommandPalette />
      </RoomShell>
    </ThemeProvider>
  </LanguageProvider>
);

export default App;
