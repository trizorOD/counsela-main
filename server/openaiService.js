import { createStatementPrompt, openAiConfig } from "./openaiConfig.js";

export class OpenAIRequestError extends Error {
    constructor(code, message, status = 502) {
        super(message);
        this.name = "OpenAIRequestError";
        this.code = code;
        this.status = status;
    }
}

async function readResponseJson(response) {
    try {
        return await response.json();
    } catch {
        throw new OpenAIRequestError(
            "invalid_provider_response",
            "The processing service returned an invalid response. Please try again."
        );
    }
}

async function transcribeAudio(file, apiKey, signal) {
    const body = new FormData();
    body.append("model", openAiConfig.transcriptionModel);
    body.append("response_format", "json");
    body.append("file", file, file.name || "recording.webm");

    const response = await fetch(`${openAiConfig.baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`
        },
        body,
        signal
    });
    const data = await readResponseJson(response);

    if (!response.ok) {
        throw new OpenAIRequestError(
            "transcription_failed",
            data.error?.message || "One of the recordings could not be transcribed. Please try again.",
            response.status
        );
    }

    const transcript = typeof data.text === "string" ? data.text.trim() : "";

    if (!transcript) {
        throw new OpenAIRequestError(
            "empty_transcription",
            "One of the recordings did not contain recognizable speech. Please review it and try again."
        );
    }

    return transcript;
}

function getResponseText(data) {
    if (typeof data.output_text === "string") {
        return data.output_text.trim();
    }

    return (data.output || [])
        .flatMap((item) => item.content || [])
        .filter((item) => item.type === "output_text" && typeof item.text === "string")
        .map((item) => item.text)
        .join("\n")
        .trim();
}

async function draftStatement(transcripts, language, apiKey, signal) {
    const sourceText = transcripts
        .map((transcript, index) => `Recording ${index + 1}:\n${transcript}`)
        .join("\n\n");
    const response = await fetch(`${openAiConfig.baseUrl}/responses`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: openAiConfig.statementModel,
            instructions: createStatementPrompt(language),
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: `Audio transcripts, in their original order:\n\n${sourceText}`
                        }
                    ]
                }
            ]
        }),
        signal
    });
    const data = await readResponseJson(response);

    if (!response.ok) {
        throw new OpenAIRequestError(
            "statement_failed",
            data.error?.message || "The final statement could not be prepared. Please try again.",
            response.status
        );
    }

    const statement = getResponseText(data);

    if (!statement) {
        throw new OpenAIRequestError(
            "empty_statement",
            "The processing service returned an empty statement. Please try again."
        );
    }

    return statement;
}

export async function createStatementFromAudio(files, { apiKey, language, onStage, signal }) {
    onStage("listening");
    onStage("transcribing");

    const transcriptionController = new AbortController();
    const abortTranscriptions = () => transcriptionController.abort();
    signal.addEventListener("abort", abortTranscriptions, { once: true });

    if (signal.aborted) {
        transcriptionController.abort();
    }

    let transcripts;

    try {
        transcripts = await Promise.all(files.map((file) => (
            transcribeAudio(file, apiKey, transcriptionController.signal)
        )));
    } catch (error) {
        transcriptionController.abort();
        throw error;
    } finally {
        signal.removeEventListener("abort", abortTranscriptions);
    }

    onStage("organizing");
    const statementPromise = draftStatement(transcripts, language, apiKey, signal);
    onStage("almost-ready");

    return statementPromise;
}
