import assert from "node:assert/strict";
import test from "node:test";
import vercelLeadFunction from "../api/lead.js";
import { handleLeadRequest } from "./leadHandler.js";

const endpoint = "http://localhost/api/lead";

const lead = {
    language: "ru",
    case: "family",
    statement: "I need help with a family petition.",
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+1 (305) 555-0134",
    contactMethod: "whatsapp"
};

function createLeadRequest(payload = lead) {
    return new Request(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
}

test("rejects unsupported methods", async () => {
    const response = await handleLeadRequest(new Request(endpoint), { apiKey: "test-key" });

    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
    assert.equal((await response.json()).error.code, "method_not_allowed");
});

test("exposes the shared handler through the Vercel function entrypoint", async () => {
    const response = await vercelLeadFunction.fetch(new Request(endpoint));

    assert.equal(response.status, 405);
    assert.equal((await response.json()).error.code, "method_not_allowed");
});

test("reports a missing API key", async () => {
    const response = await handleLeadRequest(createLeadRequest());

    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, "service_not_configured");
});

test("delivers the collected answers to the email service", async () => {
    let deliveredLead;
    const response = await handleLeadRequest(createLeadRequest(), {
        apiKey: "test-key",
        sendEmail: async (nextLead, { apiKey }) => {
            assert.equal(apiKey, "test-key");
            deliveredLead = nextLead;
            return "message-id";
        }
    });

    assert.equal(response.status, 202);
    assert.deepEqual(await response.json(), { delivered: true });
    assert.deepEqual(deliveredLead, lead);
});

test("rejects an incomplete or invalid submission", async () => {
    for (const invalidLead of [
        { ...lead, email: "not-an-email" },
        { ...lead, fullName: "" },
        { ...lead, case: "" },
        { ...lead, contactMethod: "" }
    ]) {
        const response = await handleLeadRequest(createLeadRequest(invalidLead), {
            apiKey: "test-key",
            sendEmail: async () => assert.fail("Invalid submissions must not be delivered.")
        });

        assert.equal(response.status, 400);
        assert.equal((await response.json()).error.code, "invalid_lead");
    }
});

test("rejects an unsupported language", async () => {
    const response = await handleLeadRequest(createLeadRequest({
        ...lead,
        language: "unsupported"
    }), {
        apiKey: "test-key",
        sendEmail: async () => assert.fail("Unsupported languages must not be delivered.")
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "invalid_language");
});

test("validates deployment request size before parsing the body", async () => {
    const response = await handleLeadRequest(new Request(endpoint, {
        method: "POST",
        headers: {
            "Content-Length": "1025",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(lead)
    }), {
        apiKey: "test-key",
        maxRequestBytes: 1024
    });

    assert.equal(response.status, 413);
    assert.equal((await response.json()).error.code, "request_too_large");
});

test("reports a failed delivery without exposing internals", async () => {
    const response = await handleLeadRequest(createLeadRequest(), {
        apiKey: "test-key",
        sendEmail: async () => {
            throw new Error("socket hang up");
        }
    });

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
        error: {
            code: "delivery_failed",
            message: "We could not deliver the request. Please try again."
        }
    });
});
