/**
 * LanguageContext.tsx — React Context for English / Urdu bilingual support.
 *
 * Provides:
 *  - `lang` — current language ('en' | 'ur')
 *  - `setLang` — toggle function
 *  - `t(key)` — translation lookup function
 *  - `fmt(value)` — format numbers with Urdu numerals using Bhasha.js
 *
 * Persists choice to localStorage under `waqfenau-reports-lang`.
 * Applies `dir="rtl"`, Nastaliq font, and Urdu numeral conversion when Urdu
 * is active. Uses a MutationObserver so dynamically added content (SQLRooms
 * query results, tables, etc.) also gets numerals converted.
 *
 * Bhasha.js (bhasha-js) provides the number formatting engine for Urdu
 * numerals via formatNumber(..., { useNativeDigits: true }).
 */

import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FC,
    type ReactNode,
} from 'react';
import { formatNumber } from 'bhasha-js';
import { lookup, type Lang } from './translations';
import { toUrduNumerals, toAsciiDigits } from '@waqfenau/design-tokens/urdu';

// ── Constants ────────────────────────────────────────────────────────

const STORAGE_KEY = 'waqfenau-reports-lang';

// ── Context shape ────────────────────────────────────────────────────

interface LanguageContextValue {
    /** Current language ('en' | 'ur') */
    lang: Lang;
    /** Switch language */
    setLang: (lang: Lang) => void;
    /** Lookup a translation key → localized string */
    t: (key: string) => string;
    /** True when Urdu is active (convenience for conditional rendering) */
    isUrdu: boolean;
    /**
     * Convert ASCII digits in a string to Urdu numerals (۰-۹).
     * Uses Bhasha.js's formatNumber with useNativeDigits: true for proper
     * locale-aware number formatting. For plain strings that contain numbers
     * embedded in text, falls back to simple digit substitution.
     */
    fmt: (value: string | number, options?: { raw?: boolean }) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────

interface LanguageProviderProps {
    children: ReactNode;
    defaultLang?: Lang;
}

export const LanguageProvider: FC<LanguageProviderProps> = ({
    children,
    defaultLang = 'en',
}) => {
    const [lang, setLangState] = useState<Lang>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'en' || stored === 'ur') return stored;
        } catch {
            // localStorage unavailable (SSR, private browsing restrictions)
        }
        return defaultLang;
    });

    /** Ref to the MutationObserver so we can disconnect on cleanup */
    const observerRef = useRef<MutationObserver | null>(null);

    const setLang = useCallback((next: Lang) => {
        setLangState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Silently ignore storage errors
        }
    }, []);

    const t = useCallback((key: string) => lookup(key, lang), [lang]);

    const isUrdu = lang === 'ur';

    /**
     * Format a number or string with Urdu numerals.
     * - For pure numbers, uses Bhasha.js formatNumber with useNativeDigits: true
     *   (gives proper locale-aware formatting like ١٢,٣٤٥,٦٧٨)
     * - For strings with embedded numbers (e.g. "Page 5 of 10"), uses simple
     *   digit substitution.
     * - Pass { raw: true } to skip formatNumber and just do digit substitution.
     */
    const fmt = useCallback(
        (value: string | number, options?: { raw?: boolean }): string => {
            if (typeof value === 'number' && !options?.raw) {
                // Pure number — use Bhasha.js for proper locale formatting
                return formatNumber(value, 'ur', 'PK', { useNativeDigits: true });
            }
            // String or raw mode — simple digit substitution
            return toUrduNumerals(String(value));
        },
        [],
    );

    const value = useMemo<LanguageContextValue>(
        () => ({ lang, setLang, t, isUrdu, fmt }),
        [lang, setLang, t, isUrdu, fmt],
    );

    // ── Side-effect: RTL + font + MutationObserver ──────────────────
    useEffect(() => {
        const html = document.documentElement;
        const root = document.getElementById('root');

        if (isUrdu) {
            html.setAttribute('dir', 'rtl');
            html.setAttribute('lang', 'ur');
            html.classList.add('urdu-active');

            // Walk existing text nodes immediately
            const walk = () => {
                if (!root) return;
                const walker = document.createTreeWalker(
                    root,
                    NodeFilter.SHOW_TEXT,
                    null,
                );
                let node;
                while ((node = walker.nextNode())) {
                    if (/\d/.test(node.textContent ?? '')) {
                        node.textContent = toUrduNumerals(node.textContent ?? '');
                    }
                }
            };
            requestAnimationFrame(walk);

            // Set up MutationObserver to catch dynamically added content
            // (SQLRooms query results, table updates, etc.)
            if (root && !observerRef.current) {
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        for (const addedNode of mutation.addedNodes) {
                            if (addedNode.nodeType === Node.TEXT_NODE) {
                                if (/\d/.test(addedNode.textContent ?? '')) {
                                    addedNode.textContent = toUrduNumerals(
                                        addedNode.textContent ?? '',
                                    );
                                }
                            } else if (
                                addedNode.nodeType === Node.ELEMENT_NODE
                            ) {
                                const el = addedNode as Element;
                                // Walk text nodes in the added subtree
                                const walker = document.createTreeWalker(
                                    el,
                                    NodeFilter.SHOW_TEXT,
                                    null,
                                );
                                let n: Text | null;
                                while ((n = walker.nextNode() as Text | null)) {
                                    if (/\d/.test(n.textContent ?? '')) {
                                        n.textContent = toUrduNumerals(
                                            n.textContent ?? '',
                                        );
                                    }
                                }
                            }
                        }
                    }
                });
                observer.observe(root, {
                    childList: true,
                    subtree: true,
                });
                observerRef.current = observer;
            }
        } else {
            html.setAttribute('dir', 'ltr');
            html.setAttribute('lang', 'en');
            html.classList.remove('urdu-active');

            // Disconnect observer to stop watching for changes
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }

            // Restore ASCII digits
            const walk = () => {
                if (!root) return;
                const walker = document.createTreeWalker(
                    root,
                    NodeFilter.SHOW_TEXT,
                    null,
                );
                let node;
                while ((node = walker.nextNode())) {
                    if (/[\u06F0-\u06F9]/.test(node.textContent ?? '')) {
                        node.textContent = toAsciiDigits(
                            node.textContent ?? '',
                        );
                    }
                }
            };
            requestAnimationFrame(walk);
        }

        // Cleanup observer on unmount
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, [isUrdu]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────

/**
 * Access the current language, setter, and translation function.
 * Throws if used outside of <LanguageProvider>.
 */
export function useLanguage(): LanguageContextValue {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        throw new Error('useLanguage() must be used within a <LanguageProvider>');
    }
    return ctx;
}

export { toUrduNumerals };
