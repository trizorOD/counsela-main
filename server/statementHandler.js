import { audioLimits, getStatementLanguage } from "./openaiConfig.js";
import { createStatementFromAudio, OpenAIRequestError } from "./openaiService.js";

const jsonHeaders = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
};

function createJsonResponse(status, payload, headers = {}) {
    return Response.json(payload, {
        status,
        headers: {
            ...jsonHeaders,
            ...headers
        }
    });
}

export function getStatementErrorPayload(error) {
    if (error instanceof OpenAIRequestError) {
        return {
            code: error.code,
            message: error.message
        };
    }

    if (error?.name === "AbortError") {
        return {
            code: "request_cancelled",
            message: "Processing was cancelled."
        };
    }

    return {
        code: "processing_failed",
        message: "We could not process the recordings. Please try again."
    };
}

function validateRequestMetadata(request, maxRequestBytes) {
    const contentType = request.headers.get("content-type") || "";
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (!contentType.startsWith("multipart/form-data")) {
        throw new OpenAIRequestError(
            "invalid_content_type",
            "Audio files must be sent as form data.",
            415
        );
    }

    if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
        throw new OpenAIRequestError(
            "request_too_large",
            "The recordings are too large to process.",
            413
        );
    }
}

function getAudioFiles(formData) {
    const files = formData.getAll("audio").filter((value) => (
        value
        && typeof value.arrayBuffer === "function"
        && typeof value.size === "number"
    ));

    if (!files.length) {
        throw new OpenAIRequestError(
            "missing_audio",
            "Add at least one recording before continuing.",
            400
        );
    }

    if (files.length > audioLimits.maxFiles) {
        throw new OpenAIRequestError(
            "too_many_files",
            `You can process up to ${audioLimits.maxFiles} recordings.`,
            400
        );
    }

    if (files.some((file) => file.size === 0 || file.size > audioLimits.maxFileBytes)) {
        throw new OpenAIRequestError(
            "invalid_audio_size",
            "Each recording must be smaller than 25 MB.",
            413
        );
    }

    if (files.some((file) => file.type && !file.type.startsWith("audio/"))) {
        throw new OpenAIRequestError(
            "invalid_audio_type",
            "One of the uploaded files is not a supported audio recording.",
            415
        );
    }

    return files;
}

function getStatementLanguageCode(formData) {
    const language = formData.get("language");

    if (typeof language !== "string" || !getStatementLanguage(language)) {
        throw new OpenAIRequestError(
            "invalid_language",
            "Select a supported statement language before continuing.",
            400
        );
    }

    return language;
}

async function parseStatementRequest(request, maxRequestBytes) {
    validateRequestMetadata(request, maxRequestBytes);

    try {
        const formData = await request.formData();

        return {
            files: getAudioFiles(formData),
            language: getStatementLanguageCode(formData)
        };
    } catch (error) {
        if (error instanceof OpenAIRequestError) {
            throw error;
        }

        throw new OpenAIRequestError(
            "invalid_form_data",
            "The audio upload could not be read. Please try again.",
            400
        );
    }
}

function createEventStream(request, files, language, { apiKey, processAudio }) {
    const encoder = new TextEncoder();
    const processingController = new AbortController();
    const abortProcessing = () => processingController.abort();
    let streamClosed = false;

    request.signal.addEventListener("abort", abortProcessing, { once: true });

    return new ReadableStream({
        start(controller) {
            const sendEvent = (event) => {
                if (streamClosed || processingController.signal.aborted) {
                    return;
                }

                try {
                    controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
                } catch {
                    streamClosed = true;
                    processingController.abort();
                }
            };

            Promise.resolve()
                .then(() => processAudio(files, {
                    apiKey,
                    language,
                    onStage: (stage) => sendEvent({ type: "stage", stage }),
                    signal: processingController.signal
                }))
                .then((statement) => sendEvent({ type: "result", statement }))
                .catch((error) => {
                    if (!processingController.signal.aborted) {
                        sendEvent({ type: "error", error: getStatementErrorPayload(error) });
                    }
                })
                .finally(() => {
                    request.signal.removeEventListener("abort", abortProcessing);

                    if (!streamClosed) {
                        streamClosed = true;
                        controller.close();
                    }
                });
        },
        cancel() {
            streamClosed = true;
            request.signal.removeEventListener("abort", abortProcessing);
            processingController.abort();
        }
    });
}

export async function handleStatementRequest(request, {
    apiKey,
    maxRequestBytes = audioLimits.maxRequestBytes,
    processAudio = createStatementFromAudio
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
                message: "Audio processing is not configured yet."
            }
        });
    }

    let statementRequest;

    try {
        statementRequest = await parseStatementRequest(request, maxRequestBytes);
    } catch (error) {
        return createJsonResponse(error.status || 400, {
            error: getStatementErrorPayload(error)
        });
    }

    return new Response(createEventStream(
        request,
        statementRequest.files,
        statementRequest.language,
        { apiKey, processAudio }
    ), {
        status: 200,
        headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "X-Content-Type-Options": "nosniff"
        }
    });
}
