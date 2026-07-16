import { useTranslation } from "react-i18next";
import iconClose from "../assets/icons/close.svg";
import photoCommunication from "../assets/images/communication.jpg";
import CompareCard from "../components/CompareCard";
import ContinueButton from "../components/ContinueButton";

function CommunicationScreen({ onNext, isDesktop }) {
    const { t } = useTranslation();
    return (
        <section className="screen screen--communication">
            <div className="compare">
                <div className="compare__title">
                    <h2>{t("communication.title")}</h2>
                </div>
                <div className="compare__description">{t("communication.description")}</div>

                <div className="compare__blocks">
                    <CompareCard
                        variant="negative"
                        title={t("common.others")}
                        text={t("communication.compare.negativeText")}
                    >
                        <div className="communication">
                            <div className="communication__missed">
                                <span className="communication__status">
                                    <span className="communication__status-icon">
                                        <img src={iconClose} alt="" />
                                    </span>
                                    <span className="communication__status-text">
                                        {t("communication.missedCall")}
                                    </span>
                                </span>
                                <span className="communication__day">{t("communication.day")}</span>
                            </div>
                            <div className="communication__message">
                                {t("communication.clientMessage")}
                            </div>
                            <div className="communication__silence">
                                <span className="communication__silence-line"></span>
                                <span className="communication__silence-text">
                                    {t("communication.noReply")}
                                </span>
                                <span className="communication__silence-line"></span>
                            </div>
                        </div>
                    </CompareCard>

                    <div className="compare__separator">{t("common.vs")}</div>

                    <CompareCard
                        variant="positive"
                        title={t("common.title")}
                        text={t("communication.compare.positiveText")}
                    >
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
                                <span className="communication__response-note">
                                    {t("communication.response.note")}
                                </span>
                                <span className="communication__response-time">
                                    {t("communication.response.time")}
                                </span>
                            </div>
                        </div>
                    </CompareCard>
                </div>

                {isDesktop && (
                    <div className="compare__button">
                        <ContinueButton onClick={onNext} />
                    </div>
                )}
            </div>
        </section>
    );
}

export default CommunicationScreen;
