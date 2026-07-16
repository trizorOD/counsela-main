import { defaultLanguage, languageCodes } from "../data/languages";
import { coerceFormData, getInitialFormData } from "./form.js";

export const formStorageKey = "counsela_form_data";
export const languageStorageKey = "counsela_language";

export function normalizeLanguage(language) {
    return languageCodes.includes(language) ? language : defaultLanguage;
}

function getDefaultFormData() {
    return getInitialFormData({
        language: getSavedLanguage()
    });
}

function normalizeFormData(data) {
    const defaultData = getDefaultFormData();
    const normalizedData = coerceFormData(data, defaultData);

    return {
        ...normalizedData,
        language: normalizeLanguage(normalizedData.language)
    };
}

export function getSavedFormData() {
    const savedData = localStorage.getItem(formStorageKey);

    if (!savedData) {
        return getDefaultFormData();
    }

    try {
        const parsedData = JSON.parse(savedData);

        if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
            return getDefaultFormData();
        }

        return normalizeFormData(parsedData);
    } catch {
        return getDefaultFormData();
    }
}

export function getSavedLanguage() {
    return normalizeLanguage(localStorage.getItem(languageStorageKey));
}

export function saveFormData(data) {
    localStorage.setItem(formStorageKey, JSON.stringify(normalizeFormData(data)));
}

export function saveLanguage(language) {
    localStorage.setItem(languageStorageKey, normalizeLanguage(language));
}
