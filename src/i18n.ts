import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';
import ruCommon from './locales/ru/common.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { common: enCommon },
            ar: { common: arCommon },
            ru: { common: ruCommon }
        },
        fallbackLng: 'en',
        ns: ['common'],
        defaultNS: 'common',
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage']
        }
    });

// Handle RTL for Arabic
i18n.on('languageChanged', (lng) => {
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    // Set font family for Arabic
    if (lng === 'ar') {
        document.body.style.fontFamily = "'Inter', 'Vazirmatn', sans-serif";
    } else {
        document.body.style.fontFamily = "'Inter', sans-serif";
    }
});

export default i18n;
