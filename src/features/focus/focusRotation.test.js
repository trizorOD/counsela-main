import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { languageCodes } from "../../data/languages.js";
import {
    getNextTeamIndex,
    getVisibleTeamIndex,
    shouldRotateTeams,
    teamMemberCount
} from "./focusRotation.js";

async function readMobileLocale(language) {
    const url = new URL(`../../locales/mobile/${language}.json`, import.meta.url);
    return JSON.parse(await readFile(url, "utf8"));
}

test("rotates teams only while the step is active and several teams exist", () => {
    assert.equal(shouldRotateTeams({ isActive: true, teamCount: 6 }), true);
    assert.equal(shouldRotateTeams({ isActive: false, teamCount: 6 }), false);
    assert.equal(shouldRotateTeams({ isActive: true, teamCount: 1 }), false);
    assert.equal(shouldRotateTeams({ isActive: true, teamCount: 0 }), false);
});

test("cycles through the teams and back to the first one", () => {
    assert.equal(getNextTeamIndex(0, 6), 1);
    assert.equal(getNextTeamIndex(4, 6), 5);
    assert.equal(getNextTeamIndex(5, 6), 0);
    assert.equal(getNextTeamIndex(0, 0), 0);
});

test("keeps the visible team inside the available range", () => {
    assert.equal(getVisibleTeamIndex(3, 6), 3);
    assert.equal(getVisibleTeamIndex(9, 6), 5);
    assert.equal(getVisibleTeamIndex(-1, 6), 0);
    assert.equal(getVisibleTeamIndex(2, 0), 0);
});

test("mobile locales describe the same teams in every supported language", async () => {
    const referenceTeams = (await readMobileLocale("en")).focus.teams;

    assert.ok(referenceTeams.length > 1);

    for (const language of languageCodes) {
        const { teams } = (await readMobileLocale(language)).focus;

        assert.equal(
            teams.length,
            referenceTeams.length,
            `Team count differs for mobile/${language}`
        );

        teams.forEach((team, teamIndex) => {
            assert.ok(team.area, `Missing area for mobile/${language} team ${teamIndex}`);
            assert.ok(team.title, `Missing title for mobile/${language} team ${teamIndex}`);
            assert.ok(team.more, `Missing more for mobile/${language} team ${teamIndex}`);
            assert.equal(
                team.members.length,
                teamMemberCount,
                `Member count differs for mobile/${language} team ${teamIndex}`
            );

            team.members.forEach((member, memberIndex) => {
                assert.equal(
                    member.name,
                    referenceTeams[teamIndex].members[memberIndex].name,
                    `Member names must stay untranslated in mobile/${language}`
                );
                assert.ok(
                    member.role,
                    `Missing role for mobile/${language} team ${teamIndex}`
                );
            });
        });
    }
});
