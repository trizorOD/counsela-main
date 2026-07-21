import assert from "node:assert/strict";
import test from "node:test";
import { languageCodes, languages } from "./languages.js";
import { normalizeLanguage } from "../utils/storage.js";

const expectedLanguages = [
    ["en", "English"],
    ["es", "Espa\u00f1ol"],
    ["pt", "Portugu\u00eas"],
    ["uk", "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430"],
    ["ru", "\u0420\u0443\u0441\u0441\u043a\u0438\u0439"],
    ["zh", "\u4e2d\u6587"],
    ["ht", "Krey\u00f2l Ayisyen"],
    ["ar", "\u0627\u0644\u0639\u0631\u0628\u064a\u0629"]
];

test("exposes only the supported languages in display order", () => {
    assert.deepEqual(
        languages.map(({ code, label }) => [code, label]),
        expectedLanguages
    );
    assert.deepEqual(languageCodes, expectedLanguages.map(([code]) => code));
});

test("normalizes removed and unknown languages to English", () => {
    assert.equal(normalizeLanguage("hi"), "en");
    assert.equal(normalizeLanguage("vi"), "en");
    assert.equal(normalizeLanguage("tl"), "en");
    assert.equal(normalizeLanguage("unknown"), "en");
});
