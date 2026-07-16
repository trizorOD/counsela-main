import { useCallback, useEffect, useRef, useState } from "react";

const initialPlayback = {
    currentTime: 0,
    id: null,
    isPlaying: false,
    progress: 0
};

export function useAudioPlayback() {
    const [playback, setPlayback] = useState(initialPlayback);
    const playbackRef = useRef(playback);
    const audioRef = useRef(null);
    const removeListenersRef = useRef(null);

    const updatePlayback = useCallback((nextPlayback) => {
        playbackRef.current = typeof nextPlayback === "function"
            ? nextPlayback(playbackRef.current)
            : nextPlayback;
        setPlayback(playbackRef.current);
    }, []);

    const disposeAudio = useCallback(() => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        removeListenersRef.current?.();
        removeListenersRef.current = null;
        audioRef.current = null;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
    }, []);

    const stop = useCallback(() => {
        disposeAudio();
        updatePlayback(initialPlayback);
    }, [disposeAudio, updatePlayback]);

    const toggle = useCallback(async (recording) => {
        const currentAudio = audioRef.current;
        const currentPlayback = playbackRef.current;

        if (currentAudio && currentPlayback.id === recording.id) {
            if (currentAudio.paused) {
                try {
                    await currentAudio.play();
                    updatePlayback((current) => ({ ...current, isPlaying: true }));
                } catch {
                    stop();
                }
            } else {
                currentAudio.pause();
                updatePlayback((current) => ({ ...current, isPlaying: false }));
            }
            return;
        }

        disposeAudio();
        const audio = new Audio(recording.url);
        audio.preload = "metadata";
        audioRef.current = audio;

        const handleTimeUpdate = () => {
            const duration = Number.isFinite(audio.duration) && audio.duration > 0
                ? audio.duration
                : recording.duration;

            updatePlayback({
                currentTime: audio.currentTime,
                id: recording.id,
                isPlaying: !audio.paused,
                progress: duration > 0 ? Math.min(1, audio.currentTime / duration) : 0
            });
        };
        const handleEnded = () => stop();
        const handleError = () => stop();

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);
        removeListenersRef.current = () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("error", handleError);
        };

        try {
            await audio.play();
            updatePlayback({
                currentTime: 0,
                id: recording.id,
                isPlaying: true,
                progress: 0
            });
        } catch {
            stop();
        }
    }, [disposeAudio, stop, updatePlayback]);

    useEffect(() => stop, [stop]);

    return {
        playback,
        stop,
        toggle
    };
}
