import { handleStatementRequest } from "../server/statementHandler.js";

const vercelMaxRequestBytes = 4 * 1024 * 1024;

export const maxDuration = 300;

export default {
    fetch(request) {
        return handleStatementRequest(request, {
            apiKey: process.env.OPENAI_API_KEY,
            maxRequestBytes: vercelMaxRequestBytes
        });
    }
};
