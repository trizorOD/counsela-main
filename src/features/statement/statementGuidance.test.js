import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
    getStatementGuidanceKey,
    statementGuidanceKeysByCase
} from "./statementGuidance.js";

async function readEnglishLocale(version) {
    const url = new URL(`../../locales/${version}/en.json`, import.meta.url);
    return JSON.parse(await readFile(url, "utf8"));
}

test("maps every supported case to statement guidance", () => {
    assert.deepEqual(statementGuidanceKeysByCase, {
        family: "family",
        "work-business": "workBusiness",
        protection: "protection",
        defense: "defense",
        other: "other"
    });

    assert.equal(getStatementGuidanceKey("family"), "family");
    assert.equal(getStatementGuidanceKey("work-business"), "workBusiness");
    assert.equal(getStatementGuidanceKey("unknown"), "other");
    assert.equal(getStatementGuidanceKey(undefined), "other");
});

test("desktop and mobile locales provide complete guidance for every case", async () => {
    for (const version of ["desktop", "mobile"]) {
        const locale = await readEnglishLocale(version);
        const caseValues = locale.case.options.map(({ value }) => value);

        assert.deepEqual(
            [...caseValues].sort(),
            Object.keys(statementGuidanceKeysByCase).sort()
        );

        for (const caseValue of caseValues) {
            const guidanceKey = getStatementGuidanceKey(caseValue);
            const guidance = locale.statement.guidance[guidanceKey];

            assert.equal(typeof guidance.context, "string");
            assert.ok(guidance.context.length > 0);
            assert.equal(guidance.topics.length, 5);
            assert.ok(guidance.topics.every((topic) => typeof topic === "string" && topic));
        }
    }
});
