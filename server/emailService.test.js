import assert from "node:assert/strict";
import test from "node:test";
import { EmailRequestError, sendLeadEmail } from "./emailService.js";

const lead = {
    language: "en",
    case: "defense",
    statement: "I received a notice to appear.",
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+1 (305) 555-0134",
    contactMethod: "sms"
};

function withEnvironment(values, run) {
    const originalValues = Object.fromEntries(
        Object.keys(values).map((name) => [name, process.env[name]])
    );

    Object.assign(process.env, values);

    return (async () => {
        try {
            return await run();
        } finally {
            for (const [name, value] of Object.entries(originalValues)) {
                if (value === undefined) {
                    delete process.env[name];
                } else {
                    process.env[name] = value;
                }
            }
        }
    })();
}

test("posts the lead to the email provider and returns the message id", async () => {
    const originalFetch = globalThis.fetch;
    let request;

    globalThis.fetch = async (url, options) => {
        request = { body: JSON.parse(options.body), options, url };
        return Response.json({ id: "message-id" });
    };

    try {
        const messageId = await withEnvironment({
            LEAD_RECIPIENT_EMAIL: "team@example.com, intake@example.com",
            LEAD_SENDER_EMAIL: "Counsela <requests@example.com>",
            RESEND_BASE_URL: "https://api.example.com"
        }, () => sendLeadEmail(lead, { apiKey: "test-key" }));

        assert.equal(messageId, "message-id");
        assert.equal(request.url, "https://api.example.com/emails");
        assert.equal(request.options.method, "POST");
        assert.equal(request.options.headers.Authorization, "Bearer test-key");
        assert.deepEqual(request.body.to, ["team@example.com", "intake@example.com"]);
        assert.equal(request.body.from, "Counsela <requests@example.com>");
        assert.equal(request.body.reply_to, "ada@example.com");
        assert.match(request.body.subject, /Ada Lovelace/);
        assert.match(request.body.text, /I received a notice to appear\./);
        assert.match(request.body.html, /I received a notice to appear\./);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("reports a provider failure with its status", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => Response.json(
        { message: "Domain is not verified." },
        { status: 403 }
    );

    try {
        await assert.rejects(
            () => withEnvironment({
                LEAD_RECIPIENT_EMAIL: "team@example.com",
                LEAD_SENDER_EMAIL: "requests@example.com"
            }, () => sendLeadEmail(lead, { apiKey: "test-key" })),
            (error) => {
                assert.ok(error instanceof EmailRequestError);
                assert.equal(error.code, "delivery_failed");
                assert.equal(error.status, 403);
                assert.equal(error.message, "Domain is not verified.");
                return true;
            }
        );
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test("refuses to send when the sender or recipients are missing", async () => {
    await assert.rejects(
        () => withEnvironment({
            LEAD_RECIPIENT_EMAIL: "",
            LEAD_SENDER_EMAIL: ""
        }, () => sendLeadEmail(lead, { apiKey: "test-key" })),
        (error) => {
            assert.equal(error.code, "service_not_configured");
            assert.equal(error.status, 503);
            return true;
        }
    );
});
