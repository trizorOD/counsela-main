import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { contactFieldNames } from "../../data/formSchema.js";
import { normalizeCollectedFormData, validateFields } from "../../utils/form.js";

export function useContactForm({
    formData,
    isActive,
    onComplete,
    onLayoutChange
}) {
    const rootRef = useRef(null);
    const submitLockRef = useRef(false);
    const [touched, setTouched] = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const errors = useMemo(
        () => validateFields(contactFieldNames, formData),
        [formData]
    );
    const isValid = Object.keys(errors).length === 0;

    const getVisibleError = useCallback((name) => (
        touched[name] || submitAttempted ? errors[name] : null
    ), [errors, submitAttempted, touched]);

    const handleBlur = useCallback((event) => {
        const { name } = event.target;

        if (!contactFieldNames.includes(name)) {
            return;
        }

        setTouched((currentTouched) => ({
            ...currentTouched,
            [name]: true
        }));
    }, []);

    const focusFirstInvalidField = useCallback((fieldErrors) => {
        const firstInvalidName = contactFieldNames.find((name) => fieldErrors[name]);

        if (!firstInvalidName) {
            return;
        }

        requestAnimationFrame(() => {
            rootRef.current
                ?.querySelector(`[name="${firstInvalidName}"]`)
                ?.focus();
        });
    }, []);

    const handleSubmit = useCallback(() => {
        if (submitLockRef.current) {
            return;
        }

        const normalizedData = normalizeCollectedFormData(formData);
        const nextErrors = validateFields(contactFieldNames, normalizedData);

        setSubmitAttempted(true);

        if (Object.keys(nextErrors).length > 0) {
            focusFirstInvalidField(nextErrors);
            onLayoutChange();
            return;
        }

        submitLockRef.current = true;

        if (onComplete(normalizedData) === false) {
            submitLockRef.current = false;
        }
    }, [focusFirstInvalidField, formData, onComplete, onLayoutChange]);

    const handleKeyDown = useCallback((event) => {
        const { tagName, type } = event.target;
        const isTextControl = tagName === "SELECT"
            || tagName === "INPUT" && !["radio", "checkbox", "button", "submit"].includes(type);

        if (event.key !== "Enter" || event.shiftKey || !isTextControl) {
            return;
        }

        event.preventDefault();
        handleSubmit();
    }, [handleSubmit]);

    useEffect(() => {
        submitLockRef.current = false;
    }, [isActive]);

    useEffect(() => {
        onLayoutChange();
    }, [errors, onLayoutChange, submitAttempted, touched]);

    return {
        getVisibleError,
        handleBlur,
        handleKeyDown,
        handleSubmit,
        isValid,
        rootRef
    };
}
