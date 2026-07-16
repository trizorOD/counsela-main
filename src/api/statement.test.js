import assert from "node:assert/strict";
import test from "node:test";
import { createStatement } from "./statement.js";

test("sends the selected statement language with the recordings", async () => {
    const originalFetch = globalThis.fetch;
    let requestBody;

    globalThis.fetch = async (url, options) => {
        assert.equal(url, "/api/statement");
        assert.equal(options.method, "POST");
        requestBody = options.body;

        return new Response(`${JSON.stringify({
            type: "result",
            statement: "Подготовленное заявление"
        })}\n`);
    };

    try {
        const statement = await createStatement([{
            blob: new Blob(["audio"], { type: "audio/webm" }),
            mimeType: "audio/webm"
        }], {
            language: "ru"
        });

        assert.equal(statement, "Подготовленное заявление");
        assert.equal(requestBody.get("language"), "ru");
        assert.equal(requestBody.getAll("audio").length, 1);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
