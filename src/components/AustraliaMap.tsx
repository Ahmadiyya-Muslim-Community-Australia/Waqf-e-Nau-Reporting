/**
 * AustraliaMap.tsx — Premium interactive map of Australia showing member
 * distribution by Jama'at using Leaflet with circle markers.
 *
 * Coordinates are sourced from the canonical Jama'at definitions in
 * @waqfenau/api-contracts, keyed by alias for matching raw data-lake values.
 */

import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { JAMAAT_BY_ALIAS } from '@waqfenau/api-contracts';

/* ── Colour helpers ──────────────────────────────────────────── */

const MARKER_COLOR = '#00843d'; // brand green
const MAX_RADIUS = 50;
const MIN_RADIUS = 8;

/** Compute circle radius proportional to count. */
function radiusFor(count: number, max: number): number {
    if (max === 0) return MIN_RADIUS;
    return MIN_RADIUS + ((count / max) * (MAX_RADIUS - MIN_RADIUS));
}

/* ── Component that detects dark mode and switches tiles ────── */

function TileLayerSwitcher() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const check = () => setDark(document.documentElement.classList.contains('dark'));
        check();
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    return (
        <TileLayer
            key={dark ? 'dark' : 'light'}
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={
                dark
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            }
        />
    );
}

/* ═══════════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════════ */

interface AustraliaMapProps {
    /** Array of { jamaat: string, count: number } from DuckDB. */
    data: { jamaat: string; count: number }[];
    /** Optional CSS class name. */
    className?: string;
    /**
     * Callback fired when a city marker is clicked.
     * Receives the jamaat name so callers can navigate to a filtered view.
     * Implements the Command pattern for drill-down navigation.
     */
    onCityClick?: (jamaat: string) => void;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export const AustraliaMap: FC<AustraliaMapProps> = ({ data, className, onCityClick }) => {
    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const handleCityClick = useCallback(
        (jamaat: string) => onCityClick?.(jamaat),
        [onCityClick],
    );

    return (
        <div className={className ?? ''}>
            <MapContainer
                center={[-25.2744, 133.7751]}
                zoom={4}
                scrollWheelZoom={false}
                dragging={true}
                zoomControl={true}
                className="h-[500px] w-full rounded-xl"
                style={{ background: 'transparent' }}
            >
                <TileLayerSwitcher />
                {data.map((d) => {
                    const jamaat = JAMAAT_BY_ALIAS.get(d.jamaat.toLowerCase());
                    const coords = jamaat?.coord;
                    if (!coords) return null;
                    return (
                        <CircleMarker
                            key={d.jamaat}
                            center={coords}
                            radius={radiusFor(d.count, maxCount)}
                            pathOptions={{
                                color: MARKER_COLOR,
                                fillColor: MARKER_COLOR,
                                fillOpacity: 0.55,
                                weight: 2,
                                opacity: 0.8,
                            }}
                            eventHandlers={{
                                click: () => handleCityClick(d.jamaat),
                            }}
                            className="cursor-pointer"
                        >
                            <Tooltip permanent={false} direction="top" offset={[0, -10]}>
                                <div className="text-sm font-semibold">
                                    {jamaat.label}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {d.count.toLocaleString()} member{d.count !== 1 ? 's' : ''}
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}
            </MapContainer>
            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#00843d]" />
                    Member distribution by Jama'at
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>Circle size ∝ member count</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>{data.length} locations</span>
            </div>
        </div>
    );
};
