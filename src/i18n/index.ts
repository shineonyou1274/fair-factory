import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko.json';
import en from './locales/en.json';

// localStorage에서 저장된 언어 불러오기
function getSavedLanguage(): string {
    try {
        const stored = localStorage.getItem('fair-factory-ui');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.state?.language) return parsed.state.language;
        }
    } catch { /* ignore */ }
    return 'ko';
}

i18n
    .use(initReactI18next)
    .init({
        resources: {
            ko: { translation: ko },
            en: { translation: en },
        },
        lng: getSavedLanguage(),
        fallbackLng: 'ko',
        interpolation: { escapeValue: false },
    });

export default i18n;
