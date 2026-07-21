import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import loadingAnimation from "../../../assets/animations/statement-loading.json";
import iconGlobe from "../../../assets/icons/globe.svg";
import iconMic from "../../../assets/icons/mic.svg";
import iconStop from "../../../assets/icons/stop.svg";
import AudioRecording from "../../../components/AudioRecording";
import LottieAnimation from "../../../components/LottieAnimation";

function StatementRecordScreen({ statementFlow, statementGuidance }) {
    const { t } = useTranslation();
    const {
        deleteRecording,
        dismissProcessingError,
        handleRecordButton,
        isRecording,
        isRequestingMicrophone,
        maxReached,
        maxRecordings,
        playback,
        processRecordings,
        processingError,
        processingStage,
        processingStatus,
        recorderError,
        recorderStatus,
        recordings,
        togglePlayback
    } = statementFlow;
    const topics = statementGuidance.topics;

    return (
        <section className="screen screen--statement screen--statement-record">
            <div className="statement">
                <div className="statement__header">
                    <span className="statement__context">{statementGuidance.context}</span>
                    <h3 className="statement__title">{t("statement.record.title")}</h3>
                    <p className="statement__description">{t("statement.record.description")}</p>
                </div>

                <div className="statement__content">
                    <div className="statement__topics">
                        <span className="statement__topics-title">
                            {t("statement.record.topicsTitle")}
                        </span>
                        <ol className="statement__topics-list">
                            {Array.isArray(topics) && topics.map((topic) => (
                                <li key={topic}>{topic}</li>
                            ))}
                        </ol>
                    </div>

                    <div className={`statement-recorder ${isRecording ? "is-recording" : ""}`}>
                        <button
                            className="statement-recorder__button"
                            type="button"
                            onClick={handleRecordButton}
                            disabled={(maxReached && !isRecording)
                                || recorderStatus === "requesting"
                                || recorderStatus === "stopping"}
                            aria-label={t(isRecording
                                ? "statement.record.stop"
                                : "statement.record.start")}
                        >
                            <img src={isRecording ? iconStop : iconMic} alt="" />
                        </button>

                        <span className="statement-recorder__status">
                            {t(isRecording
                                ? "statement.record.listening"
                                : isRequestingMicrophone
                                    ? "statement.record.requestingPermission"
                                    : maxReached
                                        ? "statement.record.limitReached"
                                        : recordings.length
                                            ? "statement.record.addMore"
                                            : "statement.record.tapToAnswer")}
                        </span>

                        {isRecording && recordings.length === 0 && (
                            <p className="statement-recorder__hint">
                                {t("statement.record.recordingHint", { count: maxRecordings })}
                            </p>
                        )}

                        {!isRecording && recordings.length === 0 && (
                            <p className="statement-recorder__language">
                                <img src={iconGlobe} alt="" />
                                {t("statement.record.anyLanguage")}
                            </p>
                        )}

                        {recorderError && (
                            <div className="statement-recorder__error" role="alert">
                                {recorderError}
                            </div>
                        )}

                        {recordings.length > 0 && (
                            <div className="statement-recordings">
                                <span className="statement-recordings__title">
                                    {t("statement.record.recordingsTitle")}
                                </span>

                                <div className="statement-recordings__list">
                                    {recordings.map((recording) => (
                                        <AudioRecording
                                            key={recording.id}
                                            recording={recording}
                                            playback={playback}
                                            onDelete={deleteRecording}
                                            onToggle={togglePlayback}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {processingStatus !== "idle" && createPortal(
                <div
                    className="statement-processing"
                    role={processingStatus === "error" ? "alert" : "status"}
                >
                    {processingStatus === "processing" ? (
                        <div className="statement-processing__content">
                            <LottieAnimation
                                animationData={loadingAnimation}
                                className="statement-processing__animation"
                            />
                            <p className="statement-processing__message" key={processingStage}>
                                {t(`statement.processing.stages.${processingStage}`)}
                            </p>
                            <span className="statement-processing__track"><span></span></span>
                        </div>
                    ) : (
                        <div className="statement-processing__error-card">
                            <h3>{t("statement.processing.errorTitle")}</h3>
                            <p>{processingError || t("statement.processing.errors.unknown")}</p>
                            <div className="statement-processing__actions">
                                <button
                                    className="button button--primary"
                                    type="button"
                                    onClick={processRecordings}
                                >
                                    <span className="button__text">
                                        {t("statement.processing.retry")}
                                    </span>
                                </button>
                                <button
                                    className="statement-processing__back"
                                    type="button"
                                    onClick={dismissProcessingError}
                                >
                                    {t("statement.processing.backToRecordings")}
                                </button>
                            </div>
                        </div>
                    )}
                </div>,
                document.body
            )}
        </section>
    );
}

export default StatementRecordScreen;
