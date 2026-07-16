import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { createServer as createViteServer, loadEnv } from "vite";
import { audioLimits } from "./openaiConfig.js";
import { createStatementFromAudio, OpenAIRequestError } from "./openaiService.js";

const root = process.cwd();
const isDevelopment = process.argv.includes("--dev");
const mode = isDevelopment ? "development" : "production";
Object.assign(process.env, loadEnv(mode, root, ""));

const port = Number(process.env.PORT) || 5173;
const distDirectory = resolve(root, "dist");
const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp"
};

function sendJson(response, status, payload) {
    response.writeHead(status, {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8"
    });
    response.end(JSON.stringify(payload));
}

function getErrorPayload(error) {
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

async function parseAudioFiles(request) {
    const contentType = request.headers["content-type"] || "";
    const contentLength = Number(request.headers["content-length"] || 0);

    if (!contentType.startsWith("multipart/form-data")) {
        throw new OpenAIRequestError("invalid_content_type", "Audio files must be sent as form data.", 415);
    }

    if (contentLength > audioLimits.maxRequestBytes) {
        throw new OpenAIRequestError("request_too_large", "The recordings are too large to process.", 413);
    }

    const webRequest = new Request(`http://${request.headers.host || "localhost"}${request.url}`, {
        method: request.method,
        headers: request.headers,
        body: Readable.toWeb(request),
        duplex: "half"
    });
    const formData = await webRequest.formData();
    const files = formData.getAll("audio").filter((value) => (
        value
        && typeof value.arrayBuffer === "function"
        && typeof value.size === "number"
    ));

    if (!files.length) {
        throw new OpenAIRequestError("missing_audio", "Add at least one recording before continuing.", 400);
    }

    if (files.length > audioLimits.maxFiles) {
        throw new OpenAIRequestError("too_many_files", `You can process up to ${audioLimits.maxFiles} recordings.`, 400);
    }

    if (files.some((file) => file.size === 0 || file.size > audioLimits.maxFileBytes)) {
        throw new OpenAIRequestError("invalid_audio_size", "Each recording must be smaller than 25 MB.", 413);
    }

    if (files.some((file) => file.type && !file.type.startsWith("audio/"))) {
        throw new OpenAIRequestError("invalid_audio_type", "One of the uploaded files is not a supported audio recording.", 415);
    }

    return files;
}

async function handleStatementRequest(request, response) {
    if (request.method !== "POST") {
        response.setHeader("Allow", "POST");
        sendJson(response, 405, {
            error: {
                code: "method_not_allowed",
                message: "Method not allowed."
            }
        });
        return;
    }

    if (!process.env.OPENAI_API_KEY) {
        sendJson(response, 503, {
            error: {
                code: "service_not_configured",
                message: "Audio processing is not configured yet."
            }
        });
        return;
    }

    let files;

    try {
        files = await parseAudioFiles(request);
    } catch (error) {
        const payload = getErrorPayload(error);
        sendJson(response, error.status || 400, { error: payload });
        return;
    }

    const controller = new AbortController();
    const abort = () => controller.abort();
    request.once("aborted", abort);
    response.once("close", () => {
        if (!response.writableEnded) {
            abort();
        }
    });

    response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "X-Content-Type-Options": "nosniff"
    });

    const sendEvent = (event) => {
        if (!response.destroyed && !response.writableEnded) {
            response.write(`${JSON.stringify(event)}\n`);
        }
    };

    try {
        const statement = await createStatementFromAudio(files, {
            apiKey: process.env.OPENAI_API_KEY,
            onStage: (stage) => sendEvent({ type: "stage", stage }),
            signal: controller.signal
        });

        sendEvent({ type: "result", statement });
    } catch (error) {
        if (!controller.signal.aborted) {
            sendEvent({ type: "error", error: getErrorPayload(error) });
        }
    } finally {
        if (!response.destroyed && !response.writableEnded) {
            response.end();
        }
    }
}

async function serveStatic(request, response) {
    let pathname;

    try {
        pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
        sendJson(response, 400, { error: { code: "bad_request", message: "Invalid request." } });
        return;
    }

    const requestedPath = pathname === "/" ? "index.html" : pathname.slice(1);
    let filePath = resolve(distDirectory, requestedPath);

    if (!filePath.startsWith(`${distDirectory}${sep}`) && filePath !== distDirectory) {
        sendJson(response, 403, { error: { code: "forbidden", message: "Forbidden." } });
        return;
    }

    try {
        const fileStat = await stat(filePath);
        if (fileStat.isDirectory()) {
            filePath = resolve(filePath, "index.html");
        }
    } catch {
        filePath = resolve(distDirectory, "index.html");
    }

    try {
        const file = await readFile(filePath);
        response.writeHead(200, {
            "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream"
        });
        response.end(file);
    } catch {
        sendJson(response, 404, { error: { code: "not_found", message: "Page not found." } });
    }
}

const vite = isDevelopment
    ? await createViteServer({
        appType: "spa",
        server: { middlewareMode: true }
    })
    : null;

const server = createServer((request, response) => {
    if (request.url?.startsWith("/api/statement")) {
        handleStatementRequest(request, response).catch((error) => {
            if (!response.headersSent) {
                sendJson(response, 500, { error: getErrorPayload(error) });
            } else if (!response.writableEnded) {
                response.end();
            }
        });
        return;
    }

    if (vite) {
        vite.middlewares(request, response, () => {
            sendJson(response, 404, { error: { code: "not_found", message: "Page not found." } });
        });
        return;
    }

    serveStatic(request, response);
});

server.listen(port, "127.0.0.1", () => {
    console.log(`Counsela is running at http://127.0.0.1:${port}`);
});
