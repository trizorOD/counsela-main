import { useTranslation } from "react-i18next";
import iconListItem from "../assets/icons/list-item.svg";
import iconCheck from "../assets/icons/check.svg";
import iconCheckCredentials from "../assets/icons/chek-credentials.svg";
import photoCredentials from "../assets/images/credentials.jpg";
import ContinueButton from "../components/ContinueButton";

function CredentialsScreen({ onNext, isDesktop }) {
    const { t } = useTranslation();

    const items = t("credentials.items", {
        returnObjects: true
    });

    return (
        <section className="screen screen--credentials">
            <div className="credentials">
                <div className="credentials__content">
                    <div className="credentials__badge">
                        <img src={iconCheckCredentials} alt="" />
                        {t("credentials.badge")}
                    </div>
                    <div className="credentials__title">
                        <h3>{t("credentials.title")}</h3>
                    </div>
                    <div className="credentials__description">{t("credentials.description")}</div>

                    {isDesktop && (
                        <div className="credentials__button">
                            <ContinueButton onClick={onNext} />
                        </div>
                    )}
                </div>

                <div className="credentials__card">
                    <div className="credentials__attorney">
                        <div className="credentials__avatar">
                            <img src={photoCredentials} alt="" />
                        </div>
                        <div className="credentials__attorney-info">
                            <span className="credentials__attorney-title">
                                {t("credentials.attorney.title")}
                            </span>
                            <span className="credentials__attorney-description">
                                {t("credentials.attorney.description")}
                            </span>
                        </div>
                    </div>

                    <div className="credentials__list">
                        {items.map((item) => (
                            <div className="credentials__item" key={item.title}>
                                <span className="credentials__icon">
                                    <img src={iconListItem} alt="" />
                                </span>
                                <div className="credentials__item-content">
                                    <span className="credentials__item-title">{item.title}</span>
                                    <span className="credentials__item-description">
                                        {item.description}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="credentials__notice">
                        <img src={iconCheck} alt="" />
                        {t("credentials.notice")}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CredentialsScreen;
