import { useTranslation } from "react-i18next";
import ContinueButton from "../../../components/ContinueButton";

function CaseScreen({ caseScreen }) {
    const { t } = useTranslation();
    const {
        caseError,
        groupRef,
        handleChange,
        handleNext,
        selectedCase,
        setHasInteracted,
        visibleError
    } = caseScreen;
    const options = t("case.options", { returnObjects: true });

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
                    aria-describedby={visibleError ? "case-error" : undefined}
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
                                        type="radio"
                                        name="case"
                                        value={option.value}
                                        checked={selectedCase === option.value}
                                        aria-invalid={Boolean(visibleError)}
                                        aria-describedby={visibleError ? "case-error" : undefined}
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

                <div className="case__button">
                    <ContinueButton disabled={Boolean(caseError)} onClick={handleNext} />
                </div>
            </div>
        </section>
    );
}

export default CaseScreen;
