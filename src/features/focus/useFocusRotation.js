import { useEffect, useState } from "react";
import {
    getNextTeamIndex,
    getVisibleTeamIndex,
    shouldRotateTeams,
    teamFadeDuration,
    teamVisibleDuration
} from "./focusRotation.js";

export function useFocusRotation({ isActive, teamCount }) {
    const [activeTeamIndex, setActiveTeamIndex] = useState(0);
    const [isSwitching, setIsSwitching] = useState(false);

    useEffect(() => {
        if (isActive) {
            return;
        }

        setActiveTeamIndex(0);
        setIsSwitching(false);
    }, [isActive]);

    useEffect(() => {
        if (!shouldRotateTeams({ isActive, teamCount })) {
            return undefined;
        }

        const fadeOutTimerId = window.setTimeout(() => {
            setIsSwitching(true);
        }, teamVisibleDuration);
        const switchTimerId = window.setTimeout(() => {
            setActiveTeamIndex((currentIndex) => getNextTeamIndex(currentIndex, teamCount));
            setIsSwitching(false);
        }, teamVisibleDuration + teamFadeDuration);

        return () => {
            window.clearTimeout(fadeOutTimerId);
            window.clearTimeout(switchTimerId);
        };
    }, [activeTeamIndex, isActive, teamCount]);

    return {
        activeTeamIndex: getVisibleTeamIndex(activeTeamIndex, teamCount),
        isSwitching
    };
}
