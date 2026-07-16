import { getAudioExtension } from "../utils/audio";

export class StatementApiError extends Error {
    constructor(code, message) {
        super(message);
        this.name = "StatementApiError";
        this.code = code;
    }
}

async function readErrorResponse(response) {
    try {
        const payload = await response.json();
        return new StatementApiError(
            payload.error?.code || "request_failed",
            payload.error?.message || "The recordings could not be processed."
        );
    } catch {
        return new StatementApiError("invalid_response", "The processing service returned an invalid response.");
    }
}

function handleStreamEvent(event, onStage) {
    if (event.type === "stage" && typeof event.stage === "string") {
        onStage?.(event.stage);
        return null;
    }

    if (event.type === "error") {
        throw new StatementApiError(
            event.error?.code || "processing_failed",
            event.error?.message || "The recordings could not be processed."
        );
    }

    if (event.type === "result" && typeof event.statement === "string") {
        return event.statement.trim();
    }

    return null;
}

export async function createStatement(recordings, { onStage, signal } = {}) {
    const body = new FormData();

    recordings.forEach((recording, index) => {
        const extension = getAudioExtension(recording.mimeType);
        body.append("audio", recording.blob, `recording-${index + 1}.${extension}`);
    });

    let response;

    try {
        response = await fetch("/api/statement", {
            method: "POST",
            body,
            signal
        });
    } catch (error) {
        if (error.name === "AbortError") {
            throw error;
        }

        throw new StatementApiError("network_error", "Check your connection and try again.");
    }

    if (!response.ok) {
        throw await readErrorResponse(response);
    }

    if (!response.body) {
        throw new StatementApiError("invalid_response", "The processing service returned an invalid response.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let statement = "";

    while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n");
        buffer = done ? "" : lines.pop();

        for (const line of lines) {
            if (!line.trim()) {
                continue;
            }

            let event;
            try {
                event = JSON.parse(line);
            } catch {
                throw new StatementApiError("invalid_response", "The processing service returned an invalid response.");
            }

            statement = handleStreamEvent(event, onStage) || statement;
        }

        if (done) {
            break;
        }
    }

    if (!statement) {
        throw new StatementApiError("empty_statement", "The processing service returned an empty statement.");
    }

    return statement;
}
