import { useTranslation } from "react-i18next";
import iconCheck from "../../../assets/icons/check.svg";
import iconEdit from "../../../assets/icons/edit.svg";
import ContinueButton from "../../../components/ContinueButton";

function StatementResultScreen({ onNext, statementFlow }) {
    const { t } = useTranslation();
    const {
        beginEditing,
        draftText,
        editingError,
        isEditing,
        resultDisabled,
        saveEditing,
        setDraftText,
        statementText,
        textareaRef
    } = statementFlow;

    return (
        <section className="screen screen--statement screen--statement-result">
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

                        {isEditing ? (
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
                                onClick={beginEditing}
                            >
                                <img src={iconEdit} alt="" />
                                {t("statement.result.edit")}
                            </button>
                        )}
                    </div>

                    {isEditing ? (
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
                        <div className="statement-result__error" role="alert">
                            {editingError}
                        </div>
                    )}
                </div>

                <div className="statement__button">
                    <ContinueButton disabled={resultDisabled} onClick={onNext} />
                </div>
            </div>
        </section>
    );
}

export default StatementResultScreen;
