import { useTranslation } from "react-i18next";
import CompareCard from "../../../components/CompareCard";
import ContinueButton from "../../../components/ContinueButton";

// Only the numbered pool photos (01, 02, ...) belong here. The <team>-<member>
// portraits in the same folder are driven by the mobile focus rotation instead.
const photoLawyers = Object.values(
    import.meta.glob("../../../assets/lawyers/0*.{png,jpg,jpeg,webp,avif}", {
        eager: true,
        import: "default"
    })
);

function FocusScreen({ onNext }) {
    const { t } = useTranslation();

    const coverageAreas = t("focus.coverage.areas", {
        returnObjects: true
    });

    return (
        <section className="screen screen--focus">
            <div className="compare">
                <div className="compare__title">
                    <h2>{t("focus.title")}</h2>
                </div>
                <div className="compare__description">{t("focus.description")}</div>

                <div className="compare__blocks">
                    <CompareCard
                        variant="negative"
                        title={t("common.others")}
                        text={t("focus.compare.negativeText")}
                    >
                        <div className="coverage">
                            <div className="coverage__areas">
                                {coverageAreas.map((area) => (
                                    <span className="coverage__area" key={area}>
                                        {area}
                                    </span>
                                ))}
                            </div>
                            <div className="coverage__lawyers">
                                <div className="coverage__team">
                                    <span className="coverage__team-item"></span>
                                    <span className="coverage__team-item"></span>
                                </div>
                                <div className="coverage__count">{t("focus.coverage.count")}</div>
                            </div>
                        </div>
                    </CompareCard>

                    <div className="compare__separator">{t("common.vs")}</div>

                    <CompareCard
                        variant="positive"
                        title={t("common.title")}
                        text={t("focus.compare.positiveText")}
                    >
                        <div className="network">
                            <div className="network__header">
                                <span className="network__header-title">{t("focus.network.title")}</span>
                                <span className="network__header-line"></span>
                            </div>
                            <div className="network__pool">
                                <div className="network__lawyers">
                                    {photoLawyers.map((photo) => (
                                        <span className="network__lawyer" key={photo}>
                                            <img src={photo} alt="" />
                                        </span>
                                    ))}
                                </div>
                                <div className="network__badge">{t("focus.network.badge")}</div>
                            </div>
                            <div className="network__caption">{t("focus.network.caption")}</div>
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

export default FocusScreen;
