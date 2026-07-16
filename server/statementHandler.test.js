import assert from "node:assert/strict";
import test from "node:test";
import vercelStatementFunction from "../api/statement.js";
import { handleStatementRequest } from "./statementHandler.js";

const endpoint = "http://localhost/api/statement";

test("rejects unsupported methods", async () => {
    const response = await handleStatementRequest(new Request(endpoint), { apiKey: "test-key" });

    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
    assert.deepEqual(await response.json(), {
        error: {
            code: "method_not_allowed",
            message: "Method not allowed."
        }
    });
});

test("exposes the shared handler through the Vercel function entrypoint", async () => {
    const response = await vercelStatementFunction.fetch(new Request(endpoint));

    assert.equal(response.status, 405);
    assert.equal((await response.json()).error.code, "method_not_allowed");
});

test("reports a missing API key", async () => {
    const response = await handleStatementRequest(new Request(endpoint, {
        method: "POST",
        body: new FormData()
    }));

    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, "service_not_configured");
});

test("validates deployment request size before parsing the body", async () => {
    const response = await handleStatementRequest(new Request(endpoint, {
        method: "POST",
        headers: {
            "Content-Length": "1025",
            "Content-Type": "multipart/form-data; boundary=test"
        },
        body: "--test--\r\n"
    }), {
        apiKey: "test-key",
        maxRequestBytes: 1024
    });

    assert.equal(response.status, 413);
    assert.equal((await response.json()).error.code, "request_too_large");
});

test("streams processing stages and the final statement", async () => {
    const formData = new FormData();
    formData.append("language", "ru");
    formData.append("audio", new Blob(["audio"], { type: "audio/webm" }), "recording.webm");
    const response = await handleStatementRequest(new Request(endpoint, {
        method: "POST",
        body: formData
    }), {
        apiKey: "test-key",
        processAudio: async (files, { language, onStage }) => {
            assert.equal(files.length, 1);
            assert.equal(language, "ru");
            onStage("transcribing");
            onStage("organizing");
            return "Prepared statement";
        }
    });
    const events = (await response.text())
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/x-ndjson; charset=utf-8");
    assert.deepEqual(events, [
        { type: "stage", stage: "transcribing" },
        { type: "stage", stage: "organizing" },
        { type: "result", statement: "Prepared statement" }
    ]);
});

test("rejects an unsupported statement language", async () => {
    const formData = new FormData();
    formData.append("language", "unsupported");
    formData.append("audio", new Blob(["audio"], { type: "audio/webm" }), "recording.webm");
    const response = await handleStatementRequest(new Request(endpoint, {
        method: "POST",
        body: formData
    }), {
        apiKey: "test-key"
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "invalid_language");
});
