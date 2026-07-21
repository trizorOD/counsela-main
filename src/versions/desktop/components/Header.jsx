import { useTranslation } from "react-i18next";
import logo from "../../../assets/images/logo.png";
import iconArrowLeft from "../../../assets/icons/arrow-left.svg";

function Header({ activeStep, totalSteps, titleStep, onBack }) {
    const { t } = useTranslation();
    const segments = Array.from({ length: totalSteps });

    return (
        <header className="header">
            <div className="header__info">
                <div className="header__logo">
                    <img src={logo} alt={t("common.title")} />
                </div>
            </div>

            <div className="progress">
                <div className="progress__back">
                    <button
                        className="progress__back-button"
                        type="button"
                        onClick={onBack}
                        aria-label={t("common.back")}
                    >
                        <img src={iconArrowLeft} alt="" />
                    </button>
                </div>
                <div className="progress__info">
                    <span className="progress__info-indicator">
                        {t("progress.step")} {activeStep} {t("progress.of")} {totalSteps}
                    </span>

                    <span className="progress__info-step">
                        {titleStep}
                    </span>
                </div>

                <div className="progress__track">
                    {segments.map((_, index) => (
                        <span
                            className={index < activeStep ? "is-active" : ""}
                            key={index}
                        ></span>
                    ))}
                </div>
            </div>
        </header>
    );
}

export default Header;
