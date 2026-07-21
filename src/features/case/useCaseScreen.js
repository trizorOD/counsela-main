import { useCallback, useEffect, useRef, useState } from "react";
import { validateField } from "../../utils/form.js";

export function useCaseScreen({
    formData,
    isActive,
    onFormChange,
    onLayoutChange,
    onNext,
    onScreenNavigationChange
}) {
    const groupRef = useRef(null);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const selectedCase = formData.case ?? "";
    const caseError = validateField("case", selectedCase, formData);
    const visibleError = hasInteracted || submitAttempted ? caseError : null;

    const handleChange = useCallback((event) => {
        setHasInteracted(true);
        onFormChange(event);
    }, [onFormChange]);

    const handleNext = useCallback(() => {
        setSubmitAttempted(true);

        if (caseError) {
            requestAnimationFrame(() => {
                groupRef.current?.querySelector("input")?.focus();
            });
            return;
        }

        onNext();
    }, [caseError, onNext]);

    useEffect(() => {
        onLayoutChange();
    }, [onLayoutChange, visibleError]);

    useEffect(() => {
        if (!isActive || !onScreenNavigationChange) {
            return undefined;
        }

        onScreenNavigationChange("case", {
            disabled: Boolean(caseError),
            onNext: handleNext
        });

        return () => {
            onScreenNavigationChange("case", null);
        };
    }, [caseError, handleNext, isActive, onScreenNavigationChange]);

    return {
        caseError,
        groupRef,
        handleChange,
        handleNext,
        selectedCase,
        setHasInteracted,
        visibleError
    };
}
