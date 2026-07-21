import { useTranslation } from "react-i18next";
import iconArrowRight from "../../../assets/icons/arrow-right.svg";

function Footer({ details = [], disabled = false, hidden = false, onNext }) {
    const { t } = useTranslation();

    return (
        <footer
            className={`footer ${hidden ? "is-hidden" : ""}`}
            aria-hidden={hidden}
            inert={hidden}
        >
            <div className="footer__button">
                <button
                    className="button button--secondary"
                    type="button"
                    onClick={onNext}
                    disabled={disabled}
                >
                    <span className="button__text">
                        {t("common.continue")}
                    </span>

                    <span className="button__icon">
                        <img src={iconArrowRight} alt="" />
                    </span>
                </button>
            </div>

            {details.length > 0 && (
                <div className="footer__details">
                    {details.map((detail, index) => (
                        <span key={detail}>
                            {index > 0 && <span className="footer__details-dot">•</span>}
                            {detail}
                        </span>
                    ))}
                </div>
            )}
        </footer>
    );
}

export default Footer;
