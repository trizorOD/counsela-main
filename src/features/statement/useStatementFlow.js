import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { createStatement } from "../../api/statement";
import { useAudioPlayback } from "../../hooks/useAudioPlayback";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import {
    createStatementInputFingerprint,
    reuseUnchangedStatementResult,
    shouldReuseProcessedStatement
} from "./statementProcessing.js";

const maxRecordings = 5;
const processingStages = ["listening", "transcribing", "organizing", "almost-ready"];
const minimumStageDuration = 650;

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

export function useStatementFlow({
    activeStepId,
    formData,
    onFieldChange,
    onLayoutChange,
    onNext
}) {
    const { t } = useTranslation();
    const savedStatement = typeof formData.statement === "string" ? formData.statement : "";
    const isRecordActive = activeStepId === "statementRecord";
    const isStatementActive = isRecordActive || activeStepId === "statementResult";
    const [statementText, setStatementText] = useState(savedStatement);
    const [draftText, setDraftText] = useState(savedStatement);
    const [isEditing, setIsEditing] = useState(false);
    const [editingError, setEditingError] = useState(null);
    const [processingStatus, setProcessingStatus] = useState("idle");
    const [processingStage, setProcessingStage] = useState(processingStages[0]);
    const [processingError, setProcessingError] = useState(null);
    const [resultReady, setResultReady] = useState(false);
    const textareaRef = useRef(null);
    const recordActiveRef = useRef(isRecordActive);
    const processingControllerRef = useRef(null);
    const processingStartedAtRef = useRef(0);
    const processingTimersRef = useRef(new Set());
    const processingLockRef = useRef(false);
    const lastProcessedFingerprintRef = useRef(null);
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

    const isRecording = recorderStatus === "recording";
    const isRequestingMicrophone = recorderStatus === "requesting";
    const isRecorderBusy = ["requesting", "recording", "stopping"].includes(recorderStatus);
    const recordDisabled = processingStatus !== "idle"
        || !recordings.length
        || isRecorderBusy;
    const resultDisabled = isEditing || !statementText.trim();

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

    const processRecordings = useCallback(async () => {
        if (
            processingLockRef.current
            || !recordings.length
            || !["idle", "error"].includes(recorderStatus)
        ) {
            return;
        }

        const inputFingerprint = createStatementInputFingerprint(
            recordings,
            formData.language
        );

        if (shouldReuseProcessedStatement({
            currentFingerprint: inputFingerprint,
            enabled: reuseUnchangedStatementResult,
            lastProcessedFingerprint: lastProcessedFingerprintRef.current,
            statementText
        })) {
            setDraftText(statementText);
            setEditingError(null);
            setIsEditing(false);
            setProcessingError(null);
            setResultReady(true);
            return;
        }

        processingLockRef.current = true;
        processingControllerRef.current?.abort();
        clearProcessingTimers();
        stopPlayback();
        setProcessingError(null);
        setProcessingStage(processingStages[0]);
        setProcessingStatus("processing");
        setResultReady(false);
        processingStartedAtRef.current = Date.now();

        const controller = new AbortController();
        processingControllerRef.current = controller;

        try {
            const result = await createStatement(recordings, {
                language: formData.language,
                onStage: updateProcessingStage,
                signal: controller.signal
            });

            await waitForMinimumProcessingTime(processingStartedAtRef.current, controller.signal);

            if (!recordActiveRef.current || controller.signal.aborted) {
                return;
            }

            clearProcessingTimers();
            setProcessingStage(processingStages.at(-1));
            setStatementText(result);
            setDraftText(result);
            setEditingError(null);
            setIsEditing(false);
            lastProcessedFingerprintRef.current = inputFingerprint;
            onFieldChange("statement", result);
            setResultReady(true);
        } catch (error) {
            clearProcessingTimers();

            if (error.name !== "AbortError" && recordActiveRef.current) {
                setProcessingError(error.message || t("statement.processing.errors.unknown"));
                setProcessingStatus("error");
            }
        } finally {
            if (processingControllerRef.current === controller) {
                processingControllerRef.current = null;
            }
            processingLockRef.current = false;
        }
    }, [
        clearProcessingTimers,
        formData.language,
        onFieldChange,
        recorderStatus,
        recordings,
        stopPlayback,
        statementText,
        t,
        updateProcessingStage
    ]);

    const dismissProcessingError = useCallback(() => {
        setProcessingError(null);
        setProcessingStatus("idle");
    }, []);

    const beginEditing = useCallback(() => {
        setDraftText(statementText);
        setEditingError(null);
        setIsEditing(true);
    }, [statementText]);

    const cancelEditing = useCallback(() => {
        setDraftText(statementText);
        setEditingError(null);
        setIsEditing(false);
    }, [statementText]);

    const saveEditing = useCallback(() => {
        const nextStatement = draftText.trim();

        if (!nextStatement) {
            setEditingError(t("statement.result.emptyError"));
            return false;
        }

        setStatementText(nextStatement);
        setDraftText(nextStatement);
        setEditingError(null);
        setIsEditing(false);
        onFieldChange("statement", nextStatement);
        return true;
    }, [draftText, onFieldChange, t]);

    const handleRecordButton = useCallback(() => {
        if (isRecording) {
            stopRecording();
            return;
        }

        startRecording();
    }, [isRecording, startRecording, stopRecording]);

    const deleteRecording = useCallback((recordingId) => {
        if (playback.id === recordingId) {
            stopPlayback();
        }
        removeRecording(recordingId);
    }, [playback.id, removeRecording, stopPlayback]);

    useEffect(() => {
        recordActiveRef.current = isRecordActive;

        if (isRecordActive) {
            return;
        }

        if (isRecorderBusy) {
            cancelRecording();
        }
        stopPlayback();

        if (processingStatus === "processing") {
            processingControllerRef.current?.abort();
            processingControllerRef.current = null;
            processingLockRef.current = false;
            clearProcessingTimers();
            setResultReady(false);
            setProcessingStatus("idle");
        }
    }, [
        cancelRecording,
        clearProcessingTimers,
        isRecorderBusy,
        isRecordActive,
        processingStatus,
        stopPlayback
    ]);

    useLayoutEffect(() => {
        if (!resultReady || !isRecordActive) {
            return;
        }

        setResultReady(false);
        setProcessingStatus("idle");
        onNext();
    }, [isRecordActive, onNext, resultReady]);

    useEffect(() => () => {
        processingControllerRef.current?.abort();
        clearProcessingTimers();
    }, [clearProcessingTimers]);

    useEffect(() => {
        if (!isStatementActive) {
            return undefined;
        }

        const frameId = requestAnimationFrame(onLayoutChange);

        return () => cancelAnimationFrame(frameId);
    }, [
        editingError,
        isEditing,
        isStatementActive,
        onLayoutChange,
        processingStatus,
        recorderStatus,
        recordings.length,
        statementText
    ]);

    const recorderError = errorCode
        ? t(`statement.record.errors.${errorCode}`)
        : null;

    return {
        beginEditing,
        cancelEditing,
        deleteRecording,
        dismissProcessingError,
        draftText,
        editingError,
        handleRecordButton,
        isEditing,
        isRecording,
        isRequestingMicrophone,
        maxReached,
        maxRecordings,
        playback,
        processRecordings,
        processingError,
        processingStage,
        processingStatus,
        recordDisabled,
        recorderError,
        recorderStatus,
        recordings,
        resultDisabled,
        saveEditing,
        setDraftText,
        statementText,
        textareaRef,
        togglePlayback
    };
}
