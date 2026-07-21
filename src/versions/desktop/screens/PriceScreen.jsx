import { useTranslation } from "react-i18next";
import iconLightning from "../../../assets/icons/lightning.svg";
import iconCheck from "../../../assets/icons/check.svg";
import chartNegative from "../../../assets/images/price-chart-negative.svg";
import chartPositive from "../../../assets/images/price-chart-positive.svg";
import CompareCard from "../../../components/CompareCard";
import ContinueButton from "../../../components/ContinueButton";

function PriceScreen({ onNext }) {
    const { t } = useTranslation();
    return (
        <section className="screen screen--price">
            <div className="compare">
                <div className="compare__title">
                    <h2>{t("price.title")}</h2>
                </div>
                <div className="compare__description">{t("price.description")}</div>

                <div className="compare__blocks">
                    <CompareCard
                        variant="negative"
                        title={t("common.others")}
                        text={t("price.compare.negativeText")}
                    >
                        <div className="pricing">
                            <div className="pricing__badge">
                                <img src={iconLightning} alt="" />
                                {t("price.aiBadge")}
                            </div>
                            <div className="pricing__chart">
                                <div className="pricing__image">
                                    <img src={chartNegative} alt="" />
                                </div>
                                <div className="pricing__label">{t("price.sameOldPrice")}</div>
                            </div>
                        </div>
                    </CompareCard>

                    <div className="compare__separator">{t("common.vs")}</div>

                    <CompareCard
                        variant="positive"
                        title={t("common.title")}
                        text={t("price.compare.positiveText")}
                    >
                        <div className="pricing">
                            <div className="pricing__saving">
                                <span className="pricing__percent">20%</span>
                                <div className="pricing__saving-text">{t("price.saving")}</div>
                            </div>

                            <div className="pricing__chart">
                                <div className="pricing__image">
                                    <img src={chartPositive} alt="" />
                                </div>
                                <div className="pricing__discount">{t("price.discount")}</div>
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
                    </CompareCard>
                </div>

                <div className="compare__button">
                    <ContinueButton onClick={onNext} />
                </div>
            </div>
        </section>
    );
}

export default PriceScreen;
