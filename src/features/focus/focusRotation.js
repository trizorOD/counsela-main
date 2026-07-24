export const teamVisibleDuration = 3000;
export const teamFadeDuration = 320;
export const teamMemberCount = 3;

export function shouldRotateTeams({ isActive, teamCount }) {
    return Boolean(isActive) && teamCount > 1;
}

export function getNextTeamIndex(currentIndex, teamCount) {
    if (teamCount < 1) {
        return 0;
    }

    return (currentIndex + 1) % teamCount;
}

export function getVisibleTeamIndex(currentIndex, teamCount) {
    if (teamCount < 1) {
        return 0;
    }

    return Math.min(Math.max(0, currentIndex), teamCount - 1);
}
