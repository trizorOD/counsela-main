import { useTranslation } from "react-i18next";
import photoPriya from "../../../assets/lawyers/01.jpg";
import photoHanna from "../../../assets/lawyers/02.jpg";
import photoMarcus from "../../../assets/lawyers/03.jpg";

const teamPhotos = [photoPriya, photoMarcus, photoHanna];

function FocusScreen() {
    const { t } = useTranslation();

    const areas = t("focus.areas", {
        returnObjects: true
    });
    const teamMembers = t("focus.team.members", {
        returnObjects: true
    });

    return (
        <section className="screen screen--focus">
            <div className="compare">
                <div className="compare__title">
                    <h2>{t("focus.title")}</h2>
                </div>
                <div className="compare__description">{t("focus.description")}</div>

                <div className="mobile-benefit-card focus-card">
                    <div className="focus-card__areas">
                        {areas.map((area, index) => (
                            <span
                                className={`focus-card__area ${index === 1 ? "is-selected" : ""}`}
                                key={area}
                            >
                                {area}
                            </span>
                        ))}
                    </div>

                    <div className="focus-team">
                        <div className="focus-team__title">{t("focus.team.title")}</div>

                        <div className="focus-team__members">
                            {teamMembers.map((member, index) => (
                                <div className="focus-team__member" key={member.name}>
                                    <span className="focus-team__avatar">
                                        <img src={teamPhotos[index]} alt="" loading="lazy" />
                                    </span>
                                    <span className="focus-team__person">
                                        <span className="focus-team__name">{member.name}</span>
                                        <span className="focus-team__role">{member.role}</span>
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="focus-team__more">{t("focus.team.more")}</div>
                    </div>

                    <div className="mobile-benefit-card__summary">{t("focus.summary")}</div>
                </div>
            </div>
        </section>
    );
}

export default FocusScreen;
