import { useTranslation } from "react-i18next";
import iconCheck from "../../../assets/icons/check.svg";
import chartMobile from "../../../assets/images/price-chart-mobile.svg";

function PriceScreen() {
    const { t } = useTranslation();
    return (
        <section className="screen screen--price">
            <div className="compare">
                <div className="compare__title">
                    <h2>{t("price.title")}</h2>
                </div>
                <div className="compare__description">{t("price.description")}</div>

                <div className="mobile-benefit-card price-card">
                    <div className="pricing">
                        <div className="pricing__saving">
                            <span className="pricing__percent">20%</span>
                            <div className="pricing__saving-text">{t("price.saving")}</div>
                        </div>

                        <div className="pricing__chart">
                            <img className="pricing__image" src={chartMobile} alt="" />
                        </div>

                        <div className="pricing__features">
                            <span className="pricing__feature">
                                <img src={iconCheck} alt="" />
                                {t("price.features.quoted")}
                            </span>
                            <span className="pricing__feature">
                                <img src={iconCheck} alt="" />
                                {t("price.features.flat")}
                            </span>
                            <span className="pricing__feature">
                                <img src={iconCheck} alt="" />
                                {t("price.features.noSurprises")}
                            </span>
                        </div>
                    </div>

                    <div className="mobile-benefit-card__summary">{t("price.summary")}</div>
                </div>

            </div>
        </section>
    );
}

export default PriceScreen;
