import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import iconLock from "../assets/icons/lock.svg";
import iconPhone from "../assets/icons/phone.svg";
import iconSms from "../assets/icons/sms.svg";
import iconTelegram from "../assets/icons/telegram.svg";
import iconWhatsapp from "../assets/icons/whatsapp.svg";
import { contactFieldNames } from "../data/formSchema.js";
import { normalizeCollectedFormData, validateFields } from "../utils/form.js";

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
    formData,
    isActive,
    onComplete,
    onFormChange,
    onLayoutChange
}) {
    const { t } = useTranslation();
    const rootRef = useRef(null);
    const submitLockRef = useRef(false);
    const [touched, setTouched] = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const errors = useMemo(
        () => validateFields(contactFieldNames, formData),
        [formData]
    );
    const isValid = Object.keys(errors).length === 0;

    const getVisibleError = useCallback((name) => (
        touched[name] || submitAttempted ? errors[name] : null
    ), [errors, submitAttempted, touched]);

    const handleBlur = useCallback((event) => {
        const { name } = event.target;

        if (!contactFieldNames.includes(name)) {
            return;
        }

        setTouched((currentTouched) => ({
            ...currentTouched,
            [name]: true
        }));
    }, []);

    const focusFirstInvalidField = useCallback((fieldErrors) => {
        const firstInvalidName = contactFieldNames.find((name) => fieldErrors[name]);

        if (!firstInvalidName) {
            return;
        }

        requestAnimationFrame(() => {
            rootRef.current
                ?.querySelector(`[name="${firstInvalidName}"]`)
                ?.focus();
        });
    }, []);

    const handleSubmit = useCallback(() => {
        if (submitLockRef.current) {
            return;
        }

        const normalizedData = normalizeCollectedFormData(formData);
        const nextErrors = validateFields(contactFieldNames, normalizedData);

        setSubmitAttempted(true);

        if (Object.keys(nextErrors).length > 0) {
            focusFirstInvalidField(nextErrors);
            onLayoutChange();
            return;
        }

        submitLockRef.current = true;

        if (onComplete(normalizedData) === false) {
            submitLockRef.current = false;
        }
    }, [focusFirstInvalidField, formData, onComplete, onLayoutChange]);

    const handleKeyDown = useCallback((event) => {
        const { tagName, type } = event.target;
        const isTextControl = tagName === "SELECT"
            || tagName === "INPUT" && !["radio", "checkbox", "button", "submit"].includes(type);

        if (event.key !== "Enter" || event.shiftKey || !isTextControl) {
            return;
        }

        event.preventDefault();
        handleSubmit();
    }, [handleSubmit]);

    useEffect(() => {
        submitLockRef.current = false;
    }, [isActive]);

    useEffect(() => {
        onLayoutChange();
    }, [errors, onLayoutChange, submitAttempted, touched]);

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
                        className={`contact-method ${getVisibleError("contactMethod") ? "is-invalid" : ""}`}
                        aria-invalid={Boolean(getVisibleError("contactMethod"))}
                        aria-describedby={getVisibleError("contactMethod") ? "contact-method-error" : undefined}
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
                                            aria-invalid={Boolean(getVisibleError("contactMethod"))}
                                            aria-describedby={getVisibleError("contactMethod") ? "contact-method-error" : undefined}
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
                            className={`contact-field__error contact-method__error ${getVisibleError("contactMethod") ? "is-visible" : ""}`}
                            id="contact-method-error"
                            role={getVisibleError("contactMethod") ? "alert" : undefined}
                        >
                            {getVisibleError("contactMethod")
                                ? t(getVisibleError("contactMethod"))
                                : "\u00a0"}
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
