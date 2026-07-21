import { useTranslation } from "react-i18next";
import iconLock from "../../../assets/icons/lock.svg";
import iconPhone from "../../../assets/icons/phone.svg";
import iconSms from "../../../assets/icons/sms.svg";
import iconTelegram from "../../../assets/icons/telegram.svg";
import iconWhatsapp from "../../../assets/icons/whatsapp.svg";

const contactMethods = [
    { icon: iconWhatsapp, value: "whatsapp" },
    { icon: iconTelegram, value: "telegram" },
    { icon: iconSms, value: "sms" },
    { icon: iconPhone, value: "phone" }
];

function ContactField({
    autoComplete,
    error,
    inputMode,
    name,
    onBlur,
    onChange,
    t,
    type,
    value
}) {
    const inputId = `contact-${name}`;
    const errorId = `${inputId}-error`;

    return (
        <div className={`contact-field ${error ? "is-invalid" : ""}`}>
            <label className="contact-field__label" htmlFor={inputId}>
                {t(`form.fields.${name}.label`)}
            </label>
            <input
                className="contact-field__input"
                id={inputId}
                name={name}
                type={type}
                value={value}
                placeholder={t(`form.fields.${name}.placeholder`)}
                autoComplete={autoComplete}
                inputMode={inputMode}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                onBlur={onBlur}
                onChange={onChange}
            />
            <p
                className={`contact-field__error ${error ? "is-visible" : ""}`}
                id={errorId}
                role={error ? "alert" : undefined}
            >
                {error ? t(error) : "\u00a0"}
            </p>
        </div>
    );
}

function ContactScreen({
    contactForm,
    formData,
    onFormChange
}) {
    const { t } = useTranslation();
    const {
        getVisibleError,
        handleBlur,
        handleKeyDown,
        handleSubmit,
        isValid,
        rootRef
    } = contactForm;
    const contactMethodError = getVisibleError("contactMethod");

    return (
        <section className="screen screen--contact">
            <div className="contact" ref={rootRef} onKeyDown={handleKeyDown}>
                <header className="contact__header">
                    <h3>{t("contact.title")}</h3>
                    <p>{t("contact.description")}</p>
                </header>

                <div className="contact__card">
                    <div className="contact__fields">
                        <ContactField
                            autoComplete="name"
                            error={getVisibleError("fullName")}
                            name="fullName"
                            onBlur={handleBlur}
                            onChange={onFormChange}
                            t={t}
                            type="text"
                            value={formData.fullName}
                        />
                        <ContactField
                            autoComplete="email"
                            error={getVisibleError("email")}
                            inputMode="email"
                            name="email"
                            onBlur={handleBlur}
                            onChange={onFormChange}
                            t={t}
                            type="email"
                            value={formData.email}
                        />
                        <ContactField
                            autoComplete="tel"
                            error={getVisibleError("phone")}
                            inputMode="tel"
                            name="phone"
                            onBlur={handleBlur}
                            onChange={onFormChange}
                            t={t}
                            type="tel"
                            value={formData.phone}
                        />
                    </div>

                    <fieldset
                        className={`contact-method ${contactMethodError ? "is-invalid" : ""}`}
                        aria-invalid={Boolean(contactMethodError)}
                        aria-describedby={contactMethodError ? "contact-method-error" : undefined}
                    >
                        <legend>{t("form.contactMethod.label")}</legend>
                        <div className="contact-method__options">
                            {contactMethods.map((method) => {
                                const optionId = `contact-method-${method.value}`;

                                return (
                                    <label className="contact-method__option" htmlFor={optionId} key={method.value}>
                                        <input
                                            id={optionId}
                                            type="radio"
                                            name="contactMethod"
                                            value={method.value}
                                            checked={formData.contactMethod === method.value}
                                            required
                                            aria-invalid={Boolean(contactMethodError)}
                                            aria-describedby={contactMethodError ? "contact-method-error" : undefined}
                                            onBlur={handleBlur}
                                            onChange={onFormChange}
                                        />
                                        <span className="contact-method__option-box">
                                            <img src={method.icon} alt="" />
                                            <span>{t(`form.contactMethod.options.${method.value}`)}</span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        <p
                            className={`contact-field__error contact-method__error ${contactMethodError ? "is-visible" : ""}`}
                            id="contact-method-error"
                            role={contactMethodError ? "alert" : undefined}
                        >
                            {contactMethodError ? t(contactMethodError) : "\u00a0"}
                        </p>
                    </fieldset>

                    <p className="contact__privacy">
                        <img src={iconLock} alt="" />
                        <span>{t("form.privacy")}</span>
                    </p>

                    <button
                        className="button button--primary contact__submit"
                        type="button"
                        disabled={!isValid}
                        onClick={handleSubmit}
                    >
                        <span className="button__text">{t("form.submit")}</span>
                    </button>
                </div>
            </div>
        </section>
    );
}

export default ContactScreen;
