import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { createServer as createViteServer, loadEnv } from "vite";
import { handleLeadRequest as handleLeadWebRequest } from "./leadHandler.js";
import { handleStatementRequest as handleStatementWebRequest } from "./statementHandler.js";

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

const apiRoutes = [
    {
        handle: (webRequest) => handleStatementWebRequest(webRequest, {
            apiKey: process.env.OPENAI_API_KEY
        }),
        path: "/api/statement"
    },
    {
        handle: (webRequest) => handleLeadWebRequest(webRequest, {
            apiKey: process.env.RESEND_API_KEY
        }),
        path: "/api/lead"
    }
];

async function handleApiRequest(request, response, handleWebRequest) {
    const requestController = new AbortController();
    const abortRequest = () => requestController.abort();
    const method = request.method || "GET";
    const hasBody = !["GET", "HEAD"].includes(method);
    const requestInit = {
        method,
        headers: request.headers,
        signal: requestController.signal
    };

    if (hasBody) {
        requestInit.body = Readable.toWeb(request);
        requestInit.duplex = "half";
    }

    request.once("aborted", abortRequest);
    response.once("close", () => {
        if (!response.writableEnded) {
            abortRequest();
        }
    });
    const webRequest = new Request(
        `http://${request.headers.host || "localhost"}${request.url}`,
        requestInit
    );
    const webResponse = await handleWebRequest(webRequest);

    response.writeHead(webResponse.status, Object.fromEntries(webResponse.headers.entries()));

    if (method === "HEAD" || !webResponse.body) {
        response.end();
        return;
    }

    const responseBody = Readable.fromWeb(webResponse.body);
    responseBody.once("error", (error) => {
        abortRequest();

        if (!response.destroyed) {
            response.destroy(error);
        }
    });
    responseBody.pipe(response);
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
    const apiRoute = apiRoutes.find(({ path }) => request.url?.startsWith(path));

    if (apiRoute) {
        handleApiRequest(request, response, apiRoute.handle).catch(() => {
            if (!response.headersSent) {
                sendJson(response, 500, {
                    error: {
                        code: "request_failed",
                        message: "We could not complete the request. Please try again."
                    }
                });
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
