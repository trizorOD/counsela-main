export class LeadApiError extends Error {
    constructor(code, message) {
        super(message);
        this.name = "LeadApiError";
        this.code = code;
    }
}

async function readErrorResponse(response) {
    const fallbackErrors = {
        404: new LeadApiError(
            "service_not_found",
            "Lead delivery is not available on this deployment."
        ),
        413: new LeadApiError(
            "request_too_large",
            "The request is too large for this deployment."
        ),
        503: new LeadApiError(
            "service_not_configured",
            "Lead delivery is not configured yet."
        )
    };

    try {
        const payload = await response.json();
        return new LeadApiError(
            payload.error?.code || "request_failed",
            payload.error?.message || "The request could not be delivered."
        );
    } catch {
        return fallbackErrors[response.status]
            || new LeadApiError("invalid_response", "The delivery service returned an invalid response.");
    }
}

export async function submitLead(lead, { signal } = {}) {
    let response;

    try {
        response = await fetch("/api/lead", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(lead),
            signal
        });
    } catch (error) {
        if (error.name === "AbortError") {
            throw error;
        }

        throw new LeadApiError("network_error", "Check your connection and try again.");
    }

    if (!response.ok) {
        throw await readErrorResponse(response);
    }
}
