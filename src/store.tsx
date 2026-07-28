import { createWasmDuckDbConnector } from '@sqlrooms/duckdb';
import {
  createRoomShellSlice,
  createRoomStore,
} from '@sqlrooms/room-shell';
import type { RoomShellSliceState } from '@sqlrooms/room-shell';
import { DatabaseIcon, TableIcon, LayoutGrid, BarChart3, FileText, ClipboardList, Building2 } from 'lucide-react';
import type { FC } from 'react';
import { Dashboard } from './components/Dashboard';
import { TajneedPage } from './components/TajneedPage';
import { TajneedMenu } from './components/TajneedMenu';
import { TajneedAnalytics } from './components/TajneedAnalytics';
import { TajneedReports } from './components/TajneedReports';
import { CensusMenu } from './components/CensusMenu';
import { CensusPage } from './components/CensusPage';
import { CensusAnalytics } from './components/CensusAnalytics';
import { CensusReports } from './components/CensusReports';
import { MarkazMenu } from './components/MarkazMenu';
import { MarkazPage } from './components/MarkazPage';

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
            tableName: 'registrations',
            url: dataUrl('forms/registrations.parquet'),
          },
          {
            type: 'url',
            tableName: 'surveys',
            url: dataUrl('forms/surveys.parquet'),
          },
          {
            type: 'url',
            tableName: 'census',
            url: dataUrl('tajneed/census.parquet'),
          },
          {
            type: 'url',
            tableName: 'users',
            url: dataUrl('users/users.ndjson'),
          },
          {
            type: 'url',
            tableName: 'jamaats',
            url: dataUrl('config/jamaats.json'),
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
          'tajneed-menu': {
            title: 'Tajneed',
            icon: LayoutGrid,
            component: TajneedMenu,
            placement: 'main',
          },
          'tajneed-data': {
            title: 'Tajneed Data',
            icon: TableIcon,
            component: TajneedPage,
            placement: 'main',
          },
          'tajneed-analytics': {
            title: 'Tajneed Analytics',
            icon: BarChart3,
            component: TajneedAnalytics,
            placement: 'main',
          },
          'tajneed-reports': {
            title: 'Tajneed Reports',
            icon: FileText,
            component: TajneedReports,
            placement: 'main',
          },
          'census-menu': {
            title: 'Census',
            icon: LayoutGrid,
            component: CensusMenu,
            placement: 'main',
          },
          'census-data': {
            title: 'Census Data',
            icon: ClipboardList,
            component: CensusPage,
            placement: 'main',
          },
          'census-analytics': {
            title: 'Census Analytics',
            icon: BarChart3,
            component: CensusAnalytics,
            placement: 'main',
          },
          'census-reports': {
            title: 'Census Reports',
            icon: FileText,
            component: CensusReports,
            placement: 'main',
          },
          'markaz-menu': {
            title: 'Markaz',
            icon: LayoutGrid,
            component: MarkazMenu,
            placement: 'main',
          },
          'markaz-data': {
            title: 'Markaz Data',
            icon: Building2,
            component: MarkazPage,
            placement: 'main',
          },
        },
      },
    })(set, get, store),
  }),
);
