import { handleLeadRequest } from "../server/leadHandler.js";

export const maxDuration = 30;

export default {
    fetch(request) {
        return handleLeadRequest(request, {
            apiKey: process.env.RESEND_API_KEY
        });
    }
};
