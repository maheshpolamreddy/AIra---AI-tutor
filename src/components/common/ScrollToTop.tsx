import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        const resetScroll = () => {
            // Scroll the main window to the top
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'instant'
            });

            // Target explicit scrollable IDs
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }

            // Target generic layout scroll containers like dashboards
            const scrollContainers = document.querySelectorAll('.overflow-y-auto, [style*="overflow-y: auto"], .scroll-optimized, .custom-scrollbar');
            scrollContainers.forEach(container => {
                container.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            });
        };

        // Fire immediately for synchronous DOM updates
        resetScroll();

        // Fire progressively to catch lazy-loaded (Suspense) elements mounting right after navigation
        const timeoutIds = [50, 150, 300, 500].map(delay => setTimeout(resetScroll, delay));

        return () => {
            timeoutIds.forEach(id => clearTimeout(id));
        };

    }, [pathname]);

    return null;
}
