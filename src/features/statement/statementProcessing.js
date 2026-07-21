export const reuseUnchangedStatementResult = true;

export function createStatementInputFingerprint(recordings, language) {
    return JSON.stringify({
        language,
        recordings: recordings.map((recording) => ({
            duration: recording.duration,
            id: recording.id,
            mimeType: recording.mimeType,
            size: recording.blob?.size ?? 0
        }))
    });
}

export function shouldReuseProcessedStatement({
    currentFingerprint,
    enabled,
    lastProcessedFingerprint,
    statementText
}) {
    return Boolean(
        enabled
        && statementText.trim()
        && lastProcessedFingerprint
        && currentFingerprint === lastProcessedFingerprint
    );
}
