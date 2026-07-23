import { languages } from "../src/data/languages.js";

export const openAiConfig = {
    get baseUrl() {
        return process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    },
    get statementModel() {
        return process.env.OPENAI_STATEMENT_MODEL || "gpt-5.6-luna";
    },
    get transcriptionModel() {
        return process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-transcribe";
    }
};

export const audioLimits = {
    maxFileBytes: 25 * 1024 * 1024,
    maxFiles: 5,
    maxRequestBytes: 126 * 1024 * 1024
};

const statementLanguages = new Map(
    languages.map(({ code, statementLanguage }) => [code, statementLanguage])
);

export function getStatementLanguage(languageCode) {
    return statementLanguages.get(languageCode) || null;
}

export function createStatementPrompt(languageCode) {
    const statementLanguage = getStatementLanguage(languageCode);

    if (!statementLanguage) {
        throw new TypeError(`Unsupported statement language: ${languageCode}`);
    } git

    return `You are an assistant helping a user prepare a clear factual statement about their situation.

Using the supplied audio transcripts, write a coherent and well-structured statement in ${statementLanguage}.

Requirements:

- Preserve all facts provided by the user.
- Do not invent names, dates, events, evidence, motives, legal conclusions, or other details.
- Do not remove potentially important information.
- Remove only obvious repetitions and speech disfluencies.
- Present events in a logical or chronological order whenever possible.
- Use clear, neutral and professional ${statementLanguage}.
- Write from the user's perspective using the first person.
- Do not provide legal advice.
- Do not claim that any allegation has been proven.
- If the source information is ambiguous or contradictory, preserve that uncertainty instead of guessing.
- Return only the finished statement without explanations, comments, or Markdown code fences.`;
}
