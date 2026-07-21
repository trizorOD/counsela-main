import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { languageCodes } from "../data/languages.js";

function collectTranslationPaths(value, prefix = "") {
    if (Array.isArray(value)) {
        return value.flatMap((item, index) => (
            collectTranslationPaths(item, `${prefix}[${index}]`)
        ));
    }

    if (value && typeof value === "object") {
        return Object.entries(value).flatMap(([key, item]) => (
            collectTranslationPaths(item, prefix ? `${prefix}.${key}` : key)
        ));
    }

    return [prefix];
}

async function readLocale(version, language) {
    const url = new URL(`./${version}/${language}.json`, import.meta.url);
    return JSON.parse(await readFile(url, "utf8"));
}

test("versioned locales contain only keys from their English contract", async () => {
    for (const version of ["desktop", "mobile"]) {
        const referenceLocale = await readLocale(version, "en");
        const referencePaths = new Set(collectTranslationPaths(referenceLocale));

        for (const language of languageCodes) {
            const locale = await readLocale(version, language);
            const unexpectedPaths = collectTranslationPaths(locale)
                .filter((path) => !referencePaths.has(path));

            assert.deepEqual(
                unexpectedPaths,
                [],
                `Unexpected translation keys found in ${version}/${language}`
            );
        }
    }
});

test("mobile comparison screens are translated in every supported language", async () => {
    const referenceLocale = await readLocale("mobile", "en");

    for (const language of languageCodes) {
        const locale = await readLocale("mobile", language);

        for (const section of ["focus", "communication", "price"]) {
            assert.deepEqual(
                collectTranslationPaths(locale[section], section).sort(),
                collectTranslationPaths(referenceLocale[section], section).sort(),
                `Translation keys differ for mobile/${language}/${section}`
            );
        }
    }
});
