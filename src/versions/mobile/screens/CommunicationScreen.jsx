import { useTranslation } from "react-i18next";
import photoCommunication from "../../../assets/images/communication.jpg";

function CommunicationScreen() {
    const { t } = useTranslation();
    return (
        <section className="screen screen--communication">
            <div className="compare">
                <div className="compare__title">
                    <h2>{t("communication.title")}</h2>
                </div>
                <div className="compare__description">{t("communication.description")}</div>

                <div className="mobile-benefit-card communication-card">
                    <div className="communication">
                        <div className="communication__specialist">
                            <div className="communication__avatar">
                                <img src={photoCommunication} alt="" />
                            </div>
                            <div className="communication__person">
                                <div className="communication__name">
                                    {t("communication.specialist.name")}
                                </div>
                                <div className="communication__role">
                                    {t("communication.specialist.role")}
                                </div>
                            </div>
                            <div className="communication__online">{t("communication.online")}</div>
                        </div>
                        <div className="communication__reply">{t("communication.reply")}</div>
                        <div className="communication__response">
                            <span className="communication__response-time">
                                {t("communication.responseTime")}
                            </span>
                        </div>
                    </div>

                    <div className="mobile-benefit-card__summary">
                        {t("communication.summary")}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CommunicationScreen;
