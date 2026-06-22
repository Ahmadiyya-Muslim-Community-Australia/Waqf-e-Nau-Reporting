import { createWasmDuckDbConnector } from '@sqlrooms/duckdb';
import {
  createRoomShellSlice,
  createRoomStore,
} from '@sqlrooms/room-shell';
import type { RoomShellSliceState } from '@sqlrooms/room-shell';
import { DatabaseIcon } from 'lucide-react';
import type { FC } from 'react';
import { Dashboard } from './components/Dashboard';

/**
 * Data sources pointing at the S3 data lake via CloudFront.
 * The CloudFront distribution at reports.waqfenau.au proxies /data/*
 * to the private data-lake S3 bucket (OAC), so DuckDB-WASM fetches
 * Parquet/NDJSON files over HTTP range requests.
 */
const DATA_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

const dataUrl = (path: string) => `${DATA_ORIGIN}/data/${path}`;

/** Panel component: renders the main dashboard view. */
const MainView: FC = () => <Dashboard />;

/** Room state — extend with custom slices as the dashboard grows. */
export type RoomState = RoomShellSliceState;

/**
 * Create the room store. Combines SQLRooms' room-shell slice
 * with a DuckDB-WASM connector and data sources from the S3 data lake.
 */
export const { roomStore, useRoomStore } = createRoomStore<RoomState>(
  (set, get, store) => ({
    ...createRoomShellSlice({
      connector: createWasmDuckDbConnector(),
      config: {
        title: 'Waqf-e-Nau Reports',
        dataSources: [
          {
            type: 'url',
            tableName: 'members',
            url: dataUrl('tajneed/members.parquet'),
          },
          {
            type: 'url',
            tableName: 'tally_forms',
            url: dataUrl('forms/tally_forms.ndjson'),
          },
          {
            type: 'url',
            tableName: 'tally_submissions',
            url: dataUrl('forms/tally_submissions.ndjson'),
          },
          {
            type: 'url',
            tableName: 'registrations',
            url: dataUrl('forms/registrations.ndjson'),
          },
          {
            type: 'url',
            tableName: 'surveys',
            url: dataUrl('forms/surveys.ndjson'),
          },
        ],
      },
      layout: {
        config: {
          type: 'mosaic',
          nodes: 'main',
        },
        panels: {
          main: {
            title: 'Dashboard',
            icon: DatabaseIcon,
            component: MainView,
            placement: 'main',
          },
        },
      },
    })(set, get, store),
  }),
);
