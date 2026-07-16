export const waveformBarCount = 48;

function normalizeSamples(samples, barCount) {
    if (!samples.length) {
        return Array.from({ length: barCount }, () => 0.12);
    }

    const bucketSize = samples.length / barCount;
    const levels = Array.from({ length: barCount }, (_, index) => {
        const start = Math.floor(index * bucketSize);
        const end = Math.max(start + 1, Math.floor((index + 1) * bucketSize));
        let total = 0;

        for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
            total += Math.abs(samples[sampleIndex] || 0);
        }

        const average = total / (end - start);

        return average;
    });
    const peak = Math.max(...levels, 0.01);

    return levels.map((level) => Math.min(1, Math.max(0.12, level / peak)));
}

export async function analyzeAudioBlob(blob, fallbackDuration, fallbackSamples = []) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        return {
            duration: fallbackDuration,
            waveform: normalizeSamples(fallbackSamples, waveformBarCount)
        };
    }

    const audioContext = new AudioContextClass();

    try {
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        const channelData = audioBuffer.getChannelData(0);

        return {
            duration: Number.isFinite(audioBuffer.duration) ? audioBuffer.duration : fallbackDuration,
            waveform: normalizeSamples(channelData, waveformBarCount)
        };
    } catch {
        return {
            duration: fallbackDuration,
            waveform: normalizeSamples(fallbackSamples, waveformBarCount)
        };
    } finally {
        await audioContext.close().catch(() => undefined);
    }
}

export function formatDuration(seconds) {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function getAudioExtension(mimeType = "") {
    if (mimeType.includes("mp4")) {
        return "m4a";
    }

    if (mimeType.includes("ogg")) {
        return "ogg";
    }

    return "webm";
}
