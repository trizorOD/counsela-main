import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeAudioBlob } from "../utils/audio";

const supportedMimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4"
];

function getSupportedMimeType() {
    if (typeof MediaRecorder.isTypeSupported !== "function") {
        return "";
    }

    return supportedMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
}

function getRecorderErrorCode(error) {
    switch (error?.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
            return "permissionDenied";
        case "NotFoundError":
        case "DevicesNotFoundError":
            return "noDevice";
        case "NotReadableError":
        case "TrackStartError":
        case "AbortError":
            return "deviceBusy";
        case "SecurityError":
            return "security";
        default:
            return "unknown";
    }
}

function createRecordingId() {
    return typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `recording-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useAudioRecorder(maxRecordings = 5) {
    const [recordings, setRecordings] = useState([]);
    const [status, setStatus] = useState("idle");
    const [errorCode, setErrorCode] = useState(null);
    const statusRef = useRef(status);
    const recordingsRef = useRef(recordings);
    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const meterTimerRef = useRef(null);
    const chunksRef = useRef([]);
    const samplesRef = useRef([]);
    const startedAtRef = useRef(0);
    const discardRef = useRef(false);
    const mountedRef = useRef(true);
    const urlsRef = useRef(new Set());

    const transition = useCallback((nextStatus) => {
        statusRef.current = nextStatus;

        if (mountedRef.current) {
            setStatus(nextStatus);
        }
    }, []);

    const stopMeter = useCallback(() => {
        if (meterTimerRef.current) {
            window.clearInterval(meterTimerRef.current);
            meterTimerRef.current = null;
        }

        const audioContext = audioContextRef.current;
        audioContextRef.current = null;

        if (audioContext) {
            audioContext.close().catch(() => undefined);
        }
    }, []);

    const releaseMicrophone = useCallback(() => {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        stopMeter();
    }, [stopMeter]);

    const startMeter = useCallback((stream) => {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return;
        }

        try {
            const audioContext = new AudioContextClass();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            analyser.fftSize = 256;
            const data = new Uint8Array(analyser.fftSize);
            source.connect(analyser);
            audioContextRef.current = audioContext;
            meterTimerRef.current = window.setInterval(() => {
                analyser.getByteTimeDomainData(data);

                const rms = Math.sqrt(data.reduce((sum, value) => {
                    const normalized = (value - 128) / 128;
                    return sum + normalized * normalized;
                }, 0) / data.length);

                samplesRef.current.push(rms);
            }, 70);
        } catch {
            stopMeter();
        }
    }, [stopMeter]);

    const finalizeRecording = useCallback(async (recorder) => {
        const discardReason = discardRef.current;
        const chunks = chunksRef.current;
        const fallbackSamples = samplesRef.current;
        const fallbackDuration = Math.max(0, (performance.now() - startedAtRef.current) / 1000);

        mediaRecorderRef.current = null;
        chunksRef.current = [];
        samplesRef.current = [];
        discardRef.current = null;
        releaseMicrophone();

        if (!mountedRef.current || discardReason) {
            if (mountedRef.current) {
                transition(discardReason === "error" ? "error" : "idle");
            }
            return;
        }

        const mimeType = recorder.mimeType || chunks[0]?.type || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });

        if (blob.size === 0 || fallbackDuration < 0.15) {
            setErrorCode("tooShort");
            transition("error");
            return;
        }

        const { duration, waveform } = await analyzeAudioBlob(blob, fallbackDuration, fallbackSamples);

        if (!mountedRef.current) {
            return;
        }

        const url = URL.createObjectURL(blob);
        urlsRef.current.add(url);
        setRecordings((currentRecordings) => {
            if (currentRecordings.length >= maxRecordings) {
                URL.revokeObjectURL(url);
                urlsRef.current.delete(url);
                return currentRecordings;
            }

            return [
                ...currentRecordings,
                {
                    id: createRecordingId(),
                    blob,
                    duration,
                    mimeType,
                    url,
                    waveform
                }
            ];
        });
        setErrorCode(null);
        transition("idle");
    }, [maxRecordings, releaseMicrophone, transition]);

    const startRecording = useCallback(async () => {
        if (
            !["idle", "error"].includes(statusRef.current)
            || mediaRecorderRef.current
            || recordingsRef.current.length >= maxRecordings
        ) {
            if (recordingsRef.current.length >= maxRecordings) {
                setErrorCode("maxRecordings");
                transition("error");
            }
            return;
        }

        if (
            typeof navigator.mediaDevices?.getUserMedia !== "function"
            || typeof window.MediaRecorder !== "function"
        ) {
            setErrorCode("unsupported");
            transition("error");
            return;
        }

        transition("requesting");
        setErrorCode(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            if (!mountedRef.current || statusRef.current !== "requesting") {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            if (!stream.getAudioTracks().length) {
                stream.getTracks().forEach((track) => track.stop());
                throw new DOMException("No audio track", "NotFoundError");
            }

            const mimeType = getSupportedMimeType();
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            mediaStreamRef.current = stream;
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];
            samplesRef.current = [];
            discardRef.current = null;
            startedAtRef.current = performance.now();

            recorder.addEventListener("dataavailable", (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            });
            recorder.addEventListener("stop", () => {
                finalizeRecording(recorder);
            }, { once: true });
            recorder.addEventListener("error", () => {
                discardRef.current = "error";
                setErrorCode("recordingFailed");
                transition("error");

                if (recorder.state !== "inactive") {
                    recorder.stop();
                }
                releaseMicrophone();
            }, { once: true });

            startMeter(stream);
            recorder.start(250);
            transition("recording");
        } catch (error) {
            releaseMicrophone();
            mediaRecorderRef.current = null;
            setErrorCode(getRecorderErrorCode(error));
            transition("error");
        }
    }, [finalizeRecording, maxRecordings, releaseMicrophone, startMeter, transition]);

    const stopRecording = useCallback(() => {
        const recorder = mediaRecorderRef.current;

        if (!recorder || recorder.state === "inactive" || statusRef.current !== "recording") {
            return;
        }

        transition("stopping");
        recorder.stop();
    }, [transition]);

    const cancelRecording = useCallback(() => {
        const recorder = mediaRecorderRef.current;

        discardRef.current = "cancel";

        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
        } else {
            mediaRecorderRef.current = null;
            releaseMicrophone();
            transition("idle");
        }
    }, [releaseMicrophone, transition]);

    const removeRecording = useCallback((recordingId) => {
        setRecordings((currentRecordings) => currentRecordings.filter((recording) => {
            if (recording.id !== recordingId) {
                return true;
            }

            URL.revokeObjectURL(recording.url);
            urlsRef.current.delete(recording.url);
            return false;
        }));
        setErrorCode((currentErrorCode) => currentErrorCode === "maxRecordings" ? null : currentErrorCode);

        if (statusRef.current === "error") {
            transition("idle");
        }
    }, [transition]);

    useEffect(() => {
        recordingsRef.current = recordings;
    }, [recordings]);

    useEffect(() => {
        mountedRef.current = true;
        const urls = urlsRef.current;

        return () => {
            mountedRef.current = false;
            discardRef.current = "cancel";

            const recorder = mediaRecorderRef.current;
            if (recorder && recorder.state !== "inactive") {
                recorder.stop();
            }

            releaseMicrophone();
            urls.forEach((url) => URL.revokeObjectURL(url));
            urls.clear();
        };
    }, [releaseMicrophone]);

    return {
        cancelRecording,
        errorCode,
        maxReached: recordings.length >= maxRecordings,
        recordings,
        removeRecording,
        startRecording,
        status,
        stopRecording
    };
}
