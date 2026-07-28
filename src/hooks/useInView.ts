/**
 * useInView.ts — Scroll-triggered animation hook.
 *
 * Returns a ref and inView flag. Sets inView to true the first time the
 * element enters the viewport, then disconnects the observer (one-shot).
 *
 * @example
 *   const { ref, inView } = useInView();
 *   <div ref={ref} className={inView ? 'animate-fade-in-up' : 'opacity-0'} />
 */

import { useEffect, useRef, useState } from 'react';

export function useInView(options?: IntersectionObserverInit) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, ...options },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { ref, inView } as const;
}
