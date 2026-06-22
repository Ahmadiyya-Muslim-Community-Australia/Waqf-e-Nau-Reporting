import { RoomShell } from '@sqlrooms/room-shell';
import { ThemeProvider, ThemeSwitch } from '@sqlrooms/ui';
import { roomStore } from './store';
import type { FC } from 'react';

const App: FC = () => (
  <ThemeProvider defaultTheme="light" storageKey="waqfenau-reports-theme">
    <RoomShell className="h-screen" roomStore={roomStore}>
      <RoomShell.Sidebar>
        <RoomShell.CommandPalette.Button />
        <ThemeSwitch />
      </RoomShell.Sidebar>
      <RoomShell.LayoutComposer />
      <RoomShell.LoadingProgress />
      <RoomShell.CommandPalette />
    </RoomShell>
  </ThemeProvider>
);

export default App;
