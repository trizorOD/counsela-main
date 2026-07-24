import {
    createLeadHtml,
    createLeadSubject,
    createLeadText,
    resendConfig
} from "./emailConfig.js";

export class EmailRequestError extends Error {
    constructor(code, message, status = 502) {
        super(message);
        this.name = "EmailRequestError";
        this.code = code;
        this.status = status;
    }
}

async function readResponseJson(response) {
    try {
        return await response.json();
    } catch {
        throw new EmailRequestError(
            "invalid_provider_response",
            "The email service returned an invalid response. Please try again."
        );
    }
}

export async function sendLeadEmail(lead, { apiKey, signal } = {}) {
    const { baseUrl, recipients, sender } = resendConfig;

    if (!recipients.length || !sender) {
        throw new EmailRequestError(
            "service_not_configured",
            "Lead delivery is not configured yet.",
            503
        );
    }

    const response = await fetch(`${baseUrl}/emails`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: sender,
            to: recipients,
            reply_to: lead.email,
            subject: createLeadSubject(lead),
            html: createLeadHtml(lead),
            text: createLeadText(lead)
        }),
        signal
    });
    const data = await readResponseJson(response);

    if (!response.ok) {
        throw new EmailRequestError(
            "delivery_failed",
            data.message || "The case review request could not be delivered. Please try again.",
            response.status
        );
    }

    return data.id || "";
}
