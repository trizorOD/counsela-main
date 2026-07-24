import assert from "node:assert/strict";
import test from "node:test";
import {
    createLeadFields,
    createLeadHtml,
    createLeadSubject,
    createLeadText
} from "./emailConfig.js";

const lead = {
    language: "ru",
    case: "work-business",
    statement: "My employer filed the petition in March.",
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+1 (305) 555-0134",
    contactMethod: "whatsapp"
};

test("labels every collected answer in a readable way", () => {
    assert.deepEqual(createLeadFields(lead), [
        { label: "Full name", value: "Ada Lovelace" },
        { label: "Email", value: "ada@example.com" },
        { label: "Phone", value: "+1 (305) 555-0134" },
        { label: "Preferred contact", value: "WhatsApp" },
        { label: "Language", value: "Russian" },
        { label: "Case type", value: "Work & Business" }
    ]);

    assert.equal(
        createLeadSubject(lead),
        "New case review request — Ada Lovelace (Work & Business)"
    );
});

test("keeps the statement in the plain text version", () => {
    const text = createLeadText(lead);

    assert.match(text, /Full name: Ada Lovelace/);
    assert.match(text, /Preferred contact: WhatsApp/);
    assert.match(text, /My employer filed the petition in March\./);
});

test("escapes submitted values so they cannot inject markup", () => {
    const html = createLeadHtml({
        ...lead,
        fullName: "<script>alert(1)</script>",
        statement: "5 < 6 & \"quoted\""
    });

    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.match(html, /5 &lt; 6 &amp; &quot;quoted&quot;/);
});

test("falls back to a placeholder for answers that are missing", () => {
    const fields = createLeadFields({ fullName: "Ada Lovelace" });
    const text = createLeadText({ fullName: "Ada Lovelace" });

    assert.equal(fields.find(({ label }) => label === "Preferred contact").value, "Not provided");
    assert.match(text, /Statement:\nNot provided/);
});
