import { useTranslation } from "react-i18next";
import iconDelete from "../assets/icons/delete.svg";
import iconPlay from "../assets/icons/play.svg";
import iconStop from "../assets/icons/stop.svg";
import { formatDuration } from "../utils/audio";
import Waveform from "./Waveform";

function AudioRecording({ onDelete, onToggle, playback, recording }) {
    const { t } = useTranslation();
    const isCurrent = playback.id === recording.id;
    const isPlaying = isCurrent && playback.isPlaying;
    const displayedTime = isCurrent && playback.currentTime > 0
        ? playback.currentTime
        : recording.duration;

    return (
        <div className={`audio-recording ${isPlaying ? "is-playing" : ""}`}>
            <button
                className="audio-recording__play"
                type="button"
                onClick={() => onToggle(recording)}
                aria-label={t(isPlaying ? "statement.record.pause" : "statement.record.play")}
                aria-pressed={isPlaying}
            >
                <img src={isPlaying ? iconStop : iconPlay} alt="" />
            </button>

            <Waveform
                progress={isCurrent ? playback.progress : 0}
                values={recording.waveform}
            />

            <span className="audio-recording__duration">
                {formatDuration(displayedTime)}
            </span>

            <button
                className="audio-recording__delete"
                type="button"
                onClick={() => onDelete(recording.id)}
                aria-label={t("statement.record.delete")}
            >
                <img src={iconDelete} alt="" />
            </button>
        </div>
    );
}

export default AudioRecording;
