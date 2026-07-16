import { useEffect, useState } from "react";

function getMatches(query, defaultMatches) {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return defaultMatches;
    }

    return window.matchMedia(query).matches;
}

export function useMediaQuery(query, defaultMatches = false) {
    const [matches, setMatches] = useState(() => getMatches(query, defaultMatches));

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return undefined;
        }

        const mediaQuery = window.matchMedia(query);

        function handleChange(event) {
            setMatches(event.matches);
        }

        setMatches(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleChange);

        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, [query]);

    return matches;
}

export function useIsMobile(breakpoint = 767) {
    return useMediaQuery(`(max-width: ${breakpoint}px)`);
}

export function useIsDesktop(breakpoint = 768) {
    return useMediaQuery(`(min-width: ${breakpoint}px)`);
}
