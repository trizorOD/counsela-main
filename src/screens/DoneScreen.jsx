import { useTranslation } from "react-i18next";
import iconCheck from "../assets/icons/check.svg";
import iconPhone from "../assets/icons/phone.svg";
import iconSms from "../assets/icons/sms.svg";
import iconTelegram from "../assets/icons/telegram.svg";
import iconWhatsapp from "../assets/icons/whatsapp.svg";

const contactIcons = {
    phone: iconPhone,
    sms: iconSms,
    telegram: iconTelegram,
    whatsapp: iconWhatsapp
};

function DoneScreen({ formData }) {
    const { t } = useTranslation();
    const timeline = t("done.timeline", { returnObjects: true });
    const contactMethod = contactIcons[formData.contactMethod]
        ? formData.contactMethod
        : "phone";

    return (
        <section className="screen screen--done">
            <div className="done">
                <span className="done__check" aria-hidden="true">
                    <img src={iconCheck} alt="" />
                </span>

                <h3 className="done__title">{t("done.title")}</h3>

                <ol className="done__timeline">
                    {Array.isArray(timeline) && timeline.map((item, index) => (
                        <li className="done__timeline-item" key={item.title}>
                            <span className="done__timeline-number">{index + 1}</span>
                            <span className="done__timeline-content">
                                <strong>{item.title}</strong>
                                <span>{item.description}</span>
                            </span>
                        </li>
                    ))}
                </ol>

                <div className="done__contact">
                    <img src={contactIcons[contactMethod]} alt="" />
                    <span>{t(`done.contact.${contactMethod}`)}</span>
                </div>
            </div>
        </section>
    );
}

export default DoneScreen;
