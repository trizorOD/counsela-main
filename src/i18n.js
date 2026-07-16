import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import uk from "./locales/uk.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import zh from "./locales/zh.json";
import ht from "./locales/ht.json";
import ar from "./locales/ar.json";
import hi from "./locales/hi.json";
import vi from "./locales/vi.json";
import tl from "./locales/tl.json";
import { defaultLanguage } from "./data/languages";
import { getSavedLanguage } from "./utils/storage";

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ru: { translation: ru },
            uk: { translation: uk },
            es: { translation: es },
            pt: { translation: pt },
            zh: { translation: zh },
            ht: { translation: ht },
            ar: { translation: ar },
            hi: { translation: hi },
            vi: { translation: vi },
            tl: { translation: tl }
        },
        lng: getSavedLanguage(),
        fallbackLng: defaultLanguage,
        returnEmptyString: false,
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
