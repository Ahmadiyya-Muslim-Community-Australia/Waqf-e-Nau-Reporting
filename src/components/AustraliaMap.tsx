/**
 * AustraliaMap.tsx — Premium interactive map of Australia showing member
 * distribution by Jama'at using Leaflet with circle markers.
 */

import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Australian city coordinates ─────────────────────────────── */

const CITY_COORDS: Record<string, [number, number]> = {
    Sydney: [-33.8688, 151.2093],
    Melbourne: [-37.8136, 144.9631],
    Brisbane: [-27.4698, 153.0251],
    Perth: [-31.9505, 115.8605],
    Adelaide: [-34.9285, 138.6007],
    Canberra: [-35.2802, 149.1310],
    Hobart: [-42.8821, 147.3272],
    Darwin: [-12.4634, 130.8456],
    'Gold Coast': [-28.0167, 153.4000],
    Newcastle: [-32.9283, 151.7817],
    Wollongong: [-34.4240, 150.8931],
    Townsville: [-19.2590, 146.8169],
    Cairns: [-16.9186, 145.7781],
    Geelong: [-38.1470, 144.3607],
    Parramatta: [-33.8125, 151.0027],
    Lakemba: [-33.9195, 151.0786],
    Auburn: [-33.8548, 151.0335],
    Liverpool: [-33.9211, 150.9237],
    Bankstown: [-33.9175, 151.0348],
};

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
                    const coords = CITY_COORDS[d.jamaat];
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
                                    {d.jamaat}
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
