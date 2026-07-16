import assert from "node:assert/strict";
import test from "node:test";
import { createStatementPrompt, getStatementLanguage } from "./openaiConfig.js";

test("builds the statement prompt for the selected language", () => {
    const prompt = createStatementPrompt("uk");

    assert.match(prompt, /well-structured statement in Ukrainian\./);
    assert.match(prompt, /clear, neutral and professional Ukrainian\./);
    assert.match(prompt, /Preserve all facts provided by the user\./);
    assert.doesNotMatch(prompt, /statement in English\./);
});

test("does not accept unknown statement languages", () => {
    assert.equal(getStatementLanguage("unknown"), null);
    assert.throws(
        () => createStatementPrompt("unknown"),
        /Unsupported statement language/
    );
});
