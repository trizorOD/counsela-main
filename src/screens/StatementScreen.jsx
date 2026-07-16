import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import AudioRecording from "../components/AudioRecording";
import ContinueButton from "../components/ContinueButton";
import LottieAnimation from "../components/LottieAnimation";
import { useAudioPlayback } from "../hooks/useAudioPlayback";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { createStatement } from "../api/statement";
import loadingAnimation from "../assets/animations/statement-loading.json";
import iconCheck from "../assets/icons/check.svg";
import iconEdit from "../assets/icons/edit.svg";
import iconGlobe from "../assets/icons/globe.svg";
import iconMic from "../assets/icons/mic.svg";
import iconStop from "../assets/icons/stop.svg";

const maxRecordings = 5;
const processingStages = ["listening", "transcribing", "organizing", "almost-ready"];
const minimumStageDuration = 650;
const statementTransitionSpeed = 300;

function waitForMinimumProcessingTime(startedAt, signal) {
    const minimumDuration = minimumStageDuration * processingStages.length;
    const delay = Math.max(0, minimumDuration - (Date.now() - startedAt));

    if (!delay) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const handleAbort = () => {
            window.clearTimeout(timerId);
            reject(new DOMException("Processing cancelled", "AbortError"));
        };
        const timerId = window.setTimeout(() => {
            signal.removeEventListener("abort", handleAbort);
            resolve();
        }, delay);

        signal.addEventListener("abort", handleAbort, { once: true });
    });
}

function StatementScreen({
    formData,
    isActive,
    isDesktop,
    isMobile,
    onBackNavigationChange,
    onFieldChange,
    onLayoutChange,
    onMobileNavigationChange,
    onNext
}) {
    const { t } = useTranslation();
    const savedStatement = typeof formData.statement === "string" ? formData.statement : "";
    const [screenState, setScreenState] = useState("record");
    const [statementView, setStatementView] = useState("record");
    const [isViewTransitioning, setIsViewTransitioning] = useState(false);
    const [statementText, setStatementText] = useState(savedStatement);
    const [draftText, setDraftText] = useState(savedStatement);
    const [processingStage, setProcessingStage] = useState(processingStages[0]);
    const [processingError, setProcessingError] = useState(null);
    const [editingError, setEditingError] = useState(null);
    const textareaRef = useRef(null);
    const activeRef = useRef(isActive);
    const processingControllerRef = useRef(null);
    const processingStartedAtRef = useRef(0);
    const processingTimersRef = useRef(new Set());
    const processingLockRef = useRef(false);
    const statementSwiperRef = useRef(null);
    const {
        cancelRecording,
        errorCode,
        maxReached,
        recordings,
        removeRecording,
        startRecording,
        status: recorderStatus,
        stopRecording
    } = useAudioRecorder(maxRecordings);
    const { playback, stop: stopPlayback, toggle: togglePlayback } = useAudioPlayback();

    const caseLabel = useMemo(() => {
        const options = t("case.options", { returnObjects: true });
        const selectedCases = Array.isArray(formData.cases) ? formData.cases : [];
        const selectedLabels = Array.isArray(options)
            ? options
                .filter((option) => selectedCases.includes(option.value))
                .map((option) => option.label)
            : [];

        return selectedLabels.join(" / ") || t("statement.contextFallback");
    }, [formData.cases, t]);

    const topics = t("statement.topics", { returnObjects: true });
    const isRecording = recorderStatus === "recording";
    const isRequestingMicrophone = recorderStatus === "requesting";
    const isRecorderBusy = ["requesting", "recording", "stopping"].includes(recorderStatus);

    const clearProcessingTimers = useCallback(() => {
        processingTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
        processingTimersRef.current.clear();
    }, []);

    const updateProcessingStage = useCallback((stage) => {
        const stageIndex = processingStages.indexOf(stage);

        if (stageIndex < 0) {
            return;
        }

        const delay = Math.max(
            0,
            stageIndex * minimumStageDuration - (Date.now() - processingStartedAtRef.current)
        );
        const timerId = window.setTimeout(() => {
            processingTimersRef.current.delete(timerId);
            setProcessingStage(stage);
        }, delay);

        processingTimersRef.current.add(timerId);
    }, []);

    const handleProcess = useCallback(async () => {
        if (
            processingLockRef.current
            || !recordings.length
            || !["idle", "error"].includes(recorderStatus)
        ) {
            return;
        }

        processingLockRef.current = true;
        processingControllerRef.current?.abort();
        clearProcessingTimers();
        stopPlayback();
        setProcessingError(null);
        setProcessingStage(processingStages[0]);
        setScreenState("processing");
        processingStartedAtRef.current = Date.now();

        const controller = new AbortController();
        processingControllerRef.current = controller;

        try {
            const result = await createStatement(recordings, {
                onStage: updateProcessingStage,
                signal: controller.signal
            });

            await waitForMinimumProcessingTime(processingStartedAtRef.current, controller.signal);

            if (!activeRef.current || controller.signal.aborted) {
                return;
            }

            clearProcessingTimers();
            setProcessingStage(processingStages.at(-1));
            setStatementText(result);
            setDraftText(result);
            onFieldChange("statement", result);
            setStatementView("result");
            setScreenState("result");
        } catch (error) {
            clearProcessingTimers();

            if (error.name !== "AbortError" && activeRef.current) {
                setProcessingError(error.message || t("statement.processing.errors.unknown"));
                setScreenState("processing-error");
            }
        } finally {
            if (processingControllerRef.current === controller) {
                processingControllerRef.current = null;
            }
            processingLockRef.current = false;
        }
    }, [
        clearProcessingTimers,
        onFieldChange,
        recorderStatus,
        recordings,
        stopPlayback,
        t,
        updateProcessingStage
    ]);

    const saveEditing = useCallback(() => {
        const nextStatement = draftText.trim();

        if (!nextStatement) {
            setEditingError(t("statement.result.emptyError"));
            return false;
        }

        setEditingError(null);
        setStatementText(nextStatement);
        setDraftText(nextStatement);
        onFieldChange("statement", nextStatement);
        setScreenState("result");
        return true;
    }, [draftText, onFieldChange, t]);

    const handlePrimaryAction = useCallback(() => {
        if (screenState === "record") {
            handleProcess();
            return;
        }

        if (screenState === "editing" && !saveEditing()) {
            return;
        }

        if (["result", "editing"].includes(screenState)) {
            onNext();
        }
    }, [handleProcess, onNext, saveEditing, screenState]);

    const primaryDisabled = isViewTransitioning
        || (screenState === "record"
            ? !recordings.length || isRecorderBusy
            : screenState === "editing"
                ? !draftText.trim()
                : !["result", "editing"].includes(screenState));

    const handleRecordButton = useCallback(() => {
        if (isRecording) {
            stopRecording();
            return;
        }

        startRecording();
    }, [isRecording, startRecording, stopRecording]);

    const handleDelete = useCallback((recordingId) => {
        if (playback.id === recordingId) {
            stopPlayback();
        }
        removeRecording(recordingId);
    }, [playback.id, removeRecording, stopPlayback]);

    const returnToRecordings = useCallback(() => {
        if (statementSwiperRef.current?.animating) {
            return;
        }

        processingControllerRef.current?.abort();
        processingControllerRef.current = null;
        processingLockRef.current = false;
        clearProcessingTimers();
        setProcessingError(null);
        setStatementView("record");

        if (!statementSwiperRef.current || statementSwiperRef.current.activeIndex === 0) {
            setScreenState("record");
        }
    }, [clearProcessingTimers]);

    const handleInternalBack = useCallback(() => {
        if (isViewTransitioning) {
            return;
        }

        if (screenState === "editing") {
            setDraftText(statementText);
            setEditingError(null);
            setScreenState("result");
            return;
        }

        returnToRecordings();
    }, [isViewTransitioning, returnToRecordings, screenState, statementText]);

    const handleStatementTransitionStart = useCallback(() => {
        setIsViewTransitioning(true);
        onLayoutChange();
    }, [onLayoutChange]);

    const handleStatementTransitionEnd = useCallback((swiper) => {
        setIsViewTransitioning(false);

        if (swiper.activeIndex === 0) {
            setScreenState("record");
        }

        onLayoutChange();
    }, [onLayoutChange]);

    useEffect(() => {
        activeRef.current = isActive;

        if (!isActive) {
            if (["requesting", "recording", "stopping"].includes(recorderStatus)) {
                cancelRecording();
            }
            stopPlayback();
            processingControllerRef.current?.abort();
            clearProcessingTimers();

            if (screenState === "processing") {
                processingLockRef.current = false;
                setScreenState("record");
            }
        }
    }, [cancelRecording, clearProcessingTimers, isActive, recorderStatus, screenState, stopPlayback]);

    useEffect(() => () => {
        processingControllerRef.current?.abort();
        clearProcessingTimers();
    }, [clearProcessingTimers]);

    useEffect(() => {
        if (screenState !== "editing") {
            return undefined;
        }

        const frameId = requestAnimationFrame(() => {
            textareaRef.current?.focus();
        });

        return () => cancelAnimationFrame(frameId);
    }, [screenState]);

    useEffect(() => {
        const frameId = requestAnimationFrame(() => {
            statementSwiperRef.current?.updateAutoHeight();
            onLayoutChange();
        });

        return () => cancelAnimationFrame(frameId);
    }, [onLayoutChange, recorderStatus, recordings.length, screenState, statementView]);

    useEffect(() => {
        const swiper = statementSwiperRef.current;
        const nextIndex = statementView === "result" ? 1 : 0;

        if (!swiper || swiper.destroyed || swiper.activeIndex === nextIndex) {
            return;
        }

        swiper.slideTo(nextIndex);
    }, [statementView]);

    useEffect(() => {
        if (!isActive || !isMobile) {
            return undefined;
        }

        onMobileNavigationChange("statement", {
            disabled: primaryDisabled,
            onNext: handlePrimaryAction
        });

        return () => {
            onMobileNavigationChange("statement", null);
        };
    }, [handlePrimaryAction, isActive, isMobile, onMobileNavigationChange, primaryDisabled]);

    useEffect(() => {
        if (!isActive || !["result", "editing"].includes(screenState)) {
            return undefined;
        }

        onBackNavigationChange("statement", {
            onBack: handleInternalBack
        });

        return () => {
            onBackNavigationChange("statement", null);
        };
    }, [handleInternalBack, isActive, onBackNavigationChange, screenState]);

    const recorderError = errorCode
        ? t(`statement.record.errors.${errorCode}`)
        : null;

    return (
        <section className={`screen screen--statement screen--statement-${screenState}`}>
            <Swiper
                className="statement-slides"
                autoHeight={true}
                allowTouchMove={false}
                preventInteractionOnTransition={true}
                speed={statementTransitionSpeed}
                spaceBetween={48}
                onSwiper={(swiper) => {
                    statementSwiperRef.current = swiper;
                }}
                onSlideChangeTransitionStart={handleStatementTransitionStart}
                onSlideChangeTransitionEnd={handleStatementTransitionEnd}
            >
                <SwiperSlide
                    aria-hidden={statementView !== "record"}
                    inert={statementView !== "record"}
                >
                    <div className="statement">
                        <div className="statement__header">
                            <span className="statement__context">{caseLabel}</span>
                            <h3 className="statement__title">{t("statement.record.title")}</h3>
                            <p className="statement__description">{t("statement.record.description")}</p>
                        </div>

                        <div className="statement__content">
                            <div className="statement__topics">
                                <span className="statement__topics-title">{t("statement.record.topicsTitle")}</span>
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
                                    aria-label={t(isRecording ? "statement.record.stop" : "statement.record.start")}
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
                                                    onDelete={handleDelete}
                                                    onToggle={togglePlayback}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isDesktop && (
                            <div className="statement__button">
                                <ContinueButton disabled={primaryDisabled} onClick={handlePrimaryAction} />
                            </div>
                        )}
                    </div>
                </SwiperSlide>

                <SwiperSlide
                    aria-hidden={statementView !== "result"}
                    inert={statementView !== "result"}
                >
                    <div className="statement-result">
                        <div className="statement-result__header">
                            <h3>{t("statement.result.title")}</h3>
                            <p>{t("statement.result.description")}</p>
                        </div>

                        <div className="statement-result__card">
                            <div className="statement-result__card-header">
                                <span className="statement-result__label">
                                    <span className="statement-result__dot"></span>
                                    {t("statement.result.storyLabel")}
                                </span>

                                {screenState === "editing" ? (
                                    <button
                                        className="statement-result__edit is-done"
                                        type="button"
                                        onClick={saveEditing}
                                    >
                                        <img src={iconCheck} alt="" />
                                        {t("statement.result.done")}
                                    </button>
                                ) : (
                                    <button
                                        className="statement-result__edit"
                                        type="button"
                                        onClick={() => {
                                            setDraftText(statementText);
                                            setEditingError(null);
                                            setScreenState("editing");
                                        }}
                                    >
                                        <img src={iconEdit} alt="" />
                                        {t("statement.result.edit")}
                                    </button>
                                )}
                            </div>

                            {screenState === "editing" ? (
                                <textarea
                                    ref={textareaRef}
                                    className="statement-result__textarea"
                                    value={draftText}
                                    onChange={(event) => setDraftText(event.target.value)}
                                    aria-label={t("statement.result.storyLabel")}
                                ></textarea>
                            ) : (
                                <div className="statement-result__text">{statementText}</div>
                            )}

                            {editingError && (
                                <div className="statement-result__error" role="alert">{editingError}</div>
                            )}
                        </div>

                        {isDesktop && (
                            <div className="statement__button">
                                <ContinueButton disabled={primaryDisabled} onClick={handlePrimaryAction} />
                            </div>
                        )}
                    </div>
                </SwiperSlide>
            </Swiper>

            {["processing", "processing-error"].includes(screenState) && createPortal(
                <div className="statement-processing" role={screenState === "processing-error" ? "alert" : "status"}>
                    {screenState === "processing" ? (
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
                                <button className="button button--primary" type="button" onClick={handleProcess}>
                                    <span className="button__text">{t("statement.processing.retry")}</span>
                                </button>
                                <button className="statement-processing__back" type="button" onClick={returnToRecordings}>
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

export default StatementScreen;
