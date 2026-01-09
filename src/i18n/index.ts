import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';


const getDefaultLanguage = (): string => {
    const stored = localStorage.getItem('accesspark-language');
    if (stored) return stored;

    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('el')) return 'el';
    return 'en';
};

i18n
    .use(initReactI18next)
    .init({
        resources: translations,
        lng: getDefaultLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
