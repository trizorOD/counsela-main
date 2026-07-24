import { contactFieldNames } from "../src/data/formSchema.js";
import { languageCodes } from "../src/data/languages.js";
import { normalizeCollectedFormData, validateFields } from "../src/utils/form.js";
import { EmailRequestError, sendLeadEmail } from "./emailService.js";

const jsonHeaders = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
};

export const leadLimits = {
    maxRequestBytes: 256 * 1024,
    maxStatementLength: 20000
};

const requiredFieldNames = [...contactFieldNames, "case"];

function createJsonResponse(status, payload, headers = {}) {
    return Response.json(payload, {
        status,
        headers: {
            ...jsonHeaders,
            ...headers
        }
    });
}

export function getLeadErrorPayload(error) {
    if (error instanceof EmailRequestError) {
        return {
            code: error.code,
            message: error.message
        };
    }

    if (error?.name === "AbortError") {
        return {
            code: "request_cancelled",
            message: "Delivery was cancelled."
        };
    }

    return {
        code: "delivery_failed",
        message: "We could not deliver the request. Please try again."
    };
}

function validateRequestMetadata(request, maxRequestBytes) {
    const contentType = request.headers.get("content-type") || "";
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (!contentType.startsWith("application/json")) {
        throw new EmailRequestError(
            "invalid_content_type",
            "The request must be sent as JSON.",
            415
        );
    }

    if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
        throw new EmailRequestError(
            "request_too_large",
            "The request is too large to process.",
            413
        );
    }
}

export function getValidatedLead(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new EmailRequestError(
            "invalid_lead",
            "The request could not be read. Please try again.",
            400
        );
    }

    const lead = normalizeCollectedFormData(payload);
    const errors = validateFields(requiredFieldNames, lead);

    if (Object.keys(errors).length > 0) {
        throw new EmailRequestError(
            "invalid_lead",
            `Missing or invalid fields: ${Object.keys(errors).join(", ")}.`,
            400
        );
    }

    if (!languageCodes.includes(lead.language)) {
        throw new EmailRequestError(
            "invalid_language",
            "Select a supported language before continuing.",
            400
        );
    }

    if (lead.statement.length > leadLimits.maxStatementLength) {
        throw new EmailRequestError(
            "statement_too_long",
            "The statement is too long to deliver.",
            413
        );
    }

    return lead;
}

async function parseLeadRequest(request, maxRequestBytes) {
    validateRequestMetadata(request, maxRequestBytes);

    try {
        return getValidatedLead(await request.json());
    } catch (error) {
        if (error instanceof EmailRequestError) {
            throw error;
        }

        throw new EmailRequestError(
            "invalid_lead",
            "The request could not be read. Please try again.",
            400
        );
    }
}

export async function handleLeadRequest(request, {
    apiKey,
    maxRequestBytes = leadLimits.maxRequestBytes,
    sendEmail = sendLeadEmail
} = {}) {
    if (request.method !== "POST") {
        return createJsonResponse(405, {
            error: {
                code: "method_not_allowed",
                message: "Method not allowed."
            }
        }, { Allow: "POST" });
    }

    if (!apiKey) {
        return createJsonResponse(503, {
            error: {
                code: "service_not_configured",
                message: "Lead delivery is not configured yet."
            }
        });
    }

    let lead;

    try {
        lead = await parseLeadRequest(request, maxRequestBytes);
    } catch (error) {
        return createJsonResponse(error.status || 400, {
            error: getLeadErrorPayload(error)
        });
    }

    try {
        await sendEmail(lead, {
            apiKey,
            signal: request.signal
        });
    } catch (error) {
        return createJsonResponse(error.status || 502, {
            error: getLeadErrorPayload(error)
        });
    }

    return createJsonResponse(202, { delivered: true });
}
