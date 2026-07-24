import { useTranslation } from "react-i18next";
import photoJessica from "../../../assets/lawyers/1-1.jpg";
import photoAbel from "../../../assets/lawyers/1-2.jpg";
import photoEmanuel from "../../../assets/lawyers/1-3.jpg";
import photoPriya from "../../../assets/lawyers/2-1.jpg";
import photoMarcus from "../../../assets/lawyers/2-2.jpg";
import photoHanna from "../../../assets/lawyers/2-3.jpg";
import photoSofia from "../../../assets/lawyers/3-1.jpg";
import photoLinh from "../../../assets/lawyers/3-2.jpg";
import photoAshley from "../../../assets/lawyers/3-3.jpg";
import photoFatima from "../../../assets/lawyers/4-1.jpg";
import photoDaniel from "../../../assets/lawyers/4-2.jpg";
import photoDavid from "../../../assets/lawyers/4-3.jpg";
import photoRafael from "../../../assets/lawyers/5-1.jpg";
import photoGrace from "../../../assets/lawyers/5-2.jpg";
import photoLucas from "../../../assets/lawyers/5-3.jpg";
import photoElena from "../../../assets/lawyers/6-1.jpg";
import photoKofi from "../../../assets/lawyers/6-2.jpg";
import photoMichael from "../../../assets/lawyers/6-3.jpg";

const teamPhotos = [
    [photoJessica, photoAbel, photoEmanuel],
    [photoPriya, photoMarcus, photoHanna],
    [photoSofia, photoLinh, photoAshley],
    [photoFatima, photoDaniel, photoDavid],
    [photoRafael, photoGrace, photoLucas],
    [photoElena, photoKofi, photoMichael]
];

function FocusScreen({ focusRotation, focusTeams }) {
    const { t } = useTranslation();
    const { activeTeamIndex, isSwitching } = focusRotation;
    const activeTeam = focusTeams[activeTeamIndex];
    const activePhotos = teamPhotos[activeTeamIndex] || [];

    return (
        <section className="screen screen--focus">
            <div className="compare">
                <div className="compare__title">
                    <h2>{t("focus.title")}</h2>
                </div>
                <div className="compare__description">{t("focus.description")}</div>

                <div className="mobile-benefit-card focus-card">
                    <div className="focus-card__areas">
                        {focusTeams.map((team, index) => (
                            <span
                                className={`focus-card__area ${index === activeTeamIndex ? "is-selected" : ""}`}
                                key={team.area}
                            >
                                {team.area}
                            </span>
                        ))}
                    </div>

                    <div className={`focus-team ${isSwitching ? "is-switching" : ""}`}>
                        <div className="focus-team__title">{activeTeam?.title}</div>

                        <div className="focus-team__members">
                            {activeTeam?.members.map((member, index) => (
                                <div className="focus-team__member" key={member.name}>
                                    <span className="focus-team__avatar">
                                        <img src={activePhotos[index]} alt="" loading="lazy" />
                                    </span>
                                    <span className="focus-team__person">
                                        <span className="focus-team__name">{member.name}</span>
                                        <span className="focus-team__role">{member.role}</span>
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="focus-team__more">{activeTeam?.more}</div>
                    </div>

                    <div className="mobile-benefit-card__summary">{t("focus.summary")}</div>
                </div>
            </div>
        </section>
    );
}

export default FocusScreen;
