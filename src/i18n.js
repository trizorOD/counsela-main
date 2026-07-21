import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultLanguage, languageCodes } from "./data/languages";
import { getSavedLanguage } from "./utils/storage";

i18n
    .use(initReactI18next)
    .init({
        lng: getSavedLanguage(),
        fallbackLng: defaultLanguage,
        defaultNS: "desktop",
        ns: ["desktop", "mobile"],
        supportedLngs: languageCodes,
        returnEmptyString: false,
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
