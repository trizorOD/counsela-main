import { useTranslation } from "react-i18next";
import iconArrowRight from "../assets/icons/arrow-right.svg";

function ContinueButton({ disabled = false, onClick }) {
    const { t } = useTranslation();

    return (
        <button
            className="button button--primary"
            type="button"
            disabled={disabled}
            onClick={onClick}
        >
            <span className="button__text">{t("common.continue")}</span>
            <span className="button__icon">
                <img src={iconArrowRight} alt="" />
            </span>
        </button>
    );
}

export default ContinueButton;
