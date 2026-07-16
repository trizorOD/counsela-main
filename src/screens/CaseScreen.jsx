import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ContinueButton from "../components/ContinueButton";
import { validateField } from "../utils/form.js";

function CaseScreen({
    formData,
    isActive,
    isDesktop,
    isMobile,
    onFormChange,
    onLayoutChange,
    onMobileNavigationChange,
    onNext
}) {
    const { t } = useTranslation();
    const groupRef = useRef(null);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const options = t("case.options", { returnObjects: true });
    const selectedCases = Array.isArray(formData.cases) ? formData.cases : [];
    const caseError = validateField("cases", selectedCases, formData);
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
        if (!isActive || !isMobile) {
            return undefined;
        }

        onMobileNavigationChange("case", {
            disabled: Boolean(caseError),
            onNext: handleNext
        });

        return () => {
            onMobileNavigationChange("case", null);
        };
    }, [caseError, handleNext, isActive, isMobile, onMobileNavigationChange]);

    return (
        <section className="screen screen--case">
            <div className="case">
                <div className="case__title">
                    <h3>{t("case.title")}</h3>
                </div>

                <div className="case__description">{t("case.description")}</div>

                <fieldset
                    className={`case__fieldset ${visibleError ? "is-invalid" : ""}`}
                    ref={groupRef}
                    aria-invalid={Boolean(visibleError)}
                    aria-describedby={visibleError ? "cases-error" : undefined}
                >
                    <legend className="visually-hidden">{t("case.title")}</legend>
                    <div className="case__options">
                        {options.map((option) => {
                            const inputId = `case-${option.value}`;

                            return (
                                <label className="case__option" htmlFor={inputId} key={option.value}>
                                    <input
                                        className="case__input"
                                        id={inputId}
                                        type="checkbox"
                                        name="cases"
                                        value={option.value}
                                        checked={selectedCases.includes(option.value)}
                                        data-multiple="true"
                                        aria-invalid={Boolean(visibleError)}
                                        aria-describedby={visibleError ? "cases-error" : undefined}
                                        onBlur={() => setHasInteracted(true)}
                                        onChange={handleChange}
                                    />

                                    <span className="case__option-box">
                                        <span className="case__option-content">
                                            <span className="case__option-name">{option.label}</span>
                                            <span className="case__option-description">
                                                {option.description}
                                            </span>
                                        </span>
                                        <span className="case__option-dot"></span>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                    <p
                        className={`case__error ${visibleError ? "is-visible" : ""}`}
                        id="cases-error"
                        role={visibleError ? "alert" : undefined}
                    >
                        {visibleError ? t(visibleError) : "\u00a0"}
                    </p>
                </fieldset>

                {isDesktop && (
                    <div className="case__button">
                        <ContinueButton disabled={Boolean(caseError)} onClick={handleNext} />
                    </div>
                )}
            </div>
        </section>
    );
}

export default CaseScreen;
