import assert from "node:assert/strict";
import test from "node:test";
import {
    clearSavedData,
    formStorageKey,
    languageStorageKey
} from "./storage.js";

test("clearSavedData removes only Counsela data", () => {
    const values = new Map([
        [formStorageKey, "saved form"],
        [languageStorageKey, "en"],
        ["unrelated_key", "keep me"]
    ]);
    const originalStorage = globalThis.localStorage;

    globalThis.localStorage = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key)
    };

    try {
        clearSavedData();

        assert.equal(values.has(formStorageKey), false);
        assert.equal(values.has(languageStorageKey), false);
        assert.equal(values.get("unrelated_key"), "keep me");
    } finally {
        if (originalStorage === undefined) {
            delete globalThis.localStorage;
        } else {
            globalThis.localStorage = originalStorage;
        }
    }
});
