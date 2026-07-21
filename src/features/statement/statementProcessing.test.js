import assert from "node:assert/strict";
import test from "node:test";
import {
    createStatementInputFingerprint,
    shouldReuseProcessedStatement
} from "./statementProcessing.js";

const recordings = [
    {
        blob: { size: 128 },
        duration: 4.2,
        id: "recording-1",
        mimeType: "audio/webm"
    }
];

test("reuses a statement only when its effective AI input is unchanged", () => {
    const fingerprint = createStatementInputFingerprint(recordings, "en");

    assert.equal(shouldReuseProcessedStatement({
        currentFingerprint: fingerprint,
        enabled: true,
        lastProcessedFingerprint: fingerprint,
        statementText: "Prepared statement"
    }), true);

    assert.equal(shouldReuseProcessedStatement({
        currentFingerprint: fingerprint,
        enabled: false,
        lastProcessedFingerprint: fingerprint,
        statementText: "Prepared statement"
    }), false);
});

test("invalidates the statement when a recording or language changes", () => {
    const fingerprint = createStatementInputFingerprint(recordings, "en");
    const changedRecording = createStatementInputFingerprint([
        ...recordings,
        {
            blob: { size: 256 },
            duration: 2.1,
            id: "recording-2",
            mimeType: "audio/webm"
        }
    ], "en");
    const changedLanguage = createStatementInputFingerprint(recordings, "es");

    assert.notEqual(changedRecording, fingerprint);
    assert.notEqual(changedLanguage, fingerprint);
    assert.equal(shouldReuseProcessedStatement({
        currentFingerprint: changedRecording,
        enabled: true,
        lastProcessedFingerprint: fingerprint,
        statementText: "Prepared statement"
    }), false);
    assert.equal(shouldReuseProcessedStatement({
        currentFingerprint: changedLanguage,
        enabled: true,
        lastProcessedFingerprint: fingerprint,
        statementText: "Prepared statement"
    }), false);
});

test("does not reuse an empty or missing processed result", () => {
    const fingerprint = createStatementInputFingerprint(recordings, "en");

    assert.equal(shouldReuseProcessedStatement({
        currentFingerprint: fingerprint,
        enabled: true,
        lastProcessedFingerprint: fingerprint,
        statementText: ""
    }), false);
    assert.equal(shouldReuseProcessedStatement({
        currentFingerprint: fingerprint,
        enabled: true,
        lastProcessedFingerprint: null,
        statementText: "Prepared statement"
    }), false);
});
