import { useTranslation } from "react-i18next";
import { languages } from "../data/languages";
import image from "../assets/images/counsela.jpg";
import iconGlobe from "../assets/icons/globe.svg";
import ContinueButton from "../components/ContinueButton";

function LanguageScreen({ selectedLanguage, onFormChange, onNext, isDesktop }) {
    const { t } = useTranslation();

    return (
        <section className="screen screen--language">
            <div className="split">
                <div className="split__content">
                    <div className="split__tagline">{t("language.tagline")}</div>
                    <div className="split__title">
                        <h1>{t("language.title")}</h1>
                    </div>
                    <div className="split__description">{t("language.description")}</div>

                    <div className="split__languages">
                        <div className="language">
                            <div className="language__header">
                                <span className="language__header-icon">
                                    <img src={iconGlobe} alt="" />
                                </span>
                                <span className="language__header-title">
                                    {t("language.languageSelectionTitle")}
                                </span>
                            </div>

                            <div className="language__options">
                                {languages.map((language) => (
                                    <label className="language__option" key={language.code}>
                                        <input
                                            type="radio"
                                            name="language"
                                            value={language.code}
                                            checked={selectedLanguage === language.code}
                                            onChange={onFormChange}
                                        />
                                        <span className="language__option-box">
                                            <span className="language__option-name">{language.label}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {isDesktop && (
                        <div className="split__footer">
                            <ContinueButton onClick={onNext} />
                            <div className="split__info">
                                <span>{t("language.info.firstText")}</span>
                                <span className="split__info-dot">•</span>
                                <span>{t("language.info.secondaryText")}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="split__image">
                    <img src={image} alt="" />
                </div>
            </div>
        </section>
    );
}

export default LanguageScreen;
